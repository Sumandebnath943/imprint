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
      cluster,
      module_id,
      module_name,
      prompt_given,
      response_text,
      response_audio_url,
      response_file_url,
      response_type,
      word_count,
      avg_sentence_length,
      vocabulary_richness,
      response_time_seconds,
      step_data,
      is_final_step,
      initial_skills, // Array of { skill_name, strength_level } for final step
    } = body;

    // 1. Insert into baseline_imprints
    const { error: baselineError } = await supabase.from("baseline_imprints").insert({
      user_id: user.id,
      cluster,
      module_id,
      module_name,
      prompt_given,
      response_text: response_text ?? null,
      response_audio_url: response_audio_url ?? null,
      response_file_url: response_file_url ?? null,
      response_type,
      word_count: word_count ?? 0,
      avg_sentence_length: avg_sentence_length ?? null,
      vocabulary_richness: vocabulary_richness ?? null,
      response_time_seconds: response_time_seconds ?? null,
    });

    if (baselineError) {
      console.error("Error inserting baseline:", baselineError);
      return NextResponse.json({ error: "Failed to save baseline module" }, { status: 500 });
    }

    // 2. Update profiles with step data
    const profileUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (step_data) {
      if (step_data.profession !== undefined)          profileUpdate.profession = step_data.profession;
      if (step_data.profession_cluster !== undefined)  profileUpdate.profession_cluster = step_data.profession_cluster;
      if (step_data.age_group !== undefined)           profileUpdate.age_group = step_data.age_group;
      if (step_data.ai_exposure_level !== undefined)   profileUpdate.ai_exposure_level = step_data.ai_exposure_level;
      if (step_data.ai_use_context !== undefined)      profileUpdate.ai_use_context = step_data.ai_use_context;
      if (step_data.onboarding_step !== undefined)     profileUpdate.onboarding_step = step_data.onboarding_step;
    }

    if (is_final_step) {
      profileUpdate.onboarding_completed = true;
    }

    if (Object.keys(profileUpdate).length > 1) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
      }
    }

    // 3. On final step: insert initial skill_vault rows from onboarding skill selections
    if (is_final_step && Array.isArray(initial_skills) && initial_skills.length > 0) {
      const now = new Date().toISOString();
      const skillRows = initial_skills.map(
        (s: { skill_name: string; strength_level?: number; cluster?: string }) => ({
          user_id: user.id,
          skill_name: s.skill_name,
          cluster: s.cluster ?? cluster ?? "general",
          strength_level: s.strength_level ?? 60,
          decay_rate: 0.5,
          last_exercised: now,
          times_practiced: 0,
        })
      );

      const { error: vaultError } = await supabase
        .from("skill_vault")
        .insert(skillRows);

      if (vaultError) {
        // Non-fatal — log but don't block
        console.error("Error inserting initial vault skills:", vaultError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Baseline save error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
