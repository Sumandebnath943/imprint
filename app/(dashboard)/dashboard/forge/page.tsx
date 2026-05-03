import ForgeClient from "@/components/forge/ForgeClient";
import type { ForgeUserData } from "@/lib/forge/types";

async function getForgeData(): Promise<ForgeUserData> {
  const empty: ForgeUserData = {
    userId: "",
    professionCluster: "life_personal",
    baselineWordCount: 300,
    baselineVocabRichness: 0.6,
    baselineSentenceLength: 15,
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

    const [profileRes, baselineRes, challengeRes, historyRes] = await Promise.all([
      supabase.from("profiles").select("profession_cluster").eq("id", user.id).single(),
      supabase.from("baseline_imprints").select("word_count,vocabulary_richness,avg_sentence_length")
        .eq("user_id", user.id).limit(20),
      supabase.from("vault_challenges").select("*").eq("user_id", user.id)
        .eq("status", "pending").order("due_date", { ascending: true }).limit(1).single(),
      supabase.from("journal_entries").select("id,created_at,word_count,drift_signals,content,title")
        .eq("user_id", user.id).eq("is_forge_entry", true)
        .order("created_at", { ascending: false }).limit(10),
    ]);

    // Aggregate baseline averages
    const baselines = baselineRes.data ?? [];
    const avgWordCount = baselines.length > 0
      ? Math.round(baselines.reduce((s, b) => s + (b.word_count ?? 0), 0) / baselines.length)
      : 300;
    const avgVocabRichness = baselines.length > 0
      ? baselines.reduce((s, b) => s + (b.vocabulary_richness ?? 0.6), 0) / baselines.length
      : 0.6;
    const avgSentenceLen = baselines.length > 0
      ? baselines.reduce((s, b) => s + (b.avg_sentence_length ?? 15), 0) / baselines.length
      : 15;

    // Map history entries — infer tool from drift_signals or content pattern for old entries
    const history = (historyRes.data ?? []).map((h) => {
      const signals = h.drift_signals as any;
      const hasFile = ((h as any).content || "").includes("[Attached File:");
      const title = ((h as any).title || "").toLowerCase();
      let tool = signals?.forge_tool;
      if (!tool) {
        if (hasFile && title.includes("voice")) tool = "voice-note";
        else if (hasFile) tool = "sketch-upload";
        else tool = "free-write";
      }
      return {
        id: h.id,
        created_at: h.created_at,
        tool,
        word_count: h.word_count ?? 0,
        time_spent_seconds: signals?.time_spent_seconds ?? 0,
        drift_signals: signals,
      };
    });

    return {
      userId: user.id,
      professionCluster: profileRes.data?.profession_cluster ?? "life_personal",
      baselineWordCount: avgWordCount,
      baselineVocabRichness: parseFloat(avgVocabRichness.toFixed(3)),
      baselineSentenceLength: parseFloat(avgSentenceLen.toFixed(1)),
      activeChallenge: challengeRes.data ?? null,
      history,
    };
  } catch {
    return empty;
  }
}

export default async function ForgePage() {
  const userData = await getForgeData();
  return <ForgeClient userData={userData} />;
}
