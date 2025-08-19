/**
 * Shared formatting utilities for incident display
 * Used by both cards and modal to ensure consistency
 */

import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { getPreferredDateTime } from '@/utils/timelineParser';

/**
 * Parse ISO string to local Date
 */
export function parseISOToLocal(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Format Date as YYYY-MM-DD
 */
export function formatYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Format Date as HH:mm
 */
export function formatHHmm(d: Date): string {
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Combine local date and time strings into Date object
 */
export function combineLocalDateAndTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Convert Date to UTC ISO string
 */
export function toUTCISO(date: Date): string {
  return date.toISOString();
}

/**
 * Parse date/time from notes text
 */
export function parseDateTimeFromNotes(text: string): { date: string | null; time: string | null } | null {
  if (!text?.trim()) return null;

  let foundDate: string | null = null;
  let foundTime: string | null = null;

  // Date patterns: 8/17/2025, 2025-08-17, Aug 17 2025, etc.
  const datePatterns = [
    /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,  // 8/17/2025
    /\b(\d{4})-(\d{2})-(\d{2})\b/,        // 2025-08-17
    /\b([A-Za-z]{3})\s+(\d{1,2}),?\s+(\d{4})\b/, // Aug 17 2025
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (pattern === datePatterns[0]) {
        // MM/DD/YYYY
        const [, month, day, year] = match;
        foundDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (pattern === datePatterns[1]) {
        // YYYY-MM-DD (already correct format)
        foundDate = match[0];
      } else if (pattern === datePatterns[2]) {
        // Aug 17 2025
        const [, monthName, day, year] = match;
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const month = monthNames.indexOf(monthName.toLowerCase()) + 1;
        if (month > 0) {
          foundDate = `${year}-${month.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      break;
    }
  }

  // Time patterns: 6:23 PM, 06:23, etc.
  const timePatterns = [
    /\b(\d{1,2}):(\d{2})\s*(pm|am)\b/i,   // 6:23 PM
    /\b(\d{1,2}):(\d{2})\b/,              // 06:23
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      let [, hours, minutes, meridiem] = match;
      let hour24 = parseInt(hours);
      
      if (meridiem) {
        const isPM = meridiem.toLowerCase() === 'pm';
        if (isPM && hour24 !== 12) hour24 += 12;
        if (!isPM && hour24 === 12) hour24 = 0;
      }
      
      foundTime = `${hour24.toString().padStart(2, '0')}:${minutes}`;
      break;
    }
  }

  return foundDate || foundTime ? { date: foundDate, time: foundTime } : null;
}

/**
 * Format header display for incident (e.g., "MMM d, yyyy at h:mm a")
 */
export function formatHeader(dateTimeISO?: string): string {
  if (!dateTimeISO) return "No date";
  const d = parseISOToLocal(dateTimeISO);
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
 * Format time only display
 */
export function formatTimeOnly(timePart: string): string {
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
 * Validate case number format
 */
export function validateCaseNumber(caseNumber: string): boolean {
  return /^[A-Za-z0-9 \-\/]{0,50}$/.test(caseNumber);
}

/**
 * Get display date for incident card/modal (shared formatting)
 */
export function getIncidentDisplayDate(incident: OrganizedIncident): string {
  // First check for preferred date/time from original text and timeline
  if (incident.originalEventDateText || incident.timeline) {
    const preferred = getPreferredDateTime(incident);
    
    if (preferred.date) {
      try {
        const date = new Date(preferred.date);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        }
      } catch {
        // Fall through to other methods
      }
    }
  }
  
  // Check unified dateTime field
  if (incident.dateTime) {
    const d = parseISOToLocal(incident.dateTime);
    if (d) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }
  
  // Check separate date part
  if (incident.datePart) {
    const d = parseISOToLocal(incident.datePart);
    if (d) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }
  
  // Fallback to legacy date field
  if (incident.date) {
    try {
      const d = new Date(incident.date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch {
      // Fall through
    }
  }
  
  return "No date";
}

/**
 * Get display time for incident (shared formatting)
 */
export function getIncidentDisplayTime(incident: OrganizedIncident): string {
  // First check for preferred time from timeline
  if (incident.timeline) {
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
  
  // Check unified dateTime field
  if (incident.dateTime) {
    const d = parseISOToLocal(incident.dateTime);
    if (d) {
      return d.toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    }
  }
  
  // Check separate time part
  if (incident.timePart) {
    return formatTimeOnly(incident.timePart);
  }
  
  return "No time";
}

/**
 * Check if incident has only time without date
 */
export function hasTimeOnly(incident: OrganizedIncident): boolean {
  return !!incident.timePart && !incident.datePart && !incident.dateTime && !incident.date;
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateISO: string): string {
  const now = new Date();
  const date = new Date(dateISO);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}