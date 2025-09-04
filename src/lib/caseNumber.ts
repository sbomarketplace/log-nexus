// src/lib/caseNumber.ts
import { toStr } from './strings';

export function extractCaseNumberFlexible(text?: string | null): string | null {
  const s = toStr(text);
  if (!s) return null;

  // Prefer lines/bullets that start with a label to avoid "in case ..." false positives
  // Supported labels: case, case no., case number, case id, ref/reference, ticket, report
  const patterns: RegExp[] = [
    // e.g., "- Case 1234.", "Case: 1234", "Case # 12/XYZ-44", "CASE NO. A-0034"
    /(^|\n|\r|\r\n)\s*(?:[-*•>\u2022]?\s*)?(?:case)\s*(?:#|no\.?|number|id|:)?\s*([A-Za-z0-9][A-Za-z0-9\-\/ ]{0,49})(?=[^\w\/-]|$)/gim,
    // e.g., "Ref 9981", "Reference # 77A"
    /(^|\n|\r|\r\n)\s*(?:[-*•>\u2022]?\s*)?(?:ref(?:erence)?)\s*(?:#|no\.?|id|:)?\s*([A-Za-z0-9][A-Za-z0-9\-\/ ]{0,49})(?=[^\w\/-]|$)/gim,
    // e.g., "Ticket: 9/XY-44"
    /(^|\n|\r|\r\n)\s*(?:[-*•>\u2022]?\s*)?(?:ticket|report)\s*(?:#|no\.?|id|:)?\s*([A-Za-z0-9][A-Za-z0-9\-\/ ]{0,49})(?=[^\w\/-]|$)/gim,
    // Fallback: inline "... Case 1234." (but not "in case ...")
    /(?<!\bin\s)(?:\bcase)\s*(?:#|no\.?|number|id|:)?\s*([A-Za-z0-9][A-Za-z0-9\-\/ ]{0,49})(?=[^\w\/-]|$)/gim,
  ];

  for (const rx of patterns) {
    const m = rx.exec(s);
    if (m && (m[2] ? m[2] : m[1])) {
      const raw = toStr(m[2] || m[1] || "").trim();
      const cleaned = toStr(raw)
        .replace(/[^A-Za-z0-9\-\/ ]/g, "")   // keep letters, digits, dash, slash, space
        .replace(/\s{2,}/g, " ")
        .replace(/[.,;:]+$/, "")             // trim trailing punctuation
        .trim();
      // Must contain at least one digit to be a case number
      if (cleaned && /\d/.test(cleaned)) return cleaned;
    }
  }
  return null;
}