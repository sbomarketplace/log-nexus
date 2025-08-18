/**
 * Date and time utilities for native input formatting
 * Converts various date/time formats to native input values
 */

export function toDateInputValue(v: unknown): string {
  if (!v) return "";
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

export function toTimeInputValue(v: unknown): string {
  if (!v) return "";
  const s = String(v).trim().toLowerCase();
  
  // Already HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const [hh, mm] = s.split(":").map(n => n.padStart(2, "0"));
    return `${hh}:${mm}`;
  }
  
  // Basic "3:45pm" style parsing
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m) {
    let hh = parseInt(m[1], 10);
    const mm = m[2];
    const ap = m[3].toLowerCase();
    if (ap === "pm" && hh < 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${mm}`;
  }
  
  // Try parsing other time formats
  if (s.includes("am") || s.includes("pm")) {
    const timeMatch = s.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
    if (timeMatch) {
      let hh = parseInt(timeMatch[1], 10);
      const mm = timeMatch[2] || "00";
      const ap = timeMatch[3].toLowerCase();
      if (ap === "pm" && hh < 12) hh += 12;
      if (ap === "am" && hh === 12) hh = 0;
      return `${String(hh).padStart(2, "0")}:${mm}`;
    }
  }
  
  return "";
}

/**
 * Creates ISO date string for storage while preserving timezone behavior
 */
export function formatDateForStorage(dateValue: string): string {
  if (!dateValue) return "";
  // Keep existing behavior: store as ISO with midnight UTC
  return new Date(`${dateValue}T00:00:00Z`).toISOString();
}
