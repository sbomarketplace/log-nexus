/**
 * Migration utility for OrganizedIncident dateTime field
 */
import { migrateLegacyDateTime } from './datetime';
import type { OrganizedIncident } from './organizedIncidentStorage';

/**
 * Get the effective dateTime for an OrganizedIncident, handling both new and legacy formats
 */
export function getEffectiveOrganizedDateTime(incident: OrganizedIncident | null): string | null {
  if (!incident) return null;
  
  // Prefer new unified dateTime field
  if (incident.dateTime) {
    return incident.dateTime;
  }
  
  // Fall back to migrating legacy fields on-the-fly
  return migrateLegacyDateTime(incident.date, incident.when);
}

/**
 * Migrate OrganizedIncident to use unified dateTime field
 */
export function migrateOrganizedIncidentDateTime(incident: OrganizedIncident): OrganizedIncident {
  if (incident.dateTime) {
    // Already has unified dateTime
    return incident;
  }
  
  const migratedDateTime = migrateLegacyDateTime(incident.date, incident.when);
  
  return {
    ...incident,
    dateTime: migratedDateTime || undefined
  };
}