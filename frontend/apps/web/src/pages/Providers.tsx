import {
  createProvider,
  createProviderModel,
  deleteProvider,
  getSystemLLMConfig,
  listProviderModels,
  listProviderPresets,
  listProviders,
  putSystemLLMConfig,
  syncProviderModels,
  testProvider,
  updateProvider,
  updateProviderModel,
  type Provider,
  type ProviderAPISetting,
  type ProviderModel,
  type ProviderPreset,
  type SystemLLMConfig
} from "@omnimam/shared";
import {
  Bot,
  Box,
  Brain,
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  Globe2,
  Languages,
  ListFilter,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  StickyNote,
  Trash2,
  Wrench,
  X,
  Zap
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

const modelTypeOptions = [
  { key: "vision", label: "视觉", icon: Eye },
  { key: "web", label: "联网", icon: Globe2 },
  { key: "reasoning", label: "推理", icon: Brain },
  { key: "tool", label: "工具调用", icon: Wrench },
  { key: "rerank", label: "重排", icon: ListFilter },
  { key: "embedding", label: "嵌入", icon: Box }
];

const endpointOptions = ["chat", "responses", "embeddings", "rerank", "image", "audio", "custom"];

const providerAddOptions = [
  { key: "openai", label: "OpenAI", type: "openai-compatible" },
  { key: "openai-response", label: "OpenAI-Response", type: "openai-compatible" },
  { key: "gemini", label: "Gemini", type: "openai-compatible" },
  { key: "anthropic", label: "Anthropic", type: "openai-compatible" },
  { key: "azure-openai", label: "Azure OpenAI", type: "openai-compatible" },
  { key: "new-api", label: "New API", type: "openai-compatible" },
  { key: "cherryin", label: "CherryIN", type: "openai-compatible" },
  { key: "ollama", label: "Ollama", type: "openai-compatible" }
];

interface ProviderDraft {
  name: string;
  type: string;
  base_url: string;
  auth_type: string;
  enabled: boolean;
  preset_key: string;
  config: Record<string, unknown>;
}

interface ModelDraft {
  name: string;
  group_name: string;
  endpoint_type: string;
  capabilities: string;
  model_types: string[];
  supports_stream: boolean;
  pricing_currency: string;
  pricing_input: string;
  pricing_output: string;
}

type ProviderContextMenuState = {
  provider: Provider;
  x: number;
  y: number;
};

function parseCapabilities(value: FormDataEntryValue | string | null) {
  return String(value || "")
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function modelDraftFrom(model: ProviderModel): ModelDraft {
  return {
    name: model.name || model.model,
    group_name: model.group_name || "",
    endpoint_type: model.endpoint_type || "chat",
    capabilities: (model.capabilities || []).join(","),
    model_types: model.model_types || [],
    supports_stream: Boolean(model.default_params?.supports_stream),
    pricing_currency: String(model.pricing?.currency || "USD"),
    pricing_input: String(model.pricing?.input || ""),
    pricing_output: String(model.pricing?.output || "")
  };
}

export function Providers({ canWrite }: { canWrite: boolean }) {
  const [section, setSection] = useState<"services" | "defaults">("services");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [presets, setPresets] = useState<ProviderPreset[]>([]);
  const [models, setModels] = useState<Record<string, ProviderModel[]>>({});
  const [configs, setConfigs] = useState<SystemLLMConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [search, setSearch] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [draft, setDraft] = useState<ProviderDraft>({
    name: "",
    type: "openai-compatible",
    base_url: "",
    auth_type: "api_key",
    enabled: true,
    preset_key: "",
    config: {}
  });
  const [addProviderOpen, setAddProviderOpen] = useState(false);
  const [apiSettingsOpen, setAPISettingsOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ProviderModel | null>(null);
  const [modelDraft, setModelDraft] = useState<ModelDraft | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [contextMenu, setContextMenu] = useState<ProviderContextMenuState | null>(null);
  const [remarkProvider, setRemarkProvider] = useState<Provider | null>(null);

  const selected = useMemo(() => providers.find((provider) => provider.id === selectedProvider), [providers, selectedProvider]);
  const providerModels = models[selectedProvider] || [];
  const providerByID = useMemo(() => Object.fromEntries(providers.map((provider) => [provider.id, provider])), [providers]);
  const presetByKey = useMemo(() => Object.fromEntries(presets.map((preset) => [preset.key, preset])), [presets]);
  const selectedPreset = selected?.preset_key ? presetByKey[selected.preset_key] : undefined;
  const enabledModels = useMemo(
    () => Object.values(models).flat().filter((model) => model.enabled && providerByID[model.provider_id]?.enabled),
    [models, providerByID]
  );

  async function load() {
    setError(null);
    try {
      const [providerResp, presetResp, configResp] = await Promise.all([
        listProviders(),
        listProviderPresets(),
        getSystemLLMConfig()
      ]);
      const nextProviders = providerResp.providers || [];
      setProviders(nextProviders);
      setPresets(presetResp.presets || []);
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
      enabled: selected.enabled,
      preset_key: selected.preset_key || "",
      config: { ...(selected.config || {}) }
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
    const providerKind = String(form.get("provider_kind") || providerAddOptions[0].key);
    const option = providerAddOptions.find((item) => item.key === providerKind) || providerAddOptions[0];
    const name = String(form.get("name") || "").trim() || option.label;
    setBusy("add-provider");
    try {
      await createProvider({
        name,
        type: option.type,
        enabled: true,
        base_url: form.get("base_url"),
        auth_type: "api_key",
        credential_ref: form.get("credential_ref"),
        config: { provider_kind: providerKind }
      });
      event.currentTarget.reset();
      setAddProviderOpen(false);
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
        endpoint_type: "chat",
        group_name: selected?.name || "",
        capabilities: parseCapabilities(form.get("capabilities")),
        model_types: [],
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

  function openModelEditor(model: ProviderModel) {
    setEditingModel(model);
    setModelDraft(modelDraftFrom(model));
  }

  async function saveModelEditor() {
    if (!editingModel || !modelDraft) return;
    setBusy("save-model");
    setError(null);
    try {
      await updateProviderModel(editingModel.provider_id, editingModel.id, {
        name: modelDraft.name,
        endpoint_type: modelDraft.endpoint_type,
        group_name: modelDraft.group_name,
        capabilities: parseCapabilities(modelDraft.capabilities),
        model_types: modelDraft.model_types,
        default_params: { ...(editingModel.default_params || {}), supports_stream: modelDraft.supports_stream },
        pricing: {
          currency: modelDraft.pricing_currency,
          input: modelDraft.pricing_input === "" ? undefined : Number(modelDraft.pricing_input),
          output: modelDraft.pricing_output === "" ? undefined : Number(modelDraft.pricing_output)
        }
      });
      setEditingModel(null);
      setModelDraft(null);
      setNotice("模型配置已保存");
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

  function openProviderContextMenu(event: React.MouseEvent, provider: Provider) {
    event.preventDefault();
    const menuWidth = 180;
    const menuHeight = 150;
    const x = Math.min(event.clientX, window.innerWidth - menuWidth - 12);
    const y = Math.min(event.clientY, window.innerHeight - menuHeight - 12);
    setSelectedProvider(provider.id);
    setContextMenu({ provider, x: Math.max(12, x), y: Math.max(12, y) });
  }

  async function deleteProviderAction(provider: Provider) {
    if (!window.confirm(`确定删除「${provider.name}」吗？此操作不可撤销。`)) return;
    setBusy("delete-provider");
    setError(null);
    try {
      await deleteProvider(provider.id);
      setContextMenu(null);
      if (selectedProvider === provider.id) {
        setSelectedProvider("");
      }
      await load();
    } catch (err) {
      setError(err);
    } finally {
      setBusy("");
    }
  }

  function openRemarkDialog(provider: Provider) {
    setContextMenu(null);
    setRemarkProvider(provider);
  }

  function openEditProvider(provider: Provider) {
    setContextMenu(null);
    setSelectedProvider(provider.id);
  }

  return (
    <section onClick={() => setContextMenu(null)}>
      <PageHeader
        title="模型设置"
        description="管理模型服务、模型能力标签、Provider API 设置和系统默认模型。"
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
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索模型服务..." />
                <Filter size={16} />
              </div>
              <div className="provider-section-title">已配置服务</div>
              <div className="list">
                {/* 每个云提供商渲染成一个button */}
                {filteredProviders.map((provider) => (
                  <button
                    className={`list-row ${selectedProvider === provider.id ? "selected" : ""}`}
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider.id)}
                    onContextMenu={(event) => openProviderContextMenu(event, provider)}
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
                <button className="button primary add-provider-button" type="button" onClick={() => setAddProviderOpen(true)}>
                  <Plus size={16} /> 添加
                </button>
              ) : null}
              {contextMenu ? (
                <div className="provider-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(event) => event.stopPropagation()}>
                  <button type="button" onClick={() => openEditProvider(contextMenu.provider)}><Pencil size={16} /> 编辑</button>
                  <button type="button" onClick={() => openRemarkDialog(contextMenu.provider)}><StickyNote size={16} /> 备注</button>
                  <button type="button" onClick={() => void deleteProviderAction(contextMenu.provider)} disabled={!canWrite || busy === "delete-provider"}><Trash2 size={16} /> 删除</button>
                </div>
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
                      <button className="button" type="button" onClick={() => setAPISettingsOpen(true)}>
                        <Settings2 size={16} /> API 设置
                      </button>
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
                      <div className="list-row model-row" key={model.id}>
                        <span>
                          <strong>{model.name || model.model}</strong>
                          <small>{model.model} · {model.group_name || "未分组"} · {model.endpoint_type || "chat"}</small>
                          <span className="capability-list">
                            <ModelTypeIcons types={model.model_types || []} />
                            {(model.capabilities || []).map((capability) => <span className="tag" key={capability}>{capability}</span>)}
                          </span>
                        </span>
                        <span className="model-row-actions">
                          <button className="icon-button button" type="button" disabled={!canWrite} onClick={() => openModelEditor(model)} title="编辑模型">
                            <Pencil size={16} />
                          </button>
                          <button className="button" type="button" disabled={!canWrite || busy === model.id} onClick={() => void toggleModel(model)}>
                            {model.enabled ? "禁用" : "启用"}
                          </button>
                        </span>
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

      {apiSettingsOpen ? (
        <APISettingsModal
          canWrite={canWrite}
          schema={selectedPreset?.api_settings_schema || []}
          config={draft.config}
          onClose={() => setAPISettingsOpen(false)}
          onChange={(nextConfig) => setDraft((current) => ({ ...current, config: nextConfig }))}
        />
      ) : null}

      {addProviderOpen ? (
        <AddProviderModal
          busy={busy === "add-provider"}
          onClose={() => setAddProviderOpen(false)}
          onSubmit={addProvider}
        />
      ) : null}

      {editingModel && modelDraft ? (
        <ModelEditModal
          model={editingModel}
          draft={modelDraft}
          canWrite={canWrite}
          busy={busy === "save-model"}
          onClose={() => {
            setEditingModel(null);
            setModelDraft(null);
          }}
          onSave={() => void saveModelEditor()}
          onChange={setModelDraft}
        />
      ) : null}
      {remarkProvider ? (
        <div className="provider-remark-backdrop" onClick={() => setRemarkProvider(null)}>
          <div className="provider-remark-dialog" onClick={(event) => event.stopPropagation()}>
            <h3>备注 - {remarkProvider.name}</h3>
            <textarea
              className="provider-remark-textarea"
              placeholder="输入备注内容..."
              defaultValue={String((remarkProvider.config as Record<string, unknown>)?.remark || "")}
              onChange={(event) => {
                const value = event.target.value;
                setProviders((current) =>
                  current.map((p) =>
                    p.id === remarkProvider.id
                      ? { ...p, config: { ...(p.config || {}), remark: value } }
                      : p
                  )
                );
              }}
            />
            <div className="provider-remark-actions">
              <button className="button" type="button" onClick={() => setRemarkProvider(null)}>取消</button>
              <button
                className="button primary"
                type="button"
                disabled={!canWrite || busy === "save-provider"}
                onClick={async () => {
                  const target = providers.find((p) => p.id === remarkProvider.id);
                  if (!target) return;
                  setBusy("save-provider");
                  setError(null);
                  try {
                    await updateProvider(target.id, { config: target.config });
                    setRemarkProvider(null);
                    setNotice("备注已保存");
                    await load();
                  } catch (err) {
                    setError(err);
                  } finally {
                    setBusy("");
                  }
                }}
              >
                <Save size={16} /> 保存
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ModelTypeIcons({ types }: { types: string[] }) {
  if (types.length === 0) {
    return <span className="model-type-muted">未标记类型</span>;
  }
  return (
    <span className="model-type-icons">
      {types.map((type) => {
        const option = modelTypeOptions.find((item) => item.key === type);
        const Icon = option?.icon || Sparkles;
        return (
          <span className="model-type-icon" data-tooltip={option?.label || type} key={type}>
            <Icon size={14} />
          </span>
        );
      })}
    </span>
  );
}

function APISettingsModal({
  canWrite,
  schema,
  config,
  onClose,
  onChange
}: {
  canWrite: boolean;
  schema: ProviderAPISetting[];
  config: Record<string, unknown>;
  onClose: () => void;
  onChange: (config: Record<string, unknown>) => void;
}) {
  function setValue(key: string, value: unknown) {
    onChange({ ...config, [key]: value });
  }

  return (
    <div className="asset-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="settings-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-head">
          <div>
            <h3>API 设置</h3>
            <small>不同模型服务通过 schema 渲染专属 API 开关。</small>
          </div>
          <button className="icon-button button" type="button" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="settings-form">
          {schema.length === 0 ? <div className="empty-state">当前服务没有额外 API 设置。</div> : null}
          {schema.map((setting) => (
            <label className="setting-toggle-row" key={setting.key}>
              <span>
                <strong>{setting.label}</strong>
                <small>{setting.description || setting.key}</small>
              </span>
              {setting.type === "boolean" ? (
                <button
                  className={`toggle ${Boolean(config[setting.key] ?? setting.default) ? "on" : ""}`}
                  disabled={!canWrite}
                  type="button"
                  onClick={() => setValue(setting.key, !Boolean(config[setting.key] ?? setting.default))}
                >
                  {Boolean(config[setting.key] ?? setting.default) ? "ON" : "OFF"}
                </button>
              ) : (
                <input
                  disabled={!canWrite}
                  value={String(config[setting.key] ?? setting.default ?? "")}
                  onChange={(event) => setValue(setting.key, event.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        <div className="form-actions">
          <button className="button primary" type="button" onClick={onClose}>完成</button>
        </div>
      </div>
    </div>
  );
}

function AddProviderModal({
  busy,
  onClose,
  onSubmit
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="asset-modal-backdrop" role="presentation" onClick={onClose}>
      <form className="settings-dialog provider-add-dialog" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()} onSubmit={onSubmit}>
        <div className="dialog-head">
          <div>
            <h3>添加提供商</h3>
            <small>添加后可继续配置 API 地址、密钥和模型列表。</small>
          </div>
          <button className="icon-button button" type="button" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="provider-add-avatar">P</div>
        <div className="settings-form">
          <label>
            <span>提供商名称</span>
            <input name="name" placeholder="例如 OpenAI" />
          </label>
          <label>
            <span>提供商类型</span>
            <select name="provider_kind" defaultValue={providerAddOptions[0].key}>
              {providerAddOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button className="button" type="button" onClick={onClose}>取消</button>
          <button className="button primary" type="submit" disabled={busy}>
            <Plus size={16} /> 添加
          </button>
        </div>
      </form>
    </div>
  );
}

function ModelEditModal({
  model,
  draft,
  canWrite,
  busy,
  onClose,
  onSave,
  onChange
}: {
  model: ProviderModel;
  draft: ModelDraft;
  canWrite: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
  onChange: (draft: ModelDraft) => void;
}) {
  function toggleModelType(type: string) {
    const exists = draft.model_types.includes(type);
    onChange({
      ...draft,
      model_types: exists ? draft.model_types.filter((item) => item !== type) : [...draft.model_types, type]
    });
  }

  return (
    <div className="asset-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="settings-dialog wide" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-head">
          <div>
            <h3>编辑模型</h3>
            <small>{model.model}</small>
          </div>
          <button className="icon-button button" type="button" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="settings-form two-column">
          <label>
            <span>模型 ID</span>
            <input value={model.model} disabled />
          </label>
          <label>
            <span>模型名称</span>
            <input value={draft.name} disabled={!canWrite} onChange={(event) => onChange({ ...draft, name: event.target.value })} />
          </label>
          <label>
            <span>分组名称</span>
            <input value={draft.group_name} disabled={!canWrite} onChange={(event) => onChange({ ...draft, group_name: event.target.value })} />
          </label>
          <label>
            <span>端点类型</span>
            <select value={draft.endpoint_type} disabled={!canWrite} onChange={(event) => onChange({ ...draft, endpoint_type: event.target.value })}>
              {endpointOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="span-two">
            <span>系统能力 capabilities</span>
            <input value={draft.capabilities} disabled={!canWrite} onChange={(event) => onChange({ ...draft, capabilities: event.target.value })} />
            <small>例如 `llm.chat`、`query.parse`，用于系统任务路由，不等同于 UI 模型类型。</small>
          </label>
          <div className="span-two model-type-picker">
            <span>模型类型</span>
            <div>
              {modelTypeOptions.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    className={draft.model_types.includes(item.key) ? "selected" : ""}
                    disabled={!canWrite}
                    key={item.key}
                    type="button"
                    onClick={() => toggleModelType(item.key)}
                  >
                    <Icon size={15} /> {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          <label>
            <span>支持增量文本输出</span>
            <button
              className={`toggle ${draft.supports_stream ? "on" : ""}`}
              disabled={!canWrite}
              type="button"
              onClick={() => onChange({ ...draft, supports_stream: !draft.supports_stream })}
            >
              {draft.supports_stream ? "ON" : "OFF"}
            </button>
          </label>
          <label>
            <span>币种</span>
            <input value={draft.pricing_currency} disabled={!canWrite} onChange={(event) => onChange({ ...draft, pricing_currency: event.target.value })} />
          </label>
          <label>
            <span>输入价格</span>
            <input type="number" value={draft.pricing_input} disabled={!canWrite} onChange={(event) => onChange({ ...draft, pricing_input: event.target.value })} />
          </label>
          <label>
            <span>输出价格</span>
            <input type="number" value={draft.pricing_output} disabled={!canWrite} onChange={(event) => onChange({ ...draft, pricing_output: event.target.value })} />
          </label>
        </div>
        <div className="form-actions">
          <button className="button" type="button" onClick={onClose}>取消</button>
          <button className="button primary" type="button" disabled={!canWrite || busy} onClick={onSave}>
            <Save size={16} /> 保存模型
          </button>
        </div>
      </div>
    </div>
  );
}

function previewChatEndpoint(baseURL: string) {
  const base = baseURL.trim().replace(/\/+$/, "") || "https://api.example.com";
  if (base.endsWith("/v1")) {
    return `${base}/chat/completions`;
  }
  return `${base}/v1/chat/completions`;
}