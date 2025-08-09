import { supabase } from "@/integrations/supabase/client";
import type { OrganizeResponse } from "@/types/incidents";

export async function organizeNotes(rawNotes: string) {
  const { data, error } = await supabase.functions.invoke<OrganizeResponse>(
    "organize-incidents",
    {
      body: { rawNotes },
    }
  );

  if (error) {
    // Surface server-provided details if present
    const message =
      (error as any)?.message ||
      (data as any)?.error ||
      "We couldn't organize these notes. Please try again.";
    throw new Error(message);
  }

  if (!data || !Array.isArray(data.incidents)) {
    throw new Error("Organizer returned unexpected format.");
  }

  return data.incidents;
}