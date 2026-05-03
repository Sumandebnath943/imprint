// Shared dashboard data types

export interface DashboardProfile {
  id: string;
  full_name: string | null;
  profession: string | null;
  profession_cluster: string | null;
  imprint_score: number;
  onboarding_completed: boolean;
  avatar_url: string | null;
  streak_days: number;
}

export interface DashboardDriftScore {
  score: number;
  score_label: string;
  delta_from_previous: number;
  contributing_signals: {
    baseline_consistency?: number;
    vault_activity?: number;
    ai_independence?: number;
  };
  created_at: string;
}

export interface DashboardSkill {
  id: string;
  skill_name: string;
  strength_level: number;
  times_practiced: number;
  last_exercised: string | null;
}

export interface DashboardChallenge {
  id: string;
  title?: string;
  skill_name?: string;
  due_date: string | null;
  status: string;
}

export interface DashboardCalibration {
  id: string;
  completed_at: string;
  next_due_at: string | null;
}

export interface DashboardData {
  profile: DashboardProfile | null;
  driftScore: DashboardDriftScore | null;
  skills: DashboardSkill[];
  nextChallenge: DashboardChallenge | null;
  journalCountThisWeek: number;
  calibration: DashboardCalibration | null;
  activityByDay: { day: string; value: number; isToday: boolean }[];
  streak: number;
}

// Drift score helpers
export function getDriftColor(score: number): string {
  if (score < 40) return "#00D97E";
  if (score < 60) return "#FFB800";
  if (score < 80) return "#FF5500";
  return "#FF2D2D";
}

export function getDriftLabel(score: number): string {
  if (score < 40) return "Anchored";
  if (score < 60) return "Drifting";
  if (score < 80) return "Critical";
  return "Identity Crisis";
}

export function getDriftMessage(score: number): string {
  if (score < 40) return "You're anchored. Keep going.";
  if (score < 60) return "Drift detected. Time to recalibrate.";
  if (score < 80) return "Recovery Protocol recommended.";
  return "Identity Crisis Point reached.";
}

export function getImprintScoreLabel(score: number): string {
  if (score <= 200) return "Establishing";
  if (score <= 400) return "Building";
  if (score <= 600) return "Solid";
  if (score <= 800) return "Strong";
  return "Anchored";
}

export function getSkillColor(strength: number): string {
  if (strength >= 80) return "#00D97E";
  if (strength >= 50) return "#FFB800";
  return "#FF2D2D";
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function getFirstName(fullName: string | null): string {
  if (!fullName) return "there";
  return fullName.split(" ")[0];
}

export function daysAgo(dateStr: string | null): number {
  if (!dateStr) return 999;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.floor(ms / 86400000);
}

export function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const ms = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}
