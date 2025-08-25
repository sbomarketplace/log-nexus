import { supabase } from "@/integrations/supabase/client";

export async function sendFeedback(payload: {
  message: string;
  rating: number | null;
  email: string | null;
  meta?: Record<string, any>;
}) {
  const { data, error } = await supabase.functions.invoke('send-feedback', {
    body: payload,
  });

  if (error) {
    throw new Error(error.message || 'Failed to send feedback');
  }

  return data;
}