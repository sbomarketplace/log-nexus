import { useCallback, useRef } from 'react';
import { quickScan } from "@/lib/notesFast";
import { parseInWorker } from "@/lib/notesWorkerClient";
import { batchPolish } from "@/lib/batchPolish";

type FastResult = {
  time?: string | null;
  caseNumber?: string | null;
};

type FullResult = {
  [key: string]: any;
};

type MergeFunction = (fast: FastResult, full?: FullResult) => void;

export function useOrganizeNotes() {
  const timerRef = useRef<number>();

  const run = useCallback(async (
    text: string, 
    merge: MergeFunction, 
    immediate = false
  ) => {
    // FAST: update header pills immediately
    const fast = quickScan(text);
    merge(fast); // fills time/case if empty

    // Debounce worker unless immediate
    if (!immediate) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        doWork(text, fast, merge);
      }, 500);
    } else {
      await doWork(text, fast, merge);
    }
  }, []);

  const doWork = useCallback(async (
    text: string,
    fast: FastResult,
    merge: MergeFunction
  ) => {
    try {
      const t0 = performance.now();
      
      // Parse in worker
      const { result, ms: workerMs } = await parseInWorker(text);
      
      // Decide whether polishing is needed and batch it
      const toPolish = pickPolishable(result);
      
      const t1 = performance.now();
      const polished = await batchPolish(toPolish);
      const t2 = performance.now();
      
      // Log timing in dev mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`Parsing: worker ${workerMs}ms, polish ${Math.round(t2 - t1)}ms, total ${Math.round(t2 - t0)}ms`);
      }
      
      // Merge results
      merge(fast, { ...result, ...polished });
      
    } catch (error) {
      console.warn('Note organization failed:', error);
      // On error, just keep the fast result
      merge(fast);
    }
  }, []);

  return { run };
}

function pickPolishable(result: any): Partial<{
  who: string;
  what: string;
  where: string;
  notes: string;
  witnesses: string;
  summary: string;
}> {
  return {
    who: result.peopleText || "",
    what: result.what || "",
    where: result.where || "",
    notes: result.notes || "",
    witnesses: result.witnessesText || "",
    summary: result.summary || "",
  };
}
