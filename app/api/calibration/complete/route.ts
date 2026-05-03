import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper: get ISO week number
function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - start.getTime()) / 86400000) + start.getDay() + 1) / 7);
}

// Helper: score label from drift score (0 = anchored, 100 = critical)
function getScoreLabel(score: number): string {
  if (score <= 20) return "anchored";
  if (score <= 45) return "stable";
  if (score <= 65) return "drifting";
  return "critical";
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // 1. Fetch calibration session with responses
    const { data: session, error: sessionError } = await supabase
      .from("calibration_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      console.error("Session fetch error:", sessionError);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // ── 2. Fetch all 4 signal data in parallel ──────────────────────────────

    const [baselineData, vaultData, journalData, mirrorData, prevDriftData, calData] =
      await Promise.all([
        // Baseline imprints (for text-similarity proxy)
        supabase
          .from("baseline_imprints")
          .select("word_count, vocabulary_richness, avg_sentence_length")
          .eq("user_id", user.id),
        // Skill vault (vault activity)
        supabase
          .from("skill_vault")
          .select("strength_level, last_exercised, times_practiced")
          .eq("user_id", user.id),
        // Journal (regularity signal)
        supabase
          .from("journal_entries")
          .select("created_at")
          .eq("user_id", user.id)
          .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString()),
        // Mirror sessions (AI independence — dependency flags)
        supabase
          .from("mirror_sessions")
          .select("dependency_flags")
          .eq("user_id", user.id)
          .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString()),
        // Previous drift score for delta
        supabase
          .from("drift_scores")
          .select("score")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
        // All completed calibrations for IMPRINT score
        supabase
          .from("calibration_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "completed"),
      ]);

    // ── 3. Calculate each of the 4 signals (0–100 scale, higher = more drift) ──

    // SIGNAL 1: Baseline Consistency (40% weight)
    // Compare calibration responses vs baseline vocabulary richness
    const responses: any[] = session.responses || [];
    const calWords = responses.reduce((s: number, r: any) => s + (r.wordCount || 0), 0);
    const calText = responses.map((r: any) => r.content || "").join(" ");
    const calVocabWords = calText.toLowerCase().split(/\s+/).filter(Boolean);
    const calVocabRichness = calVocabWords.length > 0
      ? new Set(calVocabWords).size / calVocabWords.length
      : 0;
    const calSentences = calText.split(/[.!?]+/).filter((s: string) => s.trim());
    const calAvgSentLen = calSentences.length > 0 ? calWords / calSentences.length : 0;

    const avgBaselineVocab = baselineData.data?.length
      ? baselineData.data.reduce((s, b) => s + (b.vocabulary_richness || 0), 0) / baselineData.data.length
      : 0.5;
    const avgBaselineSentLen = baselineData.data?.length
      ? baselineData.data.reduce((s, b) => s + (b.avg_sentence_length || 0), 0) / baselineData.data.length
      : 15;

    // Higher divergence = higher drift
    const vocabDivergence = avgBaselineVocab > 0
      ? Math.abs(calVocabRichness - avgBaselineVocab) / avgBaselineVocab
      : 0;
    const sentLenDivergence = avgBaselineSentLen > 0
      ? Math.abs(calAvgSentLen - avgBaselineSentLen) / avgBaselineSentLen
      : 0;
    const baselineConsistency = Math.min(100, Math.round((vocabDivergence * 50 + sentLenDivergence * 50) * 100));

    // SIGNAL 2: Vault Activity (25% weight)
    // Low activity in past 14 days = high drift
    const vaultSkills = vaultData.data || [];
    const cutoff14 = Date.now() - 14 * 86400000;
    const recentlyPracticed = vaultSkills.filter(
      (s) => new Date(s.last_exercised).getTime() >= cutoff14
    ).length;
    const vaultActivity = vaultSkills.length > 0
      ? Math.round(100 - (recentlyPracticed / vaultSkills.length) * 100)
      : 50; // Default 50 if no skills

    // SIGNAL 3: AI Independence (20% weight)
    // Dependency flags in past 14 days
    const totalFlags = (mirrorData.data || []).reduce(
      (s, m) => s + (m.dependency_flags || 0), 0
    );
    const aiIndependence = Math.min(100, totalFlags * 10); // each flag adds 10 drift points

    // SIGNAL 4: Journal Regularity (15% weight)
    // 14 days, max 14 entries = 100% regular
    const journalDays = new Set(
      (journalData.data || []).map((j) => new Date(j.created_at).toDateString())
    ).size;
    const journalRegularity = Math.round(Math.max(0, 100 - (journalDays / 14) * 100));

    // ── 4. Weighted drift score ─────────────────────────────────────────────
    const drift_score_produced = Math.round(
      baselineConsistency * 0.40 +
      vaultActivity        * 0.25 +
      aiIndependence       * 0.20 +
      journalRegularity    * 0.15
    );
    const finalDriftScore = Math.max(0, Math.min(100, drift_score_produced));
    const score_label = getScoreLabel(finalDriftScore);

    const contributing_signals = {
      baselineConsistency,
      vaultActivity,
      aiIndependence,
      journalRegularity,
    };

    const comparison_vs_baseline = {
      vocabulary_richness_delta: parseFloat((calVocabRichness - avgBaselineVocab).toFixed(3)),
      avg_sentence_length_delta: parseFloat((calAvgSentLen - avgBaselineSentLen).toFixed(2)),
      word_count: calWords,
    };

    // ── 5. Update calibration session ──────────────────────────────────────
    const nextSessionDue = new Date();
    nextSessionDue.setDate(nextSessionDue.getDate() + 14);

    const { error: calError } = await supabase
      .from("calibration_sessions")
      .update({
        status: "completed",
        drift_score_produced: finalDriftScore,
        comparison_vs_baseline,
        completed_at: new Date().toISOString(),
        next_session_due: nextSessionDue.toISOString(),
      })
      .eq("id", sessionId);

    if (calError) {
      console.error("Error updating calibration session:", calError);
      return NextResponse.json({ error: "Failed to update calibration session" }, { status: 500 });
    }

    // ── 6. Insert drift_scores ──────────────────────────────────────────────
    const deltaFromPrevious = prevDriftData.data
      ? finalDriftScore - prevDriftData.data.score
      : null;

    const now = new Date();
    const { error: driftError } = await supabase.from("drift_scores").insert({
      user_id: user.id,
      score: finalDriftScore,
      score_label,
      calibration_session_id: sessionId,
      delta_from_previous: deltaFromPrevious,
      contributing_signals,
      week_number: getWeekNumber(now),
      year: now.getFullYear(),
    });

    if (driftError) {
      console.error("Error inserting drift score:", driftError);
      return NextResponse.json({ error: "Failed to save drift score" }, { status: 500 });
    }

    // ── 7. Recalculate IMPRINT Score ────────────────────────────────────────
    // Fetch extra data we need
    const [allVaultData, allJournalData, allMirrorData] = await Promise.all([
      supabase.from("skill_vault").select("strength_level").eq("user_id", user.id),
      supabase.from("journal_entries").select("created_at").eq("user_id", user.id),
      supabase.from("mirror_sessions").select("dependency_flags").eq("user_id", user.id),
    ]);

    const avgSkillStrength =
      allVaultData.data?.length
        ? allVaultData.data.reduce((s, v) => s + v.strength_level, 0) / allVaultData.data.length
        : 0;

    const calibrationsCompleted = (calData.data?.length ?? 0) + 1; // +1 for current

    const allJournalDays = new Set(
      (allJournalData.data || []).map((j) => new Date(j.created_at).toDateString())
    ).size;

    const totalDependencyFlags = (allMirrorData.data || []).reduce(
      (s, m) => s + (m.dependency_flags || 0), 0
    );

    const imprintScore = Math.max(
      0,
      Math.min(
        1000,
        Math.round(
          avgSkillStrength * 2.5 +
          Math.min(calibrationsCompleted * 50, 300) +
          Math.min(allJournalDays * 8, 250) +
          Math.max(200 - totalDependencyFlags * 5, 0)
        )
      )
    );

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ imprint_score: imprintScore })
      .eq("id", user.id);

    if (profileError) {
      console.error("Error updating imprint score:", profileError);
      // Non-fatal — continue
    }

    return NextResponse.json({
      score: finalDriftScore,
      scoreLabel: score_label,
      delta: deltaFromPrevious,
      signals: contributing_signals,
      nextSessionDue: nextSessionDue.toISOString(),
    });
  } catch (error) {
    console.error("Calibration complete error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
