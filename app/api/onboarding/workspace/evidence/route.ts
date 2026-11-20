import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/api/rate-limit";
import { loadWorkspace, workspaceAccess } from "@/lib/onboarding/workspace-access";
import { getOnboardingWorkspace } from "@/lib/onboarding/workspace-catalog";
import { workspaceQuestionNumbers } from "@/lib/onboarding/workspace-contract";
import { createAdminClient } from "@/lib/supabase/admin";

const kinds: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "audio/webm": "webm",
  "audio/mp4": "m4a", "audio/wav": "wav", "audio/mpeg": "mp3", "audio/ogg": "ogg", "video/mp4": "mp4", "video/webm": "vwebm" };
const failure = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  try {
    const access = await workspaceAccess();
    if (!access) return failure("Sign in to upload evidence.", 401);
    if (!rateLimit(`workspace-upload:${access.user.id}`, 20, 60000).allowed) return failure("Wait a minute before uploading again.", 429);
    const body = await request.formData().catch(() => null);
    const id = z.uuid().safeParse(body?.get("id"));
    const question = Number(body?.get("question"));
    const file = body?.get("file");
    if (!id.success || ![4, 5, 6, 7].includes(question) || !(file instanceof File) || !file.size || file.size > 4000000) {
      return failure("Choose a supported file under 4 MB.", 400);
    }
    const workspace = await loadWorkspace(access.supabase, access.user.id, access.role.id, id.data);
    if (!workspace || workspace.assessment_id || !workspaceQuestionNumbers(workspace).includes(question)) return failure("This work sample is unavailable.", 404);
    const type = file.type.split(";")[0];
    const ext = kinds[type];
    const kind = getOnboardingWorkspace(access.role.id, question, workspace.form)?.artifact;
    const allowed = kind ? type.startsWith(`${kind}/`) : question === 4 ? type.startsWith("audio/") : question === 7 && /^(audio|image)\//.test(type);
    if (!ext || !allowed) return failure("Use the evidence format requested for this question.", 400);
    const path = `${access.user.id}/${workspace.id}/workspace-${question}-${randomUUID()}.${ext}`;
    const { error } = await createAdminClient().storage.from("assessment-evidence").upload(path, file, { contentType: type, upsert: false });
    if (error) throw error;
    return NextResponse.json({ path });
  } catch {
    return failure("The evidence could not be uploaded. Try again.", 503);
  }
}
