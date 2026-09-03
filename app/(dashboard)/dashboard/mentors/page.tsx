import MentorsClient, {
  type MentorProfile,
  type Mentorship,
} from "@/components/mentors/MentorsClient";

interface MentorsData {
  userId: string;
  myMentorship: Mentorship | null;
  myMentees: Mentorship[];
  eligibleToMentor: boolean;
  availableMentors: MentorProfile[];
}

const MENTOR_FIELDS =
  "id, full_name, imprint_score, accepting_mentees, max_mentees, mentor_bio, mentoring_style";

async function getData(): Promise<MentorsData> {
  const empty: MentorsData = {
    userId: "",
    myMentorship: null,
    myMentees: [],
    eligibleToMentor: false,
    availableMentors: [],
  };
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return empty;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    // Mentorships where the viewer is the mentee. maybeSingle() rather than
    // single(), which errors when there is no active mentorship.
    const { data: myMentorshipData } = await supabase
      .from("mentorships")
      .select("*")
      .eq("mentee_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const { data: myMenteesData } = await supabase
      .from("mentorships")
      .select("*")
      .eq("mentor_id", user.id)
      .eq("status", "active");

    // Counterpart profiles are read from public_profiles (migration 006).
    // Embedding `profiles!fk(...)` here used to return null for everyone —
    // profiles is owner-only, so the join was silently stripped by RLS.
    const counterpartIds = [
      ...(myMentorshipData ? [myMentorshipData.mentor_id] : []),
      ...(myMenteesData ?? []).map((m) => m.mentee_id),
    ].filter(Boolean);

    const counterparts = new Map<string, MentorProfile>();
    if (counterpartIds.length > 0) {
      const { data: people } = await supabase
        .from("public_profiles")
        .select(MENTOR_FIELDS)
        .in("id", counterpartIds);
      for (const p of (people ?? []) as MentorProfile[]) {
        counterparts.set(p.id, p);
      }
    }

    // Discovery: people actually accepting mentees, excluding the viewer.
    // The old query filtered on leaderboard_opt_in, which is a different
    // opt-in entirely, and included the viewer themselves.
    const { data: mentors } = await supabase
      .from("public_profiles")
      .select(MENTOR_FIELDS)
      .eq("accepting_mentees", true)
      .neq("id", user.id)
      .order("imprint_score", { ascending: false })
      .limit(50);

    const { data: profile } = await supabase
      .from("profiles")
      .select("imprint_score")
      .eq("id", user.id)
      .single();

    return {
      userId: user.id,
      myMentorship: myMentorshipData
        ? { ...(myMentorshipData as Mentorship), mentor: counterparts.get(myMentorshipData.mentor_id) }
        : null,
      myMentees: (myMenteesData ?? []).map((m) => ({
        ...(m as Mentorship),
        mentee: counterparts.get(m.mentee_id),
      })),
      eligibleToMentor: (profile?.imprint_score ?? 0) > 500,
      availableMentors: (mentors ?? []) as MentorProfile[],
    };
  } catch {
    return empty;
  }
}

export const dynamic = "force-dynamic";

export default async function MentorsPage() {
  const data = await getData();
  return <MentorsClient {...data} />;
}
