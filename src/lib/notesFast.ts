// src/lib/notesFast.ts
import { extractCaseNumberFlexible } from "./caseNumber";

export function quickScan(text = "") {
  // Fast extraction of case number for instant UI feedback
  const caseNumber = extractCaseNumberFlexible(text);
  
  // Could add other quick extractions here like time if needed
  // For now, just case number as specified in requirements
  
  return { caseNumber };
}