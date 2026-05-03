import MirrorClient from "@/components/mirror/MirrorClient";
import type { MirrorUserData } from "@/lib/mirror/types";

async function getMirrorData(): Promise<MirrorUserData> {
  const empty: MirrorUserData = {
    userId: "",
    userCluster: "life_personal",
    baselineSummary: {
      avgWordCount: 300,
      vocabularyRichness: 0.6,
      avgSentenceLength: 15,
      commonPhrases: [],
      writingStyle: "thoughtful and considered",
    },
    pastSessions: [],
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const [profileRes, baselineRes, pastRes] = await Promise.all([
      supabase.from("profiles").select("profession_cluster").eq("id", user.id).single(),
      supabase.from("baseline_imprints")
        .select("word_count,vocabulary_richness,avg_sentence_length,writing_style")
        .eq("user_id", user.id).limit(20),
      supabase.from("mirror_sessions")
        .select("id,created_at,topics,ai_question_count,user_message_count,dependency_flags,session_duration_seconds")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const baselines = baselineRes.data ?? [];
    const avgWordCount = baselines.length > 0
      ? Math.round(baselines.reduce((s, b) => s + (b.word_count ?? 0), 0) / baselines.length)
      : 300;
    const avgVocabRichness = baselines.length > 0
      ? baselines.reduce((s, b) => s + (b.vocabulary_richness ?? 0.6), 0) / baselines.length
      : 0.6;
    const avgSentenceLength = baselines.length > 0
      ? baselines.reduce((s, b) => s + (b.avg_sentence_length ?? 15), 0) / baselines.length
      : 15;
    const writingStyle = baselines.length > 0 && baselines[0].writing_style
      ? baselines[0].writing_style
      : "thoughtful and considered";

    return {
      userId: user.id,
      userCluster: profileRes.data?.profession_cluster ?? "life_personal",
      baselineSummary: {
        avgWordCount,
        vocabularyRichness: parseFloat(avgVocabRichness.toFixed(3)),
        avgSentenceLength: parseFloat(avgSentenceLength.toFixed(1)),
        commonPhrases: [],
        writingStyle: writingStyle as string,
      },
      pastSessions: (pastRes.data ?? []).map((s) => ({
        id: s.id,
        created_at: s.created_at,
        topics: (s.topics as string[]) ?? [],
        ai_question_count: s.ai_question_count ?? 0,
        user_message_count: s.user_message_count ?? 0,
        dependency_flags: s.dependency_flags ?? 0,
        session_duration_seconds: s.session_duration_seconds ?? 0,
      })),
    };
  } catch {
    return empty;
  }
}

export default async function MirrorPage() {
  const userData = await getMirrorData();
  return <MirrorClient userData={userData} />;
}
