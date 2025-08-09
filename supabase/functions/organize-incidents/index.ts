import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeadersJson = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_SECRET_KEY");

const SYSTEM_PROMPT = `You are ClearCase's HR incident organizer (not a summarizer).
Given messy workplace notes, extract and normalize all incident details and return pure JSON that the UI will render.

Goals
Identify one or more distinct incidents.
For each incident, organize details into a clean structure with fields below.
Add useful, factual organization such as a timeline, policy_concerns, and direct quotes pulled from the notes.
Never invent facts. If a field is missing, use "None noted".

Normalize
Dates: MM/DD if present; else "Unknown"
Times: h:mm AM/PM
People names: title case; de-duplicate ("Jon" vs "John" -> keep as written if uncertain)
Location: short phrase ("Tool closet")
Category: choose the best single category from:
Harassment, Discrimination, Retaliation, Substance Abuse Allegation, Policy Violation, Safety Concern, Injury/Medical, Inappropriate Comment, Other

Output (JSON only)
Return an object with a top-level incidents array. Each item:
{
  "date": "MM/DD" | "Unknown",
  "category": "…",
  "who": "Short list of key people",
  "what": "1–2 sentences stating the allegation/issue",
  "where": "Short location",
  "when": "Time span or point in time",
  "witnesses": ["Name", "Name"],
  "notes": "Short paragraph capturing key context",
  "timeline": [
    {"time": "h:mm AM/PM", "event": "What happened"},
    {"time": "h:mm AM/PM", "event": "What happened"}
  ],
  "policy_concerns": [
    "Concrete concern tied to the notes (e.g., 'Only one manager present; policy requires two.')"
  ],
  "quotes": [
    {"speaker": "Name or Role", "text": "Exact quote from notes"},
    {"speaker": "…", "text": "…"}
  ]
}

Quotes must be exact excerpts from the notes (trim to ≤ 25 words each).
Policy concerns must be grounded in the notes (don't speculate).
If there are multiple incidents in the notes, return multiple items.
Output JSON only, no prose.`;

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

    const { rawNotes } = await req.json().catch(() => ({}));
    if (!rawNotes || typeof rawNotes !== "string" || !rawNotes.trim()) {
      return new Response(JSON.stringify({ 
        ok: false, 
        code: 'validation_error',
        message: "rawNotes is required" 
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
          temperature: 0.2,
          max_tokens: 2000,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: rawNotes },
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
            code === 'insufficient_quota') {
          return new Response(JSON.stringify({
            ok: false,
            code: 'quota_exceeded',
            message: 'OpenAI quota exceeded. Add credits or raise your monthly limit, then try again.'
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
        // Fallback to a single incident with category "Other"
        console.log("Creating fallback incident from raw notes");
        parsedData = {
          incidents: [{
            date: "Unknown",
            category: "Other",
            who: "Unknown",
            what: "Raw notes could not be parsed into structured format",
            where: "None noted",
            when: "None noted",
            witnesses: [],
            notes: rawNotes.substring(0, 500) + (rawNotes.length > 500 ? "..." : ""),
            timeline: [],
            policy_concerns: [],
            quotes: []
          }]
        };
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

      // Validate incidents structure
      if (!incidents.length) {
        return new Response(JSON.stringify({ 
          ok: false,
          code: 'no_incidents',
          message: "No incidents were identified in your notes. Please provide more detailed information." 
        }), {
          status: 500,
          headers: corsHeadersJson,
        });
      }

      console.log(`organize-incidents ok in ${Date.now() - t0}ms, parsed ${incidents.length} incidents`);
      return new Response(JSON.stringify({ ok: true, incidents }), {
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