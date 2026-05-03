// Drift Score — shared types and signal helpers

export interface DriftScore {
  id: string;
  user_id: string;
  score: number; // 0–100, higher = more drifted
  created_at: string;
}

export interface CalibrationSession {
  id: string;
  user_id: string;
  completed_at: string;
  score_produced?: number;
  findings?: {
    vocab_drift?: number;
    sentence_drift?: number;
    vault_note?: string;
    mirror_note?: string;
  };
  session_number?: number;
}

export interface DriftSignalValues {
  baselineConsistency: number; // 0–100
  vaultActivity: number;       // 0–100
  aiIndependence: number;      // 0–100
  journalRegularity: number;   // 0–100
}

export interface DriftSignalTrend {
  baselineConsistency: "up" | "down" | "stable";
  vaultActivity: "up" | "down" | "stable";
  aiIndependence: "up" | "down" | "stable";
  journalRegularity: "up" | "down" | "stable";
}

export interface WeeklyRow {
  week: string;           // "Apr 7"
  score: number;
  status: string;
  baseline: number;
  vault: number;
  ai: number;
  journal: number;
  delta: number | null;  // null for first entry
  isCurrent: boolean;
}

export interface DriftPageData {
  userId: string;
  currentScore: DriftScore | null;
  previousScore: DriftScore | null;
  allScores: DriftScore[];
  signals: DriftSignalValues;
  signalTrends: DriftSignalTrend;
  calibrations: CalibrationSession[];
  weeklyRows: WeeklyRow[];
  nextCalibrationAvailable: boolean;
  nextCalibrationDate: string | null;
  rawStats: {
    journalStreak: number;
    journalEntriesThisMonth: number;
    challengesCompleted: number;
    skillsAbove50: number;
    totalSkills: number;
    daysSinceVault: number;
    mirrorSessions: number;
    avgDependencyFlags: number;
  };
}

// ── Zone helpers ──────────────────────────────────────────────────────────

export function getZoneColor(score: number): string {
  if (score < 40)  return "#00D97E";
  if (score < 60)  return "#FFB800";
  if (score < 80)  return "#FF5500";
  return "#FF2D2D";
}

export function getZoneLabel(score: number): string {
  if (score < 40)  return "Anchored — You are yourself.";
  if (score < 60)  return "Drifting — Early signals detected.";
  if (score < 80)  return "Critical — Recovery recommended.";
  return "Identity Crisis Point";
}

export function getZoneShortLabel(score: number): string {
  if (score < 40)  return "Anchored";
  if (score < 60)  return "Drifting";
  if (score < 80)  return "Critical";
  return "Crisis";
}

// ── Signal calculation (from raw DB data) ─────────────────────────────────

export interface RawSignalData {
  totalSkills: number;
  skillsAbove50: number;
  daysSinceLastVaultPractice: number;
  challengesCompletedThisMonth: number;
  mirrorSessionsThisMonth: number;
  totalDependencyFlagsThisMonth: number;
  journalStreak: number;
  journalEntriesThisMonth: number;
  avgJournalWordCount: number;
  baselineAvgWordCount: number;
  latestCalibrationVocabMatch?: number;
}

export function calcSignals(raw: RawSignalData): DriftSignalValues {
  // 1. Vault Activity
  const skillScore = raw.totalSkills > 0
    ? Math.round((raw.skillsAbove50 / raw.totalSkills) * 100) : 70;
  const practiceScore = Math.max(0, 100 - raw.daysSinceLastVaultPractice * 10);
  const challengeScore = Math.min(100, raw.challengesCompletedThisMonth * 25);
  const vaultActivity = Math.round((skillScore * 0.4 + practiceScore * 0.35 + challengeScore * 0.25));

  // 2. AI Independence
  const avgFlags = raw.mirrorSessionsThisMonth > 0
    ? raw.totalDependencyFlagsThisMonth / raw.mirrorSessionsThisMonth : 0;
  const aiIndependence = Math.max(0, Math.round(100 - avgFlags * 20));

  // 3. Journal Regularity
  const streakScore = Math.min(100, raw.journalStreak * 14);
  const frequencyScore = Math.min(100, raw.journalEntriesThisMonth * 5);
  const journalRegularity = Math.round(streakScore * 0.6 + frequencyScore * 0.4);

  // 4. Baseline Consistency (from calibration or estimate)
  const baselineConsistency = raw.latestCalibrationVocabMatch !== undefined
    ? raw.latestCalibrationVocabMatch
    : 75; // default before first calibration

  return {
    baselineConsistency: Math.min(100, Math.max(0, baselineConsistency)),
    vaultActivity: Math.min(100, Math.max(0, vaultActivity)),
    aiIndependence: Math.min(100, Math.max(0, aiIndependence)),
    journalRegularity: Math.min(100, Math.max(0, journalRegularity)),
  };
}

export function calcDriftScore(signals: DriftSignalValues): number {
  // Drift = 100 - weighted human-preservation score
  const preservation =
    signals.baselineConsistency * 0.40 +
    signals.vaultActivity       * 0.25 +
    signals.aiIndependence      * 0.20 +
    signals.journalRegularity   * 0.15;
  return Math.round(100 - preservation);
}

// ── Recovery protocol helpers ─────────────────────────────────────────────

export interface RecoveryStep {
  title: string;
  desc: string;
  ctaLabel: string;
  ctaHref: string;
  ghost?: boolean;
}

export function buildRecoverySteps(signals: DriftSignalValues): RecoveryStep[] {
  const steps: RecoveryStep[] = [];
  if (signals.baselineConsistency < 70) steps.push({
    title: "Complete a Calibration Session",
    desc: "Your baseline needs a fresh comparison point.",
    ctaLabel: "Begin Calibration →", ctaHref: "/dashboard/calibration",
  });
  if (signals.vaultActivity < 60) steps.push({
    title: "Complete 3 Vault Challenges this week",
    desc: "Your skills need active defense right now.",
    ctaLabel: "Go to Vault →", ctaHref: "/dashboard/vault",
  });
  if (signals.aiIndependence < 70) steps.push({
    title: "Do a 3-day AI reduction",
    desc: "Limit AI tool use for 3 days. Use The Forge for all writing tasks.",
    ctaLabel: "Enter The Forge →", ctaHref: "/dashboard/forge",
  });
  if (signals.journalRegularity < 50) steps.push({
    title: "Write for 7 consecutive days",
    desc: "Daily reflection rebuilds identity signal.",
    ctaLabel: "Open Journal →", ctaHref: "/dashboard/journal",
  });
  steps.push({
    title: "Schedule your next Mirror session",
    desc: "Reflect on what changed. The Mirror will surface the pattern.",
    ctaLabel: "Open The Mirror →", ctaHref: "/dashboard/mirror", ghost: true,
  });
  return steps;
}

export function formatScoreDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
