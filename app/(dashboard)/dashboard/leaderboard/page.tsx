import LeaderboardClient, { type RankedProfile } from "@/components/leaderboard/LeaderboardClient";

async function getData() {
  const empty = { rankings: [], userId: "", userRank: null, isOptedIn: false };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    // Check the viewer's own opt-in status (own row — normal profiles access).
    const { data: profile } = await supabase
      .from("profiles")
      .select("leaderboard_opt_in")
      .eq("id", user.id)
      .single();

    const isOptedIn = profile?.leaderboard_opt_in ?? false;

    // Ranked list comes from the public_profiles view (migration 006).
    // `profiles` is owner-only, so reading it here would return just the
    // viewer's own row and the board would always look empty.
    //
    // latest_drift_score is resolved inside the view with an ORDER BY, so it
    // is genuinely the most recent score rather than an arbitrary row.
    const { data: rankingsData } = await supabase
      .from("public_profiles")
      .select("id, full_name, profession_cluster, imprint_score, latest_drift_score")
      .eq("leaderboard_opt_in", true)
      .order("imprint_score", { ascending: false })
      .limit(100);

    const rankings: RankedProfile[] = (rankingsData ?? []).map((r) => ({
      id: r.id,
      full_name: r.full_name,
      profession_cluster: r.profession_cluster,
      imprint_score: r.imprint_score ?? 0,
      latest_drift:
        r.latest_drift_score === null || r.latest_drift_score === undefined
          ? null
          : { score: r.latest_drift_score },
    }));

    const idx = isOptedIn ? rankings.findIndex((r) => r.id === user.id) : -1;
    const userRank = isOptedIn ? (idx === -1 ? null : idx + 1) : null;

    return { userId: user.id, isOptedIn, rankings, userRank };
  } catch {
    return empty;
  }
}

// Per-user data behind a cookie session — must not be statically cached.
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const data = await getData();
  return <LeaderboardClient {...data} />;
}
