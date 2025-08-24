import * as React from "react";
import { X } from "lucide-react";
import {
  isValidEmail,
  isValidUrl,
  sendSlackWebhook,
  sendZapierWebhook,
  openTestEmail,
} from "@/integrations";

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

  async function handleTest() {
    try {
      if (integration.id === "email") {
        if (!isValidEmail(value)) {
          alert("Enter a valid email address first.");
          return;
        }
        openTestEmail(value);
        return;
      }
      if (integration.id === "slack") {
        if (!isValidUrl(value)) {
          alert("Enter a valid Slack Incoming Webhook URL first.");
          return;
        }
        await sendSlackWebhook(value, { type: "test", ts: new Date().toISOString() });
        alert("Test sent to Slack.");
        return;
      }
      if (integration.id === "zapier") {
        if (!isValidUrl(value)) {
          alert("Enter a valid Zapier Catch Hook URL first.");
          return;
        }
        await sendZapierWebhook(value, { type: "test", ts: new Date().toISOString() });
        alert("Test sent to Zapier.");
        return;
      }
      alert("Testing not available for this integration.");
    } catch (err) {
      console.error(err);
      alert("Test failed. See console for details.");
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Floating modal */}
      <div className="relative mx-4 w-full max-w-xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[85vh]">
        {/* Header with close only */}
        <div className="flex items-center justify-end px-5 py-4 border-b shrink-0">
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body: Title line, Description line, Inputs, Buttons row */}
        <div className="px-5 py-4 overflow-y-auto grow">
          {/* Title */}
          <h3 className="text-lg font-semibold mb-1">{integration.name}</h3>

          {/* Description */}
          <p className="text-sm text-gray-700 whitespace-normal break-words leading-snug mb-4">
            {integration.description}
          </p>

          {/* Inputs placed above buttons when required */}
          {integration.requiresUrl && (
            <div className="space-y-2 mb-4">
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
                Stored locally on your device. Not uploaded to our servers.
              </p>
            </div>
          )}

          {integration.requiresEmail && (
            <div className="space-y-2 mb-4">
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
              <p className="text-xs text-gray-500">Used to prefill exports. Stored locally only.</p>
            </div>
          )}

          {/* Buttons row under description and inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                isConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}
            >
              {isConnected ? "Connected" : "Not connected"}
            </span>

            {((integration.id === "email") || (integration.id === "slack") || (integration.id === "zapier")) &&
              !integration.disabled && (
                <button
                  onClick={handleTest}
                  className="rounded-xl bg-gray-900 px-4 py-2 text-white text-sm hover:opacity-90"
                >
                  Send test
                </button>
              )}

            {isConnected ? (
              <button
                onClick={onDisconnect}
                className="rounded-xl bg-red-600 px-4 py-2 text-white text-sm hover:opacity-90"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={onConnect}
                disabled={isDisabled}
                className={`rounded-xl px-4 py-2 text-white text-sm ${
                  isDisabled ? "bg-gray-400" : "bg-blue-600 hover:opacity-90"
                }`}
              >
                {integration.disabled ? "Unavailable" : "Connect"}
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm text-gray-800 bg-gray-100 hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}