import { NextResponse } from "next/server";
import { z } from "zod";
import { buildModuleList, PROFESSIONS } from "@/lib/onboarding/modules";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { whoAreYouSchema, aiExposureSchema } from "@/lib/validations/onboarding.schema";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { isRoleScoringEnabled } from "@/lib/assessment/pilot";

const finishSchema = z.object({
  profession: z.string(),
  ageGroup: whoAreYouSchema.shape.age_group,
  aiExposureLevel: aiExposureSchema.shape.ai_exposure_level,
  aiUseContext: z.array(z.string().max(120)).max(20),
  reflection: z.string().max(2000).optional().default(""),
  skills: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    strengthLevel: z.number().int().min(0).max(100),
  })).min(3).max(12),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to complete onboarding." }, { status: 401 });
  const parsed = finishSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your profession and selected skills." }, { status: 400 });

  const { profession, ageGroup, aiExposureLevel, aiUseContext, reflection, skills } = parsed.data;
  const role = PROFESSIONS.find(({ name }) => name === profession);
  if (!role) return NextResponse.json({ error: "Choose a supported profession." }, { status: 400 });
  const uniqueSkills = Array.from(new Map(skills.map((skill) => [skill.name.toLowerCase(), skill])).values());
  if (uniqueSkills.length < 3) return NextResponse.json({ error: "Select at least three different skills." }, { status: 400 });

  try {
    const track = findRoleTrack(profession);
    const usingAssessment = Boolean(track && isRoleScoringEnabled(track.id));
    if (track && usingAssessment) {
      const { data, error } = await supabase.from("role_assessments").select("id")
        .eq("user_id", user.id).eq("role_id", track.id).eq("rubric_version", track.version)
        .eq("form", 0).eq("status", "scored").maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Complete the role assessment before finishing onboarding." }, { status: 409 });
    }
    const { error } = await createAdminClient().rpc("finish_imprint_onboarding_with_reflection", {
      p_user_id: user.id,
      p_profession: role.name,
      p_cluster: role.cluster,
      p_age_group: ageGroup,
      p_exposure: aiExposureLevel,
      p_context: aiUseContext,
      p_skills: uniqueSkills.map(({ name, strengthLevel }) => ({ name, strength: strengthLevel })),
      p_required_modules: usingAssessment ? [] : buildModuleList(role.cluster).map(({ id }) => id),
      p_reflection: reflection,
    });
    if (error?.code === "P0001") {
      return NextResponse.json({ error: "Save every required baseline response before finishing." }, { status: 409 });
    }
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding completion failed", error instanceof Error ? error.name : "Database request");
    return NextResponse.json({ error: "Onboarding could not be completed. Your saved responses are still available." }, { status: 500 });
  }
}
