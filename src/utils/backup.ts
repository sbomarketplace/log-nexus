import JSZip from 'jszip';
import { organizedIncidentStorage, OrganizedIncident } from '@/utils/organizedIncidentStorage';
import { exportBulkSinglePDF, exportBulkCSV, exportBulkTxtZip } from '@/utils/exporters';
import { nativeSaveFile, nativeToast, isNative } from '@/utils/native';

export interface BackupData {
  version: string;
  exportDate: string;
  incidents: OrganizedIncident[];
  metadata: {
    totalIncidents: number;
    dateRange: { start: string; end: string } | null;
  };
}

export const exportBackup = async (): Promise<void> => {
  try {
    const incidents = organizedIncidentStorage.getAll();
    
    if (incidents.length === 0) {
    if (isNative) {
      nativeToast('No incidents to export');
    } else {
      alert('No incidents to export');
    }
    return;
  }

  // Create backup data
  const backupData: BackupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    incidents,
    metadata: {
      totalIncidents: incidents.length,
      dateRange: getDateRange(incidents)
    }
  };

  // Create ZIP with multiple formats
  const zip = new JSZip();

  // Add JSON backup (complete data)
  zip.file('backup.json', JSON.stringify(backupData, null, 2));

  // Add CSV export
  try {
    await exportBulkCSV(incidents, {});
    // Note: CSV export handles its own download, we'll create a simple CSV here instead
    const csvContent = createSimpleCSV(incidents);
    zip.file('incidents.csv', csvContent);
  } catch (error) {
    console.warn('Failed to add CSV to backup:', error);
  }

  // Generate final backup ZIP
  const backupBlob = await zip.generateAsync({ type: 'blob' });
  const filename = `clearcase-backup-${new Date().toISOString().split('T')[0]}.zip`;

  // Save using native or web method
  if (isNative) {
    await nativeSaveFile(backupBlob, filename);
    nativeToast('Backup saved to Files');
  } else {
    // Web fallback
    const url = URL.createObjectURL(backupBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  } catch (error) {
    console.error('Backup export failed:', error);
    const message = 'Failed to create backup. Please try again.';
    if (isNative) {
      nativeToast(message);
    } else {
      alert(message);
    }
  }
};

export const importBackup = async (file: File): Promise<{ success: boolean; imported: number; errors: string[] }> => {
  const result = { success: false, imported: 0, errors: [] as string[] };

  try {
    if (file.name.endsWith('.zip')) {
      return await importZipBackup(file);
    } else if (file.name.endsWith('.json')) {
      return await importJsonBackup(file);
    } else if (file.name.endsWith('.csv')) {
      return await importCsvBackup(file);
    } else {
      result.errors.push('Unsupported file format. Use .zip, .json, or .csv files.');
      return result;
    }
  } catch (error) {
    console.error('Backup import failed:', error);
    result.errors.push('Failed to import backup file.');
    return result;
  }
};

const importZipBackup = async (file: File): Promise<{ success: boolean; imported: number; errors: string[] }> => {
  const result = { success: false, imported: 0, errors: [] as string[] };

  try {
    const zip = await JSZip.loadAsync(file);
    
    // Try to find backup.json first
    const jsonFile = zip.file('backup.json');
    if (jsonFile) {
      const jsonContent = await jsonFile.async('string');
      const backupData: BackupData = JSON.parse(jsonContent);
      
      if (backupData.incidents && Array.isArray(backupData.incidents)) {
        result.imported = mergeIncidents(backupData.incidents);
        result.success = true;
      } else {
        result.errors.push('Invalid backup format: missing incidents array');
      }
    } else {
      result.errors.push('No backup.json found in ZIP file');
    }
  } catch (error) {
    result.errors.push('Failed to read ZIP file');
  }

  return result;
};

const importJsonBackup = async (file: File): Promise<{ success: boolean; imported: number; errors: string[] }> => {
  const result = { success: false, imported: 0, errors: [] as string[] };

  try {
    const content = await file.text();
    const backupData: BackupData = JSON.parse(content);
    
    if (backupData.incidents && Array.isArray(backupData.incidents)) {
      result.imported = mergeIncidents(backupData.incidents);
      result.success = true;
    } else {
      result.errors.push('Invalid backup format: missing incidents array');
    }
  } catch (error) {
    result.errors.push('Failed to parse JSON file');
  }

  return result;
};

const importCsvBackup = async (file: File): Promise<{ success: boolean; imported: number; errors: string[] }> => {
  const result = { success: false, imported: 0, errors: [] as string[] };

  try {
    const content = await file.text();
    const incidents = parseCsvToIncidents(content);
    
    if (incidents.length > 0) {
      result.imported = mergeIncidents(incidents);
      result.success = true;
    } else {
      result.errors.push('No valid incidents found in CSV file');
    }
  } catch (error) {
    result.errors.push('Failed to parse CSV file');
  }

  return result;
};

const mergeIncidents = (importedIncidents: OrganizedIncident[]): number => {
  let imported = 0;
  const existingIncidents = organizedIncidentStorage.getAll();
  const existingIds = new Set(existingIncidents.map(inc => inc.id));

  for (const incident of importedIncidents) {
    try {
      if (existingIds.has(incident.id)) {
        // Update existing incident if imported version is newer
        const existing = organizedIncidentStorage.getById(incident.id);
        if (existing && new Date(incident.updatedAt || incident.createdAt) > new Date(existing.updatedAt || existing.createdAt)) {
          // Delete old and save new (no update method available)
          organizedIncidentStorage.delete(incident.id);
          organizedIncidentStorage.save(incident);
          imported++;
        }
      } else {
        // Create new incident
        organizedIncidentStorage.save(incident);
        imported++;
      }
    } catch (error) {
      console.warn('Failed to import incident:', incident.id, error);
    }
  }

  return imported;
};

const parseCsvToIncidents = (csvContent: string): OrganizedIncident[] => {
  const lines = csvContent.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const incidents: OrganizedIncident[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const incident: Partial<OrganizedIncident> = {};

    // Map CSV columns to incident properties
    headers.forEach((header, index) => {
      const value = values[index];
      switch (header.toLowerCase()) {
        case 'date':
          incident.date = value;
          break;
        case 'category':
          incident.categoryOrIssue = value;
          break;
        case 'who':
          incident.who = value;
          break;
        case 'what':
          incident.what = value;
          break;
        case 'where':
          incident.where = value;
          break;
        case 'notes':
          incident.notes = value;
          break;
      }
    });

    if (incident.date && incident.what) {
      incidents.push({
        id: `import-${Date.now()}-${i}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryOrIssue: '',
        who: '',
        what: '',
        where: '',
        when: '',
        witnesses: '',
        notes: '',
        timeline: [],
        ...incident
      } as OrganizedIncident);
    }
  }

  return incidents;
};

const getDateRange = (incidents: OrganizedIncident[]): { start: string; end: string } | null => {
  if (incidents.length === 0) return null;

  const dates = incidents
    .map(inc => new Date(inc.date || inc.createdAt))
    .filter(date => !isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length === 0) return null;

  return {
    start: dates[0].toISOString(),
    end: dates[dates.length - 1].toISOString()
  };
};

const createSimpleCSV = (incidents: OrganizedIncident[]): string => {
  const headers = ['Date', 'Category', 'Who', 'What', 'Where', 'Notes'];
  const rows = [headers.join(',')];
  
  for (const incident of incidents) {
    const row = [
      `"${incident.date || ''}"`,
      `"${incident.categoryOrIssue || ''}"`,
      `"${incident.who || ''}"`,
      `"${incident.what || ''}"`,
      `"${incident.where || ''}"`,
      `"${incident.notes || ''}"`
    ];
    rows.push(row.join(','));
  }
  
  return rows.join('\n');
};