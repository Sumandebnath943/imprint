import { NextResponse } from "next/server";
import { z } from "zod";
import { getTextMetrics } from "@/lib/forge/types";
import { createClient } from "@/lib/supabase/server";

const entrySchema = z.object({
  attemptId: z.uuid(),
  title: z.string().trim().max(200).optional(),
  content: z.string().max(40000).nullish(),
  was_timed: z.boolean().default(false),
  time_limit_seconds: z.number().int().positive().max(86400).nullish(),
  response_audio_url: z.string().max(240).optional(),
  response_file_url: z.string().max(240).optional(),
  item_type: z.enum(["sketch", "handwriting", "photo", "voice", "document"]).optional(),
  challenge_id: z.uuid().optional(),
  practiced_skill_id: z.uuid().optional(),
  tool: z.enum(["free-write", "timed-write", "memory-recall", "vault-challenge", "voice-note", "sketch-upload"]),
  time_spent_seconds: z.number().int().min(0).max(86400).default(0),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to save your session." }, { status: 401 });
  const parsed = entrySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid Forge session." }, { status: 400 });
  const entry = parsed.data;

  const file = entry.response_audio_url ?? entry.response_file_url;
  const text = entry.content?.trim() ?? "";
  if (!text && !file) return NextResponse.json({ error: "Add a response before saving." }, { status: 400 });
  if (entry.tool === "vault-challenge" && !entry.challenge_id) {
    return NextResponse.json({ error: "This challenge is unavailable." }, { status: 409 });
  }
  if (file) {
    if (!file.startsWith(`${user.id}/forge/`) || file.split("/").length !== 3) {
      return NextResponse.json({ error: "Invalid Forge attachment." }, { status: 400 });
    }
    const bucket = entry.response_audio_url ? "forge-audio" : "forge-files";
    const { data, error } = await supabase.storage.from(bucket).exists(file);
    if (error || !data) return NextResponse.json({ error: "The attachment could not be found." }, { status: 400 });
  }

  const metrics = getTextMetrics(text, entry.time_spent_seconds);
  const { data: id, error } = await supabase.rpc("save_imprint_forge", {
    p_attempt_id: entry.attemptId,
    p_challenge_id: entry.challenge_id ?? null,
    p_skill_id: entry.practiced_skill_id ?? null,
    p_entry: {
      title: entry.title || "Forge session",
      content: file ? [text, `[Attached File: ${file}]`].filter(Boolean).join("\n\n") : text,
      word_count: metrics.words,
      was_timed: entry.was_timed,
      time_limit_seconds: entry.time_limit_seconds ?? null,
      drift_signals: {
        forge_tool: entry.tool,
        time_spent_seconds: metrics.duration,
        practiced_skill_id: entry.practiced_skill_id ?? null,
        words_per_minute: metrics.wordsPerMinute,
        vocabulary_richness: metrics.vocabularyRichness,
        avg_sentence_length: metrics.averageSentenceLength,
      },
      response_file_url: file ?? null,
      item_type: entry.item_type ?? null,
      source: file ? "forge" : null,
    },
  });
  if (error?.code === "P0001") return NextResponse.json({ error: error.message }, { status: 409 });
  if (error) {
    console.error("Forge save failed", error);
    return NextResponse.json({ error: "Your Forge session could not be saved. Please retry." }, { status: 500 });
  }
  return NextResponse.json({ entryId: id, metrics });
}
