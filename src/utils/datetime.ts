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

/**
 * Combine yyyy-mm-dd and HH:MM into an ISO string at local time without shifting
 * The DB write format should stay consistent with current schema. If the app expects midnight UTC for date, continue that pattern.
 */
export function combineLocalDateTime(dateValue: string, timeValue: string | undefined): string | null {
  if (!dateValue) return null;
  const hhmm = timeValue || "00:00";
  const [hh, mm] = hhmm.split(":").map(n => parseInt(n || "0", 10));
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

export function formatDateTimeForUI(dateISO?: string, timeHHMM?: string): string {
  // Prefer combining for a stable UI string
  if (dateISO) {
    const d = new Date(dateISO);
    if (!Number.isNaN(d.getTime())) {
      const date = d.toLocaleDateString();
      const time = timeHHMM
        ? (() => {
            const [hh, mm] = timeHHMM.split(":").map(n => parseInt(n || "0", 10));
            const t = new Date();
            t.setHours(hh, mm, 0, 0);
            return t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
          })()
        : null;
      return time ? `${date} at ${time}` : date;
    }
  }
  return "Unknown date";
}

/**
 * Utility to combine separate date and time inputs into a unified Date object
 */
export function combineDateAndTime(dateOnly: Date, timeOnly: Date): Date {
  const result = new Date(dateOnly);
  result.setHours(
    timeOnly.getHours(),
    timeOnly.getMinutes(),
    timeOnly.getSeconds(),
    timeOnly.getMilliseconds()
  );
  return result;
}

/**
 * Convert Date object to UTC ISO string for storage
 */
export function toUTCISO(date: Date): string {
  return date.toISOString();
}

/**
 * Parse ISO dateTime to Date object, handling timezone properly
 */
export function parseFromISO(dateTimeISO?: string): Date | null {
  if (!dateTimeISO) return null;
  const d = new Date(dateTimeISO);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Format ISO dateTime for header display
 */
export function formatHeader(dateTimeISO?: string): string {
  if (!dateTimeISO) return "No date";
  const d = parseFromISO(dateTimeISO);
  if (!d) return "Invalid date";
  
  const date = d.toLocaleDateString([], { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  const time = d.toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  
  return `${date} at ${time}`;
}

/**
 * Format ISO dateTime for time-only display
 */
export function formatTimeOnly(dateTimeISO?: string): string {
  if (!dateTimeISO) return "No time";
  const d = parseFromISO(dateTimeISO);
  if (!d) return "Invalid time";
  
  return d.toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
}

/**
 * Validate case number format
 */
export function validateCaseNumber(caseNumber: string): boolean {
  return /^[A-Za-z0-9 \-\/]{0,50}$/.test(caseNumber);
}

/**
 * Parse ISO string to local Date object for form initialization
 */
export function parseISOToLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Migration utility: combine legacy date and time into unified dateTime
 */
export function migrateLegacyDateTime(legacyDate?: string, legacyTime?: string): string | null {
  if (!legacyDate) return null;
  
  const date = new Date(legacyDate);
  if (Number.isNaN(date.getTime())) return null;
  
  if (legacyTime) {
    // Parse time and combine with date
    const timeValue = toTimeInputValue(legacyTime);
    if (timeValue) {
      const [hh, mm] = timeValue.split(":").map(n => parseInt(n, 10));
      date.setHours(hh, mm, 0, 0);
    }
  } else {
    // Default to 9:00 AM local time if no time specified
    date.setHours(9, 0, 0, 0);
  }
  
  return toUTCISO(date);
}
