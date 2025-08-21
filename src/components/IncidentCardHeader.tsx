import React from "react";
import { Badge } from '@/components/ui/badge';
import { getPreferredDateTime } from '@/utils/timelineParser';
import { getEffectiveOrganizedDateTime } from '@/utils/organizedIncidentMigration';
import { formatHeader, deriveIncidentTime, formatHHMMForUI } from '@/utils/datetime';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { caseChipText } from '@/lib/caseFormat';
import { Hash } from 'lucide-react';

interface IncidentCardHeaderProps {
  incident: OrganizedIncident;
  className?: string;
}

export const IncidentCardHeader = ({ incident, className = "" }: IncidentCardHeaderProps) => {
  if (!incident) return null;

  // Get preferred date and time using existing utility
  const preferred = getPreferredDateTime(incident);
  const effectiveDateTime = getEffectiveOrganizedDateTime(incident);

  // Derive date string
  const dateStr = (() => {
    if (preferred.date) {
      try {
        const date = new Date(preferred.date);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
        }
      } catch {
        // Fall through to effectiveDateTime
      }
    }
    
    if (effectiveDateTime) {
      return formatHeader(effectiveDateTime).split(' at ')[0];
    }

    if (incident.originalEventDateText) {
      return incident.originalEventDateText;
    }
    
    if (incident.date) {
      try {
        const date = new Date(incident.date);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          });
        }
      } catch {
        return incident.date;
      }
    }
    
    return "Unknown date";
  })();

  // Derive time string using fallback logic
  const timeStr = (() => {
    // First try preferred time from timeline parsing
    if (preferred.time) {
      try {
        const [hours, minutes] = preferred.time.split(':');
        const hour12 = parseInt(hours) % 12 || 12;
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
      } catch {
        return preferred.time;
      }
    }
    
    // Use derive logic with timeline fallback
    const derivedTime = deriveIncidentTime(incident);
    if (derivedTime) {
      return formatHHMMForUI(derivedTime);
    }
    
    // Final fallback to effectiveDateTime
    if (effectiveDateTime) {
      return formatHeader(effectiveDateTime).split(' at ')[1] || null;
    }
    
    return null;
  })();

  const category = incident.categoryOrIssue || "Uncategorized";
  const title = incident.what || category;
  
  // Get case number from incident or extract from notes
  const caseNumber = incident.caseNumber || null;
  const caseTxt = caseChipText(caseNumber);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[11px] bg-neutral-50 border-neutral-200 text-neutral-700">
          {dateStr}
        </Badge>
        {timeStr && (
          <Badge variant="outline" className="text-[11px] bg-neutral-50 border-neutral-200 text-neutral-700">
            {timeStr}
          </Badge>
        )}
        <Badge variant="secondary" className="text-[11px] bg-neutral-200 text-neutral-800 font-medium">
          {category}
        </Badge>
        {caseNumber && (
          <Badge variant="outline" className="text-[11px] bg-neutral-50 border-neutral-200 text-neutral-700 inline-flex items-center gap-1">
            <Hash className="h-3 w-3" aria-hidden />
            <span className="sm:hidden">{caseTxt.mobile}</span>
            <span className="hidden sm:inline">{caseTxt.desktop}</span>
          </Badge>
        )}
      </div>
      <div className="text-base font-semibold text-neutral-900 leading-tight">
        {title}
      </div>
    </div>
  );
};