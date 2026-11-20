export type ScoringAvailability = "enabled" | "disabled" | "unavailable";

export const SCORING_LABELS: Record<ScoringAvailability, string> = {
  enabled: "Scoring enabled",
  disabled: "Scoring not yet available",
  unavailable: "Temporarily unavailable",
};
