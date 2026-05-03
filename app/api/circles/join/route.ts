import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { invite_code } = await req.json();
    if (!invite_code) {
      return NextResponse.json({ error: "Invite code required" }, { status: 400 });
    }

    // Find circle
    const { data: circle } = await supabase
      .from("human_circles")
      .select("id, name, member_limit")
      .eq("invite_code", invite_code.toUpperCase())
      .single();

    if (!circle) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 404 });
    }

    // Check if user is already a member
    const { data: existing } = await supabase
      .from("circle_members")
      .select("id")
      .eq("circle_id", circle.id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }

    // Check member limit
    const { count } = await supabase
      .from("circle_members")
      .select("*", { count: "exact", head: true })
      .eq("circle_id", circle.id);

    if (count !== null && count >= circle.member_limit) {
      return NextResponse.json({ error: "This circle is full (8/8 members)." }, { status: 400 });
    }

    // Join circle
    const { error: joinError } = await supabase
      .from("circle_members")
      .insert({
        circle_id: circle.id,
        user_id: user.id,
        role: "member",
      });

    if (joinError) {
      return NextResponse.json({ error: "Failed to join circle" }, { status: 500 });
    }

    return NextResponse.json({ success: true, circle });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
