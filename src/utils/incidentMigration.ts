/**
 * Migration utility for converting legacy date/time fields to unified dateTime
 */
import { storage } from './storage';
import { migrateLegacyDateTime } from './datetime';
import type { Incident } from '@/types/incident';

/**
 * Migrate all existing incidents to use unified dateTime field
 * This should be run once when the app loads if migration hasn't been completed
 */
export function migrateIncidentsToDateTime(): void {
  const migrationKey = 'incidents_datetime_migration_completed';
  
  // Check if migration has already been completed
  if (localStorage.getItem(migrationKey) === 'true') {
    return;
  }
  
  try {
    const incidents = storage.getIncidents();
    let migrationCount = 0;
    
    const migratedIncidents = incidents.map(incident => {
      // Only migrate if dateTime doesn't exist but legacy fields do
      if (!incident.dateTime && (incident.date || incident.time)) {
        const migratedDateTime = migrateLegacyDateTime(incident.date, incident.time);
        
        if (migratedDateTime) {
          migrationCount++;
          return {
            ...incident,
            dateTime: migratedDateTime
          };
        }
      }
      
      return incident;
    });
    
    // Save migrated incidents if any were updated
    if (migrationCount > 0) {
      // Replace all incidents with migrated versions
      localStorage.setItem('incidents', JSON.stringify(migratedIncidents));
      console.log(`Migrated ${migrationCount} incidents to use unified dateTime field`);
    }
    
    // Mark migration as completed
    localStorage.setItem(migrationKey, 'true');
    
  } catch (error) {
    console.error('Error during incident migration:', error);
  }
}

/**
 * Get the effective dateTime for an incident, handling both new and legacy formats
 */
export function getEffectiveDateTime(incident: Incident): string | null {
  // Prefer new unified dateTime field
  if (incident.dateTime) {
    return incident.dateTime;
  }
  
  // Fall back to migrating legacy fields on-the-fly
  return migrateLegacyDateTime(incident.date, incident.time);
}