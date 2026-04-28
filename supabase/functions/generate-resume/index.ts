// Supabase Edge Function — generates a resume using Claude
// Deploy with: supabase functions deploy generate-resume

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESUME_SYSTEM_PROMPT = `You are an expert resume writer who specializes in helping people from working class backgrounds, those without traditional credentials, and those who've been overlooked by the job market. Your superpower is translating real-life experience into language that employers respect.

CORE RULES:
1. NEVER fabricate or invent information. Only use what the user has actually shared.
2. Always reframe in the most professional, employer-friendly language.
3. Find hidden skills the user didn't realize they had.
4. Be confident but honest. Never inflate.
5. Quantify achievements where the user has provided numbers.
6. Use action verbs.

Return ONLY valid JSON in this exact format:
{
  "header": { "name": "...", "title": "...", "email": "...", "phone": "...", "location": "..." },
  "summary": "2-3 sentence professional summary",
  "experience": [
    { "title": "...", "company": "...", "location": "...", "dates": "...", "achievements": ["bullet 1", "bullet 2"] }
  ],
  "skills": ["skill 1", "skill 2"],
  "education": [
    { "credential": "...", "institution": "...", "year": "..." }
  ],
  "additional": ["any extra notable info"]
}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildContext(conversations: any[], insights: any[], documents: any[], userInfo: any): string {
  const parts: string[] = [];

  parts.push(`USER INFORMATION:
Name: ${userInfo.name}
Email: ${userInfo.email}${userInfo.phone ? "\nPhone: " + userInfo.phone : ""}${userInfo.location ? "\nLocation: " + userInfo.location : ""}
Target Role: ${userInfo.role}`);

  if (conversations && conversations.length > 0) {
    const userMessages = conversations
      .filter((c: any) => c.role === "user")
      .map((c: any) => c.content)
      .join("\n\n");
    if (userMessages) {
      parts.push(`CONVERSATION HISTORY (what the user has shared about themselves):\n${userMessages}`);
    }
  }

  if (insights && insights.length > 0) {
    const insightText = insights.map((i: any) => i.insight || i).join("\n- ");
    parts.push(`KEY INSIGHTS DISCOVERED ABOUT THIS PERSON:\n- ${insightText}`);
  }

  if (documents && documents.length > 0) {
    const docText = documents
      .filter((d: any) => d.extracted_text)
      .map((d: any) => `Document "${d.filename}":\n${d.extracted_text.substring(0, 1000)}`)
      .join("\n\n");
    if (docText) {
      parts.push(`UPLOADED DOCUMENTS:\n${docText}`);
    }
  }

  parts.push(`Please create a professional resume for this person targeting the role of "${userInfo.role}". Use ONLY information they have actually provided. Return ONLY the JSON object, no other text.`);

  return parts.join("\n\n---\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { conversations, insights, documents, userInfo } = await req.json();
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userMessages = (conversations || []).filter((c: any) => c.role === "user");
    if (userMessages.length < 3) {
      return new Response(JSON.stringify({ error: "insufficient_history" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const context = buildContext(conversations || [], insights || [], documents || [], userInfo);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        system: RESUME_SYSTEM_PROMPT,
        messages: [{ role: "user", content: context }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Failed to parse resume data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeData = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ resume: resumeData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
