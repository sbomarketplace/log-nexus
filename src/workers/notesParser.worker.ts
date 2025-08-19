import { parseNotesToStructured } from "../lib/notesParser";

self.onmessage = (e) => {
  const { text } = e.data || {};
  const t0 = performance.now();
  try {
    const result = parseNotesToStructured({ text });
    const t1 = performance.now();
    (self as any).postMessage({ result, ms: Math.round(t1 - t0), success: true });
  } catch (error) {
    const t1 = performance.now();
    (self as any).postMessage({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      ms: Math.round(t1 - t0),
      success: false
    });
  }
};