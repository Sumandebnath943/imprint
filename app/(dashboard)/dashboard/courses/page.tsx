import DashboardCoursesClient from "@/components/courses/DashboardCoursesClient";

async function getData() {
  const empty = { waitlistJoined: false, userEmail: null };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const { data: profile } = await supabase
      .from("profiles")
      .select("waitlist_joined")
      .eq("id", user.id)
      .single();

    return {
      waitlistJoined: profile?.waitlist_joined ?? false,
      userEmail: user.email || null
    };
  } catch {
    return empty;
  }
}

export default async function CoursesPage() {
  const data = await getData();
  return <DashboardCoursesClient waitlistJoined={data.waitlistJoined} userEmail={data.userEmail} />;
}
