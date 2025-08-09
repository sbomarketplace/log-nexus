/** Edge Function: parse-notes - robust OpenAI parsing with normalization */
import { z } from "./deps.ts"
import { extractJsonFromText, splitNames, stripCodeFences } from "./deps.ts"

export const incidentSchema = z.object({
  date: z.string().min(1).catch(""),
  category: z.string().min(1).catch(""),
  who: z.array(z.string()).catch([]),
  what: z.string().catch(""),
  where: z.string().catch(""),
  when: z.string().catch(""),
  witnesses: z.array(z.string()).catch([]),
  notes: z.string().catch(""),
})

const singleFlexible = z.object({
  date: z.any().optional(),
  Date: z.any().optional(),
  category: z.any().optional(),
  Category: z.any().optional(),
  who: z.any().optional(),
  Who: z.any().optional(),
  what: z.any().optional(),
  What: z.any().optional(),
  where: z.any().optional(),
  Where: z.any().optional(),
  when: z.any().optional(),
  When: z.any().optional(),
  witnesses: z.any().optional(),
  Witnesses: z.any().optional(),
  notes: z.any().optional(),
  Notes: z.any().optional(),
})

type Incident = z.infer<typeof incidentSchema>

function coerceIncident(anyObj: unknown): Incident {
  const o = singleFlexible.parse(anyObj ?? {})
  const date = String(o.date ?? o.Date ?? "").trim()
  const category = String(o.category ?? o.Category ?? "").trim()
  const who = splitNames(o.who ?? o.Who ?? "")
  const what = String(o.what ?? o.What ?? "").trim()
  const where = String(o.where ?? o.Where ?? "").trim()
  const when = String(o.when ?? o.When ?? "").trim()
  const witnesses = splitNames(o.witnesses ?? o.Witnesses ?? "")
  const notes = String(o.notes ?? o.Notes ?? "").trim()

  return incidentSchema.parse({
    date, category, who, what, where, when, witnesses, notes,
  })
}

function normalizeIncidents(parsed: unknown): Incident[] {
  if (Array.isArray(parsed)) {
    return parsed.map(coerceIncident).filter(i =>
      Object.values(i).some(v => (Array.isArray(v) ? v.length : String(v).length))
    )
  }
  if (parsed && typeof parsed === "object") {
    return [coerceIncident(parsed)]
  }
  return []
}

async function callOpenAI(prompt: string) {
  const key = Deno.env.get("OPENAI_API_KEY")
  if (!key) throw new Error("Missing OPENAI_API_KEY")
  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return only JSON. Use the keys: date, category, who, what, where, when, witnesses, notes. If multiple incidents exist, return an array of objects." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
  }
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  return json
}

function okJson(body: unknown, init: number = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status: init,
    headers: { "Content-Type": "application/json" },
  })
}

Deno.serve(async (req) => {
  const errors: string[] = []
  try {
    const { notes } = await req.json().catch(() => ({ notes: "" }))
    if (!notes || typeof notes !== "string") {
      errors.push("Missing 'notes' string in request body")
      return okJson({ ok: false, normalized: null, errors, meta: { model: null, usage: null, rawPreview: "" } }, 200)
    }

    // Call OpenAI
    const ai = await callOpenAI(notes).catch((e) => {
      errors.push(`OpenAI error: ${e.message}`)
      return null
    })

    const rawPreview = ai?.choices?.[0]?.message?.content ? String(ai.choices[0].message.content) : ""
    const model = ai?.model ?? null
    const usage = ai?.usage ?? null

    // Extract JSON from content
    let jsonText = rawPreview ? extractJsonFromText(rawPreview) : null

    // If not found, try a secondary pass by asking model might have put keys inline
    if (!jsonText && rawPreview) {
      const stripped = stripCodeFences(rawPreview)
      // Simple heuristic to wrap in []
      if (stripped.includes("date") && stripped.includes("what")) {
        jsonText = `[${stripped}]`
        try { JSON.parse(jsonText) } catch { jsonText = null }
      }
    }

    let parsed: unknown = null
    if (jsonText) {
      try {
        parsed = JSON.parse(jsonText)
      } catch (e) {
        errors.push(`JSON parse failed: ${String(e?.message || e)}`)
      }
    } else {
      errors.push("No valid JSON found in model content")
    }

    // Normalize
    const incidents = normalizeIncidents(parsed)
    const normalized = incidents.length ? { incidents } : null
    const ok = Boolean(normalized)

    if (!ok) {
      // Build a minimal incident from heuristics rather than fail
      if (rawPreview) {
        const minimal: Incident = {
          date: "",
          category: "",
          who: [],
          what: rawPreview.slice(0, 2000),
          where: "",
          when: "",
          witnesses: [],
          notes: "",
        }
        errors.push("Falling back to minimal incident from raw text")
        return okJson({
          ok: false,
          normalized: { incidents: [minimal] },
          errors,
          meta: { model, usage, rawPreview: rawPreview.slice(0, 4000) },
        }, 200)
      }
    }

    return okJson({
      ok,
      normalized,
      errors,
      meta: { model, usage, rawPreview: rawPreview.slice(0, 4000) },
    }, 200)

  } catch (e) {
    errors.push(`Unhandled error: ${String(e?.message || e)}`)
    // Never crash the function
    return okJson({ ok: false, normalized: null, errors, meta: { model: null, usage: null, rawPreview: "" } }, 200)
  }
})