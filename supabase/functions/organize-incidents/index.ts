import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeadersJson = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_SECRET_KEY");

const SYSTEM_PROMPT = `
You are an HR incident organizer. Split raw notes into one or more incidents.
For EACH incident, produce JSON that matches this schema:
{
  "date": "string | null",
  "category": "one of: Harassment | Discrimination | Retaliation | Substance Abuse Allegation | Policy Violation | Inappropriate Comment | Wrongful Accusation | Other",
  "who": "string",
  "what": "1-2 sentence summary, neutral tone",
  "where": "string | null",
  "when": "string | null",
  "witnesses": ["string", ...],
  "notes": "3–6 sentences capturing key facts with specifics (policies, decisions, denials, exact requests). Keep names and times.",
  "timeline": [
    {"time":"string","event":"concise fact (keep exact wording for critical statements)"},
    ...
  ],
  "policyConcerns": ["brief bullets of policy/procedure concerns"],
  "directQuotes": ["short exact quotes if present (10–25 words)"]
}
Rules:
- Preserve concrete details (times, who did what, requests made/denied).
- Keep quotes short but exact in directQuotes.
- If a field is missing, use null or [].
- Return a single JSON object: { "incidents": [ ... ] } with NO extra text.
`.trim();

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
            date: null,
            category: "Other",
            who: "Unknown",
            what: "Raw notes could not be parsed into structured format",
            where: null,
            when: null,
            witnesses: [],
            notes: rawNotes.substring(0, 500) + (rawNotes.length > 500 ? "..." : ""),
            timeline: [],
            policyConcerns: [],
            directQuotes: []
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