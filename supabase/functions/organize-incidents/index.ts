import { z } from "./deps.ts"
import {
  corsHeadersFor,
  extractJsonFromText,
  splitNames,
  stripCodeFences,
} from "./deps.ts"
import { corsHeaders } from "../_shared/cors.ts"

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
        content: `Extract workplace incident information into JSON with maximum detail preservation. MAINTAIN FIRST-PERSON PERSPECTIVE throughout. Return only clean JSON with these exact keys:

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

- what: CONCISE summary of the main incident and key facts only from first-person perspective:
  * Primary accusation or issue as experienced by the reporter
  * Essential outcome or resolution
  * Critical statements (1-2 key quotes max)
  Keep this brief - detailed timeline goes in "notes" field.

- where: Specific location details:
  * Primary location (e.g., "Tool box room (tool closet)")
  * Additional locations if communication occurred elsewhere
  * Communication methods if relevant (phone, in person)

- when: Time of incident only (e.g., "8:00 AM" or "Time unspecified")
  Do NOT include event descriptions here - only the time.

- witnesses: Array of witness names only (people who observed but weren't directly involved)

- notes: Comprehensive chronological timeline and additional details in FIRST-PERSON perspective:
  * "Timeline:" followed by detailed chronological events with times (e.g., "I saw...", "I told...", "Mark said to me...")
  * "Requests/Responses:" for denied/approved requests  
  * "Policy Violations:" as bulleted list if any
  * "Important Quotes:" for verbatim statements
  * "Evidence/Testing:" for lab tests, searches, etc.
  * "Additional Details:" for other relevant information
  Use ALL details from raw notes. Preserve exact quotes and times.

PERSPECTIVE RULES:
- If notes are in first-person (I, me, my), KEEP THEM in first-person throughout
- Never convert "I saw" to "the employee saw" or "the reporter observed"
- Maintain the reporter's voice and perspective in all sections
- Only use third-person for OTHER people mentioned in the incident

FORMATTING RULES:
- Never use empty brackets [] - omit empty categories entirely
- Keep "what" concise (2-3 sentences max)
- Put detailed timeline in "notes" section under "Timeline:"
- Group similar information under clear headers in "notes"
- Preserve all names, times, quotes, and procedural details

CRITICAL: Use ALL information from the raw notes while maintaining the reporter's first-person perspective. The goal is maximum detail preservation with clean organization and natural voice.`
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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { notes } = await req.json().catch(() => ({ notes: "" }))
    if (!notes || typeof notes !== "string") {
      return new Response(JSON.stringify({ 
        ok: false, 
        normalized: null, 
        errors: ["Missing notes string in request body"], 
        meta: { model: null, usage: null, rawPreview: "" } 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ai = await callOpenAI(notes).catch((e: Error) => {
      throw new Error(`OpenAI error: ${e.message}`)
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
      try { parsed = JSON.parse(jsonText) } catch (e) { 
        throw new Error(`JSON parse failed: ${String(e)}`)
      }
    } else {
      throw new Error("No valid JSON found in model content")
    }

    let incidents = normalizeIncidents(parsed)

    if (!incidents.length && rawPreview) {
      incidents = [{
        date: "", category: "", who: [], where: "", when: "", witnesses: [],
        what: rawPreview.slice(0, 2000), notes: ""
      }]
    }

    return new Response(JSON.stringify({
      ok: true,
      normalized: { incidents },
      errors: [],
      meta: { model, usage, rawPreview: rawPreview.slice(0, 4000) }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ 
      ok: false, 
      normalized: null, 
      errors: [String(e?.message || e)], 
      meta: { model: null, usage: null, rawPreview: "" } 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
})