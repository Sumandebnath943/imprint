import type { ScoringAvailability } from "./availability";

export type AssessmentScore = {
  score: number;
  form: number;
  scored_at: string;
  results: { model?: string; provider?: string; evaluator?: string; difficulty?: string; evidencePolicy?: string };
};

export type AssessmentSummary = {
  current: Pick<AssessmentScore, "score" | "scored_at"> | null;
  original: Pick<AssessmentScore, "score" | "scored_at"> | null;
  difference: number | null;
  comparison: string;
  nextAction: string;
};

export function compatibleAssessments(first?: AssessmentScore | null, second?: AssessmentScore | null) {
  if (!first?.results.model || !second?.results.model || !first.results.evaluator || !second.results.evaluator) return false;
  const fallback = (result: AssessmentScore["results"]) => result.provider === "groq" || result.model?.startsWith("groq:");
  return !fallback(first.results) && !fallback(second.results) && first.results.model === second.results.model &&
    first.results.evaluator === second.results.evaluator && first.results.difficulty === second.results.difficulty &&
    first.results.evidencePolicy === second.results.evidencePolicy;
}

export function assessmentSummary(
  current: AssessmentScore | null, original: AssessmentScore | null, availability: ScoringAvailability, draft: boolean,
): AssessmentSummary {
  const ready = availability === "enabled";
  const nextAction = draft ? "Resume your saved work" : ready ? "First assessment ready" :
    availability === "unavailable" ? "Scoring temporarily unavailable" : "Baseline saved · scoring unavailable";
  const compared = Boolean(current && original && current.form !== original.form);
  const comparable = compared && compatibleAssessments(current, original);
  return {
    current: current ? { score: current.score, scored_at: current.scored_at } : null,
    original: original ? { score: original.score, scored_at: original.scored_at } : null,
    nextAction,
    difference: comparable && current && original ? current.score - original.score : null,
    comparison: !compared ? "Awaiting reassessment" : comparable ? "Observed difference" : "Scoring versions differ",
  };
}

export function signedPoints(value: number) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value)}`;
}
