import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { suggestion_text } = await req.json();

    if (!suggestion_text || suggestion_text.length > 200) {
      return NextResponse.json({ error: "Invalid suggestion" }, { status: 400 });
    }

    const { error } = await supabase
      .from("course_suggestions")
      .insert({
        user_id: user.id,
        suggestion_text
      });

    if (error) {
      return NextResponse.json({ error: "Failed to submit suggestion" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
