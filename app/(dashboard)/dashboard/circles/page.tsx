import CirclesClient, { type HumanCircle, type CircleMember } from "@/components/circles/CirclesClient";

async function getData() {
  const empty = { circles: [], memberships: [], userId: "" };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;
  
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const { data: memberships } = await supabase
      .from("circle_members")
      .select("*")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
      return { circles: [], memberships: [], userId: user.id };
    }

    const circleIds = memberships.map(m => m.circle_id);

    const { data: circles } = await supabase
      .from("human_circles")
      .select("*")
      .in("id", circleIds);

    // Fetch all members for these circles to calculate counts
    const { data: allMemberships } = await supabase
      .from("circle_members")
      .select("*")
      .in("circle_id", circleIds);

    return { 
      circles: (circles ?? []) as HumanCircle[], 
      memberships: (allMemberships ?? []) as CircleMember[], 
      userId: user.id 
    };
  } catch {
    return empty;
  }
}

export default async function CirclesPage() {
  const { circles, memberships, userId } = await getData();
  return <CirclesClient circles={circles} memberships={memberships} userId={userId} />;
}
