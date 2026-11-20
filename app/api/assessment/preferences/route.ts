import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const preferences = z.object({
  reminderEmails: z.boolean(),
  journalDays: z.number().int().min(0).max(7),
  timeZone: z.string().max(80).refine((zone) => {
    try { new Intl.DateTimeFormat("en", { timeZone: zone }); return true; }
    catch { return false; }
  }),
});

export async function PATCH(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to update preferences." }, { status: 401 });
  const parsed = preferences.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the reminder and journal settings." }, { status: 400 });
  const { error } = await supabase.rpc("update_imprint_task_preferences", {
    p_email: parsed.data.reminderEmails, p_journal_days: parsed.data.journalDays, p_zone: parsed.data.timeZone,
  });
  return error ? NextResponse.json({ error: "Preferences could not be saved." }, { status: 503 }) :
    NextResponse.json({ saved: true });
}
