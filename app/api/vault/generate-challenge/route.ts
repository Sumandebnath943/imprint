import { NextRequest, NextResponse } from "next/server";
import { getChallengeTemplate, getChallengeGain } from "@/lib/vault/types";

export async function POST(req: NextRequest) {
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { skillId, skillName, cluster, currentStrength } = body;
    if (!skillId || !skillName) {
      return NextResponse.json({ error: "skillId and skillName required" }, { status: 400 });
    }

    const template = getChallengeTemplate(cluster ?? "life_personal", skillName);
    const gain = getChallengeGain(currentStrength ?? 60);

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
      strength_gained: gain,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ challenge: data });
  } catch (err) {
    console.error("[vault/generate-challenge]", err);
    return NextResponse.json({ error: "Failed to generate challenge" }, { status: 500 });
  }
}
