import MentorsClient from "@/components/mentors/MentorsClient";
import { reviewerAllowed } from "@/lib/assessment/pilot";
import { createClient } from "@/lib/supabase/server";
import type { Application, Mentor, MentorActivity, MentorSettings } from "@/lib/mentors/types";
import { findRoleTrack } from "@/lib/assessment/catalog";

export default async function MentorsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [activity, directory, settings, applications] = await Promise.all([
    supabase.rpc("my_mentor_activity"),
    supabase.rpc("mentor_directory"),
    supabase.from("profiles").select("profession,mentor_bio,mentoring_style,accepting_mentees,max_mentees").eq("id", user.id).maybeSingle(),
    supabase.from("mentor_applications").select("profession,status,review_note"),
  ]);
  if (activity.error || directory.error || settings.error || applications.error) {
    return <section className="p-8"><h1 className="text-2xl font-semibold">Mentor Network</h1><p role="alert">Mentoring could not be loaded. Reload to try again.</p></section>;
  }
  const current = applications.data?.find((entry) => entry.profession === settings.data?.profession);
  const role = findRoleTrack(settings.data?.profession);
  const listings = (directory.data as Mentor[]).sort((first, second) =>
    Number(Boolean(role && findRoleTrack(second.profession)?.id === role.id)) -
    Number(Boolean(role && findRoleTrack(first.profession)?.id === role.id)));
  return <MentorsClient activity={activity.data as MentorActivity} directory={listings}
    settings={settings.data as MentorSettings | null} application={current as Application | undefined}
    canReview={reviewerAllowed(user.id)} />;
}
