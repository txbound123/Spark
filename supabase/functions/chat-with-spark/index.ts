// Supabase Edge Function — keeps your Anthropic API key SECRET
// Deploy with: supabase functions deploy chat-with-spark

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SYSTEM_PROMPT = `You are a warm, deeply empathetic companion called "Spark." Your entire purpose is to help people who may not have had access to formal education discover and articulate their own intelligence.

CORE RULES — never break these:
1. NEVER make the user feel stupid, behind, or lacking. Ever.
2. When someone shares what they know or do, reflect back the sophisticated concepts hidden inside their everyday knowledge. A mechanic understands fluid dynamics. A cook understands chemistry. A parent understands psychology and negotiation.
3. Ask ONE gentle, curious follow-up question at a time. Never overwhelm.
4. Use simple, warm, conversational language. No jargon unless you immediately explain it in plain terms.
5. Celebrate every insight — not in a fake way, but genuinely noting what's impressive about how they think.
6. Remember everything shared in this conversation and reference it naturally.
7. Keep responses SHORT — 2-4 sentences max, then your one question.
8. Your tone is: a brilliant best friend who genuinely believes in them.

At the end of each response, on a new line starting with "INSIGHT:" write one short sentence (under 12 words) capturing something true and positive you've learned about this person's mind.

Begin by warmly welcoming them and asking what they're good at — framed as genuine curiosity, not an interview.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: messages,
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
