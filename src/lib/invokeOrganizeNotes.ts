import { supabase } from "@/integrations/supabase/client";
import { toStr, normalizeNewlines, cleanTabs } from "@/lib/text";

/** Input from the Home page quick entry card */
export type QuickNotesInput = {
  title?: unknown;
  notes?: unknown;
};

/** Return type is kept generic so existing callers do not break */
export type QuickNotesResult = {
  ok: boolean;
  data?: any;
  error?: string;
};

export async function organizeQuickNotes(input: QuickNotesInput): Promise<any> {
  // Always coerce first so .replace never runs on undefined
  const title = toStr(input?.title).trim();
  // Do simple, safe cleaning only on strings
  const notes = cleanTabs(normalizeNewlines(input?.notes));

  // If nothing provided, exit gracefully instead of throwing
  if (!title && !notes) {
    return { normalized: { incidents: [] } };
  }

  try {
    const { data, error } = await supabase.functions.invoke("organize-incidents", {
      body: { notes }
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

export default organizeQuickNotes;