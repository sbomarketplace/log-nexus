import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  message: string;
  rating: number | null;
  email: string | null;
  meta?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { message, rating, email, meta }: FeedbackRequest = await req.json();

    if (!message || message.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "Message is required and must be at least 5 characters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const to = "SBOMarketplaceapp@gmail.com";
    const from = "feedback@resend.dev"; // Using Resend's default domain

    const html = `
      <h2>ClearCase App Feedback</h2>
      <p><b>Rating:</b> ${rating ? `${rating} stars` : "No rating provided"}</p>
      <p><b>Message:</b></p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0;">
        ${escapeHtml(message).replace(/\n/g, '<br>')}
      </div>
      <hr style="margin: 20px 0;"/>
      <p><b>Contact:</b> ${email || "No email provided"}</p>
      ${meta ? `<p><b>Metadata:</b></p><pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">${escapeHtml(JSON.stringify(meta, null, 2))}</pre>` : ''}
    `;

    console.log("Sending feedback email to:", to);

    const emailResponse = await resend.emails.send({
      from,
      to,
      subject: `ClearCase Feedback${rating ? ` (${rating}★)` : ""}`,
      html,
      reply_to: email || undefined,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ ok: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-feedback function:", error);
    return new Response(
      JSON.stringify({ ok: false, error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

// Utility function to escape HTML
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

serve(handler);