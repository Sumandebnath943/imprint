import JournalClient from "@/components/journal/JournalClient";
import type { JournalPageData, BaselineAverages } from "@/lib/journal/types";

async function getJournalData(): Promise<JournalPageData> {
  const empty: JournalPageData = {
    userId: "",
    entries: [],
    baseline: { avgWordCount: 300, avgVocabRichness: 0.6, avgSentenceLength: 15 },
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const [entriesRes, baselineRes] = await Promise.all([
      supabase.from("journal_entries")
        .select("id,user_id,title,content,word_count,mood,tags,is_forge_entry,was_timed,has_ai_assistance,drift_signals,created_at,updated_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase.from("baseline_imprints")
        .select("word_count,vocabulary_richness,avg_sentence_length")
        .eq("user_id", user.id).limit(20),
    ]);

    const baselines = baselineRes.data ?? [];
    const baseline: BaselineAverages = baselines.length > 0 ? {
      avgWordCount: Math.round(baselines.reduce((s, b) => s + (b.word_count ?? 0), 0) / baselines.length),
      avgVocabRichness: parseFloat((baselines.reduce((s, b) => s + (b.vocabulary_richness ?? 0.6), 0) / baselines.length).toFixed(3)),
      avgSentenceLength: parseFloat((baselines.reduce((s, b) => s + (b.avg_sentence_length ?? 15), 0) / baselines.length).toFixed(1)),
    } : empty.baseline;

    return {
      userId: user.id,
      entries: (entriesRes.data ?? []) as JournalPageData["entries"],
      baseline,
    };
  } catch {
    return empty;
  }
}

export default async function JournalPage() {
  const pageData = await getJournalData();
  return <JournalClient pageData={pageData} />;
}
