/**
 * Service for processing and organizing incidents with enhanced date parsing,
 * voice normalization, and category consistency
 */

import { parseIncidentDate } from '@/utils/dateParser';
import { normalizeToFirstPerson } from '@/utils/voiceNormalizer';
import { generateIncidentKey, saveCategoryMapping, getCategoryForKey } from '@/utils/incidentKeyGenerator';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';

export interface ProcessedIncident extends OrganizedIncident {
  canonicalEventDate?: string;
  originalEventDateText?: string;
  incidentKey?: string;
}

export interface ProcessIncidentOptions {
  authorPerspective?: 'first_person' | 'third_person';
  rawNotes?: string;
}

export function processIncident(
  incident: OrganizedIncident, 
  options: ProcessIncidentOptions = {}
): ProcessedIncident {
  const { authorPerspective = 'first_person', rawNotes } = options;
  
  // Generate incident key for consistency
  let incidentKey: string | undefined;
  let existingCategory: string | null = null;
  
  if (rawNotes) {
    const keyInfo = generateIncidentKey(rawNotes, incident.date);
    incidentKey = keyInfo.key;
    existingCategory = getCategoryForKey(incidentKey);
  }
  
  // Parse date for canonical format
  let canonicalEventDate: string | undefined;
  let originalEventDateText: string | undefined;
  
  // Try to parse date from various sources
  const dateToParse = incident.date || incident.when || 
    (rawNotes ? extractDateFromRawNotes(rawNotes) : null);
  
  if (dateToParse && dateToParse !== 'No date') {
    originalEventDateText = dateToParse;
    const parsed = parseIncidentDate(dateToParse);
    if (parsed) {
      canonicalEventDate = parsed.canonicalEventDate;
    }
  }
  
  // Use existing category if available for consistency
  const categoryOrIssue = existingCategory || incident.categoryOrIssue;
  
  // Save category mapping for future consistency
  if (incidentKey && !existingCategory) {
    saveCategoryMapping(incidentKey, categoryOrIssue, false);
  }
  
  // Normalize voice perspective
  const normalizedNotes = normalizeToFirstPerson(incident.notes, { authorPerspective });
  const normalizedWhat = normalizeToFirstPerson(incident.what, { authorPerspective });
  
  return {
    ...incident,
    categoryOrIssue,
    notes: normalizedNotes,
    what: normalizedWhat,
    canonicalEventDate,
    originalEventDateText,
    incidentKey
  };
}

function extractDateFromRawNotes(rawNotes: string): string | null {
  // Look for common date patterns in raw notes
  const datePatterns = [
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
    /\b(\d{1,2}-\d{1,2}-\d{2,4})\b/,
    /\b(yesterday|today|last\s+\w+day)\b/i,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s*\d{4})?\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2}(?:,?\s*\d{4})?\b/i
  ];
  
  for (const pattern of datePatterns) {
    const match = rawNotes.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

export function updateIncidentCategory(incidentKey: string, newCategory: string, userConfirmed = true): void {
  saveCategoryMapping(incidentKey, newCategory, userConfirmed);
}