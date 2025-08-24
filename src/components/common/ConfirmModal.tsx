import * as React from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /**
   * Optional string the user must type to enable the confirm button
   * (e.g., "DELETE").
   */
  requireText?: string;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmModal({
  open,
  onClose,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  requireText,
  onConfirm,
}: Props) {
  const [text, setText] = React.useState("");
  const needText = typeof requireText === "string" && requireText.length > 0;
  const canConfirm = needText ? text.trim() === requireText : true;

  React.useEffect(() => {
    if (!open) setText("");
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {description && <div className="text-sm text-gray-700">{description}</div>}

          {needText && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type <span className="font-mono rounded bg-gray-100 px-1">{requireText}</span> to continue
              </label>
              <input
                autoFocus
                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={requireText}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
          <button onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-gray-800 bg-gray-100 hover:bg-gray-200">
            {cancelLabel}
          </button>
          <button
            disabled={!canConfirm}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm text-white ${danger ? "bg-red-600" : "bg-blue-600"} ${
              canConfirm ? "hover:opacity-90" : "opacity-50"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}