"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUserStore } from "@/lib/store/user.store";
import { AUTH_RESUME_PATH } from "@/lib/auth/resume";
import { ADULT_ATTESTATION, ADULT_ONLY_MESSAGE } from "@/lib/auth/eligibility";

type SignupResult =
  | { status: "active"; redirectTo: string }
  | { status: "pending" }
  | { status: "error"; message: string };

function recordAuthTime() {
  try { localStorage.setItem("imprint_auth_ts", Date.now().toString()); } catch {}
}

export function useAuth() {
  const router = useRouter();
  const { clearProfile, setLoading } = useUserStore();
  const [loading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const signUp = useCallback(async (email: string, password: string, fullName: string, adultConfirmed: boolean): Promise<SignupResult> => {
    if (!adultConfirmed) return { status: "error", message: ADULT_ONLY_MESSAGE };
    setLocalLoading(true);
    setLoading(true);
    setError(null);
    try {
      const { data, error: failure } = await createClient().auth.signUp({
        email: email.trim(), password,
        options: {
          data: { full_name: fullName.trim(), [ADULT_ATTESTATION]: true },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (failure) {
        if (failure.code === "user_already_exists" || failure.code === "email_exists") return { status: "pending" };
        if (failure.status === 429) return { status: "error", message: "Too many attempts. Wait a few minutes and try again." };
        if (failure.code === "weak_password") return { status: "error", message: "Choose a stronger password and try again." };
        if (failure.code === "email_address_invalid" || failure.code === "validation_failed") {
          return { status: "error", message: "Check your email address and password, then try again." };
        }
        return { status: "error", message: "Signup is temporarily unavailable. Try again in a moment." };
      }
      if (data.session) {
        recordAuthTime();
        return { status: "active", redirectTo: AUTH_RESUME_PATH };
      }
      if (data.user) return { status: "pending" };
      return { status: "error", message: "Signup is temporarily unavailable. Try again in a moment." };
    } catch {
      return { status: "error", message: "Signup is temporarily unavailable. Try again in a moment." };
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [setLoading]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; redirectTo?: string }> => {
    setLocalLoading(true);
    setLoading(true);
    setError(null);
    try {
      const { data, error: failure } = await createClient().auth.signInWithPassword({ email, password });
      if (failure || !data.session) {
        setError(failure?.status === 429 ? "Too many attempts. Wait a few minutes and try again."
          : failure?.code === "email_not_confirmed" ? "Confirm your email using the link in your inbox, then sign in."
          : failure?.status === 400 || failure?.status === 401 ? "Incorrect email or password. Please try again."
          : "Sign-in is temporarily unavailable. Try again in a moment.");
        return { success: false };
      }
      recordAuthTime();
      return { success: true, redirectTo: AUTH_RESUME_PATH };
    } catch {
      setError("Sign-in is temporarily unavailable. Try again in a moment.");
      return { success: false };
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  }, [setLoading]);

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
        setError("Google sign-in is unavailable. Try again or sign in with email.");
        setLocalLoading(false);
      }
      // Navigation handled by Supabase redirect
    } catch {
      setError("Google sign-in is unavailable. Try again or sign in with email.");
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
