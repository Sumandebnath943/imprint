import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const buckets = ["assessment-evidence", "baseline-audio", "baseline-files", "forge-audio", "forge-files", "gallery", "avatars"];

async function readAccountFiles(bucket: ReturnType<ReturnType<typeof createAdminClient>["storage"]["from"]>, folder: string): Promise<string[]> {
  const files: string[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await bucket.list(folder, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    for (const item of data ?? []) {
      const path = `${folder}/${item.name}`;
      if (item.id) files.push(path);
      else files.push(...await readAccountFiles(bucket, path));
    }
    if ((data?.length ?? 0) < 100) return files;
  }
}

// The client must echo back the exact phrase shown in the confirmation UI.
// This is a second gate behind the typed confirmation in the dialog itself.
const DeleteSchema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT"),
});

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = DeleteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Type the confirmation phrase exactly to continue." },
        { status: 400 }
      );
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.error("[account/delete] SUPABASE_SERVICE_ROLE_KEY is not set");
      return NextResponse.json(
        { error: "Account deletion is not configured on this deployment." },
        { status: 500 }
      );
    }

    // Deleting the auth user requires the admin API. Every application table
    // references profiles(id) with ON DELETE CASCADE, and profiles references
    // auth.users(id) the same way, so removing the auth user removes all of
    // this user's rows in one step.
    const admin = createAdminClient();
    const paths = await Promise.all(buckets.map(async (name) => {
      const bucket = admin.storage.from(name);
      return { bucket, files: await readAccountFiles(bucket, user.id) };
    }));
    for (const { bucket, files } of paths) {
      for (let index = 0; index < files.length; index += 100) {
        const { error } = await bucket.remove(files.slice(index, index + 100));
        if (error) throw error;
      }
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("[account/delete]", error);
      return NextResponse.json(
        { error: "Failed to delete account. Please contact support." },
        { status: 500 }
      );
    }

    // Clear the now-orphaned session cookies.
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[account/delete]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
