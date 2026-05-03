import { NextResponse } from "next/server";
import { buildCalibrationPrompts } from "@/lib/calibration/prompts";

export async function POST() {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get cluster
    const profileRes = await supabase.from("profiles").select("profession_cluster").eq("id", user.id).single();
    const cluster = profileRes.data?.profession_cluster ?? "life_personal";

    // Get session count for this user
    const { count } = await supabase
      .from('calibration_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const sessionNumber = (count || 0) + 1;
    const prompts = buildCalibrationPrompts(sessionNumber, cluster);

    const { data: session, error } = await supabase.from("calibration_sessions").insert({
      user_id: user.id,
      session_number: sessionNumber,
      status: "in_progress",
      responses: [],
      next_session_due: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    }).select().single();

    if (error) {
      console.error("Calibration start error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Add prompts directly to session object for the client
    session.prompts = prompts;
    
    return NextResponse.json({ success: true, session });
  } catch (err) {
    console.error("[calibration/start]", err);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}
