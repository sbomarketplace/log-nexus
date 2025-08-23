import { nativeToast, isNative } from '@/utils/native';

interface CacheInfo {
  size: number;
  itemCount: number;
}

// Cache keys for different types of stored data
const CACHE_KEYS = {
  THUMBNAILS: 'thumbnails-',
  TEMP_BLOBS: 'temp-blobs-',
  EXPORT_CACHE: 'export-cache-',
  GRAMMAR_CACHE: 'grammar-cache-',
  IMAGE_CACHE: 'image-cache-'
};

export const getCacheSize = (): CacheInfo => {
  let totalSize = 0;
  let itemCount = 0;

  try {
    // Estimate localStorage usage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value && isCacheKey(key)) {
          totalSize += key.length + value.length;
          itemCount++;
        }
      }
    }

    // Check sessionStorage for temporary data
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        const value = sessionStorage.getItem(key);
        if (value && isCacheKey(key)) {
          totalSize += key.length + value.length;
          itemCount++;
        }
      }
    }

    // Convert from characters to approximate bytes (UTF-16)
    totalSize *= 2;
  } catch (error) {
    console.warn('Failed to calculate cache size:', error);
  }

  return { size: totalSize, itemCount };
};

export const clearCache = async (): Promise<void> => {
  try {
    let clearedCount = 0;

    // Clear localStorage cache items
    const localKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && isCacheKey(key)) {
        localKeys.push(key);
      }
    }

    localKeys.forEach(key => {
      localStorage.removeItem(key);
      clearedCount++;
    });

    // Clear sessionStorage cache items
    const sessionKeys = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && isCacheKey(key)) {
        sessionKeys.push(key);
      }
    }

    sessionKeys.forEach(key => {
      sessionStorage.removeItem(key);
      clearedCount++;
    });

    // Clear any IndexedDB caches if they exist
    await clearIndexedDBCache();

    const message = clearedCount > 0 ? 'Cache cleared.' : 'No cache to clear.';
    
    if (isNative) {
      nativeToast(message);
    } else {
      console.log(message);
    }

  } catch (error) {
    console.error('Failed to clear cache:', error);
    const message = 'Failed to clear cache.';
    
    if (isNative) {
      nativeToast(message);
    } else {
      console.error(message);
    }
  }
};

export const formatCacheSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const isCacheKey = (key: string): boolean => {
  return Object.values(CACHE_KEYS).some(prefix => key.startsWith(prefix)) ||
         key.includes('cache') ||
         key.includes('temp') ||
         key.includes('thumbnail') ||
         key.includes('blob-url');
};

const clearIndexedDBCache = async (): Promise<void> => {
  try {
    // Clear any IndexedDB databases used for caching
    const databases = await indexedDB.databases();
    
    for (const db of databases) {
      if (db.name && (db.name.includes('cache') || db.name.includes('temp'))) {
        indexedDB.deleteDatabase(db.name);
      }
    }
  } catch (error) {
    // IndexedDB not available or other error - that's okay
    console.debug('IndexedDB cache clear skipped:', error);
  }
};

export const scheduleDataRetentionCheck = (retentionDays: number): void => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // This would typically clean up soft-deleted items
    // For now, just log that we would perform cleanup
    console.log(`Data retention check: would delete items older than ${cutoffDate.toISOString()}`);
    
    // Store last cleanup date
    localStorage.setItem('last-retention-check', new Date().toISOString());
  } catch (error) {
    console.error('Data retention check failed:', error);
  }
};

// Legacy storage API for backward compatibility
export const storage = {
  getIncident: (id: string) => {
    // This is a legacy method - incidents are now stored differently
    // Return null to indicate not found
    return null;
  },
  getIncidents: () => {
    // This is a legacy method - incidents are now stored differently
    // Return empty array
    return [];
  },
  // Add other methods as needed for backward compatibility
};