import { useEffect, useState } from "react";
import { GitBranch, RefreshCw } from "lucide-react";
import { listCanvases, type CanvasRecord } from "@omnimam/shared";
import { ApiErrorView } from "../components/ApiErrorView";
import { PageHeader } from "../components/PageHeader";

export function Canvases() {
  const [canvases, setCanvases] = useState<CanvasRecord[]>([]);
  const [error, setError] = useState<unknown>(null);

  async function load() {
    setError(null);
    try {
      const resp = await listCanvases();
      setCanvases(resp.canvases || []);
    } catch (err) {
      setError(err);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section>
      <PageHeader
        title="画布"
        description="参考 static 的 classic/smart canvas 能力，第一版先提供列表和运行入口预留。"
        actions={<button className="button" type="button" onClick={() => void load()}><RefreshCw size={16} /> 刷新</button>}
      />
      <ApiErrorView error={error} />
      <div className="canvas-grid">
        {canvases.map((canvas) => (
          <article className="canvas-card" key={canvas.id}>
            <GitBranch size={20} />
            <strong>{canvas.title || canvas.name || canvas.id}</strong>
            <span>{canvas.kind || "smart"} canvas</span>
            <p>{canvas.description || "节点、资产引用、任务引用和执行快照将在后续版本接入。"}</p>
          </article>
        ))}
        <article className="canvas-card ghost">
          <GitBranch size={20} />
          <strong>智能画布入口</strong>
          <span>reserved</span>
          <p>后续接入节点编辑、资产引用、provider model 选择和 task 执行。</p>
        </article>
      </div>
    </section>
  );
}
