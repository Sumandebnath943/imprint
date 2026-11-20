import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewerAllowed } from "@/lib/assessment/pilot";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const form = z.object({ id: z.uuid(), profession: z.string().min(1).max(100), approved: z.boolean(), note: z.string().trim().min(12).max(1000) });

export async function POST(request: Request) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !reviewerAllowed(user.id)) return NextResponse.json({ error: "Reviewer access required." }, { status: 403 });
  const input = form.safeParse(await request.json().catch(() => null));
  if (!input.success || user.id === input.data.id) return NextResponse.json({ error: "Choose a decision and give a review reason of at least 12 characters." }, { status: 400 });
  const { id, profession, approved, note } = input.data;
  const { data, error } = await createAdminClient().rpc("review_mentor_application", {
    p_reviewer: user.id, p_user: id, p_profession: profession, p_approved: approved, p_note: note,
  });
  if (error) return NextResponse.json({ error: error.code === "P0001" ? error.message : "Could not save the review. Try again." }, { status: error.code === "P0001" ? 409 : 500 });
  return NextResponse.json({ result: data });
}
