import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_SECRET_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrganizedIncident {
  date: string;
  categoryOrIssue: string;
  who: string;
  what: string;
  where: string;
  when: string;
  witnesses: string;
  notes: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting organize-incidents request`);

  try {
    if (!openAIApiKey) {
      console.error('OPENAI_SECRET_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { rawNotes } = await req.json();
    
    if (!rawNotes || typeof rawNotes !== 'string') {
      return new Response(
        JSON.stringify({ error: 'rawNotes is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing rawNotes (${rawNotes.length} characters)`);

    const systemPrompt = `You are an assistant that organizes raw workplace incident notes into a JSON array of incidents. 
Return ONLY valid JSON (no markdown). Schema per item:
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
- Do not fabricate details; use only what's provided.
- If a field is missing, use 'None noted'.
- Output must be a JSON array, no extra keys, no prose.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: rawNotes }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'OpenAI API request failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('Raw AI response:', aiResponse);

    let incidents: OrganizedIncident[];
    try {
      incidents = JSON.parse(aiResponse);
      
      // Validate the structure
      if (!Array.isArray(incidents)) {
        throw new Error('Response is not an array');
      }
      
      for (const incident of incidents) {
        if (typeof incident !== 'object' || 
            typeof incident.date !== 'string' ||
            typeof incident.categoryOrIssue !== 'string' ||
            typeof incident.who !== 'string' ||
            typeof incident.what !== 'string' ||
            typeof incident.where !== 'string' ||
            typeof incident.when !== 'string' ||
            typeof incident.witnesses !== 'string' ||
            typeof incident.notes !== 'string') {
          throw new Error('Invalid incident structure');
        }
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response was:', aiResponse);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid AI response',
          details: 'AI returned malformed JSON'
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`Successfully organized ${incidents.length} incidents in ${duration}ms`);

    return new Response(JSON.stringify({ incidents }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Error in organize-incidents function (${duration}ms):`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});