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
        messages: [
          {
            role: 'system',
            content: `You are a structured HR incident parser. Convert raw workplace incident notes into an array of IncidentEvent objects in JSON that match our schema exactly.

Each IncidentEvent must have these exact fields:
- date: string (ISO date format like "2024-01-15")
- category: string (e.g., "Accusation", "Harassment", "Safety Violation")
- who: string (comma-separated list of people involved, properly capitalized)
- what: string (short description of what happened)
- where: string (location where incident occurred)
- when: string (time of day when incident occurred)
- witnesses: string (comma-separated list of witness names, or "None noted" if none)
- notes: string (detailed notes about the incident)

Always respond with valid JSON in this exact format:
{
  "events": [
    {
      "date": "2024-01-15",
      "category": "Accusation",
      "who": "John Smith, Mary Johnson",
      "what": "Verbal altercation in break room",
      "where": "Employee break room",
      "when": "2:30 PM",
      "witnesses": "Tom Wilson, Sarah Davis",
      "notes": "Detailed description of what occurred..."
    }
  ]
}

No extra commentary or text outside JSON.`
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
      parsedEvents = parsed.events;
      
      // Validate that events is an array
      if (!Array.isArray(parsedEvents)) {
        throw new Error('Events is not an array');
      }
      
      // Basic validation of event structure
      for (const event of parsedEvents) {
        const requiredFields = ['date', 'category', 'who', 'what', 'where', 'when', 'witnesses', 'notes'];
        for (const field of requiredFields) {
          if (typeof event[field] !== 'string') {
            throw new Error(`Invalid or missing field: ${field}`);
          }
        }
      }
      
    } catch (parseError) {
      console.error('JSON parsing error:', parseError, 'Raw response:', generatedText);
      return new Response(JSON.stringify({ error: 'Failed to parse notes' }), {
        status: 500,
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