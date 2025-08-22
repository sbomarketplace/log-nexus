import { Incident } from '@/types/incident';

const STORAGE_KEY = 'hr_incidents';

export const storage = {
  getIncidents: (): Incident[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading incidents:', error);
      return [];
    }
  },

  saveIncident: (incident: Incident): void => {
    try {
      const incidents = storage.getIncidents();
      const existingIndex = incidents.findIndex(i => i.id === incident.id);
      
      if (existingIndex >= 0) {
        incidents[existingIndex] = incident;
      } else {
        // Add new incidents to the beginning of the array
        incidents.unshift(incident);
      }
      
      // Sort by date/dateTime descending (newest first) to ensure proper ordering
      incidents.sort((a, b) => {
        const aDate = new Date(a.dateTime || a.date || 0).getTime();
        const bDate = new Date(b.dateTime || b.date || 0).getTime();
        return bDate - aDate; // newest first
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
    } catch (error) {
      console.error('Error saving incident:', error);
    }
  },

  deleteIncident: (id: string): void => {
    try {
      const incidents = storage.getIncidents().filter(i => i.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
    } catch (error) {
      console.error('Error deleting incident:', error);
    }
  },

  getIncident: (id: string): Incident | undefined => {
    return storage.getIncidents().find(i => i.id === id);
  }
};