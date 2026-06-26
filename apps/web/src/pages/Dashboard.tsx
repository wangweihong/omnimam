import { Archive, Bot, Network, PanelsTopLeft } from "lucide-react";
import type { ReactNode } from "react";
import type { MeResponse } from "@omnimam/shared";
import { PageHeader } from "../components/PageHeader";

interface Props {
  me: MeResponse | null;
}

export function Dashboard({ me }: Props) {
  return (
    <section>
      <PageHeader title="工作台" description="统一查看 OmniMAM 当前能力、权限和常用入口。" />
      <div className="metric-grid">
        <Metric icon={<Archive />} label="资产平面" value="Asset metadata" />
        <Metric icon={<Bot />} label="模型服务" value="Provider adapters" />
        <Metric icon={<Network />} label="异步任务" value="DB-backed queue" />
        <Metric icon={<PanelsTopLeft />} label="画布" value="Canvas workflow" />
      </div>
      <div className="panel two-col">
        <div>
          <h2>当前用户</h2>
          <dl className="info-list">
            <dt>ID</dt>
            <dd>{me?.user?.id || "-"}</dd>
            <dt>Name</dt>
            <dd>{me?.user?.name || "-"}</dd>
            <dt>Roles</dt>
            <dd>{me?.roles?.join(", ") || "-"}</dd>
          </dl>
        </div>
        <div>
          <h2>Feature Flags</h2>
          <div className="tag-list">
            {Object.entries(me?.feature_flags || {}).map(([key, enabled]) => (
              <span key={key} className={enabled ? "tag" : "tag off"}>{key}</span>
            ))}
            {!Object.keys(me?.feature_flags || {}).length ? <span className="muted-text">未返回 feature flags</span> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
