import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  closeOnBackdrop?: boolean;
  tone?: "default" | "danger";
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  busy = false,
  closeOnBackdrop = true,
  tone = "default",
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onCancel]);

  return (
    <div className="asset-modal-backdrop" role="presentation" onClick={() => closeOnBackdrop && !busy && onCancel()}>
      <div className="settings-dialog confirm-dialog" role="alertdialog" aria-modal="true" aria-busy={busy} onClick={(event) => event.stopPropagation()}>
        <div className="dialog-head">
          <div className="confirm-dialog-head">
            <span className={`confirm-dialog-icon ${tone === "danger" ? "danger" : ""}`}>
              <AlertTriangle size={16} />
            </span>
            <div>
              <h3>{title}</h3>
              <small>{description}</small>
            </div>
          </div>
          <button className="icon-button button" type="button" disabled={busy} onClick={onCancel}>
            <X size={16} />
          </button>
        </div>
        <div className="form-actions">
          <button className="button" type="button" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`button ${tone === "danger" ? "danger" : "primary"}`} type="button" disabled={busy} onClick={() => void onConfirm()}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
