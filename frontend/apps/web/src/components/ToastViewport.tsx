import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect } from "react";

export type ToastTone = "success" | "info" | "warning" | "error";

export interface ToastMessage {
  id: string;
  tone: ToastTone;
  title: string;
  detail?: string;
}

interface ToastViewportProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

const toneIcons = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle
};

export function ToastViewport({ messages, onDismiss }: ToastViewportProps) {
  if (messages.length === 0) return null;

  return (
    <div className="toast-viewport" aria-live="polite" aria-relevant="additions text">
      {messages.map((message) => (
        <ToastItem key={message.id} message={message} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: (id: string) => void }) {
  const Icon = toneIcons[message.tone];

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(message.id), 3500);
    return () => window.clearTimeout(timer);
  }, [message.id, onDismiss]);

  return (
    <div className={`app-toast ${message.tone}`} role="status">
      <Icon size={18} />
      <div>
        <strong>{message.title}</strong>
        {message.detail ? <p>{message.detail}</p> : null}
      </div>
      <button className="toast-close" type="button" onClick={() => onDismiss(message.id)} aria-label="关闭提示">
        <X size={15} />
      </button>
    </div>
  );
}
