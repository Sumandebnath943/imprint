import { NextResponse } from "next/server";
import { z } from "zod";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { EVALUATOR_VERSION, scoreHistoricalEvidence } from "@/lib/assessment/evaluate";
import { aiMedia } from "@/lib/ai/providers";
import { historicalCriteria } from "@/lib/assessment/historical";
import { ASSESSMENT_CONSENT_VERSION } from "@/lib/assessment/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { reviewerAllowed } from "@/lib/assessment/pilot";
import { hasConfirmedAdultAge } from "@/lib/auth/eligibility";

export const maxDuration = 60;

const decision = z.object({
  id: z.uuid(), decision: z.enum(["approve", "inconclusive"]),
  note: z.string().trim().min(12).max(700),
  dateCorroborated: z.boolean().default(false),
  attributionCorroborated: z.boolean().default(false),
  comparableConditions: z.boolean().default(false),
});


export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !hasConfirmedAdultAge(user) || !reviewerAllowed(user.id)) return NextResponse.json({ error: "Not available." }, { status: 404 });
    const parsed = decision.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Record the review decision and evidence checked." }, { status: 400 });
    const input = parsed.data;
    const admin = createAdminClient();
    const { data: sample, error } = await admin.from("historical_evidence").select("*")
      .eq("id", input.id).eq("status", "pending").maybeSingle();
    if (error) throw error;
    if (!sample || sample.user_id === user.id) return NextResponse.json({ error: "Sample is unavailable for independent review." }, { status: 404 });

    const role = findRoleTrack(sample.role_id);
    const criterion = role && historicalCriteria(role).find((item) => item.id === sample.criterion_id);
    if (!role || !criterion || role.version !== sample.rubric_version) return NextResponse.json({ error: "Sample needs current eligibility." }, { status: 409 });
    if (input.decision === "approve" && sample.consent_version !== ASSESSMENT_CONSENT_VERSION) {
      return NextResponse.json({ error: "The author must renew consent before scoring." }, { status: 409 });
    }

    let score: number | null = null;
    let model: string | null = null;
    if (input.decision === "approve") {
      if (!input.dateCorroborated || !input.attributionCorroborated || !input.comparableConditions) {
        return NextResponse.json({ error: "Corroborate date and authorship, and check the comparison conditions." }, { status: 422 });
      }
      const { data: { user: author }, error: authorError } = await admin.auth.admin.getUserById(sample.user_id);
      if (authorError) throw authorError;
      if (!author || !hasConfirmedAdultAge(author)) {
        return NextResponse.json({ error: "The author must confirm age eligibility before scoring." }, { status: 409 });
      }
      let image: Awaited<ReturnType<typeof aiMedia>> | undefined;
      if (sample.file_path) {
        const attachment = await admin.storage.from("assessment-evidence").download(sample.file_path);
        if (attachment.error || !attachment.data) throw new Error("Attachment unavailable");
        image = await aiMedia(attachment.data);
      }
      const result = await scoreHistoricalEvidence(role, {
        task: "Apply the shared criterion to this earlier work. Only score visible features of the artifact.",
        criterion: criterion.evidence, source: sample.content ?? "", image,
      });
      if (result) { score = result.rating * 25; model = result.model; }
    }

    const status = score === null ? "inconclusive" : "approved";
    const { data: saved, error: updateError } = await admin.from("historical_evidence").update({
      status, score, model: score === null ? null : model, evaluator: score === null ? null : EVALUATOR_VERSION,
      reviewed_at: new Date().toISOString(), review_note: input.note,
    }).eq("id", sample.id).eq("status", "pending").select("id").maybeSingle();
    if (updateError) throw updateError;
    if (!saved) return NextResponse.json({ error: "This sample changed during review." }, { status: 409 });
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ error: "The evidence review could not be saved. Please retry." }, { status: 503 });
  }
}
