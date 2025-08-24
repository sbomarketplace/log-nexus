import * as React from "react";
import { Mail, Webhook, Cloud, Link as LinkIcon, Archive } from "lucide-react";
import IntegrationModal, { IntegrationConfig } from "./IntegrationModal";
import { isValidEmail, isValidUrl } from "@/integrations";

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
      "Post incident summaries to a private Slack channel using an Incoming Webhook URL. Good for personal logs or small teams.",
    badge: "Beta",
    requiresUrl: true,
  },
  {
    id: "zapier",
    name: "Zapier Webhook",
    description:
      "Send new incidents to Zapier via a Catch Hook URL so you can automate copies to Sheets, Drive, or your CRM.",
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
        <div className="mb-3 flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-gray-600" />
          <p className="font-semibold">Integrations</p>
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
              <div key={it.id} className="rounded-xl border p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-700" />
                  <div className="flex-1 min-w-0">
                    {/* Title line */}
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{it.name}</p>
                      {it.badge && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 whitespace-nowrap">
                          {it.badge}
                        </span>
                      )}
                    </div>

                    {/* Description line */}
                    <p className="mt-1 text-sm text-gray-700 whitespace-normal break-words leading-snug">
                      {it.description}
                    </p>

                    {/* Action row under description */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
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
          const ok = active.disabled ? false : true;
          const next = { connected: ok, value: trimmed };
          const newState = { ...loadState(), [active.id!]: next };
          setState(newState);
          saveState(newState);
          setOpen(false);
        }}
        onDisconnect={() => {
          if (!active) return;
          const newState = { ...loadState(), [active.id!]: { connected: false, value: "" } };
          setState(newState);
          saveState(newState);
          setValue("");
          setOpen(false);
        }}
      />
    </>
  );
}