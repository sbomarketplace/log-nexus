/**
 * Safe date utilities to prevent null/undefined errors when accessing date properties
 * Addresses: TypeError: null is not an object (evaluating 't.date')
 */

export function safeDate(v: unknown): string {
  if (!v) return "";
  const s = typeof v === "string" ? v : "";
  const d = s ? new Date(s) : null;
  if (!d || Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function formatDateForUI(v: unknown): string {
  const iso = safeDate(v);
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  return d.toLocaleDateString();
}

/**
 * Sanitizes array of incidents/events to ensure no null items and safe date access
 */
export function sanitizeIncidentArray<T extends { date?: string }>(arr: unknown): T[] {
  return Array.isArray(arr) 
    ? arr.filter(Boolean).map((item: any) => ({
        ...item,
        date: typeof item?.date === "string" ? item.date : undefined
      }))
    : [];
}

/**
 * Safe date getter that never throws - always returns a fallback
 */
export function getDateSafely(item: any, fallback = "Unknown date"): string {
  return item?.date || fallback;
}

/**
 * Validates incident object has required date field before processing
 */
export function hasValidDate(item: any): boolean {
  return Boolean(item && typeof item.date === "string" && item.date.trim());
}