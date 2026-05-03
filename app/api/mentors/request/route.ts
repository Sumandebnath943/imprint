import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { mentor_id, message } = await req.json();
    if (!mentor_id || mentor_id === user.id) {
      return NextResponse.json({ error: "Invalid mentor ID" }, { status: 400 });
    }

    // Check if mentor is accepting
    const { data: mentorData } = await supabase
      .from("profiles")
      .select("accepting_mentees, max_mentees")
      .eq("id", mentor_id)
      .single();

    if (!mentorData || !mentorData.accepting_mentees) {
      return NextResponse.json({ error: "Mentor is not accepting requests right now" }, { status: 400 });
    }

    // Insert request
    const { data, error } = await supabase
      .from("mentorship_requests")
      .insert({
        requester_id: user.id,
        mentor_id,
        message: message || null,
        status: "pending"
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Request already exists or failed to send" }, { status: 400 });
    }

    return NextResponse.json({ success: true, request: data });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
