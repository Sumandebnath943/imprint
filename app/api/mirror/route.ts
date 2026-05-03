import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

    const body = await req.json();
    const {
      message,
      conversationHistory = [],
      sessionContext = "Something Else",
      userCluster = "life_personal",
      baselineSummary = { avgWordCount: 300, vocabularyRichness: 0.6, avgSentenceLength: 15, commonPhrases: [], writingStyle: "thoughtful" },
      dependencyFlagCount = 0,
      mode = "question", // "question" | "summary"
    } = body;

    // Rate limit: max 60 messages
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
