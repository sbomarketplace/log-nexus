import { supabase } from '@/integrations/supabase/client';
import { IncidentRecord, IncidentEvent } from '@/types/incidents';

export const incidentService = {
  /**
   * Creates a new incident record in Supabase
   */
  async createIncident(record: IncidentRecord): Promise<void> {
    const { error } = await supabase
      .from('incidents')
      .insert({
        id: record.id,
        events: record.events as any // Cast to handle JSONB type mismatch
      });

    if (error) {
      throw new Error(`Failed to create incident: ${error.message}`);
    }
  },

  /**
   * Fetches all incidents from Supabase
   */
  async getAllIncidents(): Promise<IncidentRecord[]> {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch incidents: ${error.message}`);
    }

    // Type-safe conversion from Supabase data to our types
    return (data || []).map(row => ({
      id: row.id,
      created_at: row.created_at,
      events: row.events as unknown as IncidentEvent[]
    }));
  },

  /**
   * Deletes an incident by ID
   */
  async deleteIncident(id: string): Promise<void> {
    const { error } = await supabase
      .from('incidents')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete incident: ${error.message}`);
    }
  }
};