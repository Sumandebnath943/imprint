import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId, responses } = await req.json();
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const { error } = await supabase.from("calibration_sessions")
      .update({ responses, updated_at: new Date().toISOString() })
      .eq("id", sessionId).eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[calibration/save-progress]", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
