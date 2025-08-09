import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_SECRET_KEY");

const SYSTEM_PROMPT = `
You are an assistant that organizes raw workplace incident notes into a structured JSON object.
Return a JSON object with this exact structure:

{
  "incidents": [
    {
      "date": "string",
      "category": "string", 
      "who": "string",
      "what": "string",
      "where": "string",
      "when": "string",
      "witnesses": "string",
      "notes": "string"
    }
  ]
}

Rules:
- Split into multiple incidents when dates, topics, or scenes change.
- Do not invent details; if unknown, use "None noted".
- Keep short, plain phrasing.
- MUST return valid JSON in the exact structure shown above.
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
    return new Response("ok", { 
      headers: { 
        'Content-Type': 'application/json', 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      } 
    });
  }

  try {
    if (!OPENAI_API_KEY) {
      console.error("Missing OPENAI_SECRET_KEY");
      return new Response(JSON.stringify({ ok: false, message: "Server misconfigured" }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const { rawNotes } = await req.json().catch(() => ({}));
    if (!rawNotes || typeof rawNotes !== "string" || !rawNotes.trim()) {
      return new Response(JSON.stringify({ ok: false, message: "rawNotes is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: rawNotes },
          ],
        }),
      });

      const raw = await openaiRes.json();
      console.log("OpenAI raw response:", JSON.stringify(raw, null, 2));
      
      if (!openaiRes.ok) {
        console.error("OpenAI error:", raw);
        return new Response(JSON.stringify({ ok: false, message: "OpenAI request failed" }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const text = raw?.choices?.[0]?.message?.content ?? "";
      let parsedData: any;
      
      try {
        parsedData = extractJSON(text);
      } catch (e) {
        console.error("JSON extraction failed:", e, "\nAI content:", text);
        return new Response(JSON.stringify({ 
          ok: false, 
          message: "Could not extract valid JSON from AI response. Please try rephrasing your notes." 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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
          message: "AI response format is invalid. Expected incidents array." 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      // Validate incidents structure
      if (!incidents.length) {
        return new Response(JSON.stringify({ 
          ok: false, 
          message: "No incidents were identified in your notes. Please provide more detailed information." 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      console.log(`organize-incidents ok in ${Date.now() - t0}ms, parsed ${incidents.length} incidents`);
      return new Response(JSON.stringify({ ok: true, incidents }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
      
    } catch (openaiError) {
      console.error("OpenAI call failed:", openaiError);
      return new Response(JSON.stringify({ 
        ok: false, 
        message: openaiError?.message || 'OpenAI API error' 
      }), {
        status: 500, 
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

  } catch (err) {
    console.error("organize-incidents exception:", err);
    return new Response(JSON.stringify({ 
      ok: false, 
      message: err?.message || 'Unknown error' 
    }), {
      status: 500, 
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});