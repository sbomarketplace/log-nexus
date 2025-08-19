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

// NEW UTILITIES FOR SHARED FORM COMPONENT

/**
 * Parse ISO to local and format as YYYY-MM-DD for date inputs
 */
export function parseISOToLocal(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Format Date as YYYY-MM-DD for date input
 */
export function formatYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Format Date as HH:mm for time input
 */
export function formatHHmm(d: Date): string {
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Combine local date string and time string into Date object in local timezone
 */
export function combineLocalDateAndTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Format time part as localized time string for display
 */
export function formatTimeOnlyFromParts(timePart: string): string {
  if (!timePart) return "No time";
  const [hours, minutes] = timePart.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toLocaleTimeString([], { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
}

/**
 * Get formatted display for incident date/time based on data precedence
 */
export function getIncidentDisplayDate(incident: any): string {
  // First check for preferred date/time from original text and timeline
  if (incident.originalEventDateText || incident.timeline) {
    const { getPreferredDateTime } = require('@/utils/timelineParser');
    const preferred = getPreferredDateTime(incident);
    
    if (preferred.date && preferred.time) {
      try {
        const date = new Date(preferred.date).toLocaleDateString([], { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        const [hours, minutes] = preferred.time.split(':');
        const hour12 = parseInt(hours) % 12 || 12;
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
        const time = `${hour12}:${minutes} ${ampm}`;
        return `${date} at ${time}`;
      } catch {
        // Fall through to other methods
      }
    }
    
    if (preferred.date) {
      try {
        const date = new Date(preferred.date).toLocaleDateString([], { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        return date;
      } catch {
        // Fall through to other methods
      }
    }
  }
  
  // Fallback to existing logic
  if (incident.dateTime) {
    return formatHeader(incident.dateTime);
  }
  if (incident.datePart && incident.timePart) {
    const date = new Date(incident.datePart).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    const time = formatTimeOnlyFromParts(incident.timePart);
    return `${date} at ${time}`;
  }
  if (incident.datePart) {
    const date = new Date(incident.datePart).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    return date;
  }
  if (incident.timePart) {
    return `No date - ${formatTimeOnlyFromParts(incident.timePart)}`;
  }
  return "No date";
}

/**
 * Get formatted time display for incident based on data precedence
 */
export function getIncidentDisplayTime(incident: any): string {
  // First check for preferred time from timeline
  if (incident.timeline) {
    const { getPreferredDateTime } = require('@/utils/timelineParser');
    const preferred = getPreferredDateTime(incident);
    
    if (preferred.time) {
      try {
        const [hours, minutes] = preferred.time.split(':');
        const hour12 = parseInt(hours) % 12 || 12;
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      } catch {
        // Fall through to other methods
      }
    }
  }
  
  // Fallback to existing logic
  if (incident.dateTime) {
    return formatTimeOnly(incident.dateTime);
  }
  if (incident.timePart) {
    return formatTimeOnlyFromParts(incident.timePart);
  }
  return "No time";
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

export function normalizeTimeToHHMM(v: unknown): string {
  if (!v) return "";
  const s = String(v).trim().toLowerCase();
  // 9:05 or 09:05
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const [hh, mm] = s.split(":");
    return `${hh.padStart(2, "0")}:${mm}`;
  }
  // 9am or 9 pm
  const hm1 = s.match(/^(\d{1,2})\s*(am|pm)$/i);
  if (hm1) {
    let hh = parseInt(hm1[1], 10);
    const ap = hm1[2].toLowerCase();
    if (ap === "pm" && hh < 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:00`;
  }
  // 9:05am
  const hm2 = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (hm2) {
    let hh = parseInt(hm2[1], 10);
    const mm = hm2[2];
    const ap = hm2[3].toLowerCase();
    if (ap === "pm" && hh < 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    return `${String(hh).padStart(2, "0")}:${mm}`;
  }
  return "";
}

/**
 * Find the first time token in a Timeline. Searches the text after "Timeline:" first.
 * Supports "8:00 AM", "8:00am", "8am", "08:30", "17:05".
 * Returns HH:MM or empty string if none found.
 */
export function firstTimeFromTimeline(text: unknown): string {
  if (!text) return "";
  const raw = String(text);
  const start = raw.toLowerCase().indexOf("timeline:");
  const body = start >= 0 ? raw.slice(start + "timeline:".length) : raw;
  const timeRegexes = [
    /\b(\d{1,2}):([0-5]\d)\s*(am|pm)\b/i,
    /\b(\d{1,2})\s*(am|pm)\b/i,
    /\b([01]?\d|2[0-3]):([0-5]\d)\b/
  ];
  for (const rx of timeRegexes) {
    const m = body.match(rx);
    if (m) {
      if (m.length === 3 && !/[ap]m/i.test(m[0])) {
        // 24h HH:MM
        const hh = m[1].padStart(2, "0");
        const mm = m[2];
        return `${hh}:${mm}`;
      }
      return normalizeTimeToHHMM(m[0]);
    }
  }
  return "";
}

/**
 * Return the time to show for an incident.
 * Prefer explicit incident.when or incident.time. Otherwise use firstTimeFromTimeline from timeline or notes.
 */
export function deriveIncidentTime(incident: any): string {
  const explicit = normalizeTimeToHHMM(incident?.when ?? incident?.time);
  if (explicit) return explicit;
  const fromTimeline = firstTimeFromTimeline(incident?.timeline);
  if (fromTimeline) return fromTimeline;
  const fromNotes = firstTimeFromTimeline(incident?.notes);
  return fromNotes;
}

export function formatHHMMForUI(hhmm: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(n => parseInt(n || "0", 10));
  const t = new Date();
  t.setHours(h, m, 0, 0);
  return t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
