// Journal — shared types, helpers, and client-side analysis

export type Mood =
  | "Focused" | "Creative" | "Reflective"
  | "Energized" | "Struggling" | "Heavy" | "Neutral";

export const MOOD_COLORS: Record<Mood, string> = {
  Focused:    "#4FC3F7",
  Creative:   "#CE93D8",
  Reflective: "#FFB800",
  Energized:  "#00D97E",
  Struggling: "#FF7A30",
  Heavy:      "#FF5500",
  Neutral:    "rgba(255,255,255,0.30)",
};

export const MOODS: Mood[] = [
  "Focused", "Creative", "Reflective", "Energized",
  "Struggling", "Heavy", "Neutral",
];

export interface DriftSignals {
  vocabulary_match: number;      // 0–100
  sentence_length_delta: number; // current - baseline
  vocabulary_richness: number;   // unique/total
  wpm: number;
  vs_baseline_score: number;     // 0–100
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  word_count: number;
  mood: Mood | null;
  tags: string[];
  is_forge_entry: boolean;
  was_timed: boolean;
  has_ai_assistance: boolean;
  drift_signals: DriftSignals | null;
  created_at: string;
  updated_at: string;
}

export interface BaselineAverages {
  avgWordCount: number;
  avgVocabRichness: number;
  avgSentenceLength: number;
}

export interface JournalPageData {
  userId: string;
  entries: JournalEntry[];
  baseline: BaselineAverages;
}

// ── Streak calculation ────────────────────────────────────────────────────

export function calcStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;
  const dates = new Set(
    entries.map((e) => new Date(e.created_at).toDateString())
  );
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let check = new Date(today);

  while (true) {
    if (dates.has(check.toDateString())) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      // If we haven't written today, streak is still valid from yesterday
      if (check.getTime() === today.getTime()) break;
      break;
    }
  }
  return streak;
}

// ── Entry grouping ────────────────────────────────────────────────────────

export type EntryGroup = "THIS WEEK" | "LAST WEEK" | "EARLIER THIS MONTH" | "OLDER";

export function getEntryGroup(dateStr: string): EntryGroup {
  const d = new Date(dateStr);
  const now = new Date();

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (d >= startOfWeek) return "THIS WEEK";
  if (d >= startOfLastWeek) return "LAST WEEK";
  if (d >= startOfMonth) return "EARLIER THIS MONTH";
  return "OLDER";
}

export function groupEntries(entries: JournalEntry[]): Record<EntryGroup, JournalEntry[]> {
  const groups: Record<EntryGroup, JournalEntry[]> = {
    "THIS WEEK": [], "LAST WEEK": [], "EARLIER THIS MONTH": [], "OLDER": [],
  };
  for (const e of entries) groups[getEntryGroup(e.created_at)].push(e);
  return groups;
}

// ── Relative date label ───────────────────────────────────────────────────

export function relativeDate(isoDate: string): string {
  const d = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Word count ────────────────────────────────────────────────────────────

export function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 200));
}

// ── Drift signal analysis (client-side, no AI) ────────────────────────────

export function analyzeDrift(
  content: string,
  elapsedSeconds: number,
  baseline: BaselineAverages
): DriftSignals {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wc = words.length;
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, "")));
  const vocabRichness = wc > 0 ? uniqueWords.size / wc : 0;

  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentenceLen = sentences.length > 0 ? wc / sentences.length : 0;

  const wpm = elapsedSeconds > 0 ? Math.round((wc / elapsedSeconds) * 60) : 0;

  const vocabMatch = baseline.avgVocabRichness > 0
    ? Math.min(100, Math.round((vocabRichness / baseline.avgVocabRichness) * 100))
    : 100;

  const sentenceDelta = parseFloat((avgSentenceLen - baseline.avgSentenceLength).toFixed(1));

  // vs_baseline_score: weighted average of vocab match and sentence similarity
  const sentenceScore = baseline.avgSentenceLength > 0
    ? Math.min(100, Math.round((1 - Math.abs(sentenceDelta) / baseline.avgSentenceLength) * 100))
    : 100;
  const vsBaselineScore = Math.round((vocabMatch * 0.6 + sentenceScore * 0.4));

  return {
    vocabulary_match: vocabMatch,
    sentence_length_delta: sentenceDelta,
    vocabulary_richness: parseFloat(vocabRichness.toFixed(3)),
    wpm,
    vs_baseline_score: Math.max(0, vsBaselineScore),
  };
}

// ── Export helpers ────────────────────────────────────────────────────────

export function exportAsText(entry: JournalEntry): void {
  const text = `${entry.title ?? "Untitled Entry"}\n${new Date(entry.created_at).toDateString()}\n\n${entry.content ?? ""}`;
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${(entry.title ?? "journal-entry").replace(/\s+/g, "-")}.txt`;
  a.click(); URL.revokeObjectURL(url);
}

export function exportAsMarkdown(entry: JournalEntry): void {
  const front = `---\ntitle: "${entry.title ?? "Untitled"}"\ndate: ${entry.created_at}\nmood: ${entry.mood ?? "—"}\ntags: [${(entry.tags ?? []).join(", ")}]\n---\n\n`;
  const md = front + `# ${entry.title ?? "Untitled Entry"}\n\n${entry.content ?? ""}`;
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${(entry.title ?? "journal-entry").replace(/\s+/g, "-")}.md`;
  a.click(); URL.revokeObjectURL(url);
}

// ── Streak milestone messages ─────────────────────────────────────────────

export function getStreakMilestone(streak: number): string | null {
  if (streak === 3)  return "3 day streak. Your voice is waking up.";
  if (streak === 7)  return "One week. This is becoming a practice.";
  if (streak === 14) return "Two weeks. You're building something real.";
  if (streak === 30) return "30 days. Most people quit. You didn't.";
  return null;
}

export const SUGGESTED_TAGS = ["reflection", "work", "decision", "growth", "challenge", "clarity", "struggle"];
