import { supabase } from "./supabase";

export async function fetchUserContext(userId) {
  const [{ data: conversations }, { data: insights }, { data: documents }] = await Promise.all([
    supabase
      .from("conversations")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("insights")
      .select("insight")
      .eq("user_id", userId),
    supabase
      .from("user_documents")
      .select("filename, extracted_text")
      .eq("user_id", userId),
  ]);

  return {
    conversations: conversations || [],
    insights: insights || [],
    documents: documents || [],
  };
}

export async function generateResume(userId, userInfo) {
  const { conversations, insights, documents } = await fetchUserContext(userId);

  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-resume`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ conversations, insights, documents, userInfo }),
    }
  );

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.resume;
}

export async function saveResume(userId, resumeData, targetRole) {
  const { error } = await supabase.from("resumes").insert({
    user_id: userId,
    data: resumeData,
    target_role: targetRole,
  });
  if (error) throw error;
}
