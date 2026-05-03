import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      content,
      word_count,
      was_timed,
      time_limit_seconds,
      response_audio_url,
      response_file_url,
      item_type,
      challenge_id,
      tool,
      time_spent_seconds,
      practiced_skill_id,
    } = body;

    // ── Calculate real drift signals from baseline ──────────────────────
    let drift_signals: Record<string, number> | null = null;

    if (content && word_count > 0) {
      // Fetch baseline for this user
      const { data: baseline } = await supabase
        .from("baseline_imprints")
        .select("vocabulary_richness, avg_sentence_length, word_count")
        .eq("user_id", user.id);

      const words = content.toLowerCase().split(/\s+/).filter(Boolean);
      const vocabRichness = words.length > 0 ? new Set(words).size / words.length : 0;
      const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim());
      const avgSentLen = sentences.length > 0 ? word_count / sentences.length : 0;

      const avgBaselineVocab = baseline?.length
        ? baseline.reduce((s, b) => s + (b.vocabulary_richness || 0), 0) / baseline.length
        : 0;
      const avgBaselineSentLen = baseline?.length
        ? baseline.reduce((s, b) => s + (b.avg_sentence_length || 0), 0) / baseline.length
        : 0;
      const avgBaselineWordCount = baseline?.length
        ? baseline.reduce((s, b) => s + (b.word_count || 0), 0) / baseline.length
        : 0;

      drift_signals = {
        vocabulary_richness: parseFloat(vocabRichness.toFixed(3)),
        avg_sentence_length: parseFloat(avgSentLen.toFixed(2)),
        // Delta vs baseline (positive = more verbose/complex than baseline)
        vocabulary_delta: avgBaselineVocab > 0
          ? parseFloat(((vocabRichness - avgBaselineVocab) / avgBaselineVocab * 100).toFixed(1))
          : 0,
        sentence_length_delta: avgBaselineSentLen > 0
          ? parseFloat(((avgSentLen - avgBaselineSentLen) / avgBaselineSentLen * 100).toFixed(1))
          : 0,
        word_count_delta: avgBaselineWordCount > 0
          ? parseFloat(((word_count - avgBaselineWordCount) / avgBaselineWordCount * 100).toFixed(1))
          : 0,
      };
    } else if (tool || time_spent_seconds !== undefined) {
      drift_signals = {};
    }

    if (drift_signals !== null || tool || time_spent_seconds !== undefined || practiced_skill_id) {
      if (!drift_signals) drift_signals = {};
      if (tool) drift_signals.forge_tool = tool;
      if (time_spent_seconds !== undefined) drift_signals.time_spent_seconds = time_spent_seconds;
      if (practiced_skill_id) drift_signals.practiced_skill_id = practiced_skill_id;
    }

    // ── Insert journal entry ────────────────────────────────────────────
    let finalContent = content ?? null;
    const fileUrl = response_file_url || response_audio_url;
    if (fileUrl) {
      if (finalContent) finalContent += `\n\n[Attached File: ${fileUrl}]`;
      else finalContent = `[Attached File: ${fileUrl}]`;
    }

    const { data: entry, error: insertError } = await supabase
      .from("journal_entries")
      .insert({
        user_id: user.id,
        title: title ?? `Forge Session — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
        content: finalContent,
        word_count: word_count ?? 0,
        is_forge_entry: true,
        has_ai_assistance: false,
        was_timed: was_timed ?? false,
        time_limit_seconds: time_limit_seconds ?? null,
        drift_signals,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error saving forge entry:", insertError);
      return NextResponse.json({ error: "Failed to save forge entry" }, { status: 500 });
    }

    // ── Mark vault challenge as completed if applicable ──────────────────
    if (challenge_id) {
      // Get the challenge details to update the skill strength
      const { data: challengeData } = await supabase
        .from("vault_challenges")
        .select("skill_id, strength_gained")
        .eq("id", challenge_id)
        .single();

      const { error: challengeError } = await supabase
        .from("vault_challenges")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", challenge_id)
        .eq("user_id", user.id);

      if (challengeError) {
        console.error("Error completing vault challenge:", challengeError);
      } else if (challengeData?.skill_id) {
        // Increment the skill strength in the vault
        // Since we don't have a direct increment in this Supabase version from the client,
        // we fetch the current skill and add to it.
        const { data: currentSkill } = await supabase
          .from("skill_vault")
          .select("strength_level, times_practiced")
          .eq("id", challengeData.skill_id)
          .single();
          
        if (currentSkill) {
          await supabase
            .from("skill_vault")
            .update({ 
              strength_level: Math.min(100, (currentSkill.strength_level || 0) + (challengeData.strength_gained || 5)),
              times_practiced: (currentSkill.times_practiced || 0) + 1,
              last_exercised: new Date().toISOString()
            })
            .eq("id", challengeData.skill_id);
        }
      }
    } else if (practiced_skill_id) {
      // ── Practice a specific skill (not a vault challenge) ────────────────
      const { data: currentSkill } = await supabase
        .from("skill_vault")
        .select("strength_level, times_practiced")
        .eq("id", practiced_skill_id)
        .single();
        
      if (currentSkill) {
        await supabase
          .from("skill_vault")
          .update({ 
            // A regular practice session gives a smaller boost (+2) compared to a challenge
            strength_level: Math.min(100, (currentSkill.strength_level || 0) + 2),
            times_practiced: (currentSkill.times_practiced || 0) + 1,
            last_exercised: new Date().toISOString()
          })
          .eq("id", practiced_skill_id);
      }
    }

    return NextResponse.json({ success: true, entryId: entry?.id, driftSignals: drift_signals });
  } catch (error) {
    console.error("Forge save error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
