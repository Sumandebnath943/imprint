export type Mentor = {
  id: string; full_name: string; profession: string; mentor_bio: string | null;
  mentoring_style: string[] | null; remaining_capacity: number;
};
export type Pair = { id: string; role: "mentor" | "mentee"; name: string; profession: string | null; check_in_streak: number | null; last_checkin: string | null };
export type MentorRequest = {
  id: string; direction: "inbox" | "outgoing"; name: string; status: "pending" | "accepted" | "declined";
  message: string | null; counterpart_id: string;
};
export type MentorActivity = { pairs: Pair[]; requests: MentorRequest[]; eligible: boolean; remaining_capacity: number };
export type MentorSettings = { profession: string | null; mentor_bio: string | null; mentoring_style: string[] | null; accepting_mentees: boolean | null; max_mentees: number | null };
export type Application = { status: "pending" | "approved" | "declined"; review_note: string | null };
