export type WhoField =
  | string
  | string[]
  | { name?: string | null }[]
  | Record<string, unknown>
  | null
  | undefined;

const SPLIT_REGEX = /[,;]|(?:\s+and\s+)/i;

function toPartsFromString(str: string): string[] {
  return String(str)
    .split(SPLIT_REGEX)
    .map(s => s.trim().replace(/^Others?:\s*/i, '')) // Remove "Others:" or "Other:" prefix
    .filter(Boolean);
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function formatWhoList(names?: string[]): string {
  if (!names?.length) return "";
  const seen = new Set<string>();
  const cleaned: string[] = [];
  for (const raw of names) {
    const t = (raw || "").trim();
    if (!t) continue;
    const c = t
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    if (!seen.has(c)) { 
      seen.add(c); 
      cleaned.push(c); 
    }
  }
  return cleaned.join(", ");
}

/**
 * Safe parser for a flexible Who field.
 * Accepts:
 * - "Alice, Bob and Carol"
 * - ["Alice", "Bob", "Carol"]
 * - [{ name: "Alice" }, { name: "Bob" }]
 * - { name: "Alice" } or other objects where we join values
 * Returns an array of clean display names or [] on failure.
 */
export function parseWhoFromString(input: WhoField): string[] {
  if (input == null) return [];

  try {
    // Array of strings or objects
    if (Array.isArray(input)) {
      const parts = input.flatMap(item => {
        if (typeof item === "string") return toPartsFromString(item);
        if (item && typeof item === "object" && "name" in item) {
          const val = (item as { name?: string | null }).name ?? "";
          return toPartsFromString(val);
        }
        return [];
      });
      return unique(parts);
    }

    // Plain object
    if (typeof input === "object") {
      // Common case when a single object like { name: "Alice" } is passed
      if ("name" in (input as Record<string, unknown>)) {
        const val = (input as { name?: unknown }).name ?? "";
        return unique(toPartsFromString(String(val ?? "")));
      }
      // Fallback: join values and try to split
      const joined = Object.values(input as Record<string, unknown>)
        .map(v => (v == null ? "" : String(v)))
        .join(" ");
      return unique(toPartsFromString(joined));
    }

    // String or number or boolean
    return unique(toPartsFromString(String(input)));
  } catch (err) {
    // Never throw from a helper that feeds the UI
    console.warn("parseWhoFromString failed", err, input);
    return [];
  }
}