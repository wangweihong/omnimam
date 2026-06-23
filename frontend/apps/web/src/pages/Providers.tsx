import { FormEvent, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import {
  createProvider,
  createProviderModel,
  listProviderModels,
  listProviders,
  type Provider,
  type ProviderModel
} from "@omnimam/shared";
import { ApiErrorView } from "../components/ApiErrorView";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";

export function Providers({ canWrite }: { canWrite: boolean }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Record<string, ProviderModel[]>>({});
  const [selectedProvider, setSelectedProvider] = useState("");
  const [error, setError] = useState<unknown>(null);

  async function load() {
    setError(null);
    try {
      const resp = await listProviders();
      setProviders(resp.providers || []);
      const firstID = resp.providers?.[0]?.id || "";
      setSelectedProvider((current) => current || firstID);
      const entries = await Promise.all((resp.providers || []).map(async (provider) => [provider.id, (await listProviderModels(provider.id)).models || []] as const));
      setModels(Object.fromEntries(entries));
    } catch (err) {
      setError(err);
    }
  }

  async function addProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
  }

  async function addModel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProvider) return;
    const form = new FormData(event.currentTarget);
    await createProviderModel(selectedProvider, {
      name: form.get("name"),
      model: form.get("model"),
      capabilities: String(form.get("capabilities") || "").split(",").map((item) => item.trim()).filter(Boolean),
      enabled: true
    });
    event.currentTarget.reset();
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section>
      <PageHeader
        title="模型服务"
        description="管理 DeepSeek 与 OpenAI-compatible provider，业务侧只依赖 capability。"
        actions={<button className="button" type="button" onClick={() => void load()}><RefreshCw size={16} /> 刷新</button>}
      />
      <ApiErrorView error={error} />
      <div className="split">
        <div className="panel">
          <h2>Providers</h2>
          <div className="list">
            {providers.map((provider) => (
              <button className={`list-row ${selectedProvider === provider.id ? "selected" : ""}`} key={provider.id} onClick={() => setSelectedProvider(provider.id)} type="button">
                <span>
                  <strong>{provider.name}</strong>
                  <small>{provider.type} · {provider.base_url || "no base url"}</small>
                </span>
                <StatusBadge value={provider.enabled} />
              </button>
            ))}
          </div>
          {canWrite ? (
            <form className="compact-form" onSubmit={(event) => void addProvider(event)}>
              <input name="name" placeholder="Provider name" required />
              <select name="type" defaultValue="deepseek">
                <option value="deepseek">deepseek</option>
                <option value="openai-compatible">openai-compatible</option>
              </select>
              <input name="base_url" placeholder="Base URL" />
              <input name="credential_ref" placeholder="Credential ref" />
              <button className="button primary" type="submit"><Plus size={16} /> 新增 Provider</button>
            </form>
          ) : null}
        </div>
        <div className="panel">
          <h2>Models</h2>
          <div className="list">
            {(models[selectedProvider] || []).map((model) => (
              <div className="list-row" key={model.id}>
                <span>
                  <strong>{model.name}</strong>
                  <small>{model.model} · {(model.capabilities || []).join(", ") || "no capabilities"}</small>
                </span>
                <StatusBadge value={model.enabled} />
              </div>
            ))}
          </div>
          {canWrite ? (
            <form className="compact-form" onSubmit={(event) => void addModel(event)}>
              <input name="name" placeholder="Model name" required />
              <input name="model" placeholder="deepseek-chat" required />
              <input name="capabilities" placeholder="llm.chat,query.parse" />
              <button className="button primary" type="submit"><Plus size={16} /> 新增 Model</button>
            </form>
          ) : null}
        </div>
      </div>
    </section>
  );
}
