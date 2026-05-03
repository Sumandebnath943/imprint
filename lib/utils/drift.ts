import type {
  DriftCalculationResult,
  DriftScoreLabel,
  DriftContributingSignals,
} from "@/types/drift.types";
import type { BaselineImprint } from "@/types/baseline.types";

export interface CalibrationResponse {
  module_id: string;
  response_text: string;
  response_time_seconds: number;
}

interface TextMetrics {
  word_count: number;
  avg_sentence_length: number;
  vocabulary_richness: number;
}

/**
 * Extracts basic NLP-style metrics from a text string.
 */
function extractTextMetrics(text: string): TextMetrics {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const word_count = words.length;
  const avg_sentence_length =
    sentences.length > 0 ? word_count / sentences.length : word_count;

  // Vocabulary richness = unique words / total words (Type-Token Ratio)
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const vocabulary_richness =
    word_count > 0 ? uniqueWords.size / word_count : 0;

  return { word_count, avg_sentence_length, vocabulary_richness };
}

/**
 * Computes the percentage delta between two values.
 * Positive = increased (which may indicate drift), Negative = decreased.
 */
function percentageDelta(baseline: number, current: number): number {
  if (baseline === 0) return 0;
  return ((current - baseline) / baseline) * 100;
}

/**
 * Maps a normalized divergence score (0–1) to the 0–100 drift scale.
 */
function normalizeToDriftScale(divergenceRatio: number): number {
  return Math.min(100, Math.round(divergenceRatio * 100));
}

/**
 * Determines the drift label from a numeric score.
 */
function getDriftLabel(score: number): DriftScoreLabel {
  if (score <= 39) return "anchored";
  if (score <= 59) return "drifting";
  if (score <= 79) return "critical";
  return "crisis";
}

/**
 * Calculates a drift score by comparing a calibration session's responses
 * against the user's baseline imprints.
 *
 * @param calibrationResponses - Responses from the current calibration session
 * @param baselineImprints - User's original baseline imprint records
 * @param previousScore - Optional: the user's previous drift score for delta calculation
 * @returns DriftCalculationResult containing score, label, delta, and signals
 */
export function calculateDriftScore(
  calibrationResponses: CalibrationResponse[],
  baselineImprints: BaselineImprint[],
  previousScore = 0
): DriftCalculationResult {
  if (calibrationResponses.length === 0 || baselineImprints.length === 0) {
    return {
      score: 0,
      label: "anchored",
      delta_from_previous: 0,
      contributing_signals: {
        vocabulary_richness_delta: 0,
        avg_sentence_length_delta: 0,
        reasoning_depth_delta: 0,
        response_time_delta: 0,
      },
    };
  }

  // Build a map of baseline metrics by module_id for fast lookup
  const baselineMap = new Map<string, BaselineImprint>();
  for (const b of baselineImprints) {
    baselineMap.set(b.module_id, b);
  }

  let totalVocabDelta = 0;
  let totalSentenceDelta = 0;
  let totalTimeDelta = 0;
  let matchedCount = 0;

  for (const response of calibrationResponses) {
    const baseline = baselineMap.get(response.module_id);
    if (!baseline || !response.response_text) continue;

    const currentMetrics = extractTextMetrics(response.response_text);

    totalVocabDelta += Math.abs(
      percentageDelta(baseline.vocabulary_richness, currentMetrics.vocabulary_richness)
    );
    totalSentenceDelta += Math.abs(
      percentageDelta(baseline.avg_sentence_length, currentMetrics.avg_sentence_length)
    );
    totalTimeDelta += Math.abs(
      percentageDelta(baseline.response_time_seconds, response.response_time_seconds)
    );

    matchedCount++;
  }

  if (matchedCount === 0) {
    return {
      score: 0,
      label: "anchored",
      delta_from_previous: 0,
      contributing_signals: {
        vocabulary_richness_delta: 0,
        avg_sentence_length_delta: 0,
        reasoning_depth_delta: 0,
        response_time_delta: 0,
      },
    };
  }

  const avgVocabDelta = totalVocabDelta / matchedCount;
  const avgSentenceDelta = totalSentenceDelta / matchedCount;
  const avgTimeDelta = totalTimeDelta / matchedCount;

  // Reasoning depth is approximated via a weighted combo of vocab and sentence deltas
  const reasoningDepthDelta = (avgVocabDelta * 0.6 + avgSentenceDelta * 0.4);

  // Weighted composite divergence — vocabulary richness is the strongest signal
  const compositeDeviation =
    avgVocabDelta * 0.4 +
    avgSentenceDelta * 0.3 +
    reasoningDepthDelta * 0.2 +
    avgTimeDelta * 0.1;

  // Cap at 100% deviation → maps to score 100
  const score = normalizeToDriftScale(Math.min(compositeDeviation / 100, 1));

  const contributing_signals: DriftContributingSignals = {
    vocabulary_richness_delta: Math.round(avgVocabDelta * 10) / 10,
    avg_sentence_length_delta: Math.round(avgSentenceDelta * 10) / 10,
    reasoning_depth_delta: Math.round(reasoningDepthDelta * 10) / 10,
    response_time_delta: Math.round(avgTimeDelta * 10) / 10,
  };

  return {
    score,
    label: getDriftLabel(score),
    delta_from_previous: score - previousScore,
    contributing_signals,
  };
}
