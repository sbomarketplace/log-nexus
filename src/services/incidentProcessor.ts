/**
 * Service for processing and organizing incidents with enhanced date parsing,
 * voice normalization, and category consistency
 */

import { parseIncidentDate } from '@/utils/dateParser';
import { normalizeToFirstPerson } from '@/utils/voiceNormalizer';
import { generateIncidentKey, getCategoryForKey, saveCategoryMapping } from '@/utils/incidentKeyGenerator';
import { getDateSafely } from '@/utils/safeDate';
import { OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { prefillIncidentFromNotes } from '@/lib/notesPrefill';
import { improveGrammarForFields } from '@/services/grammarService';

// ProcessedIncident is just an alias since OrganizedIncident already has all the fields we need
export type ProcessedIncident = OrganizedIncident;

export interface ProcessIncidentOptions {
  authorPerspective?: 'first_person' | 'third_person';
  rawNotes?: string;
  improveGrammar?: boolean; // New option to enable grammar improvement
}

export async function processIncident(
  incident: OrganizedIncident, 
  options: ProcessIncidentOptions = {}
): Promise<ProcessedIncident> {
  const { authorPerspective = 'first_person', rawNotes, improveGrammar = true } = options;
  
  // Apply prefill data from notes first
  let processedIncident = { ...incident };
  if (rawNotes) {
    const prefillData = prefillIncidentFromNotes({ 
      ...incident, 
      notes: rawNotes,
      what: incident.what || rawNotes
    });
    processedIncident = { ...processedIncident, ...prefillData };
  }
  
  // Improve grammar for text fields if enabled
  if (improveGrammar) {
    const fieldsToImprove = ['notes', 'what', 'who', 'where', 'when', 'witnesses'] as (keyof OrganizedIncident)[];
    processedIncident = await improveGrammarForFields(processedIncident, fieldsToImprove);
  }
  
  // Generate incident key for consistency
  let incidentKey: string | undefined;
  let existingCategory: string | null = null;
  
  if (rawNotes) {
    // Safe date access for key generation
    const dateForKey = getDateSafely(processedIncident, '');
    const keyInfo = generateIncidentKey(rawNotes, dateForKey);
    incidentKey = keyInfo.key;
    existingCategory = getCategoryForKey(incidentKey);
  }
  
  // Parse date for canonical format
  let canonicalEventDate: string | undefined;
  let originalEventDateText: string | undefined;
  
  // Try to parse date from various sources - null safety
  const dateToParse = getDateSafely(processedIncident, '') || processedIncident.when || 
    (rawNotes ? extractDateFromRawNotes(rawNotes) : null);
  
  if (dateToParse && dateToParse !== 'No date') {
    originalEventDateText = dateToParse;
    const parsed = parseIncidentDate(dateToParse);
    if (parsed) {
      canonicalEventDate = parsed.canonicalEventDate;
    }
  }
  
  // Use existing category if available for consistency
  const categoryOrIssue = existingCategory || processedIncident.categoryOrIssue;
  
  // Save category mapping for future consistency
  if (incidentKey && !existingCategory) {
    saveCategoryMapping(incidentKey, categoryOrIssue, false);
  }
  
  // Normalize voice perspective for all text fields
  const normalizedNotes = normalizeToFirstPerson(processedIncident.notes, { authorPerspective });
  const normalizedWhat = normalizeToFirstPerson(processedIncident.what, { authorPerspective });
  const normalizedWho = normalizeToFirstPerson(processedIncident.who, { authorPerspective });
  const normalizedWhere = normalizeToFirstPerson(processedIncident.where, { authorPerspective });
  const normalizedWhen = normalizeToFirstPerson(processedIncident.when, { authorPerspective });
  const normalizedWitnesses = normalizeToFirstPerson(processedIncident.witnesses, { authorPerspective });
  
  return {
    ...processedIncident,
    categoryOrIssue,
    notes: normalizedNotes,
    what: normalizedWhat,
    who: normalizedWho,
    where: normalizedWhere,
    when: normalizedWhen, 
    witnesses: normalizedWitnesses,
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