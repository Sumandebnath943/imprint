import { NextResponse } from "next/server";
import { archiveLimit, ExportArchive, ExportLimitError } from "@/lib/account/tar";
import { createClient } from "@/lib/supabase/server";

const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const pageSize = 100;
const maxRows = 5000;
const buckets = ["assessment-evidence", "baseline-audio", "baseline-files", "forge-audio", "forge-files", "gallery", "avatars"];
const tables = [
  { table: "profiles", owner: "id", fields: "id,email,full_name,username,bio,location,avatar_url,profession,profession_cluster,age_group,ai_exposure_level,ai_use_context,onboarding_completed,onboarding_step,notification_preferences,leaderboard_opt_in,credential_public,created_at,updated_at" },
  { table: "role_assessments", fields: "id,user_id,role_id,rubric_version,form,status,role_context,answers,results,score,consent_version,created_at,scored_at" },
  { table: "baseline_imprints" }, { table: "drift_scores" }, { table: "skill_vault" }, { table: "vault_challenges" },
  { table: "journal_entries" }, { table: "calibration_sessions" }, { table: "mirror_sessions" }, { table: "beliefs" },
  { table: "imprint_tasks" }, { table: "historical_evidence" }, { table: "assessment_review_requests" },
  { table: "onboarding_reflections", order: "user_id" },
  { table: "course_suggestions" }, { table: "circle_members" }, { table: "circle_checkins" }, { table: "checkin_reactions" },
  { table: "human_circles", owner: "created_by", fields: "id,name,description,cluster_focus,member_limit,is_private,created_at" },
  { table: "circle_challenges", owner: "assigned_by" }, { table: "circle_challenge_responses", order: "challenge_id" },
  { table: "mentor_applications", order: "profession", fields: "user_id,profession,status,submitted_at,reviewed_at,review_note" },
  { table: "mentorship_requests", owner: "requester_id" }, { table: "mentor_reviews", owner: "reviewer_id" },
  { table: "mentorships", owner: "mentor_id" }, { table: "mentorships", owner: "mentee_id" },
];

function removeStorageTokens(_key: string, value: unknown) {
  if (typeof value === "string" && /^https?:\/\/[^/]+\/storage\/v1\/object\/(sign|authenticated)\//i.test(value)) {
    return value.split(/[?#]/, 1)[0];
  }
  return value;
}

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to export your data." }, { status: 401, headers });
  const archive = new ExportArchive();
  const manifest: { datasets: string[]; attachments: { bucket: string; originalPath: string; file: string }[] } = { datasets: [], attachments: [] };
  const json = (name: string, value: unknown) => archive.add(name, Buffer.from(JSON.stringify(value, removeStorageTokens, 2)));

  try {
    for (const { table, owner = "user_id", order = "id", fields = "*" } of tables) {
      const dataset = table === "mentorships" ? table + "-" + owner : table;
      manifest.datasets.push(dataset);
      for (let offset = 0; ; offset += pageSize) {
        request.signal.throwIfAborted();
        const { data, error } = await supabase.from(table).select(fields).eq(owner, user.id).order(order).range(offset, offset + pageSize - 1);
        if (error) throw error;
        const rows = data ?? [];
        if (offset >= maxRows && rows.length) throw new ExportLimitError();
        if (offset === 0 || rows.length) json(`records/${dataset}/${offset / pageSize + 1}.json`, rows);
        if (rows.length < pageSize) break;
      }
    }

    const capsules = await supabase.from("time_capsule_metadata").select("*").order("id").limit(501);
    if (capsules.error) throw capsules.error;
    if ((capsules.data?.length ?? 0) > 500) throw new ExportLimitError();
    manifest.datasets.push("time_capsules");
    const metadata = capsules.data ?? [];
    json("records/time_capsules/1.json", metadata);
    for (const capsule of metadata) {
      if (!capsule.is_unlocked) continue;
      request.signal.throwIfAborted();
      const { data: letter, error } = await supabase.rpc("read_time_capsule", { p_id: capsule.id });
      if (error) throw error;
      if (typeof letter === "string") json(`capsules/${capsule.id}.json`, { id: capsule.id, content: letter });
    }

    let attachmentBytes = 0;
    for (const name of buckets) {
      const bucket = supabase.storage.from(name);
      const folders = [user.id];
      for (let index = 0; index < folders.length; index++) {
        for (let offset = 0; ; offset += pageSize) {
          request.signal.throwIfAborted();
          const { data: items, error } = await bucket.list(folders[index], { limit: pageSize, offset, sortBy: { column: "name", order: "asc" } });
          if (error) throw error;
          for (const item of items ?? []) {
            if (!item.name || /[/\\]/.test(item.name) || item.name === "." || item.name === "..") throw new Error("Invalid attachment name");
            const path = `${folders[index]}/${item.name}`;
            if (!item.id) {
              if (folders.length >= 200) throw new ExportLimitError();
              folders.push(path);
              continue;
            }
            if (manifest.attachments.length >= 250 || attachmentBytes + Number(item.metadata?.size ?? 0) > archiveLimit) throw new ExportLimitError();
            const download = await bucket.download(path);
            if (download.error || !download.data) throw new Error("Attachment unavailable");
            attachmentBytes += download.data.size;
            if (attachmentBytes > archiveLimit) throw new ExportLimitError();
            const extension = item.name.match(/\.[a-zA-Z0-9]{1,10}$/)?.[0] ?? "";
            const file = `attachments/${name}/${manifest.attachments.length + 1}${extension}`;
            archive.add(file, Buffer.from(await download.data.arrayBuffer()));
            manifest.attachments.push({ bucket: name, originalPath: path, file });
          }
          if ((items?.length ?? 0) < pageSize) break;
        }
      }
    }
    json("manifest.json", { version: 1, exportedAt: new Date().toISOString(), ...manifest });
    return new Response(new Uint8Array(archive.gzip()), { headers: {
      ...headers, "Content-Type": "application/gzip", "Content-Disposition": 'attachment; filename="imprint-data.tar.gz"',
    } });
  } catch (error) {
    if (error instanceof ExportLimitError) return NextResponse.json({ error: "Your archive exceeds the download limit. Contact support for a copy." }, { status: 413, headers });
    return NextResponse.json({ error: "Could not prepare your archive. Try again." }, { status: 500, headers });
  }
}
