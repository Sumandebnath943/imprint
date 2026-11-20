import { NextResponse } from "next/server";
import { z } from "zod";
import { countWords } from "@/lib/forge/types";
import { createClient } from "@/lib/supabase/server";
import type { CalibrationPrompt } from "@/lib/calibration/types";

const progressSchema = z.object({
  sessionId: z.uuid(),
  version: z.number().int().min(0),
  responses: z.array(z.object({
    promptId: z.string().max(40),
    content: z.string().max(16000),
    responseTimeSeconds: z.number().int().min(0).max(86400),
    recordedAt: z.iso.datetime(),
  })).max(20),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to save your progress." }, { status: 401 });
  const parsed = progressSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid saved responses." }, { status: 400 });

  const { sessionId, version, responses } = parsed.data;
  const { data: session, error: lookupError } = await supabase.from("calibration_sessions")
    .select("prompts").eq("id", sessionId).eq("user_id", user.id).eq("status", "in_progress").maybeSingle();
  if (lookupError || !session) return NextResponse.json({ error: "Calibration is not open." }, { status: 409 });
  const prompts = session.prompts as CalibrationPrompt[];
  if (new Set(responses.map((response) => response.promptId)).size !== responses.length ||
      responses.some((response) => !prompts.some((prompt) => prompt.id === response.promptId))) {
    return NextResponse.json({ error: "Responses do not match this calibration." }, { status: 400 });
  }

  const { data, error } = await supabase.from("calibration_sessions")
    .update({
      responses: responses.map((response) => ({ ...response, wordCount: countWords(response.content) })),
      updated_at: new Date().toISOString(),
      progress_version: version + 1,
    })
    .eq("id", sessionId).eq("user_id", user.id).eq("status", "in_progress").eq("progress_version", version)
    .select("progress_version").maybeSingle();
  if (error) return NextResponse.json({ error: "Could not save progress." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "This calibration changed. Reload to resume the saved version." }, { status: 409 });
  return NextResponse.json({ version: data.progress_version });
}
