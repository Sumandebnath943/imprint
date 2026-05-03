"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BaselineImprint } from "@/types/baseline.types";

export function useBaseline(userId: string | undefined) {
  const [baselines, setBaselines] = useState<BaselineImprint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBaselines = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from("baseline_imprints")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      setBaselines((data as BaselineImprint[]) ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load baseline data."
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBaselines();
  }, [fetchBaselines]);

  const hasBaseline = baselines.length > 0;

  return { baselines, isLoading, error, hasBaseline, refetch: fetchBaselines };
}
