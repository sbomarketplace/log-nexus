export { z } from "https://deno.land/x/zod@v3.23.8/mod.ts"

export function stripCodeFences(input: string): string {
  // Remove ```json ... ``` or ``` ... ``` or ```something
  return input.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim()
}

// Extract the largest plausible JSON object or array from text
export function extractJsonFromText(text: string): string | null {
  const stripped = stripCodeFences(text)
  // Try direct parse first
  try {
    JSON.parse(stripped)
    return stripped
  } catch {}

  // Find the longest balanced JSON block
  const candidates: string[] = []
  // Objects
  let depth = 0, start = -1
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i]
    if (ch === "{") {
      if (depth === 0) start = i
      depth++
    } else if (ch === "}") {
      depth--
      if (depth === 0 && start >= 0) {
        candidates.push(stripped.slice(start, i + 1))
        start = -1
      }
    }
  }
  // Arrays
  depth = 0; start = -1
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i]
    if (ch === "[") {
      if (depth === 0) start = i
      depth++
    } else if (ch === "]") {
      depth--
      if (depth === 0 && start >= 0) {
        candidates.push(stripped.slice(start, i + 1))
        start = -1
      }
    }
  }
  // Try parse by longest first
  candidates.sort((a, b) => b.length - a.length)
  for (const c of candidates) {
    try {
      JSON.parse(c)
      return c
    } catch {}
  }
  return null
}

export function splitNames(value: unknown): string[] {
  if (!value) return []
  const raw = Array.isArray(value) ? value.join(",") : String(value)
  return raw
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(Boolean)
}