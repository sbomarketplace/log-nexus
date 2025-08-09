import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeadersJson = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_SECRET_KEY");

const SYSTEM_PROMPT = `You ORGANIZE raw workplace notes into the structured schema below. Do NOT lose information.

Schema for each incident:
{
  "date": string | null,                 // e.g., "7/22" or ISO if present
  "category": string,                    // e.g., "Wrongful Accusation", "Harassment", "Discrimination", "Substance Abuse Allegation", "Policy Violation", "Safety Concern", "Injury/Medical", "Inappropriate Comment", "Other"
  "who": {
    "accused": string[],                // people accused
    "accusers": string[],               // managers, reporters
    "managers": string[],
    "unionStewards": string[],
    "security": string[],
    "others": string[]
  },
  "where": string | null,
  "timeline": [
    {
      "time": string | null,             // "8:00 AM", "9:25 AM"
      "event": string,                   // concise event sentence
      "quotes": string[]                 // verbatim quotes if present
    }
  ],
  "whatHappened": string,                // stitched narrative (keep detail, no summarizing away)
  "requestsAndResponses": [
    {
      "request": string,                 // e.g., "Requested search and dog sniff"
      "response": "approved" | "denied" | "unknown",
      "byWhom": string | null            // who approved/denied
    }
  ],
  "policyOrProcedure": string[],         // explicit policy notes (e.g., "Two managers must approach together")
  "evidenceOrTests": [
    {
      "type": string,                    // "lab test", "rapid test", "security report"
      "detail": string,
      "status": string                   // "performed", "planned", "unclear"
    }
  ],
  "witnesses": string[],                 // explicitly listed witnesses
  "outcomeOrNext": string | null,        // outcome or next steps (if any)
  "notes": string[]                      // keep extra details verbatim lines
}

Rules:
• Split distinct moments into timeline items with their times in order.
• Preserve names exactly (managers, union stewards, security, accused).
• Keep quotes verbatim in timeline item quotes arrays.
• Capture policy mentions in policyOrProcedure with plain text lines.
• Capture every request with its outcome in requestsAndResponses.
• Include all tests/evidence mentions in evidenceOrTests with status.
• If a time is stated (8am, 9:25), map to timeline.time exactly as written.
• Populate whatHappened with a faithful, detailed narrative (no brevity penalty).
• If a field is absent, use [] or null; never invent details.
• Output ONLY valid JSON matching the incidents array with this schema.`;

// Robust JSON extraction with fallback parsing
function extractJSON(text: string): any {
  // First try direct parsing
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (e) {
    console.log("Direct parse failed, trying fallback extraction...");
  }

  // Fallback: extract JSON from markdown code blocks or mixed content
  const jsonMatches = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i) ||
                     text.match(/(\{[\s\S]*"incidents"[\s\S]*?\})/i) ||
                     text.match(/(\[[\s\S]*?\])/i);

  if (jsonMatches && jsonMatches[1]) {
    try {
      const cleaned = jsonMatches[1].trim();
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (e) {
      console.log("Fallback extraction failed:", e);
    }
  }

  // Last resort: try to find any valid JSON object/array
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('{') || line.startsWith('[')) {
      try {
        // Try to parse from this line to end
        const remaining = lines.slice(i).join('\n');
        return JSON.parse(remaining);
      } catch (e) {
        continue;
      }
    }
  }

  throw new Error("No valid JSON found in response");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeadersJson });
  }

  try {
    if (!OPENAI_API_KEY) {
      console.error("Missing OPENAI_SECRET_KEY");
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'config_error',
        message: "Server misconfigured" 
      }), {
        status: 500,
        headers: corsHeadersJson,
      });
    }

    const { rawNotes, notes } = await req.json().catch(() => ({}));
    const inputNotes = rawNotes || notes; // Support both field names for compatibility
    if (!inputNotes || typeof inputNotes !== "string" || !inputNotes.trim()) {
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'validation_error',
        message: "notes is required" 
      }), {
        status: 400,
        headers: corsHeadersJson,
      });
    }

    const t0 = Date.now();
    
    try {
      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          temperature: 0.1,
          max_tokens: 4000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: inputNotes },
          ],
        }),
      });

      if (!openaiRes.ok) {
        const raw = await openaiRes.json();
        console.error("OpenAI error:", raw);
        
        // Check for quota/rate limit errors
        const message = raw?.error?.message || '';
        const code = raw?.error?.code || '';
        
        if (openaiRes.status === 429 || openaiRes.status === 403 || 
            message.toLowerCase().includes('quota') || 
            message.toLowerCase().includes('insufficient_quota') ||
            message.toLowerCase().includes('exceeded your current quota') ||
            code === 'insufficient_quota') {
          return new Response(JSON.stringify({
            error: "Quota exceeded. Please update your API key or wait for reset."
          }), {
            status: 429,
            headers: corsHeadersJson,
          });
        }
        
        return new Response(JSON.stringify({ 
          ok: false, 
          code: 'openai_error',
          message: message || "OpenAI request failed" 
        }), {
          status: 500,
          headers: corsHeadersJson,
        });
      }

      const raw = await openaiRes.json();
      console.log("OpenAI raw response:", JSON.stringify(raw, null, 2));

      const text = raw?.choices?.[0]?.message?.content ?? "";
      let parsedData: any;
      
      try {
        parsedData = extractJSON(text);
      } catch (e) {
        console.error("JSON extraction failed:", e, "\nAI content:", text);
        return new Response(JSON.stringify({ 
          ok: false,
          code: 'invalid_json',
          message: 'Invalid AI JSON response' 
        }), {
          status: 400,
          headers: corsHeadersJson,
        });
      }

      // Handle both direct array and wrapped object formats
      let incidents: any[];
      if (Array.isArray(parsedData)) {
        incidents = parsedData;
      } else if (parsedData?.incidents && Array.isArray(parsedData.incidents)) {
        incidents = parsedData.incidents;
      } else {
        console.error("Unexpected response structure:", parsedData);
        return new Response(JSON.stringify({ 
          ok: false,
          code: 'format_error',
          message: "AI response format is invalid. Expected incidents array." 
        }), {
          status: 500,
          headers: corsHeadersJson,
        });
      }

      // Validate incidents structure and add defensive defaults
      if (!incidents.length) {
        return new Response(JSON.stringify({ incidents: [] }), {
          headers: corsHeadersJson,
        });
      }

      // Add defensive defaults to ensure all required fields exist
      const validatedIncidents = incidents.map((inc: any) => ({
        date: inc.date || null,
        category: inc.category || "Other",
        who: {
          accused: Array.isArray(inc.who?.accused) ? inc.who.accused : [],
          accusers: Array.isArray(inc.who?.accusers) ? inc.who.accusers : [],
          managers: Array.isArray(inc.who?.managers) ? inc.who.managers : [],
          unionStewards: Array.isArray(inc.who?.unionStewards) ? inc.who.unionStewards : [],
          security: Array.isArray(inc.who?.security) ? inc.who.security : [],
          others: Array.isArray(inc.who?.others) ? inc.who.others : []
        },
        where: inc.where || null,
        timeline: Array.isArray(inc.timeline) ? inc.timeline : [],
        whatHappened: inc.whatHappened || "",
        requestsAndResponses: Array.isArray(inc.requestsAndResponses) ? inc.requestsAndResponses : [],
        policyOrProcedure: Array.isArray(inc.policyOrProcedure) ? inc.policyOrProcedure : [],
        evidenceOrTests: Array.isArray(inc.evidenceOrTests) ? inc.evidenceOrTests : [],
        witnesses: Array.isArray(inc.witnesses) ? inc.witnesses : [],
        outcomeOrNext: inc.outcomeOrNext || null,
        notes: Array.isArray(inc.notes) ? inc.notes : []
      }));

      // Verify each incident has a timeline array (unit-like check)
      for (const incident of validatedIncidents) {
        if (!Array.isArray(incident.timeline)) {
          console.error("Timeline validation failed for incident:", incident);
          return new Response(JSON.stringify({ 
            ok: false,
            code: 'validation_error',
            message: 'Incident timeline validation failed' 
          }), {
            status: 400,
            headers: corsHeadersJson,
          });
        }
      }

      console.log(`organize-incidents ok in ${Date.now() - t0}ms, parsed ${validatedIncidents.length} incidents`);
      return new Response(JSON.stringify({ incidents: validatedIncidents }), {
        headers: corsHeadersJson,
      });
      
    } catch (openaiError) {
      console.error("OpenAI call failed:", openaiError);
      return new Response(JSON.stringify({ 
        ok: false,
        code: 'server_error',
        message: openaiError?.message || 'OpenAI API error' 
      }), {
        status: 500, 
        headers: corsHeadersJson
      });
    }

  } catch (err) {
    console.error("organize-incidents exception:", err);
    return new Response(JSON.stringify({ 
      ok: false,
      code: 'server_error',
      message: err?.message || 'Unknown error' 
    }), {
      status: 500, 
      headers: corsHeadersJson
    });
  }
});