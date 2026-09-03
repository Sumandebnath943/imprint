import CredentialClient from "@/components/credential/CredentialClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Identity Credential",
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
    .select(
      "id, full_name, username, profession, profession_cluster, imprint_score, credential_code, credential_public"
    )
    .eq("id", user.id)
    .single();

  // `status` is not a column on drift_scores — the label column is
  // score_label. maybeSingle() because a new user has no drift score yet,
  // and single() throws on zero rows.
  const { data: driftScore } = await supabase
    .from("drift_scores")
    .select("score, score_label")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Real counts, replacing the previous hardcoded {4, 12, 8}.
  const { data: statsRows } = await supabase.rpc("credential_stats", {
    uid: user.id,
  });
  const s = Array.isArray(statsRows) ? statsRows[0] : statsRows;

  const stats = {
    calibrations: s?.calibrations ?? 0,
    streak: s?.day_streak ?? 0,
    skillsTracked: s?.skills_tracked ?? 0,
  };

  return (
    <CredentialClient
      profile={profile!}
      driftScore={driftScore}
      stats={stats}
    />
  );
}
