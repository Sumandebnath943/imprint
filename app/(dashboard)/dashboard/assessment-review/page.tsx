import { notFound } from "next/navigation";
import HistoricalReview from "@/components/assessment/HistoricalReview";
import ScoreReview from "@/components/assessment/ScoreReview";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { historicalCriteria } from "@/lib/assessment/historical";
import { reviewerAllowed } from "@/lib/assessment/pilot";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function AssessmentReviewPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !reviewerAllowed(user.id)) notFound();
  const admin = createAdminClient();
  const [{ data, error }, appeals] = await Promise.all([
    admin.from("historical_evidence").select("*").eq("status", "pending").neq("user_id", user.id).order("created_at").limit(20),
    admin.from("assessment_review_requests").select("id,reason,role_assessments(role_id,answers,results,score)")
      .neq("user_id", user.id).is("resolved_at", null).order("created_at").limit(20),
  ]);
  if (error) throw error;
  return <main className="mx-auto max-w-3xl space-y-4 p-6">
    <h1 className="text-2xl font-semibold">Review earlier work</h1>
    {data.length === 0 && <p>No samples are awaiting review.</p>}
    {await Promise.all(data.map(async (sample) => {
      const role = findRoleTrack(sample.role_id);
      const criterion = role && historicalCriteria(role).find((item) => item.id === sample.criterion_id);
      const url = sample.file_path ? (await admin.storage.from("assessment-evidence").createSignedUrl(sample.file_path, 600)).data?.signedUrl : null;
      return <article className="space-y-3 rounded-xl border border-white/10 p-5" key={sample.id}>
        <h2 className="font-semibold">{role?.name} · {criterion?.skill}</h2>
        <p>{criterion?.evidence}</p>
        <p>Claimed work date {sample.work_date} · Earlier period ends {sample.prior_period_end}</p>
        <p>Contribution · {sample.contribution}</p><p>Tools and assistance · {sample.tool_context}</p>
        <p><a href={sample.source_url} target="_blank" rel="noopener noreferrer" className="text-[#ff9c77] underline">Open submitted source</a></p>
        {sample.content && <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap rounded bg-black/40 p-3 text-sm">{sample.content}</pre>}
        {url && <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#ff9c77] underline">View private attachment</a>}
        <HistoricalReview sampleId={sample.id} />
      </article>;
    }))}
    <h2 className="text-xl font-semibold">Requested score reviews</h2>
    {appeals.error && <p>Score reviews could not be loaded.</p>}
    {await Promise.all((appeals.data ?? []).map(async (appeal) => {
      const records = appeal.role_assessments;
      const assessment = Array.isArray(records) ? records[0] : records;
      const answers = Object.values(assessment?.answers ?? {}) as { text?: string; evidencePath?: string }[];
      const signed = await Promise.all(answers.map(async ({ evidencePath }) => evidencePath
        ? (await admin.storage.from("assessment-evidence").createSignedUrl(evidencePath, 600)).data?.signedUrl
        : undefined));
      return <article key={appeal.id} className="space-y-2 rounded-xl border border-white/10 p-5">
        <p>{appeal.reason}</p>
        <p>{assessment?.role_id} · {assessment?.score}/100</p>
        <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(assessment?.results, null, 2)}</pre>
        {answers.map((answer, index) => <p key={index} className="text-sm">{answer.text}{signed[index] && (
          <a href={signed[index]} target="_blank" rel="noopener noreferrer" className="ml-2 text-[#ff9c77] underline">Open response attachment</a>
        )}</p>)}
        <ScoreReview id={appeal.id} resolve criteria={assessment?.results?.criteria ?? []} />
      </article>;
    }))}
  </main>;
}
