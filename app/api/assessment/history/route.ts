import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { historicalCriteria } from "@/lib/assessment/historical";
import { isRoleScoringEnabled } from "@/lib/assessment/pilot";
import { ASSESSMENT_CONSENT_VERSION } from "@/lib/assessment/rules";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const intake = z.object({
  roleId: z.string().max(80),
  criterionId: z.string().max(100),
  workDate: z.iso.date(),
  priorPeriodEnd: z.iso.date(),
  sourceUrl: z.url().max(600).refine((value) => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  }),
  contribution: z.string().trim().min(8).max(450),
  toolContext: z.string().trim().min(3).max(450),
  consent: z.literal("yes"),
  consentVersion: z.literal(ASSESSMENT_CONSENT_VERSION),
  content: z.string().trim().max(10000).default(""),
});
const imageTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const error = (message: string, status: number) => NextResponse.json({ error: message }, { status });

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return error("Sign in to save earlier work.", 401);
    const body = await request.formData().catch(() => null);
    if (!body) return error("Choose the earlier work you want reviewed.", 400);
    const parsed = intake.safeParse(Object.fromEntries(body.entries()));
    if (!parsed.success) return error("Provide dates, a source, your contribution, and permission to review.", 400);
    const input = parsed.data;
    const today = new Date().toISOString().slice(0, 10);
    if (input.workDate >= input.priorPeriodEnd || input.priorPeriodEnd > today) {
      return error("Choose a work date earlier than the end of your comparison period.", 400);
    }

    const role = findRoleTrack(input.roleId);
    const criterion = role && historicalCriteria(role).find((item) => item.id === input.criterionId);
    if (!role || !criterion || !isRoleScoringEnabled(role.id)) return error("This skill is unavailable for historical review.", 404);
    const { data: baseline, error: lookupError } = await supabase.from("role_assessments")
      .select("id").eq("user_id", user.id).eq("role_id", role.id).eq("rubric_version", role.version)
      .eq("status", "scored").eq("form", 0).maybeSingle();
    if (lookupError) throw lookupError;
    if (!baseline) return error("Complete your current assessment baseline first.", 409);

    const file = body.get("file");
    const attachment = file instanceof File && file.size ? file : undefined;
    let content = input.content;
    let image: File | undefined;
    if (criterion.mode === "image") {
      if (!attachment || attachment.size > 4000000 || !imageTypes[attachment.type]) {
        return error("Choose a JPG, PNG, or WebP image under 4 MB.", 400);
      }
      image = attachment;
    } else if (attachment) {
      if (attachment.size > 55000 || !/\.(txt|md|csv|js|ts)$/i.test(attachment.name)) {
        return error("Choose a supported text file under 55 KB or enter an excerpt.", 400);
      }
      content = (await attachment.text()).trim().slice(0, 10000);
    }
    if (!image && !content) return error("Provide the relevant work excerpt.", 400);
    const digest = createHash("sha256").update(image ? Buffer.from(await image.arrayBuffer()) : content.replace(/\s+/g, " ")).digest("hex");
    const id = randomUUID();
    const admin = createAdminClient();
    const path = image ? `${user.id}/historical/${id}.${imageTypes[image.type]}` : null;
    if (image && path) {
      const uploaded = await admin.storage.from("assessment-evidence").upload(path, image, { contentType: image.type });
      if (uploaded.error) throw uploaded.error;
    }
    const source = new URL(input.sourceUrl);
    source.hash = "";
    const result = await admin.from("historical_evidence").insert({
      id, user_id: user.id, role_id: role.id, rubric_version: role.version, criterion_id: criterion.id,
      work_date: input.workDate, prior_period_end: input.priorPeriodEnd, source_url: source.toString(),
      content: content || null, file_path: path, contribution: input.contribution, tool_context: input.toolContext,
      evidence_hash: digest, consent_version: ASSESSMENT_CONSENT_VERSION,
    });
    if (result.error) {
      if (path) await admin.storage.from("assessment-evidence").remove([path]);
      if (result.error.code === "23505") return error("This source or sample was already submitted for this skill.", 409);
      throw result.error;
    }
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return error("Could not save your earlier work. Please retry.", 503);
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return error("Sign in to remove your earlier work.", 401);
    const parsed = z.object({ id: z.uuid() }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return error("Choose a sample to remove.", 400);
    const row = await supabase.from("historical_evidence").select("file_path")
      .eq("id", parsed.data.id).eq("user_id", user.id).maybeSingle();
    if (row.error) throw row.error;
    if (!row.data) return NextResponse.json({ removed: true });
    const admin = createAdminClient();
    if (row.data.file_path) {
      const removal = await admin.storage.from("assessment-evidence").remove([row.data.file_path]);
      if (removal.error) throw removal.error;
    }
    const deletion = await admin.from("historical_evidence").delete()
      .eq("id", parsed.data.id).eq("user_id", user.id);
    if (deletion.error) throw deletion.error;
    return NextResponse.json({ removed: true });
  } catch {
    return error("Could not remove the earlier work. Please retry.", 503);
  }
}

export async function PATCH(request: Request) {
  try {
    const { data: { user } } = await createClient().auth.getUser();
    if (!user) return error("Sign in to confirm permission for your earlier work.", 401);
    const parsed = z.object({
      id: z.uuid(), consent: z.literal(true), consentVersion: z.literal(ASSESSMENT_CONSENT_VERSION),
    }).safeParse(await request.json().catch(() => null));
    if (!parsed.success) return error("Choose the sample and confirm permission to score it.", 400);
    const saved = await createAdminClient().from("historical_evidence").update({ consent_version: ASSESSMENT_CONSENT_VERSION })
      .eq("id", parsed.data.id).eq("user_id", user.id).eq("status", "pending").select("id").maybeSingle();
    if (saved.error) throw saved.error;
    if (!saved.data) return error("That pending sample is unavailable.", 404);
    return NextResponse.json({ renewed: true });
  } catch {
    return error("Could not confirm permission for the sample. Please retry.", 503);
  }
}
