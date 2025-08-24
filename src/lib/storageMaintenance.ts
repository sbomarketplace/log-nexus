export type CacheStats = { items: number; bytes: number };

const KNOWN_IDB_DATABASES = [
  // Add any IndexedDB databases your app uses for caches/files
  "ClearCaseFiles",
  "ClearCaseCache",
];
const KNOWN_LOCALSTORAGE_CACHE_KEYS = [
  // Add any cache-y localStorage keys (not user content)
  "cc_ai_cache_v1",
  "cc_export_cache_v1",
];

const INCIDENT_LOCALSTORAGE_KEYS = [
  // Add the real keys your app uses to persist incidents
  "cc_incidents_v1",
  "cc_incidents_index_v1",
];

export async function getCacheStats(): Promise<CacheStats> {
  let items = 0;
  let bytes = 0;

  if ("caches" in window) {
    const names = await caches.keys();
    for (const name of names) {
      const cache = await caches.open(name);
      const reqs = await cache.keys();
      items += reqs.length;

      // Try to sum content-length headers (best-effort)
      await Promise.all(
        reqs.map(async (req) => {
          const res = await cache.match(req);
          const len = res?.headers.get("content-length");
          if (len) bytes += Number(len) || 0;
        }),
      );
    }
  }

  // Rough add of localStorage cache sizes
  for (const key of KNOWN_LOCALSTORAGE_CACHE_KEYS) {
    const v = localStorage.getItem(key);
    if (v) bytes += new Blob([v]).size;
  }

  return { items, bytes };
}

export async function clearAllAppCaches(): Promise<void> {
  // Cache Storage
  if ("caches" in window) {
    const names = await caches.keys();
    await Promise.all(names.map((n) => caches.delete(n)));
  }

  // Known localStorage caches
  for (const key of KNOWN_LOCALSTORAGE_CACHE_KEYS) {
    localStorage.removeItem(key);
  }

  // IndexedDB (best-effort)
  await Promise.all(
    KNOWN_IDB_DATABASES.map(
      (dbName) =>
        new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(dbName);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve(); // ignore failures
          req.onblocked = () => resolve();
        }),
    ),
  );
}

export async function deleteAllIncidents(): Promise<void> {
  // 1) If you have a storage adapter, call it:
  try {
    // Check for custom app deletion hook
    const windowWithCC = window as any;
    if (windowWithCC.cc?.deleteAllIncidents) {
      await windowWithCC.cc.deleteAllIncidents();
      return;
    }
  } catch {
    // ignore and fallback
  }

  // 2) Fallback: remove known incident keys from localStorage
  for (const key of INCIDENT_LOCALSTORAGE_KEYS) {
    localStorage.removeItem(key);
  }

  // 3) If incidents live in IndexedDB (Dexie, etc.), add DB names here and delete like above
  // KNOWN_IDB_DATABASES.push("ClearCaseIncidentsDB")
  // await indexedDB.deleteDatabase("ClearCaseIncidentsDB")
}