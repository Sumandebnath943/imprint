import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const checkinSchema = z.object({
  circle_id: z.string().uuid(),
  checkin_type: z.string().min(1),
  content: z.string().max(280, "Check-in content must be 280 characters or less."),
  drift_score_shared: z.number().nullable().optional()
});

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = checkinSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { circle_id, checkin_type, content, drift_score_shared } = parsed.data;

    // Verify membership
    const { data: membership } = await supabase
      .from("circle_members")
      .select("id")
      .eq("circle_id", circle_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this circle" }, { status: 403 });
    }

    // Insert check-in
    const { data, error } = await supabase
      .from("circle_checkins")
      .insert({
        circle_id,
        user_id: user.id,
        checkin_type,
        content,
        drift_score_shared: drift_score_shared ?? null
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to post check-in" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (_err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
