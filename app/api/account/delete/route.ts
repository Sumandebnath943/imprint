import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

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
    const { createClient: createAdminClient } = await import("@supabase/supabase-js");
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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
