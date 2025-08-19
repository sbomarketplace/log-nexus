/**
 * Single source of truth for incident date/time display
 * Used by both incident cards and modal to ensure consistency
 */

import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { parseISOToLocal } from '@/utils/incidentFormatting';
import { getPreferredDateTime } from '@/utils/timelineParser';

export type Occurrence = {
  type: "occurrence" | "created";
  dt: Date | null;
  hasDate: boolean;
  hasTime: boolean;
  originalDate?: string; // Store original date part for display
  originalTime?: string; // Store original time part for display
};

export function deriveIncidentOccurrence(incident: OrganizedIncident): Occurrence {
  // 1) Check for preferred date/time from original text and timeline first
  if (incident.originalEventDateText || incident.timeline) {
    const preferred = getPreferredDateTime(incident);
    
    if (preferred.date) {
      try {
        // Parse YYYY-MM-DD format and ensure we use local date
        const [year, month, day] = preferred.date.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        
        if (!isNaN(date.getTime())) {
          const hasTime = Boolean(preferred.time);
          
          if (hasTime && preferred.time) {
            // Combine date and time
            const [hours, minutes] = preferred.time.split(':').map(Number);
            date.setHours(hours, minutes, 0, 0);
            return { 
              type: "occurrence", 
              dt: date, 
              hasDate: true, 
              hasTime: true,
              originalDate: preferred.date,
              originalTime: preferred.time
            };
          } else {
            return { 
              type: "occurrence", 
              dt: date, 
              hasDate: true, 
              hasTime: false,
              originalDate: preferred.date
            };
          }
        }
      } catch {
        // Fall through to other methods
      }
    }
    
    // Only time from timeline
    if (preferred.time) {
      const today = new Date();
      const [hours, minutes] = preferred.time.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      return { 
        type: "occurrence", 
        dt: today, 
        hasDate: false, 
        hasTime: true,
        originalTime: preferred.time
      };
    }
  }

  // 2) Full datetime
  if (incident?.dateTime) {
    const d = parseISOToLocal(incident.dateTime);
    if (d) {
      return { type: "occurrence", dt: d, hasDate: true, hasTime: true };
    }
  }
  
  // 3) Parts
  const hasDatePart = Boolean(incident?.datePart);
  const hasTimePart = Boolean(incident?.timePart);
  
  if (hasDatePart || hasTimePart) {
    // Build a best effort Date object only for display when both exist
    if (hasDatePart && hasTimePart) {
      try {
        const dtLocalStr = `${incident.datePart}T${incident.timePart}:00`;
        const dt = new Date(dtLocalStr);
        return { 
          type: "occurrence", 
          dt: dt, 
          hasDate: true, 
          hasTime: true,
          originalDate: incident.datePart,
          originalTime: incident.timePart
        };
      } catch {
        // Fallback to date only
      }
    }
    
    // Only one part exists
    if (hasDatePart) {
      try {
        const dt = new Date(`${incident.datePart}T00:00:00`);
        return {
          type: "occurrence",
          dt: dt,
          hasDate: true,
          hasTime: false,
          originalDate: incident.datePart
        };
      } catch {
        // Fall through
      }
    }
    
    if (hasTimePart) {
      // Time only - use today's date for display purposes
      const today = new Date();
      const [hours, minutes] = incident.timePart.split(':').map(Number);
      today.setHours(hours, minutes, 0, 0);
      return {
        type: "occurrence",
        dt: today,
        hasDate: false,
        hasTime: true,
        originalTime: incident.timePart
      };
    }
  }
  
  // 4) Fallback to created
  const created = incident?.createdAt ? new Date(incident.createdAt) : null;
  return { type: "created", dt: created, hasDate: Boolean(created), hasTime: Boolean(created) };
}

export function formatPrimaryChip(occ: Occurrence): string {
  if (occ.type === "occurrence") {
    if (occ.hasDate && occ.hasTime && occ.dt) {
      return formatDate(occ.dt, "MMM d");
    }
    if (occ.hasDate && occ.dt) {
      return formatDate(occ.dt, "MMM d");
    }
    // Time only, no date - show time only badge separately
    return "No date";
  }
  // Created fallback
  return occ.dt ? formatDate(occ.dt, "MMM d") : "No date";
}

export function formatTimeChip(occ: Occurrence): string | null {
  if (occ.type === "occurrence" && occ.hasTime && occ.dt) {
    return formatDate(occ.dt, "h:mm a");
  }
  return null;
}

export function hasTimeOnly(occ: Occurrence): boolean {
  return occ.type === "occurrence" && occ.hasTime && !occ.hasDate;
}

export function formatSecondaryCreated(createdAt?: string): string {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  return `Created ${formatDate(d, "MMM d")} at ${formatDate(d, "h:mm a")}`;
}

export function formatRelativeUpdate(updatedAt?: string): string {
  if (!updatedAt) return "";
  
  const now = new Date();
  const date = new Date(updatedAt);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Updated just now";
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  if (diffDays < 7) return `Updated ${diffDays}d ago`;
  
  return `Updated ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })}`;
}

// Lightweight date formatter
function formatDate(d: Date, fmt: string): string {
  if (fmt === "MMM d") {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
  if (fmt === "h:mm a") {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }
  if (fmt === "MMM d, h:mm a") {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }) + ' at ' + d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  }
  return d.toLocaleString();
}