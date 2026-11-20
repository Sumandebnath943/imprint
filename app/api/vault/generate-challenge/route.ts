import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { getChallengeTemplate } from "@/lib/vault/types";
import { findRoleTrack } from "@/lib/assessment/catalog";

export async function POST(req: NextRequest) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = z.object({ skillId: z.uuid() }).safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Choose a skill." }, { status: 400 });
    const { skillId } = parsed.data;
    const { data: skill, error: lookupError } = await supabase.from("skill_vault")
      .select("skill_name,cluster").eq("id", skillId).eq("user_id", user.id).maybeSingle();
    if (lookupError) throw lookupError;
    if (!skill) return NextResponse.json({ error: "Skill unavailable." }, { status: 404 });
    const { data: existing, error: challengeError } = await supabase.from("vault_challenges")
      .select("*").eq("user_id", user.id).eq("status", "pending").order("due_date").limit(1).maybeSingle();
    if (challengeError) throw challengeError;
    if (existing) return NextResponse.json({ error: "Complete your pending Vault challenge first." }, { status: 409 });
    const { data: profile } = await supabase.from("profiles").select("profession").eq("id", user.id).maybeSingle();
    const task = findRoleTrack(profile?.profession)?.tasks.find((item) =>
      item.skill.toLowerCase() === skill.skill_name.toLowerCase());
    const template = task ? {
      title: `Practice ${task.skill.toLowerCase()}`,
      description: task.practice,
      type: task.mode === "image" ? "creative_production" : task.mode === "voice" ? "explanation_exercise" : "reasoning_exercise",
    } : getChallengeTemplate(skill.cluster, skill.skill_name);

    const due = new Date();
    due.setDate(due.getDate() + 3);

    const { data, error } = await supabase.from("vault_challenges").insert({
      user_id: user.id,
      skill_id: skillId,
      challenge_title: template.title,
      challenge_description: template.description,
      challenge_type: template.type,
      assigned_date: new Date().toISOString().split("T")[0],
      due_date: due.toISOString().split("T")[0],
      status: "pending",
      strength_gained: 0,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ challenge: data });
  } catch (err) {
    console.error("[vault/generate-challenge]", err);
    return NextResponse.json({ error: "Failed to generate challenge" }, { status: 500 });
  }
}
