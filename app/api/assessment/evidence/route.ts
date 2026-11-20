import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findRoleTrack, getRoleTasks } from "@/lib/assessment/catalog";
import { isRoleScoringEnabled } from "@/lib/assessment/pilot";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const imageTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const voiceTypes: Record<string, string> = {
  "audio/webm": "webm", "video/webm": "webm", "audio/ogg": "ogg",
  "audio/mp4": "m4a", "video/mp4": "mp4", "audio/mpeg": "mp3", "audio/wav": "wav",
};

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to upload evidence." }, { status: 401 });
  const body = await request.formData().catch(() => null);
  const taskId = body?.get("taskId");
  const attemptId = z.uuid().safeParse(body?.get("attemptId"));
  const file = body?.get("file");
  if (!attemptId.success || typeof taskId !== "string" || !(file instanceof File) || !file.size || file.size > 4000000) {
    return NextResponse.json({ error: "Choose a supported file under 4 MB." }, { status: 400 });
  }

  const { data: attempt, error: lookupError } = await supabase.from("role_assessments")
    .select("role_id,rubric_version,form,status")
    .eq("id", attemptId.data).eq("user_id", user.id).maybeSingle();
  const role = findRoleTrack(attempt?.role_id);
  const task = role && attempt && getRoleTasks(role, attempt.form).find((record) => record.id === taskId);
  if (lookupError || !attempt || !role || !task || attempt.status !== "draft" ||
      role.version !== attempt.rubric_version || !isRoleScoringEnabled(role.id)) {
    return NextResponse.json({ error: "This task is unavailable." }, { status: 404 });
  }

  const fileType = file.type.split(";")[0];
  const extension = task.mode === "image" ? imageTypes[fileType] : task.mode === "voice" ? voiceTypes[fileType] : undefined;
  if (!extension) return NextResponse.json({ error: "This file format is unavailable for the task." }, { status: 400 });
  const path = `${user.id}/${attemptId.data}/${taskId}-${randomUUID()}.${extension}`;
  const { error } = await createAdminClient().storage.from("assessment-evidence")
    .upload(path, file, { contentType: fileType, upsert: false });
  if (error) return NextResponse.json({ error: "The upload failed. Please retry." }, { status: 503 });
  return NextResponse.json({ path });
}
