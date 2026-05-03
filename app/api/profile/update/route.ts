import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: body.full_name,
        username: body.username,
        bio: body.bio,
        location: body.location,
        age_group: body.age_group || null,
        profession: body.profession || null,
        profession_cluster: body.profession_cluster || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (_err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
