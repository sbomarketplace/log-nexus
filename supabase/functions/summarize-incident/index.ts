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
You are a professional HR documentation assistant. Your task is to parse raw HR incident notes into separate, structured incident summaries.
Each summary must follow this format exactly:

📅 [Date] — [Category or Issue]
• Who:
• What:
• Where:
• When:
• Witnesses:
• Notes:

Rules:

- Split each distinct incident into its own structured block based on new dates, topic shifts, or scene changes.
- Use the first clear date (e.g., 11/18, 7/22) as the incident date. If missing, write "Unknown Date".
- Assign a relevant incident category like: Harassment, Retaliation, Discrimination, Favoritism, Inappropriate Comment, False Accusation, Privacy Violation, Unsafe Condition, etc.
- Clean up obvious typos like "at out desks" → "at our desks"
- If a field is missing (e.g., no witnesses), still include the field but write "None noted"
- Return summaries in this clean, readable format. Do not output any extra commentary or headers.

Example input:
11/18
Who: Troy Malone
What: Asked if Indian QA has an OF during a meeting...
[...more entries with other dates]

Expected output:
📅 11/18 — Inappropriate Comment
• Who: Troy Malone
• What: Asked if an Indian QA had an OnlyFans during a team meeting
• Where: At our desks
• When: 6:00 AM
• Witnesses: Mark, Jake, Billy, AL, Darryl, 2 AOG contractors
• Notes: Occurred during a formal team meeting

📅 7/22 — False Accusation
• Who: Arthur Samora, Vincent Jessie, Seth Bentley
• What: Accused employee of smoking weed in the tool room...
[...]

Respond with a JSON array of incident objects like this:

[
  {
    "title": "[Short descriptive title]",
    "category": "[Category from above]",
    "date": "[Date in MM/DD format]",
    "location": "[Where it happened or 'None noted']",
    "peopleInvolved": ["person1", "person2"],
    "summary": "[The formatted summary using the 📅 format above]"
  }
]
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
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
      
      // Handle both single incident and multiple incidents
      const incidents = Array.isArray(parsed) ? parsed : [parsed]
      
      // TODO: Decrement user credits here
      
      return new Response(
        JSON.stringify({ incidents }),
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