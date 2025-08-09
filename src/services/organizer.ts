import { supabase } from "@/integrations/supabase/client";
import type { OrganizeResponse } from "@/types/incidents";

export async function organizeNotes(rawNotes: string) {
  const { data, error } = await supabase.functions.invoke(
    "organize-incidents",
    {
      body: { rawNotes },
    }
  );

  if (error) {
    console.error('Supabase function invocation error:', error);
    const message = error?.message || "We couldn't organize these notes. Please try again.";
    throw new Error(message);
  }

  console.log('Organize response data:', data);

  if (!data?.ok) {
    // Handle specific error codes
    if (data?.code === 'quota_exceeded') {
      throw new Error("OpenAI quota exceeded. Add credits or raise your monthly limit, then try again.");
    }
    
    const message = data?.message || "Organizer returned an error.";
    throw new Error(message);
  }

  if (!data.incidents || !Array.isArray(data.incidents)) {
    throw new Error("Organizer returned unexpected format.");
  }

  return data.incidents;
}