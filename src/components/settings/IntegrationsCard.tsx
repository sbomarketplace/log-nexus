import * as React from "react";
import { Mail, Webhook, Cloud, Link as LinkIcon, Archive } from "lucide-react";
import IntegrationModal, { IntegrationConfig } from "./IntegrationModal";
import { isValidUrl, isValidEmail } from "@/integrations";

type Stored = { connected: boolean; value: string };
const LS_KEY = "cc_integrations_state_v1";

function loadState(): Record<string, Stored> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveState(state: Record<string, Stored>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: "email",
    name: "Email",
    description:
      "Set a default email to prefill when exporting reports. Uses your device Mail client. No connection required.",
    badge: "New",
    requiresEmail: true,
  },
  {
    id: "slack",
    name: "Slack Webhook",
    description:
      "Post incident summaries to a private Slack channel using an Incoming Webhook URL.",
    badge: "Beta",
    requiresUrl: true,
  },
  {
    id: "zapier",
    name: "Zapier Webhook",
    description:
      "Send new incidents to Zapier via a Catch Hook URL for automation into Sheets or your CRM.",
    requiresUrl: true,
  },
  {
    id: "google_drive",
    name: "Google Drive",
    description: "Export PDFs directly to Drive. Planned.",
    badge: "Coming soon",
    disabled: true,
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Save exports to Dropbox. Planned.",
    badge: "Coming soon",
    disabled: true,
  },
];

export default function IntegrationsCard() {
  const [state, setState] = React.useState<Record<string, Stored>>({});
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<IntegrationConfig | null>(null);
  const [value, setValue] = React.useState("");

  React.useEffect(() => setState(loadState()), []);

  function openModal(integration: IntegrationConfig) {
    const st = loadState();
    setActive(integration);
    setValue(st[integration.id]?.value || "");
    setOpen(true);
  }

  function updateStored(id: string, next: Stored) {
    const newState = { ...loadState(), [id]: next };
    setState(newState);
    saveState(newState);
  }

  return (
    <>
      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-gray-600" />
            <p className="font-semibold">Integrations</p>
          </div>
        </div>

        <div className="space-y-3">
          {INTEGRATIONS.map((it) => {
            const stored = state[it.id] || { connected: false, value: "" };
            const Icon =
              it.id === "email"
                ? Mail
                : it.id === "slack"
                ? Webhook
                : it.id === "zapier"
                ? Webhook
                : it.id === "google_drive"
                ? Cloud
                : Archive;

            return (
              <div
                key={it.id}
                className="flex items-start justify-between gap-3 rounded-xl border p-4 hover:bg-gray-50"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{it.name}</p>
                      {it.badge && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                          {it.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 break-words">{it.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      stored.connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {stored.connected ? "Connected" : "Not connected"}
                  </span>
                  <button
                    onClick={() => openModal(it)}
                    className="rounded-xl bg-blue-600 px-3 py-2 text-sm text-white hover:opacity-90 disabled:bg-gray-400"
                  >
                    {stored.connected ? "Manage" : it.disabled ? "Details" : "Connect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <IntegrationModal
        open={open}
        onClose={() => setOpen(false)}
        integration={active}
        value={value}
        onChange={(v) => setValue(v)}
        isConnected={active ? Boolean(state[active.id!]?.connected) : false}
        isDisabled={active?.disabled}
        onConnect={() => {
          if (!active) return;
          const trimmed = value.trim();
          if (active.requiresUrl && !isValidUrl(trimmed)) {
            alert("Enter a valid URL that starts with http or https.");
            return;
          }
          if (active.requiresEmail && !isValidEmail(trimmed)) {
            alert("Enter a valid email address.");
            return;
          }
          updateStored(active.id!, { connected: !active.disabled, value: trimmed });
          setOpen(false);
        }}
        onDisconnect={() => {
          if (!active) return;
          updateStored(active.id!, { connected: false, value: "" });
          setValue("");
          setOpen(false);
        }}
      />
    </>
  );
}