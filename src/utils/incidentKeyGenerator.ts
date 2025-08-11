/**
 * Incident key generator for consistent category assignment across duplicates
 * Creates deterministic keys based on normalized text and primary date
 */

import { parseIncidentDate } from './dateParser';

export interface IncidentKey {
  key: string;
  normalizedText: string;
  primaryDate: string | null;
}

export interface CategoryMapping {
  key: string;
  category: string;
  confirmedAt: string;
  userConfirmed: boolean;
}

const CATEGORY_STORAGE_KEY = 'incident-category-mappings';

export function generateIncidentKey(rawNotes: string, dateText?: string): IncidentKey {
  // Normalize the text for consistent hashing
  const normalizedText = normalizeTextForKey(rawNotes);
  
  // Extract primary date
  let primaryDate: string | null = null;
  if (dateText) {
    const parsed = parseIncidentDate(dateText);
    primaryDate = parsed?.canonicalEventDate || null;
  }
  
  // If no explicit date, try to extract from content
  if (!primaryDate) {
    const contentDate = extractDateFromContent(rawNotes);
    if (contentDate) {
      const parsed = parseIncidentDate(contentDate);
      primaryDate = parsed?.canonicalEventDate || null;
    }
  }
  
  // Create deterministic key
  const keyInput = `${normalizedText}|${primaryDate || 'no-date'}`;
  const key = generateHash(keyInput);
  
  return {
    key,
    normalizedText,
    primaryDate
  };
}

function normalizeTextForKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();
}

function extractDateFromContent(text: string): string | null {
  // Look for common date patterns in text
  const datePatterns = [
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
    /\b(\d{1,2}-\d{1,2}-\d{2,4})\b/,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:,?\s*\d{4})?\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+\d{1,2}(?:,?\s*\d{4})?\b/i,
    /\b(yesterday|today|last\s+\w+day)\b/i
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

function generateHash(input: string): string {
  // Simple hash function for deterministic key generation
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

export function saveCategoryMapping(key: string, category: string, userConfirmed = false): void {
  try {
    const mappings = getCategoryMappings();
    const existing = mappings.find(m => m.key === key);
    
    if (existing) {
      existing.category = category;
      existing.confirmedAt = new Date().toISOString();
      existing.userConfirmed = userConfirmed || existing.userConfirmed;
    } else {
      mappings.push({
        key,
        category,
        confirmedAt: new Date().toISOString(),
        userConfirmed
      });
    }
    
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(mappings));
  } catch (error) {
    console.error('Error saving category mapping:', error);
  }
}

export function getCategoryForKey(key: string): string | null {
  try {
    const mappings = getCategoryMappings();
    const mapping = mappings.find(m => m.key === key);
    return mapping?.category || null;
  } catch (error) {
    console.error('Error getting category mapping:', error);
    return null;
  }
}

export function getCategoryMappings(): CategoryMapping[] {
  try {
    const stored = localStorage.getItem(CATEGORY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading category mappings:', error);
    return [];
  }
}

export function findDuplicateIncidentKeys(newKey: string): CategoryMapping[] {
  const mappings = getCategoryMappings();
  return mappings.filter(m => m.key === newKey);
}