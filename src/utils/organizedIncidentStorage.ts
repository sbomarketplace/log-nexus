export interface OrganizedIncident {
  id: string;
  date: string;
  categoryOrIssue: string;
  who: string;
  what: string;
  where: string;
  when: string;
  witnesses: string;
  notes: string;
  timeline?: string;
  requests?: string;
  policy?: string;
  evidence?: string;
  files?: string[];
  createdAt: string;
  updatedAt: string;
  // Enhanced date fields
  canonicalEventDate?: string; // ISO 8601 string
  originalEventDateText?: string; // Original input
  // Category consistency
  incidentKey?: string; // For duplicate detection
}

export interface OrganizedIncidentStorage {
  version: string;
  incidents: OrganizedIncident[];
}

const STORAGE_KEY = 'organized-incidents';
const STORAGE_VERSION = '1.0';

export const organizedIncidentStorage = {
  getAll(): OrganizedIncident[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const data: OrganizedIncidentStorage = JSON.parse(stored);
      return data.incidents || [];
    } catch (error) {
      console.error('Error reading organized incidents from storage:', error);
      return [];
    }
  },

  save(incident: OrganizedIncident): void {
    try {
      const incidents = this.getAll();
      const existingIndex = incidents.findIndex(i => i.id === incident.id);
      
      if (existingIndex >= 0) {
        incidents[existingIndex] = { ...incident, updatedAt: new Date().toISOString() };
      } else {
        incidents.push(incident);
      }
      
      const data: OrganizedIncidentStorage = {
        version: STORAGE_VERSION,
        incidents
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving organized incident to storage:', error);
      throw new Error('Failed to save incident');
    }
  },

  saveMultiple(incidents: OrganizedIncident[]): void {
    try {
      const existing = this.getAll();
      const updated = [...existing, ...incidents];
      
      const data: OrganizedIncidentStorage = {
        version: STORAGE_VERSION,
        incidents: updated
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving multiple organized incidents to storage:', error);
      throw new Error('Failed to save incidents');
    }
  },

  getById(id: string): OrganizedIncident | null {
    const incidents = this.getAll();
    return incidents.find(i => i.id === id) || null;
  },

  delete(id: string): void {
    try {
      const incidents = this.getAll().filter(i => i.id !== id);
      
      const data: OrganizedIncidentStorage = {
        version: STORAGE_VERSION,
        incidents
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error deleting organized incident from storage:', error);
      throw new Error('Failed to delete incident');
    }
  },

  exportToText(incident: OrganizedIncident): string {
    return `INCIDENT REPORT
=================

Date: ${incident.date}
Category/Issue: ${incident.categoryOrIssue}

WHO: ${incident.who}

WHAT: ${incident.what}

WHERE: ${incident.where}

WHEN: ${incident.when}

WITNESSES: ${incident.witnesses}

NOTES: ${incident.notes}

---
Created: ${new Date(incident.createdAt).toLocaleString()}
Last Updated: ${new Date(incident.updatedAt).toLocaleString()}`;
  },

  downloadAsFile(incident: OrganizedIncident): void {
    const content = this.exportToText(incident);
    const filename = `incident-${incident.date.replace(/[\/\s]/g, '-')}-${incident.categoryOrIssue.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
};