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
        content: `Extract workplace incident information into JSON with maximum detail preservation. Return only clean JSON with these exact keys:

- date: Date of incident (e.g., "7/22")
- category: Choose the most specific category:
  * Harassment (Verbal, Physical, Sexual)
  * Discrimination (Race, Gender, Age, Disability, etc.)
  * Wrongful Accusation / Drug Use Allegation
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

- who: Detailed categorization of all people involved with their roles:
  Format: "Managers: [names], Union Stewards: [names], Security: [names], Others: [names], Lab Technician: [names]"
  Extract EVERY person mentioned and categorize them based on context clues.

- what: Comprehensive description of what happened including:
  * Main accusation or incident
  * All key events in sequence
  * Important statements made
  * Policy violations mentioned
  * Requests made and responses received
  * Testing or evidence procedures
  Use ALL details from the raw notes, don't summarize away important information.

- where: Specific location details:
  * Primary location (e.g., "Tool box room (tool closet)")
  * Additional locations if communication occurred elsewhere
  * Communication methods if relevant (phone, in person)

- when: Detailed chronological timeline with specific times:
  Format each event as "TIME - EVENT DESCRIPTION"
  Include ALL times mentioned and what happened at each time.
  Preserve exact quotes when provided.

- witnesses: Array of all witness names (people who observed but weren't directly involved)

- notes: Comprehensive additional details including:
  * Policy violations and procedural issues
  * Denied requests (searches, tests, etc.)
  * Inconsistencies in procedures
  * Important quotes or statements
  * Evidence collection details
  * Any other relevant observations
  * Personal statements or denials

CRITICAL: Use ALL information from the raw notes. Only exclude truly redundant repetitions. Preserve all names, times, quotes, policy issues, and procedural details. The goal is maximum detail preservation and organization.` 
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