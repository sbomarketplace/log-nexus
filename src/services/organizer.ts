import { supabase } from "@/integrations/supabase/client";
import type { StructuredIncidentResponse } from "@/types/structured-incidents";

export async function organizeNotes(rawNotes: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "organize-incidents",
      {
        body: { notes: rawNotes },
      }
    );

    if (error) {
      console.error('Supabase function invocation error:', error);
      
      // Handle specific HTTP status codes
      if (error.message?.includes('422')) {
        throw new Error(`${data?.error || "Invalid input data"}\n\n[View function logs](https://supabase.com/dashboard/project/higuokkqenvesmexzozx/functions/organize-incidents/logs)`);
      }
      
      if (error.message?.includes('502')) {
        throw new Error(`AI service is temporarily unavailable. Please try again in a moment.\n\n[View function logs](https://supabase.com/dashboard/project/higuokkqenvesmexzozx/functions/organize-incidents/logs)`);
      }
      
      if (error.message?.includes('500')) {
        throw new Error(`We hit an unexpected server error. Please try again.\n\n[View function logs](https://supabase.com/dashboard/project/higuokkqenvesmexzozx/functions/organize-incidents/logs)`);
      }
      
      const message = error?.message || "We couldn't organize these notes. Please try again.";
      throw new Error(`${message}\n\n[View function logs](https://supabase.com/dashboard/project/higuokkqenvesmexzozx/functions/organize-incidents/logs)`);
    }

    console.log('Organize response data:', data);

    if (data?.ok === false) {
      // Handle specific error codes
      if (data?.code === 'quota_exceeded') {
        throw new Error(`OpenAI quota exceeded. Add credits or raise your monthly limit, then try again.\n\n[View function logs](https://supabase.com/dashboard/project/higuokkqenvesmexzozx/functions/organize-incidents/logs)`);
      }
      
      const message = data?.message || "Organizer returned an error.";
      throw new Error(`${message}\n\n[View function logs](https://supabase.com/dashboard/project/higuokkqenvesmexzozx/functions/organize-incidents/logs)`);
    }

    if (!data?.incidents || !Array.isArray(data.incidents)) {
      throw new Error(`Organizer returned unexpected format.\n\n[View function logs](https://supabase.com/dashboard/project/higuokkqenvesmexzozx/functions/organize-incidents/logs)`);
    }

    return data.incidents;
  } catch (error) {
    // Re-throw with function logs link if not already included
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    if (!errorMessage.includes('View function logs')) {
      throw new Error(`${errorMessage}\n\n[View function logs](https://supabase.com/dashboard/project/higuokkqenvesmexzozx/functions/organize-incidents/logs)`);
    }
    throw error;
  }
}