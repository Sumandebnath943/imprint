import BeliefsClient from "@/components/beliefs/BeliefsClient";
import type { Belief } from "@/components/beliefs/BeliefCard";

async function getData() {
  const empty = { beliefs: [] as Belief[], userId: "" };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;
    const { data } = await supabase.from("beliefs").select("*").eq("user_id", user.id).order("first_recorded", { ascending: false });
    return { beliefs: (data ?? []) as Belief[], userId: user.id };
  } catch { return empty; }
}

export default async function BeliefsPage() {
  const { beliefs, userId } = await getData();
  return <BeliefsClient beliefs={beliefs} userId={userId} />;
}
