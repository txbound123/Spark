// Supabase Edge Function — LinkedIn Coach powered by Claude
// Deploy with: supabase functions deploy linkedin-coach

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LINKEDIN_COACH_SYSTEM_PROMPT = `You are a warm, encouraging LinkedIn coach who specializes in helping people from working class backgrounds, those without traditional credentials, and those who've been overlooked.

CORE RULES:
1. NEVER fabricate or invent facts about the user — only use what they have shared
2. Always reframe in employer-friendly language
3. Find hidden skills they didn't realize they had
4. Be confident but honest — never inflate
5. Keep responses focused and actionable
6. Match the warm, encouraging tone of Spark
7. Be specific — vague advice doesn't help

You will receive context including:
- The user's conversation history with Spark
- Insights Spark has discovered about them
- Which step of the coaching session they're on
- Their answer to the current step's question

Generate the appropriate output for that step in the format requested. Return ONLY valid JSON — no other text.`;

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
    const { step, userAnswer, sessionId, userId, previousResponses } = await req.json();

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull user context from Supabase
    let conversations: any[] = [];
    let insights: any[] = [];

    if (supabaseUrl && supabaseServiceKey && userId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const [{ data: convs }, { data: ins }] = await Promise.all([
          supabase
            .from("conversations")
            .select("role, content")
            .eq("user_id", userId)
            .order("created_at", { ascending: true }),
          supabase
            .from("insights")
            .select("insight")
            .eq("user_id", userId),
        ]);
        conversations = convs || [];
        insights = ins || [];
      } catch (e) {
        console.error("Failed to fetch user context:", e);
      }
    }

    // Build context prompt
    const parts: string[] = [];
    parts.push(`COACHING SESSION — STEP ${step} of 5`);

    if (conversations.length > 0) {
      const userMessages = conversations
        .filter((c: any) => c.role === "user")
        .map((c: any) => c.content)
        .join("\n\n");
      if (userMessages) {
        parts.push(`USER'S CONVERSATION HISTORY WITH SPARK (use this to understand who they are):\n${userMessages}`);
      }
    }

    if (insights.length > 0) {
      const insightText = insights.map((i: any) => i.insight || i).join("\n- ");
      parts.push(`KEY INSIGHTS SPARK HAS DISCOVERED ABOUT THIS PERSON:\n- ${insightText}`);
    }

    if (previousResponses && Object.keys(previousResponses).length > 0) {
      const prevEntries = Object.entries(previousResponses)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([s, r]) => `Step ${s}: ${JSON.stringify(r)}`);
      if (prevEntries.length > 0) {
        parts.push(`PREVIOUS COACHING RESULTS FROM THIS SESSION:\n${prevEntries.join("\n")}`);
      }
    }

    const stepInstructions: Record<string, string> = {
      "1": `USER'S CURRENT LINKEDIN HEADLINE: "${userAnswer}"

Generate 3 alternative LinkedIn headlines that are specific, compelling, and honest. Draw on their Spark conversation history to surface what makes them unique.
Return ONLY this JSON:
{ "options": ["headline 1", "headline 2", "headline 3"], "tip": "one short actionable tip under 15 words" }`,

      "2": `USER'S ABOUT SECTION (or self-description): "${userAnswer}"

Rewrite it as a warm, professional LinkedIn About section under 200 words. Use their voice, draw on their Spark conversation for concrete details.
Return ONLY this JSON:
{ "optimized": "rewritten about section", "tip": "one short tip under 15 words" }`,

      "3": `USER'S CURRENT SKILLS: "${userAnswer}"

Suggest 8-12 LinkedIn skills total. Keep the strong ones they mentioned, and add hidden skills you've inferred from their background. Flag which ones are newly suggested.
Return ONLY this JSON:
{ "skills": ["skill1", "skill2", "...all skills including existing"], "new": ["only the newly suggested ones"], "tip": "one short tip under 15 words" }`,

      "4": `USER'S JOB DESCRIPTION: "${userAnswer}"

Rewrite it with strong action verbs and quantified achievements where the user has provided numbers. Use bullet-point style.
Return ONLY this JSON:
{ "optimized": "rewritten job description with bullet points", "tip": "one short tip under 15 words" }`,

      "5": `Generate a complete LinkedIn Optimization Report that combines all the coaching work from this session.
Return ONLY this JSON:
{
  "headline": "the best headline from step 1 results, or craft one based on conversation history if step 1 was skipped",
  "about": "the optimized about section from step 2, or a brief professional about based on conversation history if skipped",
  "skills": ["full skill list from step 3, or inferred from conversation history if skipped"],
  "jobDescription": "the optimized job description from step 4, or omit this field if step 4 was skipped",
  "improvements": ["one specific actionable improvement", "a second specific improvement", "a third specific improvement"],
  "closingMessage": "warm, specific, 2-3 sentence message that celebrates what makes this person unique and encourages them to update their profile today"
}`,
    };

    parts.push(stepInstructions[step] || "Generate helpful coaching advice as JSON.");

    const context = parts.join("\n\n---\n\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1500,
        system: LINKEDIN_COACH_SYSTEM_PROMPT,
        messages: [{ role: "user", content: context }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Failed to parse coaching response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
