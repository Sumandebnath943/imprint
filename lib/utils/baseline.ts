import type { BaselineImprint, BaselineMetrics, BaselineComparisonResult } from "@/types/baseline.types";

/**
 * Extracts simple text metrics from a raw response string.
 */
export function computeTextMetrics(
  text: string,
  responseTimeSeconds: number
): BaselineMetrics {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const word_count = words.length;
  const avg_sentence_length =
    sentences.length > 0 ? word_count / sentences.length : word_count;

  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const vocabulary_richness =
    word_count > 0 ? uniqueWords.size / word_count : 0;

  return {
    word_count,
    avg_sentence_length: Math.round(avg_sentence_length * 100) / 100,
    vocabulary_richness: Math.round(vocabulary_richness * 1000) / 1000,
    response_time_seconds: responseTimeSeconds,
  };
}

/**
 * Compares a current response's metrics against a baseline imprint,
 * returning a structured comparison result.
 */
export function compareToBaseline(
  baseline: BaselineImprint,
  currentText: string,
  currentResponseTimeSeconds: number
): BaselineComparisonResult {
  const currentMetrics = computeTextMetrics(currentText, currentResponseTimeSeconds);

  const baselineMetrics: BaselineMetrics = {
    word_count: baseline.word_count,
    avg_sentence_length: baseline.avg_sentence_length,
    vocabulary_richness: baseline.vocabulary_richness,
    response_time_seconds: baseline.response_time_seconds,
  };

  // Compute overall delta as average percentage change across key metrics
  const vocabDelta =
    baseline.vocabulary_richness > 0
      ? ((currentMetrics.vocabulary_richness - baseline.vocabulary_richness) /
          baseline.vocabulary_richness) *
        100
      : 0;
  const sentenceDelta =
    baseline.avg_sentence_length > 0
      ? ((currentMetrics.avg_sentence_length - baseline.avg_sentence_length) /
          baseline.avg_sentence_length) *
        100
      : 0;
  const timeDelta =
    baseline.response_time_seconds > 0
      ? ((currentMetrics.response_time_seconds - baseline.response_time_seconds) /
          baseline.response_time_seconds) *
        100
      : 0;

  const delta_percentage =
    Math.abs(vocabDelta) * 0.4 +
    Math.abs(sentenceDelta) * 0.3 +
    Math.abs(timeDelta) * 0.3;

  const divergence_areas: string[] = [];
  if (Math.abs(vocabDelta) > 15) divergence_areas.push("vocabulary_richness");
  if (Math.abs(sentenceDelta) > 20) divergence_areas.push("sentence_structure");
  if (Math.abs(timeDelta) > 30) divergence_areas.push("response_speed");

  return {
    module_id: baseline.module_id,
    baseline_metrics: baselineMetrics,
    current_metrics: currentMetrics,
    delta_percentage: Math.round(delta_percentage * 10) / 10,
    divergence_areas,
  };
}

/**
 * Computes an aggregate baseline snapshot from multiple baseline imprints.
 */
export function getBaselineAggregate(imprints: BaselineImprint[]): BaselineMetrics {
  if (imprints.length === 0) {
    return {
      word_count: 0,
      avg_sentence_length: 0,
      vocabulary_richness: 0,
      response_time_seconds: 0,
    };
  }

  const total = imprints.reduce(
    (acc, imp) => ({
      word_count: acc.word_count + imp.word_count,
      avg_sentence_length: acc.avg_sentence_length + imp.avg_sentence_length,
      vocabulary_richness: acc.vocabulary_richness + imp.vocabulary_richness,
      response_time_seconds:
        acc.response_time_seconds + imp.response_time_seconds,
    }),
    {
      word_count: 0,
      avg_sentence_length: 0,
      vocabulary_richness: 0,
      response_time_seconds: 0,
    }
  );

  const count = imprints.length;
  return {
    word_count: Math.round(total.word_count / count),
    avg_sentence_length: Math.round((total.avg_sentence_length / count) * 100) / 100,
    vocabulary_richness: Math.round((total.vocabulary_richness / count) * 1000) / 1000,
    response_time_seconds: Math.round(total.response_time_seconds / count),
  };
}
