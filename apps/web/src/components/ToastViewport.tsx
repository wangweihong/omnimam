import { ApiError } from "@omnimam/shared";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

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

interface ToastContextValue {
  show: (tone: ToastTone, title: string, detail?: string) => void;
  success: (title: string, detail?: string) => void;
  info: (title: string, detail?: string) => void;
  warning: (title: string, detail?: string) => void;
  error: (title: string, error: unknown) => void;
}

const toneIcons = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function toastErrorDetail(error: unknown) {
  if (error instanceof ApiError) {
    return error.detail || error.message || "请求失败";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "未知错误";
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const show = useCallback((tone: ToastTone, title: string, detail?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setMessages((current) => [...current, { id, tone, title, detail }].slice(-4));
  }, []);

  const dismiss = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    show,
    success: (title, detail) => show("success", title, detail),
    info: (title, detail) => show("info", title, detail),
    warning: (title, detail) => show("warning", title, detail),
    error: (title, error) => show("error", title, toastErrorDetail(error))
  }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport messages={messages} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return toast;
}

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
