import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CheckinSchema = z.object({
  mentorship_id: z.string().uuid(),
});

const DAY_MS = 86_400_000;

/**
 * Records a mentorship check-in and maintains the streak.
 *
 * The mentorships table already carried check_in_streak / last_checkin but
 * nothing ever wrote to them, so the streak shown on the mentors page was
 * permanently zero.
 */
export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = CheckinSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid mentorship" }, { status: 400 });
    }

    // RLS already limits mentorships to the mentor or mentee, but scope the
    // read explicitly so a valid id from another pairing cannot be used.
    const { data: mentorship } = await supabase
      .from("mentorships")
      .select("id, mentor_id, mentee_id, check_in_streak, last_checkin, status")
      .eq("id", parsed.data.mentorship_id)
      .eq("status", "active")
      .maybeSingle();

    if (!mentorship) {
      return NextResponse.json({ error: "Mentorship not found" }, { status: 404 });
    }
    if (mentorship.mentor_id !== user.id && mentorship.mentee_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const last = mentorship.last_checkin ? new Date(mentorship.last_checkin) : null;

    // Same UTC day → already checked in. Within 48h → streak continues.
    // Longer gap → streak resets to 1.
    const sameDay =
      last !== null &&
      last.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);

    if (sameDay) {
      return NextResponse.json({
        success: true,
        alreadyCheckedIn: true,
        check_in_streak: mentorship.check_in_streak ?? 0,
      });
    }

    const continues = last !== null && now.getTime() - last.getTime() <= 2 * DAY_MS;
    const streak = continues ? (mentorship.check_in_streak ?? 0) + 1 : 1;

    const { error } = await supabase
      .from("mentorships")
      .update({ check_in_streak: streak, last_checkin: now.toISOString() })
      .eq("id", mentorship.id);

    if (error) {
      console.error("[mentors/checkin]", error);
      return NextResponse.json({ error: "Failed to record check-in" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      alreadyCheckedIn: false,
      check_in_streak: streak,
    });
  } catch (err) {
    console.error("[mentors/checkin]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
