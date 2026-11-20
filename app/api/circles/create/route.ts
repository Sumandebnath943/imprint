import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const input = z.object({
  name: z.string().trim().min(2).max(60), description: z.string().trim().max(500).default(""),
  clusterFocus: z.string().trim().min(1).max(60), isPrivate: z.boolean().default(true),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to create a circle." }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the circle name, description and cluster." }, { status: 400 });
  const { name, description, clusterFocus, isPrivate } = parsed.data;
  const { data, error } = await supabase.rpc("create_human_circle", {
    p_name: name, p_description: description, p_focus: clusterFocus, p_private: isPrivate,
  });
  if (error) return NextResponse.json({ error: "Could not create your circle. Try again." }, { status: 500 });
  return NextResponse.json({ success: true, circle: data, inviteCode: data.invite_code });
}
