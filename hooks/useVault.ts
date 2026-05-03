"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SkillVaultEntry, VaultChallenge } from "@/types/vault.types";

export function useVault(userId: string | undefined) {
  const [skills, setSkills] = useState<SkillVaultEntry[]>([]);
  const [challenges, setChallenges] = useState<VaultChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVaultData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const [skillsResult, challengesResult] = await Promise.all([
        supabase
          .from("skill_vault")
          .select("*")
          .eq("user_id", userId)
          .order("strength_level", { ascending: false }),
        supabase
          .from("vault_challenges")
          .select("*")
          .eq("user_id", userId)
          .order("assigned_date", { ascending: false })
          .limit(20),
      ]);

      if (skillsResult.error) throw skillsResult.error;
      if (challengesResult.error) throw challengesResult.error;

      setSkills((skillsResult.data as SkillVaultEntry[]) ?? []);
      setChallenges((challengesResult.data as VaultChallenge[]) ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load vault data."
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchVaultData();
  }, [fetchVaultData]);

  return {
    skills,
    challenges,
    isLoading,
    error,
    refetch: fetchVaultData,
  };
}
