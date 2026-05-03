import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      messages,
      aiQuestionCount,
      userMessageCount,
      dependencyFlags,
      topics,
      sessionDurationSeconds
    } = body;

    const { data, error: insertError } = await supabase.from("mirror_sessions").insert({
      user_id: user.id,
      messages: messages,
      ai_question_count: aiQuestionCount || 0,
      user_message_count: userMessageCount || 0,
      dependency_flags: dependencyFlags || 0,
      topics: topics || [],
      session_duration_seconds: sessionDurationSeconds || 0
    }).select().single();

    if (insertError) {
      console.error("Mirror save error:", insertError.message, insertError.details);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, sessionId: data.id });
  } catch (error) {
    console.error("Mirror save error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
