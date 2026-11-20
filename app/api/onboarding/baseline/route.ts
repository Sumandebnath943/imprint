import { NextResponse } from "next/server";
import { z } from "zod";
import { buildModuleList, PROFESSIONS } from "@/lib/onboarding/modules";
import { createClient } from "@/lib/supabase/server";
import { getTextMetrics } from "@/lib/forge/types";

const captureSchema = z.object({
  profession: z.string(),
  moduleId: z.string(),
  mode: z.enum(["text", "audio", "file"]),
  text: z.string().max(16000).default(""),
  path: z.string().max(240).optional(),
  duration: z.number().int().min(0).max(86400),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to save your baseline." }, { status: 401 });
  const parsed = captureSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid baseline response." }, { status: 400 });

  const { profession, moduleId, mode, text, path, duration } = parsed.data;
  const role = PROFESSIONS.find(({ name }) => name === profession);
  const baselineTask = role && buildModuleList(role.cluster).find(({ id }) => id === moduleId);
  if (!baselineTask) return NextResponse.json({ error: "This baseline task is unavailable." }, { status: 400 });
  const modes = baselineTask.id === "FINAL" ? ["text", "audio", "file"] : [
    baselineTask.responseType, ...(baselineTask.allowVoiceAlternative ? ["audio"] : []),
  ];
  if (!modes.includes(mode)) return NextResponse.json({ error: "Invalid response format for this task." }, { status: 400 });

  const metrics = getTextMetrics(mode === "text" ? text : "", duration);
  if (mode !== "text") {
    if (!path?.startsWith(`${user.id}/baseline/${moduleId}.`) || path.split("/").length !== 3) {
      return NextResponse.json({ error: "Upload your response before continuing." }, { status: 400 });
    }
    const bucket = mode === "audio" ? "baseline-audio" : "baseline-files";
    const { data, error } = await supabase.storage.from(bucket).exists(path);
    if (error || !data) return NextResponse.json({ error: "The uploaded response could not be found." }, { status: 400 });
  }

  const minimum = baselineTask.minWords ?? 1;
  const expired = baselineTask.timed && duration >= baselineTask.timed * 60;
  if (mode === "text" && baselineTask.id !== "FINAL" && metrics.words < minimum && !expired) {
    return NextResponse.json({ error: `This task requires at least ${minimum} words.` }, { status: 400 });
  }

  const { error } = await supabase.rpc("save_baseline_capture", {
    p_capture: {
      cluster: baselineTask.cluster,
      module_id: baselineTask.id,
      module_name: baselineTask.name,
      prompt_given: baselineTask.prompt,
      response_text: mode === "text" ? text : null,
      response_audio_url: mode === "audio" ? path : null,
      response_file_url: mode === "file" ? path : null,
      response_type: mode,
      word_count: metrics.words,
      avg_sentence_length: metrics.averageSentenceLength,
      vocabulary_richness: metrics.vocabularyRichness,
      response_time_seconds: duration,
    },
  });
  return error
    ? NextResponse.json({ error: "Your baseline could not be saved. Please retry." }, { status: 500 })
    : NextResponse.json({ success: true });
}
