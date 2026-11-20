import { NextResponse } from "next/server";
import { z } from "zod";
import { buildModuleList, PROFESSIONS } from "@/lib/onboarding/modules";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { whoAreYouSchema, aiExposureSchema } from "@/lib/validations/onboarding.schema";
import { ADULT_ONLY_MESSAGE, hasConfirmedAdultAge } from "@/lib/auth/eligibility";
import { loadWorkspace } from "@/lib/onboarding/workspace-access";
import { ONBOARDING_WORK_VERSION } from "@/lib/onboarding/workspace-catalog";

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
  if (!hasConfirmedAdultAge(user)) return NextResponse.json({ error: ADULT_ONLY_MESSAGE }, { status: 403 });
  const parsed = finishSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your profession and selected skills." }, { status: 400 });

  const { profession, ageGroup, aiExposureLevel, aiUseContext, reflection, skills } = parsed.data;
  const role = PROFESSIONS.find(({ name }) => name === profession);
  if (!role) return NextResponse.json({ error: "Choose a supported profession." }, { status: 400 });
  const uniqueSkills = Array.from(new Map(skills.map((skill) => [skill.name.toLowerCase(), skill])).values());
  if (uniqueSkills.length < 3) return NextResponse.json({ error: "Select at least three different skills." }, { status: 400 });

  try {
    const workspace = await loadWorkspace(supabase, user.id, role.id, undefined, true);
    const common = {
      p_user_id: user.id,
      p_profession: role.name,
      p_cluster: role.cluster,
      p_age_group: ageGroup,
      p_exposure: aiExposureLevel,
      p_context: aiUseContext,
      p_skills: uniqueSkills.map(({ name, strengthLevel }) => ({ name, strength: strengthLevel })),
      p_reflection: reflection,
    };
    const admin = createAdminClient();
    const { error } = workspace
      ? await admin.rpc("finish_workspace_onboarding", { ...common, p_role: role.id, p_rubric: ONBOARDING_WORK_VERSION })
      : await admin.rpc("finish_selected_profession_onboarding", { ...common, p_required_modules: buildModuleList(role.cluster).map(({ id }) => id) });
    if (error?.code === "P0001") {
      return NextResponse.json({ error: "Your profession and all seven baseline responses must match before finishing." }, { status: 409 });
    }
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding completion failed", error instanceof Error ? error.name : "Database request");
    return NextResponse.json({ error: "Onboarding could not be completed. Your saved responses are still available." }, { status: 500 });
  }
}
