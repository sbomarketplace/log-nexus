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

        {/* Body - simplified layout: title → description → buttons */}
        <div className="px-4 py-3">
          {/* Description directly under title */}
          <p className="text-xs text-gray-600 mb-3 leading-snug">
            {integration.description}
          </p>

          {/* Input fields just above buttons if needed */}
          {integration.requiresUrl && (
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-700 mb-1 block">Webhook URL</label>
              <input
                type="url"
                inputMode="url"
                placeholder="https://hooks.slack.com/services/..."
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isDisabled}
              />
            </div>
          )}

          {integration.requiresEmail && (
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-700 mb-1 block">Default export email</label>
              <input
                type="email"
                inputMode="email"
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={isDisabled}
              />
            </div>
          )}

          {integration.disabled && (
            <div className="rounded-lg border bg-gray-50 px-2 py-1.5 text-xs text-gray-600 mb-3">
              This integration is planned for a future update.
            </div>
          )}
            
          {/* Buttons - horizontal layout under description */}
          <div className="flex items-center gap-2">
            {/* Test button appears when an action is testable */}
            {((integration.id === "email") || (integration.id === "slack") || (integration.id === "zapier")) && !integration.disabled && (
              <button
                onClick={handleTest}
                className="rounded-lg bg-gray-900 px-2 py-1.5 text-white text-xs hover:opacity-90"
              >
                Test
              </button>
            )}
            {isConnected ? (
              <button
                onClick={onDisconnect}
                className="rounded-lg bg-red-600 px-2 py-1.5 text-white text-xs hover:opacity-90"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={onConnect}
                disabled={isDisabled}
                className={`rounded-lg px-2 py-1.5 text-white text-xs ${isDisabled ? "bg-gray-400" : "bg-blue-600 hover:opacity-90"}`}
              >
                {integration.disabled ? "Unavailable" : "Connect"}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              Close
            </button>
            {/* Status indicator */}
            <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isConnected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
              {isConnected ? "Connected" : "Not connected"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}