import CirclesClient, { type HumanCircle, type CircleMember, type PublicCircle } from "@/components/circles/CirclesClient";
import { createClient } from "@/lib/supabase/server";

export default async function CirclesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [circles, directory] = await Promise.all([
    supabase.from("human_circles").select("id,name,description,cluster_focus,member_limit,invite_code"),
    supabase.rpc("public_circle_directory"),
  ]);
  const items = (circles.data ?? []) as HumanCircle[];
  const { data: members, error: memberError } = items.length ? await supabase.from("circle_members")
    .select("id,circle_id,user_id,role,joined_at").in("circle_id", items.map(({ id }) => id)) : { data: [], error: null };
  if (circles.error || directory.error || memberError) return <section className="p-8"><h1 className="text-2xl font-semibold">Human Circles</h1><p role="alert">Circles could not be loaded. Reload to try again.</p></section>;
  return <CirclesClient circles={items} memberships={(members ?? []) as CircleMember[]} directory={(directory.data ?? []) as PublicCircle[]} userId={user.id} />;
}
