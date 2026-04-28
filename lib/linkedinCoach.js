import { supabase } from "./supabase";

export async function checkConversationHistory(userId) {
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "user");

  return (data || []).length;
}

export async function getOrCreateSession(userId) {
  const { data: existing } = await supabase
    .from("linkedin_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("completed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing;

  const { data: newSession, error } = await supabase
    .from("linkedin_sessions")
    .insert({
      user_id: userId,
      current_step: 1,
      responses: {},
      optimized: {},
      completed: false,
    })
    .select()
    .single();

  if (error) throw error;
  return newSession;
}

export async function updateSession(sessionId, updates) {
  if (!sessionId) return;
  const { error } = await supabase
    .from("linkedin_sessions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    console.error("Failed to save LinkedIn session:", error);
    // Don't throw — always show the user their results even if save fails
  }
}

export async function callLinkedInCoach({ step, userAnswer, sessionId, userId, previousResponses }) {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/linkedin-coach`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ step, userAnswer, sessionId, userId, previousResponses }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}
