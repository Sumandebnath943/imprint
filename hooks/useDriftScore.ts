"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calculateDriftScore } from "@/lib/utils/drift";
import type { DriftScore } from "@/types/drift.types";

export function useDriftScore(userId: string | undefined) {
  const [currentScore, setCurrentScore] = useState<DriftScore | null>(null);
  const [scoreHistory, setScoreHistory] = useState<DriftScore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScores = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("drift_scores")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(12);

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setCurrentScore(data[0] as DriftScore);
        setScoreHistory(data as DriftScore[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drift scores.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  return {
    currentScore,
    scoreHistory,
    isLoading,
    error,
    refetch: fetchScores,
    calculateDriftScore,
  };
}
