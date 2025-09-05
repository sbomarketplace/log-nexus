export function toStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  try { return String(v); } catch { return ""; }
}

export function normalizeNewlines(v: unknown): string {
  return toStr(v).replace(/\r\n/g, "\n");
}

export function cleanTabs(v: unknown): string {
  return toStr(v).replace(/\t/g, " ");
}