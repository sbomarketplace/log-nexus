import { supabase } from '@/integrations/supabase/client';

export interface SearchIncidentsParams {
  query: string;
  category?: string;
  limit?: number;
}

/**
 * Search incidents in Supabase database by keyword, person, or Case # (exact/partial)
 * This function demonstrates database-level search using the normalized case_number_norm column
 */
export async function searchIncidents({ query, category, limit = 50 }: SearchIncidentsParams) {
  const q = query.trim();
  const qLike = `%${q}%`;
  const qNorm = q.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Build OR clause for flexible search. Remove falsy entries before join.
  const orParts = [
    // Search in text fields
    `events->>0->>'what':ilike.${qLike}`,
    `events->>0->>'who':ilike.${qLike}`,
    `events->>0->>'where':ilike.${qLike}`,
    `events->>0->>'categoryOrIssue':ilike.${qLike}`,
    `events->>0->>'notes':ilike.${qLike}`,
    // Case number exact match
    `case_number:ilike.${qLike}`,
    // Case number normalized partial match (strips punctuation/spaces for flexible matching)
    qNorm ? `case_number_norm:ilike.%${qNorm}%` : null,
  ].filter(Boolean).join(',');

  let queryBuilder = supabase
    .from('incidents')
    .select('*')
    .or(orParts)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category && category !== 'All Categories') {
    queryBuilder = queryBuilder.eq('events->>0->>"categoryOrIssue"', category);
  }

  return await queryBuilder;
}

/**
 * Normalize text for fuzzy case number matching
 * Removes spaces, punctuation, and converts to lowercase
 */
export function normalizeForSearch(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Check if a case number matches a search query (exact or partial)
 */
export function matchesCaseNumber(caseNumber: string | undefined, searchQuery: string): boolean {
  if (!caseNumber || !searchQuery) return false;
  
  const searchLower = searchQuery.toLowerCase();
  const searchNorm = normalizeForSearch(searchQuery);
  
  // Exact match (case-insensitive)
  if (caseNumber.toLowerCase().includes(searchLower)) {
    return true;
  }
  
  // Normalized partial match (strips punctuation/spaces for flexible matching)
  if (searchNorm && normalizeForSearch(caseNumber).includes(searchNorm)) {
    return true;
  }
  
  return false;
}