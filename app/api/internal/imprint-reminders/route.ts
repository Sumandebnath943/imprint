import { createHmac, timingSafeEqual } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { NextResponse } from "next/server";
import { hasConfirmedAdultAge } from "@/lib/auth/eligibility";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;
type Reminder = { task_id: string; event: string; task_kind: string; schedule_revision: number };

function authorized(request: Request) {
  const secret = process.env.IMPRINT_CRON_SECRET;
  if (!secret) return false;
  const bearer = Buffer.from(request.headers.get("authorization") ?? "");
  const expectedBearer = Buffer.from(`Bearer ${secret}`);
  if (bearer.length === expectedBearer.length && timingSafeEqual(bearer, expectedBearer)) return true;

  // pg_net queues the headers in Postgres, so the job sends a short-lived signature.
  const timestamp = request.headers.get("x-imprint-timestamp") ?? "";
  const signature = request.headers.get("x-imprint-signature") ?? "";
  if (!/^\d{10}$/.test(timestamp) || !/^[a-f0-9]{64}$/.test(signature)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 90) return false;
  const expected = createHmac("sha256", secret).update(`imprint-reminders:${timestamp}`).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { RESEND_API_KEY: key, IMPRINT_REMINDER_FROM: sender, NEXT_PUBLIC_APP_URL: origin } = process.env;
  if (!key || !sender || !origin) return NextResponse.json({ error: "Reminder delivery is unconfigured." }, { status: 503 });

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("claim_imprint_reminders", { p_limit: 25 });
  if (error) return NextResponse.json({ error: "Reminders could not be scheduled." }, { status: 503 });

  const reminders = data as Reminder[];
  const deadline = AbortSignal.timeout(43000);
  async function sendReminder(item: Reminder) {
    const { data: current, error: lookupError } = await admin.from("imprint_tasks")
      .select("user_id,completed_at,schedule_revision,profiles!inner(notification_preferences)")
      .eq("id", item.task_id).maybeSingle();
    if (lookupError) throw lookupError;
    const profile = Array.isArray(current?.profiles) ? current.profiles[0] : current?.profiles;
    if (!current || current.completed_at || current.schedule_revision !== item.schedule_revision ||
        profile?.notification_preferences?.imprint_task_emails !== true) return false;

    const { data: { user }, error: authError } = await admin.auth.admin.getUserById(current.user_id);
    if (authError && authError.status !== 404) throw authError;
    if (!user?.email || !user.email_confirmed_at || !hasConfirmedAdultAge(user)) return false;

    const subject = item.event === "scheduled" ? "An Imprint task is scheduled" :
      item.event === "due-soon" ? "An Imprint task is due soon" : "An Imprint task is overdue";
    const link = new URL("/dashboard/drift", origin).toString();
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`, "Content-Type": "application/json",
        "Idempotency-Key": `imprint/${item.task_id}/${item.schedule_revision}/${item.event}`,
      },
      body: JSON.stringify({
        from: sender, to: [user.email], subject,
        text: `Your ${item.task_kind} is ${item.event.replace("-", " ")}. View the task and manage reminder preferences in Imprint.\n\n${link}`,
      }),
      signal: AbortSignal.any([deadline, AbortSignal.timeout(12000)]),
    });
    if (!result.ok) throw new Error("Email delivery did not complete");
    const email = await result.json();
    const { error: logError } = await admin.from("imprint_reminder_delivery")
      .update({ sent_at: new Date().toISOString(), provider_id: email.id })
      .eq("task_id", item.task_id).eq("schedule_revision", item.schedule_revision).eq("event", item.event);
    if (logError) throw logError;
    return true;
  }

  let sent = 0;
  let retry = 0;
  let processed = 0;
  const batchSize = 4;
  // Leave room for Auth emails on the shared Resend account.
  while (!deadline.aborted && processed < reminders.length) {
    const batch = await Promise.allSettled(reminders.slice(processed, processed + batchSize).map(sendReminder));
    sent += batch.filter((result) => result.status === "fulfilled" && result.value).length;
    retry += batch.filter((result) => result.status === "rejected").length;
    processed += batch.length;
    if (processed < reminders.length && !deadline.aborted) await delay(1100, undefined, { signal: deadline }).catch(() => {});
  }
  return NextResponse.json({ claimed: reminders.length, sent, retry: retry + reminders.length - processed });
}
