import { supabase } from '@/integrations/supabase/client';

export interface GrammarImprovementResult {
  improvedText: string;
  hasChanges: boolean;
  originalLength?: number;
  improvedLength?: number;
  error?: string;
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

  try {
    const { data, error } = await supabase.functions.invoke('improve-grammar', {
      body: { text }
    });

    if (error) {
      console.warn('Grammar improvement failed:', error);
      return {
        improvedText: text,
        hasChanges: false,
        error: error.message
      };
    }

    return data as GrammarImprovementResult;
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
 * Improves grammar for multiple text fields in an object
 */
export async function improveGrammarForFields<T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): Promise<T> {
  const result = { ...obj };
  
  for (const field of fields) {
    const text = obj[field];
    if (typeof text === 'string' && text.trim()) {
      const improved = await improveGrammar(text);
      if (improved.hasChanges) {
        (result as any)[field] = improved.improvedText;
      }
    }
  }
  
  return result;
}