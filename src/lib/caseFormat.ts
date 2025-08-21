// Remove leading labels (Case, Case #, Case No., etc.) and extra punctuation/spaces.
export function normalizeCaseValue(raw?: string | null): string {
  if (!raw) return "";
  const s = String(raw)
    .replace(/^\s*(?:case)\s*(?:#|no\.?|number|id|:)?\s*/i, "") // strip leading "Case #", "Case No.", etc.
    .replace(/^\s*#\s*/, "")                                    // strip a leading "#" if present
    .replace(/[ ,.;:]+$/g, "")                                   // trailing punctuation
    .trim();
  return s;
}

// For the chip text: use "Case 1234" on ≥sm; on mobile show just the bare value.
// We rely on the hash icon for the visual "#", so we DO NOT add another "#".
export function caseChipText(value?: string | null): { mobile: string; desktop: string } {
  const clean = normalizeCaseValue(value);
  return { mobile: clean, desktop: clean ? `Case ${clean}` : "" };
}