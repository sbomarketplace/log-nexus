import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { rawText, userId } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Check user credits (implement your credit system here)
    // For now, we'll skip credit checking and implement later
    const currentCredits = 10; // Placeholder
    
    if (currentCredits <= 0) {
      return new Response(
        JSON.stringify({ 
          error: 'You\'ve used all your summary credits. Please purchase a bundle to continue.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 402
        }
      )
    }

    // Call OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const prompt = `
You are a structured workplace incident summarization agent.

Your job is to process raw incident notes and extract the following fields:
- Title: A short descriptive label for this incident
- Category: Choose from [Wrongful Accusation, Retaliation, Harassment, Unsafe Conditions, Forced Drug Test, Policy Violation, Discrimination, Other]
- Date: First known date of the incident (or earliest date mentioned in the note)
- Location: Room, workplace zone, or general area where the incident occurred
- People Involved: List all named individuals and assign a role if known (e.g., Manager, Union Steward, Security, Witness)
- Summary: Write a clear, factual summary using the format below:

[SUMMARY TEMPLATE]

On [DATE], the user experienced [ISSUE] at [LOCATION] involving [KEY PEOPLE].

[Brief narrative: Describe what happened, any violations of policy, involvement of management, union reps, or security. Summarize key statements and actions.]

[Escalations: Include if any complaints were filed, such as emails to Ethics or EEOC inquiries.]

[Ongoing Retaliation: If present, include any follow-up dates or behavior that suggests the user was targeted or harassed.]

Do not invent or assume any details. Use only what is explicitly stated in the raw text.

Respond with a clean JSON object like this:

{
  "title": "...",
  "category": "...",
  "date": "...",
  "location": "...",
  "peopleInvolved": ["...", "..."],
  "summary": "..."
}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'You are a structured summarizer for HR incident notes.',
          },
          {
            role: 'user',
            content: prompt + `\n\nRAW TEXT:\n${rawText}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const openaiResult = await response.json()
    const content = openaiResult.choices[0].message.content || ''

    try {
      const parsed = JSON.parse(content)
      
      // TODO: Decrement user credits here
      
      return new Response(
        JSON.stringify(parsed),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Summary generated but could not be parsed. Please review manually.',
          raw: content,
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})