import { supabase } from '@/integrations/supabase/client';
import { OrganizedIncident } from '@/types/incidents';

export const aiService = {
  /**
   * Organizes raw incident notes using AI via Supabase Edge Function
   */
  async organizeIncidents(rawNotes: string): Promise<OrganizedIncident[]> {
    try {
      const { data, error } = await supabase.functions.invoke('organize-incidents', {
        body: { rawNotes }
      });

      if (error) {
        throw new Error(`AI processing failed: ${error.message}`);
      }

      if (!data || !data.incidents) {
        throw new Error('No organized incidents returned from AI');
      }

      return data.incidents;
    } catch (error) {
      console.error('Error organizing incidents:', error);
      throw error;
    }
  }
};