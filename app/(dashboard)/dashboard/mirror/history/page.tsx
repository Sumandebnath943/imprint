import MirrorHistoryClient from "@/components/mirror/MirrorHistoryClient";

export default async function MirrorHistoryPage() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to view reflection history.</div>;
  }

  const { data: sessions, error } = await supabase
    .from("mirror_sessions")
    .select("id, created_at, topics, ai_question_count, user_message_count, session_duration_seconds, dependency_flags")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching mirror history:", error);
    return <div>Failed to load reflection history.</div>;
  }

  return <MirrorHistoryClient initialSessions={sessions || []} />;
}
