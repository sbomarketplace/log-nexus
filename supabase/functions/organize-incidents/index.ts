import { z } from "./deps.ts"
import {
  corsHeadersFor,
  extractJsonFromText,
  splitNames,
  stripCodeFences,
} from "./deps.ts"

const incidentSchema = z.object({
  date: z.string().catch(""),
  category: z.string().catch(""),
  who: z.array(z.string()).catch([]),
  what: z.string().catch(""),
  where: z.string().catch(""),
  when: z.string().catch(""),
  witnesses: z.array(z.string()).catch([]),
  notes: z.string().catch(""),
})
type Incident = z.infer<typeof incidentSchema>

const flexible = z.object({
  date: z.any().optional(), Date: z.any().optional(),
  category: z.any().optional(), Category: z.any().optional(),
  who: z.any().optional(), Who: z.any().optional(),
  what: z.any().optional(), What: z.any().optional(),
  where: z.any().optional(), Where: z.any().optional(),
  when: z.any().optional(), When: z.any().optional(),
  witnesses: z.any().optional(), Witnesses: z.any().optional(),
  notes: z.any().optional(), Notes: z.any().optional(),
})

function toIncident(x: unknown): Incident {
  const o = flexible.parse(x ?? {})
  const date = String(o.date ?? o.Date ?? "").trim()
  const category = String(o.category ?? o.Category ?? "").trim()
  const who = splitNames(o.who ?? o.Who ?? "")
  const what = String(o.what ?? o.What ?? "").trim()
  const where = String(o.where ?? o.Where ?? "").trim()
  const when = String(o.when ?? o.When ?? "").trim()
  const witnesses = splitNames(o.witnesses ?? o.Witnesses ?? "")
  const notes = String(o.notes ?? o.Notes ?? "").trim()
  return incidentSchema.parse({ date, category, who, what, where, when, witnesses, notes })
}

function normalizeIncidents(parsed: unknown): Incident[] {
  if (Array.isArray(parsed)) return parsed.map(toIncident)
  if (parsed && typeof parsed === "object") return [toIncident(parsed)]
  return []
}

async function callOpenAI(prompt: string) {
  const key = Deno.env.get("OPENAI_API_KEY")
  if (!key) throw new Error("Missing OPENAI_API_KEY")

  const body = {
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { 
        role: "system", 
        content: `Extract workplace incident information into JSON. Return only clean JSON with these exact keys:
- date: Date of incident (e.g., "7/22")
- category: Choose from these predefined categories only:
  * Harassment (Verbal, Physical, Sexual)
  * Discrimination (Race, Gender, Age, Disability, etc.)
  * Retaliation
  * Bullying / Intimidation
  * Threats / Violence
  * Substance Abuse / Drug or Alcohol Policy Violation
  * Safety Violation (OSHA, PPE, Hazard Reporting)
  * Attendance / Tardiness
  * Insubordination / Refusal to Follow Instructions
  * Policy Violation (General)
  * Property Damage
  * Equipment Misuse or Failure
  * Unauthorized Access / Security Breach
  * Theft / Missing Property
  * Accident / Injury
  * Performance Issue
  * Miscommunication / Procedural Error
  * Other (Specify in Notes)
- who: Array of all people mentioned by name
- what: Brief description of the main incident
- where: Location where incident occurred
- when: Chronological timeline of events with times (e.g., "8:00 AM - Entered tool closet, 8:30 AM - Mark Cordell informs Brian needs to call Art")
- witnesses: Array of witness names
- notes: Additional details including policy violations, requests/denials, evidence/testing info, and other important notes

For multiple incidents, return an array. Avoid repeating information across fields.` 
      },
      { role: "user", content: prompt }
    ]
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  return json
}

function respond(req: Request, body: unknown) {
  const headers = corsHeadersFor(req.headers.get("Origin") ?? undefined)
  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json", ...headers },
  })
}

Deno.serve(async (req) => {
  const headers = corsHeadersFor(req.headers.get("Origin") ?? undefined)

  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers })
  }

  const errors: string[] = []
  try {
    const { notes } = await req.json().catch(() => ({ notes: "" }))
    if (!notes || typeof notes !== "string") {
      errors.push("Missing notes string in request body")
      return respond(req, { ok: false, normalized: null, errors, meta: { model: null, usage: null, rawPreview: "" } })
    }

    const ai = await callOpenAI(notes).catch((e: Error) => {
      errors.push(`OpenAI error: ${e.message}`)
      return null
    })

    const rawPreview = ai?.choices?.[0]?.message?.content ? String(ai.choices[0].message.content) : ""
    const model = ai?.model ?? null
    const usage = ai?.usage ?? null

    let jsonText = rawPreview ? extractJsonFromText(rawPreview) : null

    if (!jsonText && rawPreview) {
      const stripped = stripCodeFences(rawPreview)
      if (stripped.includes("date") && stripped.includes("what")) {
        const candidate = `[${stripped}]`
        try { JSON.parse(candidate); jsonText = candidate } catch {}
      }
    }

    let parsed: unknown = null
    if (jsonText) {
      try { parsed = JSON.parse(jsonText) } catch (e) { errors.push(`JSON parse failed: ${String(e)}`) }
    } else {
      errors.push("No valid JSON found in model content")
    }

    let incidents = normalizeIncidents(parsed)

    if (!incidents.length && rawPreview) {
      errors.push("Falling back to minimal incident")
      incidents = [{
        date: "", category: "", who: [], where: "", when: "", witnesses: [],
        what: rawPreview.slice(0, 2000), notes: ""
      }]
    }

    return respond(req, {
      ok: Boolean(incidents.length),
      normalized: { incidents },
      errors,
      meta: { model, usage, rawPreview: rawPreview.slice(0, 4000) }
    })
  } catch (e) {
    errors.push(`Unhandled error: ${String(e?.message || e)}`)
    return respond(req, { ok: false, normalized: null, errors, meta: { model: null, usage: null, rawPreview: "" } })
  }
})