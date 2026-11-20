import MirrorClient from "@/components/mirror/MirrorClient";
import { isAIEnabled } from "@/lib/ai/config";
import { createClient } from "@/lib/supabase/server";

export default async function MirrorPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="p-6">Sign in to use Mirror.</p>;
  const { data, error } = await supabase.from("mirror_sessions")
    .select("id,created_at,topics,ai_question_count,user_message_count,dependency_flags,session_duration_seconds")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(8);
  return <MirrorClient aiEnabled={isAIEnabled()} userData={{ userId: user.id, pastSessions: error ? [] : data ?? [] }} />;
}
