import { NextResponse } from "next/server";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { ADULT_ONLY_MESSAGE, hasConfirmedAdultAge } from "@/lib/auth/eligibility";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to choose a profession." }, { status: 401 });
  if (!hasConfirmedAdultAge(user)) return NextResponse.json({ error: ADULT_ONLY_MESSAGE }, { status: 403 });
  const input = await request.json().catch(() => null);
  const role = typeof input?.role === "string" ? findRoleTrack(input.role) : undefined;
  if (!role) return NextResponse.json({ error: "Choose a supported profession." }, { status: 400 });

  const { data, error } = await supabase.from("profiles").update({ profession: role.name, profession_cluster: role.cluster })
    .eq("id", user.id).or("onboarding_completed.is.null,onboarding_completed.eq.false").select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Your profession could not be saved. Try again." }, { status: 503 });
  if (!data) return NextResponse.json({ error: "Change your profession from your Profile." }, { status: 409 });
  return NextResponse.json({ role: role.id });
}
