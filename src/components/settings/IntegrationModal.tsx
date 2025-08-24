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

  const title = `${integration.name} Integration`;

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
        await sendSlackWebhook(value, {
          type: "test",
          source: "IntegrationsModal",
          message: "ClearCase test message",
          timestamp: new Date().toISOString(),
        });
        alert("Test sent to Slack.");
        return;
      }
      if (integration.id === "zapier") {
        if (!isValidUrl(value)) {
          alert("Enter a valid Zapier Catch Hook URL first.");
          return;
        }
        await sendZapierWebhook(value, {
          type: "test",
          source: "IntegrationsModal",
          message: "ClearCase test message",
          timestamp: new Date().toISOString(),
        });
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Floating modal */}
      <div className="relative mx-4 w-full max-w-xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[85vh]">
        {/* Header with title on a single line */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body scroll area */}
        <div className="px-5 py-4 overflow-y-auto grow">
          {/* Badge if present */}
          {integration.badge && (
            <div className="mb-2">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 whitespace-nowrap">
                {integration.badge}
              </span>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-gray-600 whitespace-normal break-words leading-relaxed mb-4">
            {integration.description}
          </p>

          {/* Input fields if needed */}
          {integration.requiresUrl && (
            <div className="space-y-1 mb-4">
              <label className="text-sm font-medium text-gray-700">Webhook URL</label>
              <input
                type="url"
                inputMode="url"
                placeholder="https://hooks.slack.com/services/..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isDisabled}
              />
              <p className="text-xs text-gray-500">Stored locally on your device.</p>
            </div>
          )}

          {integration.requiresEmail && (
            <div className="space-y-1 mb-4">
              <label className="text-sm font-medium text-gray-700">Default export email</label>
              <input
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isDisabled}
              />
              <p className="text-xs text-gray-500">Used to prefill exports.</p>
            </div>
          )}

          {integration.disabled && (
            <div className="rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-600 mb-4">
              This integration is planned for a future update.
            </div>
          )}

          {/* Status */}
          <div className="mb-4">
            <span className="text-xs text-gray-500 mr-2">Status:</span>
            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${isConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
              {isConnected ? "Connected" : "Not connected"}
            </span>
          </div>
            
          {/* Buttons - horizontal layout */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Test button appears when an action is testable */}
            {((integration.id === "email") || (integration.id === "slack") || (integration.id === "zapier")) && !integration.disabled && (
              <button
                onClick={handleTest}
                className="rounded-lg bg-gray-900 px-3 py-2 text-white text-sm hover:opacity-90"
              >
                Send test
              </button>
            )}
            {isConnected ? (
              <button
                onClick={onDisconnect}
                className="rounded-lg bg-red-600 px-3 py-2 text-white text-sm hover:opacity-90"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={onConnect}
                disabled={isDisabled}
                className={`rounded-lg px-3 py-2 text-white text-sm ${isDisabled ? "bg-gray-400" : "bg-blue-600 hover:opacity-90"}`}
              >
                {integration.disabled ? "Unavailable" : "Connect"}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}