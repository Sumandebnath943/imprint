import VaultClient from "@/components/vault/VaultClient";
import type { VaultPageData } from "@/lib/vault/types";

async function getVaultData(): Promise<VaultPageData> {
  const empty: VaultPageData = {
    userId: "", userCluster: "life_personal",
    skills: [], activeChallenge: null, history: [],
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const [profileRes, skillsRes, challengeRes, historyRes] = await Promise.all([
      supabase.from("profiles").select("profession_cluster").eq("id", user.id).single(),
      supabase.from("skill_vault").select("*").eq("user_id", user.id).order("strength_level", { ascending: true }),
      supabase.from("vault_challenges")
        .select("*, skill_vault(skill_name)")
        .eq("user_id", user.id).eq("status", "pending")
        .order("due_date", { ascending: true }).limit(1).single(),
      supabase.from("vault_challenges")
        .select("id,created_at,challenge_type,status,strength_gained,skill_vault(skill_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(30),
    ]);

    // Map active challenge
    let activeChallenge = null;
    if (challengeRes.data) {
      const c = challengeRes.data as Record<string, unknown>;
      const sv = c.skill_vault as Record<string, unknown> | null;
      activeChallenge = {
        id: c.id as string,
        user_id: c.user_id as string,
        skill_id: c.skill_id as string,
        skill_name: sv?.skill_name as string | undefined,
        challenge_title: c.challenge_title as string,
        challenge_description: c.challenge_description as string,
        challenge_type: c.challenge_type as string,
        assigned_date: c.assigned_date as string,
        due_date: c.due_date as string,
        status: c.status as "pending",
        strength_gained: c.strength_gained as number,
      };
    }

    // Map history rows
    const history = (historyRes.data ?? []).map((h) => {
      const sv = (h.skill_vault as unknown) as Record<string, unknown> | null;
      return {
        id: h.id,
        created_at: h.created_at,
        skill_name: (sv?.skill_name as string) ?? "Unknown skill",
        challenge_type: h.challenge_type ?? "",
        status: (h.status as "completed" | "missed" | "in_progress") ?? "in_progress",
        strength_change: h.status === "completed" ? (h.strength_gained ?? 5) : -3,
      };
    });

    return {
      userId: user.id,
      userCluster: profileRes.data?.profession_cluster ?? "life_personal",
      skills: (skillsRes.data ?? []) as VaultPageData["skills"],
      activeChallenge,
      history,
    };
  } catch {
    return empty;
  }
}

export default async function VaultPage() {
  const pageData = await getVaultData();
  return <VaultClient pageData={pageData} />;
}
