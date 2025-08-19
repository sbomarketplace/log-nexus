export function formatWhoList(names?: string[]): string {
  if (!names?.length) return "";
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of names) {
    const t = (raw || "").trim();
    if (!t) continue;
    const c = t
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    if (!seen.has(c)) { 
      seen.add(c); 
      cleaned.push(c); 
    }
  }
  return cleaned.join(", ");
}

export function parseWhoFromString(input: string): string[] {
  if (!input) return [];
  return input
    .split(/[,;]|(?:\s+and\s+)/i)
    .map(s => s.trim().replace(/^Others?:\s*/i, '')) // Remove "Others:" or "Other:" prefix
    .filter(s => s.length > 0);
}