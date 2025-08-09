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
You are an assistant that organizes raw workplace incident notes into a JSON array of incidents.
Return ONLY valid JSON (no markdown, no prose). Schema per array item:

{
  "date": "string",
  "categoryOrIssue": "string",
  "who": "string",
  "what": "string",
  "where": "string",
  "when": "string",
  "witnesses": "string",
  "notes": "string"
}

Rules:
- Split into multiple incidents when dates, topics, or scenes change.
- Do not invent details; if unknown, use "None noted".
- Keep short, plain phrasing.
- Output MUST be a JSON array and nothing else.
`.trim();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    if (!OPENAI_API_KEY) {
      console.error("Missing OPENAI_SECRET_KEY");
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: CORS,
      });
    }

    const { rawNotes } = await req.json().catch(() => ({}));
    if (!rawNotes || typeof rawNotes !== "string" || !rawNotes.trim()) {
      return new Response(JSON.stringify({ error: "rawNotes is required" }), {
        status: 400,
        headers: CORS,
      });
    }

    const t0 = Date.now();
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: rawNotes },
        ],
      }),
    });

    const raw = await openaiRes.json();
    if (!openaiRes.ok) {
      console.error("OpenAI error:", raw);
      return new Response(JSON.stringify({ error: "OpenAI request failed" }), {
        status: 502,
        headers: CORS,
      });
    }

    const text = raw?.choices?.[0]?.message?.content ?? "";
    let incidents: unknown;
    try {
      incidents = JSON.parse(text);
      if (!Array.isArray(incidents)) throw new Error("Not an array");
    } catch (e) {
      console.error("Invalid AI JSON:", e, "\nAI content:", text);
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 422,
        headers: CORS,
      });
    }

    console.log("organize-incidents ok in", Date.now() - t0, "ms");
    return new Response(JSON.stringify({ incidents }), { status: 200, headers: CORS });
  } catch (err) {
    console.error("organize-incidents exception:", err);
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500,
      headers: CORS,
    });
  }
});