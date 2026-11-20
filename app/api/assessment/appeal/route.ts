import { NextResponse } from "next/server";
import { z } from "zod";
import { reviewerAllowed } from "@/lib/assessment/pilot";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const input = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), id: z.uuid(), reason: z.string().trim().min(12).max(1200) }),
  z.object({ action: z.literal("resolve"), id: z.uuid(), resolution: z.string().trim().min(12).max(1200) }),
]);

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to request a review." }, { status: 401 });
    const result = input.safeParse(await request.json().catch(() => null));
    if (!result.success) return NextResponse.json({ error: "Describe what should be reviewed." }, { status: 400 });
    const admin = createAdminClient();
    if (result.data.action === "request") {
      const { data, error } = await supabase.from("role_assessments").select("id")
        .eq("id", result.data.id).eq("user_id", user.id).eq("status", "scored").maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Assessment unavailable." }, { status: 404 });
      const saved = await admin.from("assessment_review_requests").insert({
        user_id: user.id, assessment_id: data.id, reason: result.data.reason,
      });
      if (saved.error?.code === "23505") return NextResponse.json({ error: "A review already exists for this assessment." }, { status: 409 });
      if (saved.error) throw saved.error;
    } else {
      if (!reviewerAllowed(user.id)) return NextResponse.json({ error: "Review unavailable." }, { status: 404 });
      const { data, error } = await admin.from("assessment_review_requests")
        .update({ resolution: result.data.resolution, resolved_at: new Date().toISOString() })
        .eq("id", result.data.id).neq("user_id", user.id).is("resolved_at", null).select("id").maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "Review unavailable." }, { status: 404 });
    }
    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "The review could not be saved. Try again." }, { status: 503 });
  }
}
