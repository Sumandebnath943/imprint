import MirrorClient from "@/components/mirror/MirrorClient";
import { isAIEnabled } from "@/lib/ai/config";
import { createClient } from "@/lib/supabase/server";
import { findRoleTrack } from "@/lib/assessment/catalog";

export default async function MirrorPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="p-6">Sign in to use Mirror.</p>;
  const [sessions, profile] = await Promise.all([
    supabase.from("mirror_sessions").select("id,created_at,topics,ai_question_count,user_message_count,dependency_flags,session_duration_seconds")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("profiles").select("profession").eq("id", user.id).maybeSingle(),
  ]);
  const role = findRoleTrack(profile.data?.profession);
  const workQuestion = role && `Think of a recent task as a ${role.name}. When did you have to ${role.workStages[2].toLowerCase()}, and what evidence guided you?`;
  return <MirrorClient aiEnabled={isAIEnabled()} workQuestion={workQuestion}
    userData={{ userId: user.id, pastSessions: sessions.error ? [] : sessions.data ?? [] }} />;
}
