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

  async function load() {
    setError(null);
    try {
      const resp = await listTasks({ status: status || undefined });
      setTasks(resp.tasks || []);
    } catch (err) {
      setError(err);
    }
  }

  async function cancel(id: string) {
    await cancelTask(id);
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section>
      <PageHeader
        title="任务"
        description="查看 DB-backed async Task 的状态、队列、进度和错误信息。"
        actions={<button className="button" type="button" onClick={() => void load()}><RefreshCw size={16} /> 刷新</button>}
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
        <button className="button" type="button" onClick={() => void load()}>应用</button>
      </div>
      <div className="table">
        <div className="table-head"><span>名称</span><span>类型</span><span>队列</span><span>状态</span><span>操作</span></div>
        {tasks.map((task) => (
          <div className="table-row" key={task.id}>
            <span>{task.name || task.id}</span>
            <span>{task.type}</span>
            <span>{task.queue}</span>
            <span><StatusBadge value={task.status} /></span>
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
