// Calibration Session — types

export type CalibrationStatus = "pending" | "in_progress" | "completed" | "abandoned";

export interface CalibrationPrompt {
  id: string;
  moduleId: string;
  cluster: "universal" | string;
  ghostWord: string;
  headline: string;
  prompt: string;
  badge: string;
  responseType: "text" | "audio" | "file";
  timed?: number;        // minutes
  minWords?: number;
  disableBackspace?: boolean;
}

export interface CalibrationResponse {
  promptId: string;
  content: string;
  wordCount: number;
  responseTimeSeconds: number;
  recordedAt: string;
}

export interface CalibrationSession {
  id: string;
  user_id: string;
  session_number: number;
  status: CalibrationStatus;
  prompts: CalibrationPrompt[];
  responses: CalibrationResponse[];
  drift_score_produced?: number;
  comparison_vs_baseline?: Record<string, unknown>;
  completed_at?: string;
  created_at: string;
  next_session_due?: string;
}

export interface CalibrationScoreResult {
  score: number;
  scoreLabel: "anchored" | "drifting" | "critical" | "crisis";
  delta: number | null;
  signals: {
    baselineConsistency: number;
    vaultActivity: number;
    aiIndependence: number;
    journalRegularity: number;
  };
  nextSessionDue: string;
}

export interface CalibrationPageData {
  userId: string;
  userCluster: string;
  sessions: CalibrationSession[];
  latestDriftScore: number | null;
  previousDriftScore: number | null;
  activeSession: CalibrationSession | null;
  baselineExists: boolean;
}
