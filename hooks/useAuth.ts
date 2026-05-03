"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store/user.store";
import type { Profile } from "@/types/user.types";

export function useAuth() {
  const router = useRouter();
  const { setProfile, clearProfile, setLoading } = useUserStore();
  const [loading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ─── Sign Up ──────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string
    ): Promise<{ success: boolean }> => {
      setLocalLoading(true);
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            setError("An account with this email already exists.");
          } else {
            setError(signUpError.message);
          }
          return { success: false };
        }

        if (data.user) {
          // Upsert profile — the DB trigger will also handle this,
          // but we do it explicitly to ensure full_name is set
          const { data: profileData } = await supabase
            .from("profiles")
            .upsert(
              {
                id: data.user.id,
                email: data.user.email ?? email,
                full_name: fullName,
                onboarding_completed: false,
                onboarding_step: 0,
                imprint_score: 0,
                ai_use_context: [],
              },
              { onConflict: "id" }
            )
            .select()
            .single();

          if (profileData) {
            setProfile(profileData as Profile);
          }

          // Store auth timestamp for analytics
          localStorage.setItem("imprint_auth_ts", Date.now().toString());

          return { success: true };
        }

        return { success: false };
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Signup failed. Please try again."
        );
        return { success: false };
      } finally {
        setLocalLoading(false);
        setLoading(false);
      }
    },
    [setProfile, setLoading]
  );

  // ─── Sign In ──────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ success: boolean; redirectTo?: string }> => {
      setLocalLoading(true);
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          if (signInError.message.toLowerCase().includes("invalid")) {
            setError("Incorrect email or password. Please try again.");
          } else if (signInError.message.toLowerCase().includes("not found")) {
            setError("No account found with this email address.");
          } else {
            setError(signInError.message);
          }
          return { success: false };
        }

        if (data.user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          if (profileData) {
            setProfile(profileData as Profile);
            localStorage.setItem("imprint_auth_ts", Date.now().toString());

            const redirectTo =
              profileData.onboarding_completed ? "/dashboard" : "/onboarding/welcome";
            return { success: true, redirectTo };
          }
        }

        return { success: true, redirectTo: "/onboarding/welcome" };
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Sign in failed. Please try again."
        );
        return { success: false };
      } finally {
        setLocalLoading(false);
        setLoading(false);
      }
    },
    [setProfile, setLoading]
  );

  // ─── Google OAuth ─────────────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async () => {
    setLocalLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLocalLoading(false);
      }
      // Navigation handled by Supabase redirect
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setLocalLoading(false);
    }
  }, []);

  // ─── Sign Out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    setLocalLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      clearProfile();
      localStorage.removeItem("imprint_auth_ts");
      router.push("/signin");
    } finally {
      setLocalLoading(false);
    }
  }, [clearProfile, router]);

  // ─── Reset Password ───────────────────────────────────────────────────────
  const resetPassword = useCallback(
    async (email: string): Promise<{ success: boolean }> => {
      setLocalLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { error: resetError } =
          await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          });

        if (resetError) {
          setError(resetError.message);
          return { success: false };
        }

        return { success: true };
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Reset failed. Please try again."
        );
        return { success: false };
      } finally {
        setLocalLoading(false);
      }
    },
    []
  );

  // ─── Update Password (after reset) ───────────────────────────────────────
  const updatePassword = useCallback(
    async (newPassword: string): Promise<{ success: boolean }> => {
      setLocalLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          setError(updateError.message);
          return { success: false };
        }

        return { success: true };
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Update failed. Please try again."
        );
        return { success: false };
      } finally {
        setLocalLoading(false);
      }
    },
    []
  );

  return {
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    clearError,
    loading,
    error,
  };
}
