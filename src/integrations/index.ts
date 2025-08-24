const LS_KEY = "cc_integrations_state_v1";

// If you add a relay endpoint later, set this in your env (Vite example)
const RELAY_URL = import.meta.env?.VITE_WEBHOOK_RELAY_URL || null;

type Stored = { connected: boolean; value: string };
type State = Record<string, Stored>;

function loadState(): State {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(state: State) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

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

export function getDefaultExportEmail(): string | null {
  const st = loadState();
  const email = st["email"]?.connected ? st["email"].value : "";
  return isValidEmail(email) ? email : null;
}

/** Opens a mailto for test or quick exports */
export function openTestEmail(to: string, subject = "ClearCase test export", body = "This is a test email from ClearCase.") {
  const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = url;
}

/** Minimal webhook sender. Uses a serverless relay if provided (recommended for Slack due to CORS). */
async function postJson(url: string, payload: unknown) {
  if (RELAY_URL) {
    // Send via your relay to avoid CORS and to keep URLs private in logs
    const res = await fetch(RELAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl: url, payload }),
    });
    if (!res.ok) throw new Error(`Relay failed ${res.status}`);
    return;
  }
  // Direct client-side call (Zapier typically works; Slack often blocks with CORS)
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST to ${url} failed ${res.status}`);
}

export async function sendSlackWebhook(url: string, payload: any) {
  // Slack expects { text, blocks, attachments } shape; we attach your payload for transparency
  const body = {
    text: "ClearCase notification",
    attachments: [{ text: "payload", fields: [{ title: "data", value: "see JSON block below" }] }],
    // Stash structured payload as a JSON string
    blocks: [
      { type: "section", text: { type: "mrkdwn", text: "*ClearCase* test message" } },
      { type: "section", text: { type: "mrkdwn", text: "```" + JSON.stringify(payload, null, 2) + "```" } },
    ],
  };
  await postJson(url, body);
}

export async function sendZapierWebhook(url: string, payload: any) {
  await postJson(url, payload);
}

/** Reusable broadcast for your Export flow */
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
    ts: new Date().toISOString(),
  };

  // Slack
  if (st["slack"]?.connected && isValidUrl(st["slack"].value)) {
    try { await sendSlackWebhook(st["slack"].value, payload); } catch (e) { console.warn("Slack send failed", e); }
  }
  // Zapier
  if (st["zapier"]?.connected && isValidUrl(st["zapier"].value)) {
    try { await sendZapierWebhook(st["zapier"].value, payload); } catch (e) { console.warn("Zapier send failed", e); }
  }
  // Email is handled in the UI via mailto; use getDefaultExportEmail() to prefill.
}

export { loadState, saveState };
