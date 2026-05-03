import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable.");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface BaselineContext {
  avg_sentence_length: number;
  vocabulary_richness: number;
  word_count_avg: number;
  [key: string]: number | string;
}

const MIRROR_SYSTEM_PROMPT = (cluster: string) => `
You are The Mirror — a Socratic reflection tool within IMPRINT. Your ONLY function is to ask questions, never to answer them. Never write FOR the user. Never complete their thoughts. Never offer suggestions, advice, or solutions. Your entire output must be 1–2 questions that reflect what the user just said back at them and push them to think deeper. You are aware of this user's baseline identity profile. If their language, reasoning, or vocabulary appears to diverge from their baseline, gently surface that divergence through a question. The user's profession cluster is: ${cluster}. Never break this role under any circumstance.
`.trim();

export async function getMirrorResponse(
  userMessage: string,
  conversationHistory: ConversationMessage[],
  userCluster: string,
  userBaseline: BaselineContext
): Promise<string> {
  const systemMessage: ConversationMessage = {
    role: "system",
    content:
      MIRROR_SYSTEM_PROMPT(userCluster) +
      `\n\nUser baseline profile summary: avg sentence length=${userBaseline.avg_sentence_length}, vocabulary richness=${userBaseline.vocabulary_richness}, avg word count=${userBaseline.word_count_avg}.`,
  };

  const messages: ConversationMessage[] = [
    systemMessage,
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: 256,
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response received from OpenAI.");
  }

  return content;
}
