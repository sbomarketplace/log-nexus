import React from "react";
import { CheckCircle, X, AlertCircle, Info } from "lucide-react";

type ToastProps = {
  title?: string;
  description?: string;
  message?: string;               // legacy single-line
  type?: "success" | "error" | "info";
  onClose?: () => void;
  durationMs?: number;
};

export function Toast({
  title,
  description,
  message,
  type = "success",
  onClose,
  durationMs = 2500,              // default 2.5s
}: ToastProps) {
  const colors =
    type === "success"
      ? "bg-emerald-50 text-emerald-900 ring-emerald-400/30 border-emerald-200"
      : type === "error"
      ? "bg-red-50 text-red-900 ring-red-400/30 border-red-200"
      : "bg-slate-50 text-slate-900 ring-slate-400/30 border-slate-200";

  const Icon = type === "success" ? CheckCircle : type === "error" ? AlertCircle : Info;

  // auto-dismiss
  React.useEffect(() => {
    const id = setTimeout(() => onClose?.(), durationMs);
    return () => clearTimeout(id);
  }, [durationMs, onClose]);

  return (
    <div
      className="fixed inset-x-0 top-3 z-[1000] pointer-events-none px-3 sm:px-4 md:px-6 lg:px-8"
      style={{
        paddingLeft: "max(env(safe-area-inset-left), 12px)",
        paddingRight: "max(env(safe-area-inset-right), 12px)",
      }}
      role="status"
      aria-live="polite"
    >
      <div className={`pointer-events-auto w-full rounded-2xl shadow-lg border ring-1 ${colors} px-4 py-3 flex items-start gap-3`}>
        <Icon className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 leading-snug">
          {title && <div className="font-semibold">{title}</div>}
          {description && <div className="opacity-90">{description}</div>}
          {!title && !description && message && <div className="font-medium">{message}</div>}
        </div>
        <button 
          type="button" 
          onClick={onClose} 
          aria-label="Close notification" 
          className="ml-2 opacity-80 hover:opacity-100 transition-opacity"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}