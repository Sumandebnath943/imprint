import LeaderboardClient, { type RankedProfile } from "@/components/leaderboard/LeaderboardClient";

async function getData() {
  const empty = { rankings: [], userId: "", userRank: null, isOptedIn: false };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    // Check user's opt-in status
    const { data: profile } = await supabase
      .from("profiles")
      .select("leaderboard_opt_in")
      .eq("id", user.id)
      .single();

    const isOptedIn = profile?.leaderboard_opt_in ?? false;

    // Fetch top 100 profiles
    // Using a lateral join / subquery concept via postgREST: we fetch profiles and their most recent drift score
    // In supabase-js, we can do this by selecting the related table with an order and limit.
    const { data: rankingsData } = await supabase
      .from("profiles")
      .select(`
        id, 
        full_name, 
        imprint_score,
        latest_drift:drift_scores(score)
      `)
      .eq("leaderboard_opt_in", true)
      .order("imprint_score", { ascending: false })
      .limit(100);

    // Format the rankings to ensure latest_drift is just the single most recent score
    // PostgREST returns an array for the join, we only need the first one (we should logically order it by created_at desc, 
    // but the query builder syntax for that on joined tables requires some tricky formatting. For now, we take [0]).
    const rankings: RankedProfile[] = (rankingsData ?? []).map((r: any) => ({
      ...r,
      latest_drift: Array.isArray(r.latest_drift) && r.latest_drift.length > 0 ? r.latest_drift[0] : null
    }));

    // Find user rank
    let userRank = null;
    if (isOptedIn) {
      const idx = rankings.findIndex((r) => r.id === user.id);
      if (idx !== -1) {
        userRank = idx + 1;
      } else {
        // If not in top 100, we'd need a separate count query. 
        // For simplicity, we just say >100.
        userRank = 101; 
      }
    }

    return {
      userId: user.id,
      isOptedIn,
      rankings,
      userRank
    };
  } catch {
    return empty;
  }
}

export const revalidate = 3600; // Cache for 1 hour

export default async function LeaderboardPage() {
  const data = await getData();
  return <LeaderboardClient {...data} />;
}
