import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const allowed: Record<string, { folder: string; types: RegExp }> = {
  "baseline-audio": { folder: "baseline", types: /^(audio|video)\/(webm|mp4|ogg|mpeg|wav)$/ },
  "baseline-files": { folder: "baseline", types: /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/ },
  "forge-audio": { folder: "forge", types: /^(audio|video)\/(webm|mp4|ogg|mpeg|wav)$/ },
  "forge-files": { folder: "forge", types: /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/ },
};

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const bucket = formData.get("bucket");
    const path = formData.get("path");

    if (!(file instanceof File) || typeof bucket !== "string" || typeof path !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure path starts with user id for security (RLS requires this anyway)
    const config = Object.hasOwn(allowed, bucket) ? allowed[bucket] : null;
    if (!config || !path.startsWith(`${user.id}/${config.folder}/`) ||
        !/^[A-Za-z0-9_-]+\.[a-zA-Z0-9]{1,8}$/.test(path.split("/")[2] ?? "") || path.split("/").length !== 3) {
      return NextResponse.json({ error: "Invalid path, must start with user ID" }, { status: 403 });
    }

    const type = file.type.split(";")[0];
    if (!config.types.test(type) || !file.size || file.size > 4000000) {
      return NextResponse.json({ error: "Choose a supported attachment under 4 MB." }, { status: 400 });
    }
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: type
    });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, path });
  } catch (error) {
    console.error("Storage route error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
