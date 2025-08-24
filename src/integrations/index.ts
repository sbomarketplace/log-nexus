export function isValidUrl(u: string) {
  if (!u) return false;
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");
}

export function openTestEmail(to: string) {
  const subject = encodeURIComponent("ClearCase test export");
  const body = encodeURIComponent("This is a test email from ClearCase Integrations.");
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${subject}&body=${body}`;
}

/** Minimal webhook senders. Throws if response is not ok. */
export async function sendSlackWebhook(url: string, payload: unknown) {
  const body =
    typeof payload === "object"
      ? { text: "ClearCase notification", attachments: [{ text: JSON.stringify(payload) }] }
      : { text: String(payload) };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Slack webhook failed with ${res.status}`);
}

export async function sendZapierWebhook(url: string, payload: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Zapier webhook failed with ${res.status}`);
}

/** Optional helpers for the Export flow */
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

export function getDefaultExportEmail(): string | null {
  const st = loadState();
  const email = st["email"]?.connected ? st["email"].value : "";
  return isValidEmail(email) ? email : null;
}

export async function broadcastIncidentExport(incident: {
  id: string | number;
  title?: string;
  summary?: string;
  category?: string;
  createdAt?: string;
}) {
  const st = loadState();
  const payload = {
    type: "incident_exported",
    incident: {
      id: incident.id,
      title: incident.title || "Incident",
      summary: incident.summary || "",
      category: incident.category || "",
      createdAt: incident.createdAt || new Date().toISOString(),
    },
    app: "ClearCase",
    timestamp: new Date().toISOString(),
  };

  // Slack
  if (st["slack"]?.connected && isValidUrl(st["slack"].value)) {
    try {
      await sendSlackWebhook(st["slack"].value, payload);
    } catch (e) {
      console.warn("Slack send failed", e);
    }
  }
  // Zapier
  if (st["zapier"]?.connected && isValidUrl(st["zapier"].value)) {
    try {
      await sendZapierWebhook(st["zapier"].value, payload);
    } catch (e) {
      console.warn("Zapier send failed", e);
    }
  }
  // Email is handled by your UI through a mailto link. Use getDefaultExportEmail to prefill.
}