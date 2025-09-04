export function toStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  try { return String(v); } catch { return ""; }
}

export function sReplace(v: unknown, pattern: RegExp | string, replacement: string): string {
  return toStr(v).replace(pattern as any, replacement);
}

export function collapseWhitespace(v: unknown): string {
  return toStr(v).replace(/\s+/g, " ").trim();
}