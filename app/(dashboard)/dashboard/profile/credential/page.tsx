import CredentialClient from "@/components/credential/CredentialClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Identity Credential — IMPRINT",
  description: "Your verified IMPRINT score and identity preservation credential.",
};

export default async function CredentialPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: driftScores } = await supabase
    .from("drift_scores")
    .select("score, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Mocked Stats (until full relations are built)
  const stats = {
    calibrations: 4,
    streak: 12,
    skillsTracked: 8,
  };

  return <CredentialClient profile={profile || {}} driftScore={driftScores || null} stats={stats} />;
}
