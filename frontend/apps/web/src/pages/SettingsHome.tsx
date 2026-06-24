import { Link } from "react-router-dom";
import { Bot, ChevronRight } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

export function SettingsHome() {
  return (
    <section>
      <PageHeader title="设置" description="管理系统级能力、模型服务和默认模型引用。" />
      <div className="settings-home-grid">
        <Link className="settings-entry-card" to="/providers">
          <div className="metric-icon">
            <Bot />
          </div>
          <span>
            <strong>模型设置</strong>
            <small>配置模型服务、API key、模型列表和默认模型。</small>
          </span>
          <ChevronRight size={18} />
        </Link>
      </div>
    </section>
  );
}
