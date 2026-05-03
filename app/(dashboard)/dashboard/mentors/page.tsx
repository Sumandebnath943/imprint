import MentorsClient from "@/components/mentors/MentorsClient";

async function getData() {
  const empty = { myMentorship: null, myMentees: [], eligibleToMentor: false, availableMentors: [], userId: "" };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    // Check if user is a mentee
    const { data: myMentorshipData } = await supabase
      .from("mentorships")
      .select(`*, mentor:profiles!mentorships_mentor_id_fkey(id, full_name, imprint_score, mentor_bio, mentoring_style, max_mentees)`)
      .eq("mentee_id", user.id)
      .eq("status", "active")
      .single();

    // Check if user is a mentor (has mentees)
    const { data: myMenteesData } = await supabase
      .from("mentorships")
      .select(`*, mentee:profiles!mentorships_mentee_id_fkey(id, full_name, imprint_score)`)
      .eq("mentor_id", user.id)
      .eq("status", "active");

    // Fetch available mentors
    const { data: mentors } = await supabase
      .from("profiles")
      .select("id, full_name, imprint_score, accepting_mentees, max_mentees, mentor_bio, mentoring_style")
      .eq("leaderboard_opt_in", true); // Simple filtering criteria for discovery

    // Check eligibility: IMPRINT > 500, drift check is simplified here
    const { data: profile } = await supabase.from("profiles").select("imprint_score").eq("id", user.id).single();
    const eligibleToMentor = (profile?.imprint_score || 0) > 500;

    return {
      userId: user.id,
      myMentorship: myMentorshipData as Record<string, unknown>,
      myMentees: (myMenteesData as Record<string, unknown>[]) || [],
      eligibleToMentor,
      availableMentors: (mentors as Record<string, unknown>[]) || []
    };
  } catch {
    return empty;
  }
}

export default async function MentorsPage() {
  const data = await getData();
  return <MentorsClient {...data} />;
}
