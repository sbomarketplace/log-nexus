import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, texts } = await req.json();

    // Handle batch processing
    if (texts && Array.isArray(texts)) {
      console.log('Batch improving grammar for', texts.length, 'texts');
      
      const results = [];
      for (const textItem of texts) {
        if (!textItem?.trim()) {
          results.push({ improvedText: textItem || '', hasChanges: false });
          continue;
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: `You are a grammar correction assistant for workplace incident reports. Your job is to:

1. Fix grammar, punctuation, capitalization, and spelling errors
2. Maintain the exact meaning and content
3. Keep workplace-specific terms and names as they are (even if they seem unusual)
4. Preserve the original structure and tone
5. Make minimal changes - only fix clear errors
6. Always maintain first-person perspective if present

IMPORTANT: Only return the corrected text, nothing else. Do not add explanations, comments, or formatting. If the text is already correct, return it unchanged.`
              },
              { 
                role: 'user', 
                content: `Please fix any grammar, punctuation, and spelling errors in this incident report text while preserving the exact meaning and content:\n\n${textItem}` 
              }
            ],
            max_tokens: 1000,
            temperature: 0.1
          }),
        });

        if (!response.ok) {
          results.push({ improvedText: textItem, hasChanges: false, error: 'API error' });
          continue;
        }

        const data = await response.json();
        const improvedText = data.choices[0].message.content?.trim() || textItem;
        const hasChanges = improvedText.toLowerCase().replace(/\s+/g, ' ') !== 
                          textItem.toLowerCase().replace(/\s+/g, ' ');

        results.push({
          improvedText,
          hasChanges,
          originalLength: textItem.length,
          improvedLength: improvedText.length
        });
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle single text processing
    if (!text?.trim()) {
      return new Response(JSON.stringify({ 
        improvedText: text,
        hasChanges: false 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Improving grammar for text:', text.substring(0, 100) + '...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `You are a grammar correction assistant for workplace incident reports. Your job is to:

1. Fix grammar, punctuation, capitalization, and spelling errors
2. Maintain the exact meaning and content
3. Keep workplace-specific terms and names as they are (even if they seem unusual)
4. Preserve the original structure and tone
5. Make minimal changes - only fix clear errors
6. Always maintain first-person perspective if present

IMPORTANT: Only return the corrected text, nothing else. Do not add explanations, comments, or formatting. If the text is already correct, return it unchanged.`
          },
          { 
            role: 'user', 
            content: `Please fix any grammar, punctuation, and spelling errors in this incident report text while preserving the exact meaning and content:\n\n${text}` 
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const improvedText = data.choices[0].message.content?.trim() || text;
    
    // Check if there were any meaningful changes
    const hasChanges = improvedText.toLowerCase().replace(/\s+/g, ' ') !== 
                      text.toLowerCase().replace(/\s+/g, ' ');

    console.log('Grammar improvement completed. Changes made:', hasChanges);

    return new Response(JSON.stringify({ 
      improvedText,
      hasChanges,
      originalLength: text.length,
      improvedLength: improvedText.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in improve-grammar function:', error);
    
    // Return original text if grammar correction fails
    const { text } = await req.json().catch(() => ({ text: '' }));
    
    return new Response(JSON.stringify({ 
      improvedText: text || '',
      hasChanges: false,
      error: 'Grammar correction failed, returned original text'
    }), {
      status: 200, // Don't fail the whole process if grammar correction fails
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});