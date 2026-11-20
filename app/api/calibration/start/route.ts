import { NextResponse } from "next/server";
import { buildCalibrationPrompts } from "@/lib/calibration/prompts";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { findRoleTrack } from "@/lib/assessment/catalog";

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to calibrate." }, { status: 401 });
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("profession,profession_cluster,onboarding_completed").eq("id", user.id).single();
    if (profileError || !profile?.onboarding_completed) {
      return NextResponse.json({ error: "Finish onboarding to start a calibration." }, { status: 409 });
    }
    if (findRoleTrack(profile.profession)) {
      return NextResponse.json({ error: "Open Calibration to start work for your profession." }, { status: 409 });
    }

    const prompts = Array.from({ length: 6 }, (_, index) =>
      buildCalibrationPrompts(index + 1, profile.profession_cluster ?? "life_personal"));
    const { data, error } = await createAdminClient().rpc("start_imprint_calibration", {
      p_user_id: user.id,
      p_cluster: profile.profession_cluster,
      p_prompt_sets: prompts,
      p_due: new Date(Date.now() + 14 * 86400000).toISOString(),
    });
    if (error) throw error;
    const session = Array.isArray(data) ? data[0] : data;
    if (!session) throw new Error("No calibration was returned");
    return NextResponse.json({ session });
  } catch (error) {
    console.error("Calibration start failed", error);
    return NextResponse.json({ error: "Could not start calibration." }, { status: 500 });
  }
}
