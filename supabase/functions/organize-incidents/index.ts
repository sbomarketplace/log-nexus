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
  notes: z.union([z.string(), z.object({}).passthrough()]).catch(""),
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
  const notes = o.notes ?? o.Notes ?? ""
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
    model: "gpt-4.1-2025-04-14",
    temperature: 0.1,
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
  ONLY include categories that have names. Do NOT include empty categories or empty brackets [].
  Format: "Managers: Arthur Samora, Vincent Jessie, Seth Bentley; Union Stewards: Troy Denney, Jon Taylor; Security: Two unnamed officers; Others: Mark Cordell, Brian"
  Extract EVERY person mentioned and categorize them based on context clues.

- what: CONCISE summary of the main incident and key facts only:
  * Primary accusation or issue
  * Essential outcome or resolution
  * Critical statements (1-2 key quotes max)
  Keep this brief - detailed timeline goes in "when" field.

- where: Specific location details:
  * Primary location (e.g., "Tool box room (tool closet)")
  * Additional locations if communication occurred elsewhere
  * Communication methods if relevant (phone, in person)

- when: Time of incident only (e.g., "8:00 AM" or "Time unspecified")
  Do NOT include event descriptions here - only the time.

- witnesses: Array of witness names only (people who observed but weren't directly involved)

- notes: Comprehensive chronological timeline and additional details:
  * "Timeline:" followed by detailed chronological events with times
  * "Requests/Responses:" for denied/approved requests  
  * "Policy Violations:" as bulleted list if any
  * "Important Quotes:" for verbatim statements
  * "Evidence/Testing:" for lab tests, searches, etc.
  * "Additional Details:" for other relevant information
  Use ALL details from raw notes. Preserve exact quotes and times.

FORMATTING RULES:
- Never use empty brackets [] - omit empty categories entirely
- Keep "what" concise (2-3 sentences max)
- Put detailed timeline in "notes" section under "Timeline:"
- Group similar information under clear headers in "notes"
- Preserve all names, times, quotes, and procedural details

CRITICAL: Use ALL information from the raw notes. The goal is maximum detail preservation with clean organization.`
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