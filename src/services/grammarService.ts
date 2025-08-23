import { supabase } from '@/integrations/supabase/client';
import { canParse, consumeParse } from '@/utils/parsingGate';

export interface GrammarImprovementResult {
  improvedText: string;
  hasChanges: boolean;
  originalText?: string;
  originalLength?: number;
  improvedLength?: number;
  error?: string;
}

// Simple in-memory cache for grammar improvements
const grammarCache = new Map<string, GrammarImprovementResult>();

// Helper to generate cache key
function getCacheKey(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Improves grammar in text using AI while preserving meaning and content
 */
export async function improveGrammar(text: string): Promise<GrammarImprovementResult> {
  if (!text?.trim()) {
    return {
      improvedText: text || '',
      hasChanges: false
    };
  }

  // Check parsing gate before making AI call
  if (!canParse()) {
    return { improvedText: text, hasChanges: false };
  }

  // Check cache first
  const cacheKey = getCacheKey(text);
  if (grammarCache.has(cacheKey)) {
    return grammarCache.get(cacheKey)!;
  }

  try {
    const { data, error } = await supabase.functions.invoke('improve-grammar', {
      body: { text }
    });

    // Consume parsing credit after successful call
    await consumeParse();

    if (error) {
      console.warn('Grammar improvement failed:', error);
      return {
        improvedText: text,
        hasChanges: false,
        error: error.message
      };
    }

    const result = data as GrammarImprovementResult;
    
    // Cache the result
    grammarCache.set(cacheKey, result);
    
    return result;
  } catch (error) {
    console.warn('Grammar service error:', error);
    return {
      improvedText: text,
      hasChanges: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Improves grammar for multiple text fields in an object using batch processing
 */
export async function improveGrammarForFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): Promise<T> {
  const result = { ...obj };
  
  // Collect texts that need improvement
  const textsToImprove: string[] = [];
  const fieldMapping: { field: keyof T; index: number }[] = [];
  
  for (const field of fields) {
    const text = obj[field];
    if (typeof text === 'string' && text.trim()) {
      // Check cache first
      const cacheKey = getCacheKey(text);
      if (grammarCache.has(cacheKey)) {
        const cachedResult = grammarCache.get(cacheKey)!;
        if (cachedResult.hasChanges) {
          (result as any)[field] = cachedResult.improvedText;
        }
      } else {
        // Add to batch
        textsToImprove.push(text);
        fieldMapping.push({ field, index: textsToImprove.length - 1 });
      }
    }
  }
  
  // Process batch if there are uncached texts
  if (textsToImprove.length > 0) {
    // Check parsing gate before making AI call
    if (!canParse()) {
      // Return results with original text for uncached items
      for (const text of textsToImprove) {
        const cacheKey = `grammar_${text.slice(0, 50)}_${text.length}`;
        grammarCache.set(cacheKey, { improvedText: text, hasChanges: false });
      }
    } else {
      try {
        const { data, error } = await supabase.functions.invoke('improve-grammar', {
          body: { texts: textsToImprove }
        });

        // Consume parsing credit after successful call
        await consumeParse();

        if (error) {
          console.warn('Batch grammar improvement failed:', error);
          return result;
        }

        const batchResults = data.results as GrammarImprovementResult[];
        
        // Apply results and cache them
        for (const { field, index } of fieldMapping) {
          const batchResult = batchResults[index];
          const originalText = textsToImprove[index];
          
          // Cache the result
          const cacheKey = getCacheKey(originalText);
          grammarCache.set(cacheKey, batchResult);
          
          // Apply if there are changes
          if (batchResult.hasChanges) {
            (result as any)[field] = batchResult.improvedText;
          }
        }
      } catch (error) {
        console.warn('Grammar service batch error:', error);
      }
    }
  }
  
  return result;
}