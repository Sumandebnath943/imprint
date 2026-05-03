// Mirror — shared types

export type SessionContext =
  | "My Work"
  | "A Decision"
  | "My Skills"
  | "My Beliefs"
  | "Something Else";

export type MessageRole = "mirror" | "user" | "system";

export interface MirrorMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface MirrorSessionStats {
  questionCount: number;   // mirror messages
  userCount: number;       // user messages
  dependencyFlags: number;
}

export interface BaselineSummary {
  avgWordCount: number;
  vocabularyRichness: number;
  avgSentenceLength: number;
  commonPhrases: string[];
  writingStyle: string;
}

export interface MirrorUserData {
  userId: string;
  userCluster: string;
  baselineSummary: BaselineSummary;
  pastSessions: MirrorPastSession[];
}

export interface MirrorPastSession {
  id: string;
  created_at: string;
  topics: string[];
  ai_question_count: number;
  user_message_count: number;
  dependency_flags: number;
  session_duration_seconds: number;
}

// Opening questions keyed by context
export const OPENING_QUESTIONS: Record<SessionContext, string | null> = {
  "My Work":
    "What aspect of your work has been taking up the most mental space lately — and why do you think that is?",
  "A Decision":
    "What decision are you sitting with — and what would it mean to get it wrong?",
  "My Skills":
    "Which skill of yours feels most at risk of being replaced or forgotten — and what would losing it actually cost you?",
  "My Beliefs":
    "What do you believe right now that you wouldn't have believed five years ago — and what changed?",
  "Something Else": null, // generated via API or fallback
};

export const OPENING_FALLBACK =
  "What's sitting heaviest on your mind right now — not what you think you should be thinking about, but what keeps surfacing on its own?";

export const DEPENDENCY_TRIGGERS = [
  "tell me",
  "should i",
  "what should",
  "recommend",
  "advise",
  "decide for me",
  "what would you do",
  "what do you think i should",
  "help me decide",
  "can you write",
  "draft me",
  "what is",
  "how does",
  "what do you think",
];

export function detectDependency(message: string): boolean {
  const lower = message.toLowerCase();
  return DEPENDENCY_TRIGGERS.some((t) => lower.includes(t));
}

export function calcVocabRichness(messages: MirrorMessage[]): number {
  const text = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join(" ");
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  return parseFloat((new Set(words).size / words.length).toFixed(3));
}

export function calcAvgSentenceLen(messages: MirrorMessage[]): number {
  const text = messages.filter((m) => m.role === "user").map((m) => m.content).join(" ");
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
  const words = text.split(/\s+/).filter(Boolean);
  if (sentences.length === 0) return 0;
  return parseFloat((words.length / sentences.length).toFixed(1));
}

export type IndicatorStatus = "good" | "warn" | "bad";

export function getVocabStatus(current: number, baseline: number): IndicatorStatus {
  if (baseline === 0) return "good";
  const ratio = current / baseline;
  if (ratio >= 0.75) return "good";
  if (ratio >= 0.5) return "warn";
  return "bad";
}

export function getDepthStatus(avgLen: number, baseline: number): IndicatorStatus {
  if (baseline === 0) return "good";
  const ratio = avgLen / baseline;
  if (ratio >= 0.7) return "good";
  if (ratio >= 0.4) return "warn";
  return "bad";
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
