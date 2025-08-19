let worker: Worker | null = null;
const cache = new Map<string, any>();

// Simple hash function for caching
const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
};

export async function parseInWorker(text: string) {
  const key = hash(text);
  
  // Return cached result if available
  if (cache.has(key)) {
    return { ...cache.get(key), cached: true };
  }
  
  // Create worker if needed
  if (!worker) {
    try {
      worker = new Worker(
        new URL("../workers/notesParser.worker.ts", import.meta.url),
        { type: "module" }
      );
    } catch (error) {
      console.warn('Worker creation failed, falling back to sync parsing:', error);
      // Fallback to synchronous parsing
      const { parseNotesToStructured } = await import("../lib/notesParser");
      const t0 = performance.now();
      const result = parseNotesToStructured({ text });
      const t1 = performance.now();
      const response = { result, ms: Math.round(t1 - t0), success: true };
      cache.set(key, response);
      return response;
    }
  }
  
  return new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Worker timeout'));
    }, 10000); // 10s timeout
    
    const onMessage = (e: MessageEvent) => {
      worker!.removeEventListener("message", onMessage);
      clearTimeout(timeout);
      
      if (e.data.success) {
        cache.set(key, e.data);
        resolve(e.data);
      } else {
        reject(new Error(e.data.error || 'Worker parsing failed'));
      }
    };
    
    worker!.addEventListener("message", onMessage);
    worker!.postMessage({ text });
  });
}

// Clean up worker on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (worker) {
      worker.terminate();
      worker = null;
    }
  });
}