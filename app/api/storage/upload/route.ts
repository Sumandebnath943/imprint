import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string;
    const path = formData.get("path") as string;

    if (!file || !bucket || !path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure path starts with user id for security (RLS requires this anyway)
    if (!path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "Invalid path, must start with user ID" }, { status: 403 });
    }

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: file.type
    });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    return NextResponse.json({ success: true, url: urlData.publicUrl });
  } catch (error) {
    console.error("Storage route error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
