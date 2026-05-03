import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { DashboardProfile, DashboardDriftScore } from "@/lib/dashboard/types";

// Gracefully attempt Supabase fetch — skip if env vars missing (local dev)
async function getDashboardLayoutData(): Promise<{
  profile: DashboardProfile | null;
  driftScore: DashboardDriftScore | null;
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { profile: null, driftScore: null };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { profile: null, driftScore: null };

    const [profileRes, driftRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("drift_scores")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    const profile = profileRes.data as DashboardProfile | null;

    // Redirect to onboarding if not completed
    if (profile && !profile.onboarding_completed) {
      redirect("/onboarding/welcome");
    }

    return {
      profile,
      driftScore: driftRes.data as DashboardDriftScore | null,
    };
  } catch {
    return { profile: null, driftScore: null };
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, driftScore } = await getDashboardLayoutData();

  return (
    <DashboardShell profile={profile} driftScore={driftScore}>
      {children}
    </DashboardShell>
  );
}
