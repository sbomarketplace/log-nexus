export type AIAllowance = { allowed: true };

/** Always allow AI. Quotas have been removed. */
export async function ensureAIAllowed(): Promise<AIAllowance> {
  return { allowed: true };
}

/** For UI badges—return Infinity so nothing shows a countdown. */
export function getAIRemaining(): number {
  return Number.POSITIVE_INFINITY;
}