import { supabase } from '@/integrations/supabase/client';

type Fields = Partial<{
  who: string;
  what: string;
  where: string;
  notes: string;
  witnesses: string;
  summary: string;
}>;

export async function batchPolish(fields: Fields): Promise<Fields> {
  // If fields are short/clean, skip the model entirely (fast path)
  const joinedText = Object.values(fields).filter(Boolean).join("\n");
  const joinedLen = joinedText.length;
  
  // Skip polishing for short content or if no fields to polish
  if (joinedLen < 300 || !joinedText.trim()) {
    return fields;
  }
  
  try {
    // Use existing improve-grammar function but pass all fields at once
    const { data, error } = await supabase.functions.invoke('improve-grammar', {
      body: { 
        text: JSON.stringify(fields),
        batchMode: true 
      }
    });

    if (error) {
      console.warn('Batch grammar improvement failed:', error);
      return fields; // Return original fields on error
    }

    // If the function returns improved fields, merge them
    if (data && data.improvedText) {
      try {
        const improvedFields = JSON.parse(data.improvedText);
        return { ...fields, ...improvedFields };
      } catch (parseError) {
        console.warn('Failed to parse improved batch result:', parseError);
        return fields;
      }
    }

    return fields;
  } catch (error) {
    console.warn('Batch polish error:', error);
    return fields; // Return original fields on any error
  }
}