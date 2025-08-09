import { supabase } from '@/integrations/supabase/client';

export interface OrganizedIncident {
  date: string;
  categoryOrIssue: string;
  who: string;
  what: string;
  where: string;
  when: string;
  witnesses: string;
  notes: string;
}

export const aiService = {
  /**
   * Organizes raw incident notes using AI via Supabase Edge Function
   */
  async organizeIncidents(rawNotes: string): Promise<OrganizedIncident[]> {
    try {
      const { data, error } = await supabase.functions.invoke('parse-incident-notes', {
        body: { rawNotes }
      });

      if (error) {
        throw new Error(`AI processing failed: ${error.message}`);
      }

      if (!data || !data.events) {
        throw new Error('No organized incidents returned from AI');
      }

      // Map the response to our OrganizedIncident format
      return data.events.map((event: any): OrganizedIncident => ({
        date: event.date || 'None noted',
        categoryOrIssue: event.category || 'None noted',
        who: event.who || 'None noted',
        what: event.what || 'None noted',
        where: event.where || 'None noted',
        when: event.when || 'None noted',
        witnesses: event.witnesses || 'None noted',
        notes: event.notes || 'None noted'
      }));
    } catch (error) {
      console.error('Error organizing incidents:', error);
      throw error;
    }
  }
};