interface Props {
  value?: string | boolean;
}

export function StatusBadge({ value }: Props) {
  const text = typeof value === "boolean" ? (value ? "enabled" : "disabled") : value || "unknown";
  const tone = ["ready", "succeeded", "enabled", "running"].includes(text) ? "good" : ["failed", "disabled"].includes(text) ? "bad" : "muted";
  return <span className={`status ${tone}`}>{text}</span>;
}
