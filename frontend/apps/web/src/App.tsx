import { useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import { Archive, Bot, CheckCircle2, Database, LayoutDashboard, Network, PanelsTopLeft, RefreshCw } from "lucide-react";
import { getMe, hasPermission, type MeResponse } from "@omnimam/shared";
import { ApiErrorView } from "./components/ApiErrorView";
import { Dashboard } from "./pages/Dashboard";
import { Assets } from "./pages/Assets";
import { Providers } from "./pages/Providers";
import { Tasks } from "./pages/Tasks";
import { Canvases } from "./pages/Canvases";
import { CanvasEditor } from "./pages/CanvasEditor";

const navItems = [
  { path: "/dashboard", label: "工作台", icon: LayoutDashboard, permission: "" },
  { path: "/assets", label: "资产", icon: Archive, permission: "asset.read" },
  { path: "/providers", label: "模型服务", icon: Bot, permission: "provider.read" },
  { path: "/tasks", label: "任务", icon: Network, permission: "task.read" },
  { path: "/canvases", label: "画布", icon: PanelsTopLeft, permission: "canvas.read" }
];

export function App() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  async function loadMe() {
    setLoading(true);
    setError(null);
    try {
      setMe(await getMe());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMe();
  }, []);

  const visibleNav = useMemo(() => navItems.filter((item) => hasPermission(me, item.permission)), [me]);

  if (loading) {
    return <div className="boot">正在连接 OmniMAM API...</div>;
  }

  if (error) {
    return (
      <div className="boot boot-error">
        <ApiErrorView error={error} title="无法加载当前用户能力" />
        <button className="button primary" type="button" onClick={() => void loadMe()}>
          <RefreshCw size={16} /> 重试
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">O</div>
          <div>
            <strong>OmniMAM</strong>
            <span>AI capability hub</span>
          </div>
        </div>
        <nav className="nav-list">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => (isActive ? "active" : "")} title={item.label}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <CheckCircle2 size={16} />
          <span>{me?.user?.name || "default-user"}</span>
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard me={me} />} />
          <Route path="/assets" element={<Assets canWrite={hasPermission(me, "asset.create")} />} />
          <Route path="/providers" element={<Providers canWrite={hasPermission(me, "provider.manage")} />} />
          <Route path="/tasks" element={<Tasks canWrite={hasPermission(me, "task.cancel")} />} />
          <Route path="/canvases" element={<Canvases />} />
          <Route path="/canvases/:canvasId" element={<CanvasEditor />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
