import { useEffect, useState } from "react";
import { Ban, RefreshCw } from "lucide-react";
import { cancelTask, listTasks, type Task } from "@omnimam/shared";
import { ApiErrorView } from "../components/ApiErrorView";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";

export function Tasks({ canWrite }: { canWrite: boolean }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    setError(null);
    try {
      const resp = await listTasks({ status: status || undefined });
      setTasks(resp.tasks || []);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    setError(null);
    try {
      await cancelTask(id);
      await load();
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
        title="任务"
        description="查看 DB-backed async Task 的状态、队列、进度和错误信息。"
        actions={<button className="button" type="button" onClick={() => void load()} disabled={busy}><RefreshCw size={16} /> 刷新</button>}
      />
      <ApiErrorView error={error} />
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">全部状态</option>
          <option value="pending">pending</option>
          <option value="running">running</option>
          <option value="succeeded">succeeded</option>
          <option value="failed">failed</option>
          <option value="canceled">canceled</option>
        </select>
        <button className="button" type="button" onClick={() => void load()} disabled={busy}>应用</button>
      </div>
      <div className="table">
        <div className="table-head task-table-row">
          <span>名称</span><span>类型</span><span>队列</span><span>状态</span><span>进度</span><span>重试</span><span>错误</span><span>操作</span>
        </div>
        {tasks.map((task) => (
          <div className="table-row task-table-row" key={task.id}>
            <span>{task.name || task.id}</span>
            <span>{task.type}</span>
            <span>{task.queue}</span>
            <span><StatusBadge value={task.status} /></span>
            <span>{task.progress ?? 0}%</span>
            <span>{task.attempts ?? 0}/{task.max_attempts ?? 0}</span>
            <span title={task.error || ""}>{task.error || "-"}</span>
            <span>
              {canWrite && !["succeeded", "failed", "canceled"].includes(task.status) ? (
                <button className="icon-button" type="button" onClick={() => void cancel(task.id)} title="取消任务"><Ban size={16} /></button>
              ) : null}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
