import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewerAllowed } from "@/lib/assessment/pilot";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { criterionScore, overallScore, type CriterionScore } from "@/lib/assessment/rules";

const correction = z.object({
  taskId: z.string().max(100), rating: z.number().int().min(0).max(4),
  evidence: z.string().trim().min(3).max(750), feedback: z.string().trim().min(3).max(750),
});

const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), id: z.uuid(), reason: z.string().trim().min(12).max(1200) }),
  z.object({ action: z.literal("resolve"), id: z.uuid(), resolution: z.string().trim().min(12).max(1200), correction: correction.optional() }),
]);

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to request a review." }, { status: 401 });
    const result = input.safeParse(await request.json().catch(() => null));
    if (!result.success) return NextResponse.json({ error: "Describe what should be reviewed." }, { status: 400 });
    const admin = createAdminClient();
    if (result.data.action === "request") {
      const { data, error } = await supabase.from("role_assessments").select("id")
        .eq("id", result.data.id).eq("user_id", user.id).eq("status", "scored").maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Assessment unavailable." }, { status: 404 });
      const saved = await admin.from("assessment_review_requests").insert({
        user_id: user.id, assessment_id: data.id, reason: result.data.reason,
      });
      if (saved.error?.code === "23505") return NextResponse.json({ error: "A review already exists for this assessment." }, { status: 409 });
      if (saved.error) throw saved.error;
    } else {
      if (!reviewerAllowed(user.id)) return NextResponse.json({ error: "Review unavailable." }, { status: 404 });
      const input = result.data;
      let revised: Record<string, unknown> | null = null;
      let score: number | null = null;
      if (input.correction) {
        const { data: appeal, error } = await admin.from("assessment_review_requests").select("assessment_id,user_id")
          .eq("id", input.id).neq("user_id", user.id).is("resolved_at", null).maybeSingle();
        if (error) throw error;
        if (!appeal) return NextResponse.json({ error: "Review unavailable." }, { status: 404 });
        const { data: assessment, error: lookupError } = await admin.from("role_assessments").select("results")
          .eq("id", appeal.assessment_id).eq("user_id", appeal.user_id).eq("status", "scored").single();
        if (lookupError) throw lookupError;
        const patch = input.correction;
        const criteria = assessment.results.criteria as CriterionScore[];
        if (!criteria.some(({ taskId }) => taskId === patch.taskId)) return NextResponse.json({ error: "Choose a criterion from this assessment." }, { status: 400 });
        const amended = criteria.map((criterion) => criterion.taskId !== patch.taskId ? criterion : {
          ...criterion, rubricRating: patch.rating, score: criterionScore(patch.rating, criterion.objectiveCheck),
          evidence: patch.evidence, feedback: patch.feedback,
        });
        score = overallScore(amended);
        revised = { ...assessment.results, criteria: amended, score };
      }
      const { error } = await admin.rpc("resolve_assessment_review", {
        p_review: input.id, p_reviewer: user.id, p_reason: input.resolution, p_score: score, p_results: revised,
      });
      if (error?.code === "P0001") return NextResponse.json({ error: error.message }, { status: 409 });
      if (error) throw error;
    }
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "The review could not be saved. Try again." }, { status: 503 });
  }
}
