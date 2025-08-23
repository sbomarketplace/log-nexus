import * as React from "react";
import { X } from "lucide-react";

type IntegrationId = "slack" | "zapier" | "email" | "google_drive" | "dropbox";

export type IntegrationConfig = {
  id: IntegrationId;
  name: string;
  description: string;
  badge?: "Beta" | "Coming soon" | "New";
  requiresUrl?: boolean;
  requiresEmail?: boolean;
  disabled?: boolean;
};

type ModalProps = {
  open: boolean;
  onClose: () => void;
  integration: IntegrationConfig | null;
  value: string;
  onChange: (v: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
  isDisabled?: boolean;
};

export default function IntegrationModal({
  open,
  onClose,
  integration,
  value,
  onChange,
  onConnect,
  onDisconnect,
  isConnected,
  isDisabled,
}: ModalProps) {
  if (!open || !integration) return null;

  const title = `${integration.name} Integration`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-xl rounded-2xl bg-white shadow-xl">
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

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
          {integration.badge && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {integration.badge}
            </span>
          )}
          <p className="text-sm text-gray-700">{integration.description}</p>

          {integration.requiresUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook URL</label>
              <input
                type="url"
                inputMode="url"
                placeholder="https://hooks.slack.com/services/..."
                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isDisabled}
              />
              <p className="text-xs text-gray-500">
                We store this URL locally on your device. It is not uploaded to our servers.
              </p>
            </div>
          )}

          {integration.requiresEmail && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Default export email</label>
              <input
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isDisabled}
              />
              <p className="text-xs text-gray-500">
                Used to prefill export flows. Stored locally only.
              </p>
            </div>
          )}

          {integration.disabled && (
            <div className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-600">
              This integration is planned. OAuth screens and export targets will be added in a future update.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-5 py-3">
          <div className="text-xs text-gray-500">
            Status: {isConnected ? "Connected" : "Not connected"}
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <button
                onClick={onDisconnect}
                className="rounded-xl bg-red-600 px-4 py-2 text-white hover:opacity-90"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={onConnect}
                disabled={isDisabled}
                className={`rounded-xl px-4 py-2 text-white ${isDisabled ? "bg-gray-400" : "bg-blue-600 hover:opacity-90"}`}
              >
                {integration.disabled ? "Unavailable" : "Connect"}
              </button>
            )}
            <button onClick={onClose} className="rounded-xl px-4 py-2 text-gray-700 hover:bg-gray-100">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}