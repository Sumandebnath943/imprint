import Link from "next/link";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { getScoringAvailability } from "@/lib/assessment/pilot";
import { isPastGrace, type CriterionScore } from "@/lib/assessment/rules";
import { createClient } from "@/lib/supabase/server";
import FollowThrough from "@/components/assessment/FollowThrough";
import PastWork from "@/components/assessment/PastWork";
import { historicalComparison, historicalCriteria } from "@/lib/assessment/historical";
import ProgressPreferences from "@/components/assessment/ProgressPreferences";
import RescheduleTask from "@/components/assessment/RescheduleTask";
import { assessmentSummary, compatibleAssessments, signedPoints as signed, type AssessmentScore } from "@/lib/assessment/comparison";
import { getRoleSeries } from "@/lib/onboarding/workspace-access";
import { ONBOARDING_WORK_VERSION } from "@/lib/onboarding/workspace-catalog";

type Result = AssessmentScore & { results: { criteria: CriterionScore[]; reviewRevision?: number } };
type Completion = {
  skill?: string; attemptedFirst?: boolean; contribution?: string; verification?: string; context?: string;
};
type Assigned = { id: string; kind: string; due_at: string; completed_at: string | null; completion: Completion | null; schedule_revision: number };

const box = "rounded-2xl border border-white/10 bg-[#111010] p-5";
const date = (value: string) => new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default async function ImprintProgressPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="p-6">Sign in to view your progress.</p>;

  const [profile, legacy, journal, reflection, history] = await Promise.all([
    supabase.from("profiles").select("profession,notification_preferences").eq("id", user.id).maybeSingle(),
    supabase.from("drift_scores").select("score,created_at,calibration_session_id,contributing_signals")
      .eq("user_id", user.id).not("calibration_session_id", "is", null)
      .order("created_at", { ascending: false }).limit(20),
    supabase.from("journal_entries").select("created_at").eq("user_id", user.id).eq("is_forge_entry", false)
      .gte("created_at", new Date(Date.now() - 8 * 86400000).toISOString()),
    supabase.rpc("due_onboarding_reflection").maybeSingle<{ note: string; captured_at: string }>(),
    supabase.from("role_assessments").select("id,role_id,rubric_version,form,status,score,created_at,scored_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
  ]);
  const selectedRole = findRoleTrack(profile.data?.profession);
  const series = selectedRole ? await getRoleSeries(supabase, user.id, selectedRole) : null;
  const role = series?.role;
  const availability = role ? getScoringAvailability(role.id) : "disabled";
  const scoringEnabled = availability === "enabled";
  const comparisons = role ? await Promise.all([
    supabase.from("role_assessments").select("score,form,scored_at,results").eq("user_id", user.id)
      .eq("role_id", role.id).eq("rubric_version", role.version).eq("status", "scored")
      .order("form", { ascending: false }).limit(16),
    supabase.from("role_assessments").select("score,form,scored_at,results").eq("user_id", user.id)
      .eq("role_id", role.id).eq("rubric_version", role.version).eq("status", "scored").eq("form", 0).maybeSingle(),
    supabase.from("imprint_tasks").select("id,kind,due_at,completed_at,completion,schedule_revision")
      .eq("user_id", user.id).eq("role_id", role.id).eq("rubric_version", role.version)
      .order("assigned_at", { ascending: false }).limit(100),
    supabase.from("historical_evidence").select("id,criterion_id,status,work_date,prior_period_end,score,model,evaluator,review_note,consent_version")
      .eq("user_id", user.id).eq("role_id", role.id).eq("rubric_version", role.version)
      .order("created_at", { ascending: false }).limit(100),
  ]) : null;

  const records = (comparisons?.[0].data ?? []) as Result[];
  const original = comparisons?.[1].data as Result | null | undefined;
  const current = records[0];
  const previousRecord = records[1];
  const compatible = (record?: Result | null) => record?.form !== current?.form && compatibleAssessments(current, record);
  const archived = (history.data ?? []).filter((record) => record.role_id !== role?.id || record.rubric_version !== role?.version);
  const draft = Boolean(series?.draft) || (history.data ?? []).some((record) => record.role_id === role?.id && record.rubric_version === role?.version && record.status === "draft");
  const summary = assessmentSummary(current ?? null, original ?? null, availability, draft);
  const samples = comparisons?.[3].data ?? [];
  const historyOptions = role && role.version !== ONBOARDING_WORK_VERSION ? historicalCriteria(role) : [];
  const approvedSamples = samples.filter((sample) => sample.status === "approved");
  const earlier = current ? historicalComparison(approvedSamples, current.results.criteria, current.results.model, current.results.evaluator) : [];
  const earlierAtBaseline = original ? historicalComparison(approvedSamples, original.results.criteria, original.results.model, original.results.evaluator) : [];
  const tasks = (comparisons?.[2].data ?? []) as Assigned[];
  const pending = tasks.filter((task) => !task.completed_at);
  const weakest = current ? [...current.results.criteria].sort((a, b) => a.score - b.score)[0] : undefined;
  const rolling = Date.now() - 28 * 86400000;
  const practiceDue = tasks.filter((task) => task.kind === "practice" && Date.parse(task.due_at) >= rolling && Date.parse(task.due_at) <= Date.now());
  const checkIns = tasks.filter((task) => task.kind === "check-in" && task.completed_at &&
    Date.parse(task.completed_at) >= rolling && task.completion).map((task) => task.completion!);
  const incomplete = comparisons?.some((query) => query.error);
  const preferences = profile.data?.notification_preferences ?? {};
  const journalTarget = Number(preferences.imprint_journal_days ?? 0);
  const timeZone = String(preferences.imprint_time_zone || "UTC");
  const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: safeZone(timeZone), year: "numeric", month: "2-digit", day: "2-digit" });
  const days = new Set(Array.from({ length: 7 }, (_, index) => dateKey.format(Date.now() - index * 86400000)));
  const journalDays = new Set((journal.data ?? []).map((entry) => dateKey.format(Date.parse(entry.created_at))));
  const journalCoverage = Array.from(journalDays).filter((day) => days.has(day)).length;
  const checks = records.filter((record) => Date.parse(record.scored_at) >= rolling).flatMap((record) => record.results.criteria);
  const passingChecks = checks.filter((item) => (item.rubricRating ?? 0) >= 3 && item.objectiveCheck !== false);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">
      <header>
        <h1 className="text-3xl font-semibold">Your Imprint progress</h1>
        {role && <p className="mt-2 text-white/65">{role.name}</p>}
      </header>
      {(profile.error || incomplete) && <p role="status" className="text-[#ffa487]">Some progress data is unavailable. Reload to try again.</p>}
      {reflection.data && <section className={box}>
        <h2 className="text-xl font-semibold">Your onboarding reflection</h2>
        <p className="mt-1 text-sm text-white/70">Saved {date(reflection.data.captured_at)}</p>
        <p className="mt-3 whitespace-pre-wrap break-words">{reflection.data.note}</p>
      </section>}
      {current && original ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={box}><p className="text-white/70">Current proficiency</p><p className="my-2 text-3xl font-semibold">{current.score}/100</p><p className="text-sm text-white/65">{date(current.scored_at)}</p></div>
            <div className={box}><p className="text-white/70">Original Imprint</p><p className="my-2 text-3xl font-semibold">{original.score}/100</p><p className="text-sm text-white/65">{date(original.scored_at)}</p></div>
            <div className={box}><p className="text-white/70">Change from your baseline</p><p className="my-2 text-3xl font-semibold">{summary.difference === null ? "—" : `${signed(summary.difference)} points`}</p><p className="text-sm text-white/65">{summary.comparison}</p></div>
          </div>
          <section className={box}>
            <h2 className="text-xl font-semibold">Change since your Imprint</h2>
            <p className="mt-2 text-sm text-white/65">Point differences describe these submissions. A trend requires repeated comparable evidence and a validated estimate of normal variation.</p>
            <dl className="mt-3 divide-y divide-white/10">
              {current.results.criteria.map((criterion) => {
                const baselineCriterion = compatible(original) ? original.results.criteria.find((item) => item.taskId === criterion.taskId) : undefined;
                const previous = compatible(previousRecord) ? previousRecord?.results.criteria.find((item) => item.taskId === criterion.taskId) : undefined;
                return <div key={criterion.taskId} className="space-y-1 py-3">
                  <dt className="font-medium">{criterion.skill}</dt>
                  <dd>{criterion.score}/100{baselineCriterion ? ` · ${signed(criterion.score - baselineCriterion.score)} since baseline` : ""}{previous ? ` · ${signed(criterion.score - previous.score)} since last assessment` : ""}</dd>
                  <dd className="text-sm text-white/65">{criterion.feedback}</dd>
                </div>;
              })}
            </dl>
          </section>
          <section className={box}>
            <h2 className="text-xl font-semibold">Assessment history</h2>
            <ol className="mt-3 space-y-2 text-sm text-white/80">
              {records.map((record) => <li key={record.form}>{date(record.scored_at)} · {record.form === 0 ? "Original Imprint" : `Reassessment ${record.form}`} · {record.score}/100{record.results.reviewRevision ? ` · Review revision ${record.results.reviewRevision}` : ""}</li>)}
            </ol>
          </section>
        </>
      ) : <section className={box}>
        <h2 className="text-xl font-semibold">Current proficiency</h2>
        <p className="my-2 text-3xl font-semibold">—</p>
        <p className="mt-2 text-white/70">{role ? summary.nextAction : "Choose a profession in Profile to see its assessment options."}</p>
        <Link href={role ? "/dashboard/calibration" : "/dashboard/profile"} className="mt-4 inline-block text-[#ff9c77] underline">
          {scoringEnabled ? "Open assessment" : role ? "Open role practice" : "Open Profile"}
        </Link>
      </section>}
      {role && current && (
        <>
          <section className={box}>
            <h2 className="text-xl font-semibold">Practice and AI use</h2>
            <p className="mt-2">Vault Activity · {practiceDue.length ? `${practiceDue.filter((item) => item.completed_at).length} of ${practiceDue.length} due tasks completed` : "No practice due in this period"} in the past 28 days</p>
            <p className="mt-2">AI Independence · {checks.length ? `${passingChecks.length} of ${checks.length} independently attempted criteria met in the past 28 days` : "No current assessment evidence"}</p>
            <p className="mt-2">Journal Regularity · {journalTarget ? `${journalCoverage} journal days against your ${journalTarget}-day weekly goal` : "No weekly reflection goal set"}</p>
            <ProgressPreferences reminderEmails={preferences.imprint_task_emails === true} journalDays={journalTarget} />
            {checkIns.length > 0 && <ul className="mt-3 space-y-2 text-sm text-white/70">
              {role.tasks.map((item) => {
                const reports = checkIns.filter((report) => report.skill === item.skill);
                const delegated = reports.filter((report) => report.contribution === "core-step" && report.context === "optional");
                const notVerified = delegated.filter((report) => report.verification !== "independently-checked");
                if (!reports.length) return null;
                return <li key={item.skill}>{item.skill} · Independent first attempt on {reports.filter((report) => report.attemptedFirst).length} of {reports.length} reported tasks. Optional AI delegation without independent verification on {notVerified.length} of {reports.length}. Self-reported, past 28 days.</li>;
              })}
            </ul>}
          </section>
          {historyOptions.length > 0 && <section className={box}>
            <h2 className="mb-3 text-xl font-semibold">Earlier work</h2>
            {earlier.map((item) => {
              const start = earlierAtBaseline.find((entry) => entry.skill === item.skill);
              return <div className="mb-3 border-b border-white/10 pb-3 text-sm" key={item.skill}>
                <p className="font-medium">{item.skill} · {signed(item.gap)} points against earlier work</p>
                <p>{item.current} today · {item.earlier} in {item.count} approved samples · {item.from} to {item.to}</p>
                {start && <p className="text-white/65">Gap at your original Imprint · {signed(start.gap)} points</p>}
              </div>;
            })}
            <PastWork roleId={role.id} criteria={historyOptions.map(({ id, skill, mode }) => ({ id, skill, mode }))} samples={samples} scoringEnabled={scoringEnabled} />
          </section>}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Your next tasks</h2>
            {pending.some((item) => isPastGrace(item)) && <p className="text-[#ffa487]">A task is past its grace period. Complete the overdue work to restore assessment or credential progression.</p>}
            {pending.map((task) => (
              <div key={task.id}>
                {task.kind === "reassessment" ? (
                  <div className={box}>
                    <p>Reassessment due {date(task.due_at)}</p>
                    {scoringEnabled && <Link href="/dashboard/calibration" className="mt-2 inline-block text-[#ff9c77] underline">Open reassessment</Link>}
                  </div>
                ) : <FollowThrough task={task} role={role} recommendedSkill={weakest?.skill ?? role.tasks[0].skill} />}
                {task.schedule_revision === 0 && Date.parse(task.due_at) > Date.now() && <RescheduleTask id={task.id} />}
              </div>
            ))}
          </section>
        </>
      )}
      {archived.length > 0 && <details className={box}>
        <summary className="cursor-pointer font-medium">Other professions and earlier assessment versions</summary>
        <ul className="mt-3 space-y-2 text-sm text-white/80">
          {archived.map((record) => <li key={record.id}>
            {date(record.scored_at ?? record.created_at)} · {findRoleTrack(record.role_id)?.name ?? record.role_id} · {record.rubric_version} · {record.status === "draft" ? "Saved draft" : `${record.score}/100`}
          </li>)}
        </ul>
        <Link href="/dashboard/settings" className="mt-3 inline-block text-sm text-[#ffad89] underline">Export your saved responses and evidence</Link>
      </details>}
      {legacy.data?.length ? (
        <details className={box}>
          <summary className="cursor-pointer font-medium">Legacy text comparisons</summary>
          <p className="mt-2 text-sm text-white/65">Earlier Drift scores use the methodology recorded at the time.</p>
          <ul className="mt-3 space-y-2 text-sm">
            {legacy.data.map((row) => <li key={row.calibration_session_id + row.created_at}>{date(row.created_at)} · {row.score}/100 · {row.contributing_signals?.methodology === "legacy-text-v2" ? "Legacy text and activity v2" : "Original Drift formula"}</li>)}
          </ul>
        </details>
      ) : null}
    </main>
  );
}

function safeZone(zone: string) {
  try { new Intl.DateTimeFormat("en", { timeZone: zone }); return zone; }
  catch { return "UTC"; }
}
