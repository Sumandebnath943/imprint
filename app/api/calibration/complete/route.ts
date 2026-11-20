import { NextResponse } from "next/server";
import { z } from "zod";
import type { CalibrationPrompt, CalibrationResponse } from "@/lib/calibration/types";
import { getTextMetrics } from "@/lib/forge/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const completionSchema = z.object({ sessionId: z.uuid() });

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to finish calibration." }, { status: 401 });
    const parsed = completionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid session." }, { status: 400 });

    const { sessionId } = parsed.data;
    const { data: session, error: sessionError } = await supabase.from("calibration_sessions")
      .select("*").eq("id", sessionId).eq("user_id", user.id).maybeSingle();
    if (sessionError || !session) return NextResponse.json({ error: "Calibration could not be found." }, { status: 404 });

    const admin = createAdminClient();
    if (session.status === "completed") {
      const { data: saved, error } = await supabase.from("drift_scores").select("*")
        .eq("user_id", user.id).eq("calibration_session_id", sessionId)
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (saved) return NextResponse.json({
        score: saved.score, scoreLabel: saved.score_label,
        delta: session.comparison_vs_baseline?.delta ?? null,
        signals: saved.contributing_signals, nextSessionDue: session.next_session_due,
      });
    }

    const prompts = session.prompts as CalibrationPrompt[];
    const responses = session.responses as CalibrationResponse[];
    if (!prompts.length || prompts.some((prompt) => !responses.some((response) =>
      response.promptId === prompt.id && getTextMetrics(response.content, 0).words >= (prompt.minWords ?? 1)))) {
      return NextResponse.json({ error: "Save an answer to every calibration task first." }, { status: 409 });
    }

    const cutoff = new Date(Date.now() - 14 * 86400000).toISOString();
    const [baseline, vault, journal, prior, profile] = await Promise.all([
      supabase.from("baseline_imprints").select("module_id,response_text,created_at")
        .eq("user_id", user.id).eq("response_type", "text").order("created_at", { ascending: false }),
      supabase.from("skill_vault").select("last_exercised,times_practiced").eq("user_id", user.id),
      supabase.from("journal_entries").select("created_at").eq("user_id", user.id).gte("created_at", cutoff),
      supabase.from("calibration_sessions").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("status", "completed"),
      supabase.from("profiles").select("imprint_score").eq("id", user.id).single(),
    ]);
    for (const result of [baseline, vault, journal, prior, profile]) if (result.error) throw result.error;

    const distances = prompts.flatMap((prompt) => {
      const original = baseline.data?.find((row) => row.module_id === prompt.moduleId && row.response_text);
      const response = responses.find((answer) => answer.promptId === prompt.id);
      if (!original?.response_text || !response) return [];
      const a = getTextMetrics(original.response_text, 0);
      const b = getTextMetrics(response.content, 0);
      if (!a.words || !b.words) return [];
      return [Math.min(100, 50 * (Math.abs(b.vocabularyRichness - a.vocabularyRichness) / a.vocabularyRichness +
        Math.abs(b.averageSentenceLength - a.averageSentenceLength) / a.averageSentenceLength))];
    });
    if (!distances.length) {
      return NextResponse.json({ error: "There are no comparable legacy text responses for this session." }, { status: 422 });
    }

    const baselineDivergence = Math.round(distances.reduce((sum, value) => sum + value, 0) / distances.length);
    const skills = vault.data ?? [];
    const active = skills.filter((skill) => skill.times_practiced > 0 && skill.last_exercised >= cutoff).length;
    const vaultInactivity = skills.length ? Math.round(100 * (1 - active / skills.length)) : 50;
    const journalDays = new Set(journal.data?.map((entry) => entry.created_at.slice(0, 10))).size;
    const journalIrregularity = Math.round(Math.max(0, 100 * (1 - journalDays / 14)));
    const score = Math.round((baselineDivergence * 40 + vaultInactivity * 25 + journalIrregularity * 15) / 80);
    const scoreLabel = score < 40 ? "anchored" : score < 60 ? "drifting" : score < 80 ? "critical" : "crisis";
    const nextSessionDue = new Date(Date.now() + 14 * 86400000).toISOString();

    const { data, error } = await admin.rpc("finish_imprint_calibration", {
      p_user_id: user.id, p_session_id: sessionId, p_version: session.progress_version,
      p_result: {
        score, scoreLabel, nextSessionDue,
        signals: {
          baseline_divergence: baselineDivergence, vault_inactivity: vaultInactivity,
          journal_irregularity: journalIrregularity, methodology: "legacy-text-v2",
        },
      },
      p_comparison: { matched_modules: distances.length },
      p_imprint: profile.data?.imprint_score ?? 0,
    });
    if (error?.code === "P0001") return NextResponse.json({ error: error.message }, { status: 409 });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Calibration completion failed", error);
    return NextResponse.json({ error: "Your comparison could not be scored. Your responses are saved." }, { status: 500 });
  }
}
