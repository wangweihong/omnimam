import { AlertCircle } from "lucide-react";
import { ApiError } from "@omnimam/shared";

interface Props {
  error: unknown;
  title?: string;
}

export function ApiErrorView({ error, title = "请求失败" }: Props) {
  if (!error) return null;
  const apiError = error instanceof ApiError ? error : null;
  return (
    <div className="error-box">
      <AlertCircle size={18} />
      <div>
        <strong>{title}</strong>
        <p>{apiError?.detail || apiError?.message || (error as Error)?.message || "未知错误"}</p>
        {apiError ? <small>HTTP {apiError.status} / code {apiError.code}</small> : null}
      </div>
    </div>
  );
}
