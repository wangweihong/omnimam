import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Bot,
  Box,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  Languages,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Zap
} from "lucide-react";
import {
  createProvider,
  createProviderModel,
  getSystemLLMConfig,
  listProviderModels,
  listProviders,
  putSystemLLMConfig,
  syncProviderModels,
  testProvider,
  updateProvider,
  updateProviderModel,
  type Provider,
  type ProviderModel,
  type SystemLLMConfig
} from "@omnimam/shared";
import { ApiErrorView } from "../components/ApiErrorView";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";

const defaultPurposes = [
  {
    purpose: "assistant.default",
    title: "默认助手模型",
    icon: MessageSquare,
    description: "创建新助手时使用的模型，如果助手未设置模型，则使用此模型。"
  },
  {
    purpose: "quick",
    title: "快速模型",
    icon: Zap,
    description: "执行话题命名、搜索关键词提炼等简单任务时使用的模型。"
  },
  {
    purpose: "translation",
    title: "翻译模型",
    icon: Languages,
    description: "翻译服务使用的模型。"
  }
];

function parseCapabilities(value: FormDataEntryValue | null) {
  return String(value || "")
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function Providers({ canWrite }: { canWrite: boolean }) {
  const [section, setSection] = useState<"services" | "defaults">("services");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Record<string, ProviderModel[]>>({});
  const [configs, setConfigs] = useState<SystemLLMConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [search, setSearch] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [draft, setDraft] = useState({ name: "", type: "openai-compatible", base_url: "", auth_type: "api_key", enabled: true });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState<unknown>(null);

  const selected = useMemo(() => providers.find((provider) => provider.id === selectedProvider), [providers, selectedProvider]);
  const providerModels = models[selectedProvider] || [];
  const providerByID = useMemo(() => Object.fromEntries(providers.map((provider) => [provider.id, provider])), [providers]);
  const enabledModels = useMemo(
    () => Object.values(models).flat().filter((model) => model.enabled && providerByID[model.provider_id]?.enabled),
    [models, providerByID]
  );

  async function load() {
    setError(null);
    try {
      const [providerResp, configResp] = await Promise.all([listProviders(), getSystemLLMConfig()]);
      const nextProviders = providerResp.providers || [];
      setProviders(nextProviders);
      setConfigs(configResp.configs || []);
      setSelectedProvider((current) => current || nextProviders[0]?.id || "");
      const entries = await Promise.all(
        nextProviders.map(async (provider) => [provider.id, (await listProviderModels(provider.id)).models || []] as const)
      );
      setModels(Object.fromEntries(entries));
    } catch (err) {
      setError(err);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDraft({
      name: selected.name || "",
      type: selected.type || "openai-compatible",
      base_url: selected.base_url || "",
      auth_type: selected.auth_type || "api_key",
      enabled: selected.enabled
    });
    setApiKey("");
    setNotice("");
  }, [selected]);

  const filteredProviders = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return providers;
    return providers.filter((provider) => `${provider.name} ${provider.type} ${provider.base_url}`.toLowerCase().includes(keyword));
  }, [providers, search]);

  async function addProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy("add-provider");
    try {
      await createProvider({
        name: form.get("name"),
        type: form.get("type"),
        enabled: true,
        base_url: form.get("base_url"),
        auth_type: "api_key",
        credential_ref: form.get("credential_ref")
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy("");
    }
  }

  async function saveProvider() {
    if (!selected) return;
    setBusy("save-provider");
    setError(null);
    try {
      const input: Record<string, unknown> = { ...draft };
      if (apiKey.trim()) {
        input.credential_ref = apiKey.trim();
      }
      await updateProvider(selected.id, input);
      setNotice("模型服务已保存");
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy("");
    }
  }

  async function testCurrentProvider() {
    if (!selected) return;
    setBusy("test-provider");
    setError(null);
    setNotice("");
    try {
      const resp = await testProvider(selected.id, { ...draft, credential_ref: apiKey.trim() });
      setNotice(`${resp.message} · ${resp.latency_ms}ms`);
    } catch (err) {
      setError(err);
    } finally {
      setBusy("");
    }
  }

  async function syncModels() {
    if (!selected) return;
    setBusy("sync-models");
    setError(null);
    try {
      const resp = await syncProviderModels(selected.id);
      setModels((current) => ({ ...current, [selected.id]: resp.models || [] }));
      setNotice(`模型列表已同步：新增 ${resp.created}，更新 ${resp.updated}，跳过 ${resp.skipped}`);
    } catch (err) {
      setError(err);
    } finally {
      setBusy("");
    }
  }

  async function addModel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProvider) return;
    const form = new FormData(event.currentTarget);
    setBusy("add-model");
    try {
      await createProviderModel(selectedProvider, {
        name: form.get("name"),
        model: form.get("model"),
        capabilities: parseCapabilities(form.get("capabilities")),
        enabled: true
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy("");
    }
  }

  async function toggleModel(model: ProviderModel) {
    setBusy(model.id);
    try {
      await updateProviderModel(model.provider_id, model.id, { enabled: !model.enabled });
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy("");
    }
  }

  async function selectDefaultModel(purpose: string, modelID: string) {
    const model = enabledModels.find((item) => item.id === modelID);
    if (!model) return;
    setBusy(purpose);
    setError(null);
    try {
      const next = configs.filter((item) => item.purpose !== purpose);
      next.push({
        purpose,
        provider_id: model.provider_id,
        model_id: model.id,
        model: model.model,
        enabled: true
      });
      const resp = await putSystemLLMConfig(next);
      setConfigs(resp.configs || next);
      setNotice("默认模型已保存");
    } catch (err) {
      setError(err);
    } finally {
      setBusy("");
    }
  }

  return (
    <section>
      <PageHeader
        title="模型设置"
        description="管理 OpenAI-compatible provider、模型能力和系统默认模型引用。"
        actions={<button className="button" type="button" onClick={() => void load()}><RefreshCw size={16} /> 刷新</button>}
      />
      <ApiErrorView error={error} />
      {notice ? <div className="notice"><CheckCircle2 size={16} /> {notice}</div> : null}

      <div className="settings-layout">
        <aside className="settings-nav panel">
          <button className={section === "services" ? "selected" : ""} type="button" onClick={() => setSection("services")}>
            <Bot size={18} /> 模型服务
          </button>
          <button className={section === "defaults" ? "selected" : ""} type="button" onClick={() => setSection("defaults")}>
            <Box size={18} /> 默认模型
          </button>
        </aside>

        {section === "services" ? (
          <>
            <div className="panel provider-list-panel">
              <div className="provider-search">
                <Search size={16} />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索模型平台..." />
                <Filter size={16} />
              </div>
              <div className="list">
                {filteredProviders.map((provider) => (
                  <button
                    className={`list-row ${selectedProvider === provider.id ? "selected" : ""}`}
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id)}
                    type="button"
                  >
                    <span>
                      <strong>{provider.name}</strong>
                      <small>{provider.type} · {provider.base_url || "未配置 API 地址"}</small>
                    </span>
                    <StatusBadge value={provider.enabled} />
                  </button>
                ))}
              </div>
              {canWrite ? (
                <form className="compact-form" onSubmit={(event) => void addProvider(event)}>
                  <input name="name" placeholder="Provider name" required />
                  <select name="type" defaultValue="openai-compatible">
                    <option value="deepseek">deepseek</option>
                    <option value="openai-compatible">openai-compatible</option>
                  </select>
                  <input name="base_url" placeholder="https://api.example.com" />
                  <input name="credential_ref" placeholder="API key 或 env:KEY" />
                  <button className="button primary" type="submit" disabled={busy === "add-provider"}>
                    <Plus size={16} /> 添加
                  </button>
                </form>
              ) : null}
            </div>

            <div className="panel provider-detail-panel">
              {selected ? (
                <>
                  <div className="provider-detail-head">
                    <div>
                      <h2>{selected.name}</h2>
                      <small>{selected.id}</small>
                    </div>
                    <button
                      className={`toggle ${draft.enabled ? "on" : ""}`}
                      type="button"
                      disabled={!canWrite}
                      onClick={() => setDraft((current) => ({ ...current, enabled: !current.enabled }))}
                    >
                      {draft.enabled ? "ON" : "OFF"}
                    </button>
                  </div>

                  <div className="settings-form">
                    <label>
                      <span>名称</span>
                      <input value={draft.name} disabled={!canWrite} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
                    </label>
                    <label>
                      <span>类型</span>
                      <select value={draft.type} disabled={!canWrite} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}>
                        <option value="deepseek">deepseek</option>
                        <option value="openai-compatible">openai-compatible</option>
                      </select>
                    </label>
                    <label>
                      <span>API 密钥</span>
                      <div className="inline-input">
                        <input
                          type={showKey ? "text" : "password"}
                          value={apiKey}
                          disabled={!canWrite}
                          placeholder={selected.credential_ref ? "已配置，留空表示不修改" : "API key 或 env:KEY"}
                          onChange={(event) => setApiKey(event.target.value)}
                        />
                        <button className="icon-button button" type="button" onClick={() => setShowKey((value) => !value)}>
                          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button className="button" type="button" disabled={!selected || busy === "test-provider"} onClick={() => void testCurrentProvider()}>
                          检测
                        </button>
                      </div>
                      <small>多个密钥使用逗号分隔；检测可使用当前输入值，不会保存。</small>
                    </label>
                    <label>
                      <span>API 地址</span>
                      <input
                        value={draft.base_url}
                        disabled={!canWrite}
                        placeholder="https://api.example.com"
                        onChange={(event) => setDraft((current) => ({ ...current, base_url: event.target.value }))}
                      />
                      <small>预览：{previewChatEndpoint(draft.base_url)}</small>
                    </label>
                    <div className="form-actions">
                      <button className="button primary" type="button" disabled={!canWrite || busy === "save-provider"} onClick={() => void saveProvider()}>
                        <Save size={16} /> 保存服务
                      </button>
                    </div>
                  </div>

                  <div className="provider-model-head">
                    <h2>模型 <span className="tag">{providerModels.length}</span></h2>
                    <div>
                      <button className="button" type="button" disabled={!canWrite || busy === "sync-models"} onClick={() => void syncModels()}>
                        <RefreshCw size={16} /> 获取模型列表
                      </button>
                    </div>
                  </div>
                  <div className="list model-list">
                    {providerModels.map((model) => (
                      <div className="list-row" key={model.id}>
                        <span>
                          <strong>{model.name || model.model}</strong>
                          <small>{model.model}</small>
                          <span className="capability-list">
                            {(model.capabilities || []).map((capability) => <span className="tag" key={capability}>{capability}</span>)}
                          </span>
                        </span>
                        <button className="button" type="button" disabled={!canWrite || busy === model.id} onClick={() => void toggleModel(model)}>
                          {model.enabled ? "禁用" : "启用"}
                        </button>
                      </div>
                    ))}
                  </div>
                  {canWrite ? (
                    <form className="compact-form inline-form" onSubmit={(event) => void addModel(event)}>
                      <input name="name" placeholder="Model name" required />
                      <input name="model" placeholder="deepseek-chat" required />
                      <input name="capabilities" placeholder="llm.chat,query.parse" />
                      <button className="button primary" type="submit" disabled={busy === "add-model"}>
                        <Plus size={16} /> 添加模型
                      </button>
                    </form>
                  ) : null}
                </>
              ) : (
                <div className="empty-state">请选择或添加一个模型服务。</div>
              )}
            </div>
          </>
        ) : (
          <div className="panel default-model-panel">
            <div className="default-model-list">
              {defaultPurposes.map((item) => {
                const Icon = item.icon;
                const current = configs.find((config) => config.purpose === item.purpose);
                return (
                  <div className="default-model-card" key={item.purpose}>
                    <div className="default-model-title">
                      <Icon size={18} />
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </div>
                    </div>
                    <div className="default-model-control">
                      <select
                        value={current?.model_id || ""}
                        disabled={!canWrite || busy === item.purpose}
                        onChange={(event) => void selectDefaultModel(item.purpose, event.target.value)}
                      >
                        <option value="">请选择模型</option>
                        {enabledModels.map((model) => (
                          <option key={model.id} value={model.id}>
                            {(model.name || model.model)} | {providerByID[model.provider_id]?.name || model.provider_id}
                          </option>
                        ))}
                      </select>
                      <button className="icon-button button" type="button" title="参数设置">
                        <SlidersHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function previewChatEndpoint(baseURL: string) {
  const base = baseURL.trim().replace(/\/+$/, "") || "https://api.example.com";
  if (base.endsWith("/v1")) {
    return `${base}/chat/completions`;
  }
  return `${base}/v1/chat/completions`;
}
