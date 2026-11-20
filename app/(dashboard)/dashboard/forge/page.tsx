import { Suspense } from "react";
import ForgeClient from "@/components/forge/ForgeClient";
import type { ForgeUserData } from "@/lib/forge/types";

async function getForgeData(): Promise<ForgeUserData> {
  const empty: ForgeUserData = {
    userId: "",
    professionCluster: "life_personal",
    activeChallenge: null,
    history: [],
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const [profileRes, challengeRes, historyRes] = await Promise.all([
      supabase.from("profiles").select("profession_cluster").eq("id", user.id).single(),
      supabase.from("vault_challenges").select("*").eq("user_id", user.id)
        .eq("status", "pending").order("due_date", { ascending: true }).limit(1).single(),
      supabase.from("journal_entries").select("id,created_at,word_count,drift_signals,content,title")
        .eq("user_id", user.id).eq("is_forge_entry", true)
        .order("created_at", { ascending: false }).limit(10),
    ]);

    // Map history entries — infer tool from drift_signals or content pattern for old entries
    const history = (historyRes.data ?? []).map((h) => {
      const signals = (h.drift_signals ?? {}) as Record<string, unknown>;
      const hasFile = ((h as Record<string, unknown>).content as string || "").includes("[Attached File:");
      const title = ((h as Record<string, unknown>).title as string || "").toLowerCase();

      // drift_signals is untyped JSONB, so narrow before use.
      const rawTool = signals.forge_tool;
      let tool = typeof rawTool === "string" ? rawTool : "";
      if (!tool) {
        if (hasFile && title.includes("voice")) tool = "voice-note";
        else if (hasFile) tool = "sketch-upload";
        else tool = "free-write";
      }

      const rawTime = signals.time_spent_seconds;

      return {
        id: h.id,
        created_at: h.created_at,
        tool,
        word_count: h.word_count ?? 0,
        time_spent_seconds: typeof rawTime === "number" ? rawTime : 0,
        drift_signals: signals,
      };
    });

    return {
      userId: user.id,
      professionCluster: profileRes.data?.profession_cluster ?? "life_personal",
            activeChallenge: challengeRes.data ? {
        id: challengeRes.data.id, title: challengeRes.data.challenge_title,
        description: challengeRes.data.challenge_description, due_date: challengeRes.data.due_date,
        submissionMode: challengeRes.data.challenge_type === "creative_production" ? "sketch-upload" :
          challengeRes.data.challenge_type === "explanation_exercise" ? "voice-note" : "text",
      } : null,
      history,
    };
  } catch {
    return empty;
  }
}

export default async function ForgePage() {
  const userData = await getForgeData();
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#040404]" />}>
      <ForgeClient userData={userData} />
    </Suspense>
  );
}
