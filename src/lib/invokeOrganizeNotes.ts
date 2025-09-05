import { supabase } from "@/integrations/supabase/client";

export async function organizeQuickNotes(payload: { title: string; notes: string }) {
  try {
    const { data, error } = await supabase.functions.invoke("organize-incidents", {
      body: { notes: payload.notes }
    });

    if (error) {
      console.error('Edge Function error:', error);
      
      // This is the exact message you are seeing when fetch fails due to CORS or network
      if (error.message.includes("Failed to send a request to the Edge Function")) {
        throw new Error("Network or CORS issue reaching the Edge Function. Confirm deploy and CORS.");
      }
      throw error;
    }

    if (data?.ok === false) {
      const message = data?.errors?.join("; ") || "Service returned error";
      throw new Error(message);
    }

    return data;
  } catch (e: any) {
    const msg = e?.message || "Unexpected error";
    console.error('organizeQuickNotes error:', msg);
    throw new Error(msg);
  }
}