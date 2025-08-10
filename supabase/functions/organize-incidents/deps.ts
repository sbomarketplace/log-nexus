export { z } from "https://deno.land/x/zod@v3.23.8/mod.ts"

export const ALLOWED_ORIGINS = [
  "https://preview--log-nexus.lovable.app",
  "https://log-nexus.lovable.app",
  "http://localhost:3000",
  "http://localhost:5173",
]

export function corsHeadersFor(origin?: string) {
  const allowAll = Deno.env.get("CORS_ALLOW_ALL") === "true"
  const allowed =
    allowAll ||
    (origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o)))

  const allowOrigin = allowed && origin ? origin : "*"

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  }
}

export function stripCodeFences(input: string): string {
  return input.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, "$1").trim()
}

export function extractJsonFromText(text: string): string | null {
  const stripped = stripCodeFences(text)

  try { JSON.parse(stripped); return stripped } catch {}

  const candidates: string[] = []

  // Objects
  let depth = 0, start = -1
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i]
    if (ch === "{") { if (depth === 0) start = i; depth++ }
    else if (ch === "}") { depth--; if (depth === 0 && start >= 0) { candidates.push(stripped.slice(start, i + 1)); start = -1 } }
  }

  // Arrays
  depth = 0; start = -1
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i]
    if (ch === "[") { if (depth === 0) start = i; depth++ }
    else if (ch === "]") { depth--; if (depth === 0 && start >= 0) { candidates.push(stripped.slice(start, i + 1)); start = -1 } }
  }

  candidates.sort((a, b) => b.length - a.length)
  for (const c of candidates) {
    try { JSON.parse(c); return c } catch {}
  }
  return null
}

export function splitNames(value: unknown): string[] {
  if (!value) return []
  const raw = Array.isArray(value) ? value.join(",") : String(value)
  return raw.split(/[;,]/).map(s => s.trim()).filter(Boolean)
}