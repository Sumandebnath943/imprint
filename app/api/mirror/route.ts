import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { rateLimit } from "@/lib/api/rate-limit";
import { describeWritingStyle } from "@/lib/mirror/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// gpt-4o is billed per call, so cap how fast one account can drive it.
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 5 * 60_000;

const MAX_MESSAGE_CHARS = 4000;
const MAX_CONTEXT_CHARS = 120;

const MessageSchema = z.object({
  role: z.string().max(20),
  content: z.string().max(MAX_MESSAGE_CHARS),
});

const MirrorRequestSchema = z.object({
  message: z.string().max(MAX_MESSAGE_CHARS).optional().default(""),
  conversationHistory: z.array(MessageSchema).max(120).optional().default([]),
  sessionContext: z.string().max(MAX_CONTEXT_CHARS).optional().default("Something Else"),
  dependencyFlagCount: z.number().int().min(0).max(999).optional().default(0),
  mode: z.enum(["question", "summary"]).optional().default("question"),
});

/**
 * The session context is user-authored free text that lands inside the system
 * prompt, so strip the characters and phrases used to escape a prompt or issue
 * a competing instruction. Cheap defence, but it removes the obvious lever.
 */
function sanitizeContext(raw: string): string {
  return raw
    .replace(/[\r\n]+/g, " ")
    .replace(/[`{}<>#*_[\]]/g, "")
    .replace(/\b(ignore|disregard|forget|override|system prompt|you are now|new instructions?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_CONTEXT_CHARS) || "open reflection";
}

const DEPENDENCY_TRIGGERS = [
  "tell me", "should i", "what should", "recommend", "advise",
  "decide for me", "what would you do", "what do you think i should",
  "help me decide", "can you write", "draft me", "what is",
  "how does", "what do you think",
];

function detectDependency(message: string): boolean {
  const lower = message.toLowerCase();
  return DEPENDENCY_TRIGGERS.some((t) => lower.includes(t));
}

function buildSystemPrompt(
  sessionContext: string,
  userCluster: string,
  baselineSummary: {
    avgWordCount: number;
    vocabularyRichness: number;
    avgSentenceLength: number;
    commonPhrases: string[];
    writingStyle: string;
  },
  dependencyFlagCount: number
): string {
  return `You are The Mirror — a Socratic reflection tool within IMPRINT, an identity preservation engine.

YOUR IDENTITY:
You are not an assistant. You are not a chatbot. You are a mirror. You reflect thinking back at the human in front of you and help them discover what they actually think.

YOUR ONLY FUNCTION:
Ask 1–2 questions per response. That is all.
Never answer questions.
Never offer solutions, advice, or recommendations.
Never write content for the user.
Never complete their thoughts.
Never validate or invalidate their views (simply reflect them).
Never say 'Great point' or 'That's interesting.'
Never use filler phrases.

HOW YOU QUESTION:
Your questions must:
- Come directly from what the user just said
- Push one level deeper than their last statement
- Be specific, not generic
- Be uncomfortable when necessary
- Never be yes/no questions
- End with a '?' — always

BASELINE AWARENESS:
This user's baseline profile:
- Cluster: ${userCluster}
- Avg vocabulary richness: ${baselineSummary.vocabularyRichness}
- Typical sentence length: ${baselineSummary.avgSentenceLength} words
- Writing style: ${baselineSummary.writingStyle}

If the user's current language, reasoning depth, or vocabulary diverges significantly from this baseline, surface it through a question:
'You usually [describe baseline trait]. Right now you seem to be [current pattern]. What's behind that shift?'

DEPENDENCY DETECTION:
If the user asks you to make a decision, recommend something, or tell them what to do:
Do not comply.
Respond ONLY with a question that redirects to their own judgment:
'What does your own instinct say about this?'
'If you already knew the answer, what would it be?'
'What would you tell someone else facing this exact choice?'
Current dependency flag count: ${dependencyFlagCount}
${dependencyFlagCount >= 3 ? "Begin response with a brief observation about this pattern, then ask one question." : ""}

CONTEXT:
The user is reflecting on: ${sessionContext}

RESPONSE FORMAT:
- Maximum 3 sentences
- Always ends with a question mark
- No bullet points, no lists, no headers
- No preamble ('I hear you', 'That's a great thought')
- Just the reflection and the question
- Thoughtful, unhurried tone`;
}

export async function POST(req: NextRequest) {
  try {
    // Auth check via Supabase
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limit = rateLimit(`mirror:${user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          response: "You're moving faster than reflection allows. Take a breath and come back in a moment.",
          dependencyFlagged: false,
          rateLimited: true,
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const parsed = MirrorRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { response: "That message couldn't be read. Try rephrasing it.", dependencyFlagged: false, error: true },
        { status: 400 }
      );
    }

    const { message, conversationHistory, dependencyFlagCount, mode } = parsed.data;
    const sessionContext = sanitizeContext(parsed.data.sessionContext);

    // The cluster and baseline shape the system prompt, so read them from the
    // database rather than the request body. Previously the client supplied
    // both, which let a user fabricate their own baseline — and the Mirror's
    // whole purpose is to compare against a baseline they cannot edit.
    const [{ data: profile }, { data: baselines }] = await Promise.all([
      supabase.from("profiles").select("profession_cluster").eq("id", user.id).single(),
      supabase
        .from("baseline_imprints")
        .select("word_count, vocabulary_richness, avg_sentence_length")
        .eq("user_id", user.id),
    ]);

    const rows = baselines ?? [];
    const avg = (pick: (r: (typeof rows)[number]) => number | null, fallback: number) =>
      rows.length > 0
        ? rows.reduce((s, r) => s + (pick(r) ?? fallback), 0) / rows.length
        : fallback;

    const userCluster = profile?.profession_cluster ?? "life_personal";
    const vocabularyRichness = Number(avg((r) => r.vocabulary_richness, 0.6).toFixed(3));
    const avgSentenceLength = Number(avg((r) => r.avg_sentence_length, 15).toFixed(1));

    const baselineSummary = {
      avgWordCount: Math.round(avg((r) => r.word_count, 300)),
      vocabularyRichness,
      avgSentenceLength,
      commonPhrases: [] as string[],
      // Derived from the user's own metrics rather than the constant that
      // stood in here, so the prompt describes this person and not everyone.
      writingStyle:
        rows.length > 0
          ? describeWritingStyle(avgSentenceLength, vocabularyRichness)
          : "thoughtful and considered",
    };

    // Session length cap — keeps a single reflection from running forever.
    if (conversationHistory.length > 60) {
      return NextResponse.json({
        response: "Sessions have a 60 message limit. This keeps the reflection meaningful. End this session and reflect on what you've discovered.",
        dependencyFlagged: false,
      });
    }

    const isDependency = mode === "question" ? detectDependency(message) : false;
    const systemPrompt = buildSystemPrompt(sessionContext, userCluster, baselineSummary, dependencyFlagCount);

    // Build messages for OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      // Include last 20 messages for context
      ...conversationHistory.slice(-20).map((m: { role: string; content: string }) => ({
        role: (m.role === "mirror" ? "assistant" : m.role === "system" ? "system" : "user") as "assistant" | "user" | "system",
        content: m.content,
      })),
    ];

    if (mode === "question") {
      messages.push({ role: "user", content: message });
    } else {
      // Summary mode — different prompt
      messages.push({
        role: "user",
        content: `In 2–3 sentences, summarize the themes this person explored and 1 question they might want to sit with. Be specific to what they actually said. Do not give advice. End with a question.`,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 200,
      temperature: 0.85,
    });

    const response = completion.choices[0]?.message?.content ?? "What comes to mind when you sit with that for a moment?";

    return NextResponse.json({ response, dependencyFlagged: isDependency });
  } catch (err) {
    console.error("[Mirror API]", err);
    return NextResponse.json(
      { response: "The Mirror is momentarily unavailable. Your thoughts are still here.", dependencyFlagged: false, error: true },
      { status: 200 } // 200 so client shows graceful message rather than HTTP error
    );
  }
}
