import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateInviteCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description, clusterFocus, isPrivate } = body;
    
    console.log('Creating circle for user:', user.id);
    console.log('Circle data:', { name, description, clusterFocus, isPrivate });

    if (!name || !clusterFocus) {
      return NextResponse.json({ error: "Name and cluster focus required" }, { status: 400 });
    }

    // Generate unique invite code
    let inviteCode = "";
    let isUnique = false;
    while (!isUnique) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data } = await supabase.from("human_circles").select("id").eq("invite_code", inviteCode).single();
      if (!data) isUnique = true;
    }

    // Use service role to bypass RLS recursion for both circle and member
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insert circle
    const { data: circle, error: circleError } = await supabaseAdmin
      .from("human_circles")
      .insert({
        name,
        description: description || "",
        cluster_focus: clusterFocus || "",
        created_by: user.id,
        member_limit: 8,
        is_private: isPrivate ?? true,
        invite_code: inviteCode
      })
      .select()
      .single();

    if (circleError || !circle) {
      console.error("Circle create error:", circleError);
      return NextResponse.json({ error: circleError?.message || "Failed to create circle" }, { status: 500 });
    }

    const { error: memberError } = await supabaseAdmin
      .from("circle_members")
      .insert({
        circle_id: circle.id,
        user_id: user.id,
        role: "admin",
      });

    if (memberError) {
      console.error("Circle member error:", memberError);
    }

    return NextResponse.json({ success: true, circle, inviteCode });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
