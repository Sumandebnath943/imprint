import TimeCapsuleClient from "@/components/time-capsule/TimeCapsuleClient";
import type { TimeCapsule } from "@/components/time-capsule/CapsuleList";

async function getData() {
  const empty = { capsules: [] as TimeCapsule[], userId: "", userName: "Friend", currentDriftScore: null as number | null };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const [capsRes, profileRes, scoreRes] = await Promise.all([
      supabase.from("time_capsules").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase.from("drift_scores").select("score").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    ]);

    return {
      capsules: (capsRes.data ?? []) as TimeCapsule[],
      userId: user.id,
      userName: (profileRes.data?.full_name as string | null)?.split(" ")[0] ?? "Friend",
      currentDriftScore: (scoreRes.data as Record<string, unknown> | null)?.score as number | null ?? null,
    };
  } catch { return empty; }
}

export default async function TimeCapsulePage() {
  const data = await getData();
  return <TimeCapsuleClient {...data} />;
}
