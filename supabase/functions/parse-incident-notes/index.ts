import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IncidentEvent {
  date: string;            // ISO date string
  category: string;        // "Accusation", "Harassment", etc.
  who: string;              // Comma-separated list of people, properly capitalized
  what: string;             // Short description of incident
  where: string;            // Location
  when: string;              // Time of day
  witnesses: string;         // Comma-separated list of names
  notes: string;             // Detailed notes
}

const SYSTEM_PROMPT = `
You are a professional HR documentation assistant.

Task:
Convert raw workplace incident notes into a STRICT JSON object with this shape:
{
  "events": [
    {
      "date": "string",          // "7/22" or "Unknown" if missing
      "category": "string",      // e.g., "Wrongful Accusation", "Harassment", "Discrimination", etc.
      "who": "string",           // comma-separated names
      "what": "string",          // 1–2 sentence neutral summary
      "where": "string",         // location; "None noted" if missing
      "when": "string",          // time; "None noted" if missing
      "witnesses": "string",     // comma-separated names; "None noted" if missing
      "notes": "string"          // 1–3 concise, neutral details
    }
  ]
}

Rules:
- Return ONLY JSON with the key "events" (no markdown, no commentary).
- Split into multiple events when dates/topics/scenes change.
- If a field is missing, use "None noted" (except date: use "Unknown").
- Keep tone neutral and factual; no judgments.
- Max 2 sentences for "what"; max 3 short bullets rolled into one sentence for "notes".
- Normalize names to Title Case.
- Do not invent dates/times or people.
`;

function normalizeIncidentEvent(event: any): IncidentEvent {
  const normalize = (value: any, fallback: string = "None noted"): string => {
    if (typeof value !== 'string' || !value.trim()) {
      return fallback;
    }
    return value.trim();
  };

  return {
    date: normalize(event.date, "Unknown"),
    category: normalize(event.category),
    who: normalize(event.who),
    what: normalize(event.what),
    where: normalize(event.where),
    when: normalize(event.when),
    witnesses: normalize(event.witnesses),
    notes: normalize(event.notes)
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Validate request body
    const { rawNotes } = await req.json();
    
    if (!rawNotes || typeof rawNotes !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid rawNotes field' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openAIApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Service configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: rawNotes
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return new Response(JSON.stringify({ error: 'Failed to parse notes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Parse the JSON response
    let parsedEvents;
    try {
      const parsed = JSON.parse(generatedText);
      
      // Validate response structure
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.events)) {
        throw new Error('Invalid response structure: missing events array');
      }
      
      // Normalize and validate each event
      parsedEvents = parsed.events.map((event: any) => {
        const normalized = normalizeIncidentEvent(event);
        
        // Validate required fields exist after normalization
        const requiredFields = ['date', 'category', 'who', 'what', 'where', 'when', 'witnesses', 'notes'];
        for (const field of requiredFields) {
          if (!normalized[field as keyof IncidentEvent]) {
            throw new Error(`Missing field after normalization: ${field}`);
          }
        }
        
        return normalized;
      });
      
    } catch (parseError) {
      console.error('JSON parsing error:', parseError, 'Raw response:', generatedText);
      return new Response(JSON.stringify({ error: 'Invalid AI response' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the parsed events
    return new Response(JSON.stringify({ events: parsedEvents }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-incident-notes function:', error);
    return new Response(JSON.stringify({ error: 'Failed to parse notes' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});