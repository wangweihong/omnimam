import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileUp, GitBranch, Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import {
  createCanvas,
  deleteCanvas,
  exportCanvas,
  importCanvas,
  listCanvases,
  updateCanvasMeta,
  type CanvasExportPayload,
  type CanvasRecord
} from "@omnimam/shared";
import { ApiErrorView } from "../components/ApiErrorView";
import { PageHeader } from "../components/PageHeader";

function downloadJSON(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function Canvases() {
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [canvases, setCanvases] = useState<CanvasRecord[]>([]);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState("");

  async function load() {
    setError(null);
    try {
      const resp = await listCanvases();
      setCanvases(resp.canvases || []);
    } catch (err) {
      setError(err);
    }
  }

  async function create(kind: "classic" | "smart") {
    setBusy(kind);
    setError(null);
    try {
      const resp = await createCanvas({
        kind,
        icon: kind === "smart" ? "sparkles" : "layers",
        title: kind === "smart" ? "智能画布" : "未命名画布"
      });
      navigate(`/canvases/${resp.canvas.id}`);
    } catch (err) {
      setError(err);
    } finally {
      setBusy("");
    }
  }

  async function rename(canvas: CanvasRecord) {
    const next = window.prompt("画布名称", canvas.title || canvas.name || "");
    if (!next || next === canvas.title) return;
    setError(null);
    try {
      await updateCanvasMeta(canvas.id, { title: next });
      await load();
    } catch (err) {
      setError(err);
    }
  }

  async function remove(canvas: CanvasRecord) {
    if (!window.confirm(`删除画布「${canvas.title || canvas.name || canvas.id}」？`)) return;
    setError(null);
    try {
      await deleteCanvas(canvas.id);
      await load();
    } catch (err) {
      setError(err);
    }
  }

  async function exportOne(canvas: CanvasRecord) {
    setError(null);
    try {
      const data = await exportCanvas(canvas.id);
      downloadJSON(`${canvas.title || canvas.id}.omnimam-canvas.json`, data.canvas);
    } catch (err) {
      setError(err);
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const payload = JSON.parse(await file.text()) as CanvasExportPayload | { canvas?: CanvasExportPayload };
      const canvas = (
        typeof payload === "object" && payload !== null && "canvas" in payload && payload.canvas ? payload.canvas : payload
      ) as CanvasExportPayload;
      const resp = await importCanvas(canvas);
      navigate(`/canvases/${resp.canvas.id}`);
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
        description="管理 classic/smart canvas，编辑节点、资产引用和工作流。"
        actions={
          <>
            <button className="button" type="button" onClick={() => void load()}>
              <RefreshCw size={16} /> 刷新
            </button>
            <button className="button" type="button" onClick={() => importInputRef.current?.click()}>
              <FileUp size={16} /> 导入 JSON
            </button>
            <button className="button" type="button" disabled={busy === "classic"} onClick={() => void create("classic")}>
              <Plus size={16} /> 普通画布
            </button>
            <button className="button primary" type="button" disabled={busy === "smart"} onClick={() => void create("smart")}>
              <Sparkles size={16} /> 智能画布
            </button>
            <input ref={importInputRef} hidden type="file" accept="application/json,.json" onChange={importFile} />
          </>
        }
      />
      <ApiErrorView error={error} />
      <div className="canvas-grid">
        {canvases.map((canvas) => (
          <article className="canvas-card canvas-list-card" key={canvas.id} onDoubleClick={() => navigate(`/canvases/${canvas.id}`)}>
            <button className="canvas-card-main" type="button" onClick={() => navigate(`/canvases/${canvas.id}`)}>
              {canvas.kind === "smart" ? <Sparkles size={20} /> : <GitBranch size={20} />}
              <strong>{canvas.title || canvas.name || canvas.id}</strong>
              <span>{canvas.kind || "classic"} canvas · {canvas.node_count || 0} nodes</span>
              <p>{canvas.description || "双击或点击进入编辑器。"}</p>
            </button>
            <div className="canvas-card-actions">
              <button className="icon-button" type="button" title="重命名" onClick={() => void rename(canvas)}>
                Aa
              </button>
              <button className="icon-button" type="button" title="导出" onClick={() => void exportOne(canvas)}>
                <Download size={15} />
              </button>
              <button className="icon-button danger" type="button" title="删除" onClick={() => void remove(canvas)}>
                <Trash2 size={15} />
              </button>
            </div>
          </article>
        ))}
        {!canvases.length && (
          <article className="canvas-card ghost">
            <GitBranch size={20} />
            <strong>还没有画布</strong>
            <span>create</span>
            <p>创建普通画布或智能画布开始组织资产和任务。</p>
          </article>
        )}
      </div>
    </section>
  );
}
