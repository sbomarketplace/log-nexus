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
You are a professional HR documentation assistant. Your job is to parse raw HR incident notes into individual structured summaries.

Rules:
- Each incident must be separated into its own summary block
- Use the first clear date (e.g. 11/18, 7/22) as the incident date
- Clean up obvious typos (e.g. "at out desks" to "at our desks")
- Always assign a meaningful incident category from: Harassment, Discrimination, Favoritism, Retaliation, Privacy Violation, Inappropriate Behavior, False Accusation, Unsafe Conditions, Workplace Negligence, Policy Violation, Other
- Don't include duplicate information
- Use only information explicitly stated in the raw text

Format each incident exactly like this:

📅 [Date] — [Category or Issue]
• Who: [People involved]
• What: [What happened]
• Where: [Location if mentioned, otherwise "Not specified"]
• When: [Time if mentioned, otherwise "Not specified"]
• Witnesses: [Witnesses if mentioned, otherwise "None noted"]
• Notes: [Additional context if any, otherwise "None"]

Respond with a JSON object like this:

{
  "title": "[Short descriptive title]",
  "category": "[Category from the list above]",
  "date": "[Date in MM/DD format]",
  "location": "[Where it happened]",
  "peopleInvolved": ["person1", "person2"],
  "summary": "[The formatted summary using the 📅 format above]"
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