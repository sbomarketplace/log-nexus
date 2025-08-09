import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeadersJson = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_SECRET_KEY");

const SYSTEM_PROMPT = `You are an assistant that organizes raw workplace incident notes into a structured, detailed format while preserving every meaningful fact, name, time, and quote. Do not shorten or generalize unless information is clearly redundant. Separate each incident clearly.

Return a JSON object with an "incidents" array. For each incident, use this structure:
{
  "date": "MM/DD format or 'Unknown'",
  "category": "one of: Harassment | Discrimination | Retaliation | Substance Abuse Allegation | Policy Violation | Safety Concern | Injury/Medical | Inappropriate Comment | Other",
  "who": "Detailed list of all people involved, preserving original names and titles",
  "what": "Comprehensive description maintaining all factual details and context",
  "where": "Complete location details as provided",
  "when": "Full time information including duration and sequence",
  "witnesses": "All witnesses mentioned, preserving names exactly as written",
  "notes": "Detailed preservation of all factual context, policy violations, requests made/denied, exact statements, and procedural concerns. Maintain original wording for quotes and key statements.",
  "timeline": [
    {"time": "exact time format", "event": "preserve exact wording for critical statements and actions"}
  ],
  "policy_concerns": [
    "specific policy violations or procedural concerns mentioned in notes"
  ],
  "quotes": [
    {"speaker": "exact name or role", "text": "exact quote from notes"}
  ]
}

Rules:
- Maintain original wording for quotes and key statements
- Do not merge separate events — keep them split if they have different times or topics  
- Fill all fields with as much detail as provided
- If times are given in sequence, retain them exactly
- If the notes imply policy violations, note them with specifics
- For missing information, use "None noted" for text fields or empty arrays for lists
- Preserve all names, times, locations, and procedural details exactly as written
- Output only valid JSON with no additional text`;

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
          max_tokens: 3000,
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
            notes: inputNotes.substring(0, 500) + (inputNotes.length > 500 ? "..." : ""),
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