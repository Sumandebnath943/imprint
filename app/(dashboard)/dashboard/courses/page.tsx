import DashboardCoursesClient from "@/components/courses/DashboardCoursesClient";
import Link from "next/link";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { workspaceRole } from "@/lib/onboarding/workspace-catalog";

async function getData() {
  const empty = { waitlistJoined: false, userEmail: null, role: undefined };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const { data: profile } = await supabase
      .from("profiles")
      .select("waitlist_joined,profession")
      .eq("id", user.id)
      .single();

    const role = findRoleTrack(profile?.profession);
    return {
      waitlistJoined: profile?.waitlist_joined ?? false,
      userEmail: user.email || null,
      role: role && workspaceRole(role),
    };
  } catch {
    return empty;
  }
}

export default async function CoursesPage() {
  const data = await getData();
  return <>
    {data.role && <section className="mx-auto max-w-4xl space-y-3 px-5 pt-8">
      <h2 className="text-xl font-semibold">Practice resources for {data.role.name}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {data.role.tasks.map(({ skill, practice }) => <li key={skill} className="rounded-xl border border-white/10 p-4">
          <Link className="font-medium text-[#ffad89] underline" href={`/dashboard/forge?role_practice=${encodeURIComponent(skill)}`}>{skill}</Link>
          <p className="mt-1 text-sm text-white/75">{practice}</p>
        </li>)}
      </ul>
    </section>}
    <DashboardCoursesClient waitlistJoined={data.waitlistJoined} userEmail={data.userEmail} />
  </>;
}
