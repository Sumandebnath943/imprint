export type DriftScoreLabel =
  | "anchored"
  | "drifting"
  | "critical"
  | "crisis";

export interface DriftContributingSignals {
  vocabulary_richness_delta: number;
  avg_sentence_length_delta: number;
  reasoning_depth_delta: number;
  response_time_delta: number;
  [key: string]: number;
}

export interface DriftScore {
  id: string;
  user_id: string;
  score: number;
  score_label: DriftScoreLabel;
  calibration_session_id: string | null;
  delta_from_previous: number;
  contributing_signals: DriftContributingSignals;
  week_number: number;
  year: number;
  created_at: string;
}

export type DriftScoreInsert = Omit<DriftScore, "id" | "created_at">;

export interface DriftCalculationResult {
  score: number;
  label: DriftScoreLabel;
  delta_from_previous: number;
  contributing_signals: DriftContributingSignals;
}

export interface DriftScoreHistory {
  week_number: number;
  year: number;
  score: number;
  label: DriftScoreLabel;
}
