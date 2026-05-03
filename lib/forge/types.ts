// Forge — shared types

export type ForgeTool =
  | "free-write"
  | "timed-write"
  | "vault-challenge"
  | "voice-note"
  | "sketch-upload"
  | "memory-recall";

export type ForgeSessionState = "idle" | "active" | "complete";

export interface ForgeSession {
  tool: ForgeTool;
  startTime: number;
  content: string;
  wordCount: number;
  elapsed: number; // seconds
  timerDuration: number; // seconds (0 = free write)
  memoryTopic?: string;
  audioBlob?: Blob;
  audioUrl?: string;
  fileBlob?: File;
  filePreviewUrl?: string;
}

export interface ForgeHistoryEntry {
  id: string;
  created_at: string;
  tool: string;
  word_count: number;
  time_spent_seconds: number;
  drift_signals?: {
    vocabulary_match?: number;
    sentence_rhythm_delta?: number;
    wpm?: number;
    vs_baseline_score?: number;
  };
}

export interface ForgeChallenge {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  skill_name?: string;
}

export interface ForgeUserData {
  userId: string;
  professionCluster: string;
  baselineWordCount: number;
  baselineVocabRichness: number;
  baselineSentenceLength: number;
  activeChallenge: ForgeChallenge | null;
  history: ForgeHistoryEntry[];
}

export const MEMORY_TOPICS: Record<string, string[]> = {
  language_voice: [
    "Explain a writing technique",
    "Name 5 influential works",
    "Describe your editing process",
    "What makes great prose?",
    "Custom topic",
  ],
  technical_analytical: [
    "Explain an algorithm",
    "Walk through a system design",
    "Describe a debugging approach",
    "Explain a data concept",
    "Custom topic",
  ],
  visual_creative: [
    "Describe your design process",
    "Explain a visual principle",
    "Describe a creative project",
    "What inspires your work?",
    "Custom topic",
  ],
  human_social: [
    "Explain a core concept in your field",
    "Describe how you handle a difficult case",
    "Describe your methodology",
    "What is your approach?",
    "Custom topic",
  ],
  leadership_strategy: [
    "Describe a key decision you made",
    "Explain your leadership approach",
    "Walk through a strategy you used",
    "What principles guide you?",
    "Custom topic",
  ],
  life_personal: [
    "Describe something you know deeply",
    "Walk through a skill you've built",
    "Explain something you've learned",
    "Describe a value you live by",
    "Custom topic",
  ],
};

export function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function calcWPM(words: number, seconds: number): number {
  if (seconds < 1) return 0;
  return Math.round((words / seconds) * 60);
}

export function getTimerColor(remaining: number): string {
  if (remaining > 300) return "#FFFFFF";
  if (remaining > 120) return "#FFB800";
  if (remaining > 60) return "#FF7A30";
  return "#FF2D2D";
}
