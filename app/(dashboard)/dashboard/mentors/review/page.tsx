import { notFound } from "next/navigation";
import Link from "next/link";
import MentorReviewForm from "@/components/mentors/MentorReviewForm";
import { findRoleTrack } from "@/lib/assessment/catalog";
import { reviewerAllowed } from "@/lib/assessment/pilot";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function MentoringReview() {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user || !reviewerAllowed(user.id)) notFound();
  const admin = createAdminClient();
  const { data, error } = await admin.from("mentor_applications")
    .select("user_id,profession,applicant:profiles!mentor_applications_user_id_fkey(full_name,profession,mentor_bio)")
    .eq("status", "pending").neq("user_id", user.id).order("submitted_at").limit(100);
  const queue = await Promise.all((data ?? []).map(async (application) => {
    const role = findRoleTrack(application.profession);
    const score = role ? await admin.from("role_assessments").select("score")
      .eq("user_id", application.user_id).eq("role_id", role.id).eq("status", "scored").order("scored_at", { ascending: false }).limit(1).maybeSingle() : null;
    return { ...application, score: score?.data?.score as number | undefined };
  }));
  return <main className="mx-auto max-w-3xl space-y-5 px-5 py-10">
    <Link href="/dashboard/mentors" className="text-[#ff9c77] underline">Mentor Network</Link>
    <h1 className="text-2xl font-semibold">Mentor applications</h1>
    <p className="text-sm text-white/70">Approve only after reviewing the applicant’s ability to mentor this profession. For legacy applicants without a role score, record the qualifications you verified.</p>
    {error && <p role="alert">Applications could not be loaded. Reload to try again.</p>}
    {!error && !queue.length && <p className="text-white/70">No pending applications.</p>}
    {queue.map(({ applicant, profession, user_id, score }) => {
      const person = Array.isArray(applicant) ? applicant[0] : applicant;
      return <section key={`${user_id}:${profession}`} className="rounded-2xl border border-white/10 bg-[#111] p-5">
        <h2 className="text-lg font-semibold">{person?.full_name || "Applicant"} · {profession}</h2>
        <p className="mt-2 whitespace-pre-wrap text-white/80">{person?.mentor_bio}</p>
        <p className="mt-2 text-sm text-white/70">{score !== undefined ? `Latest role proficiency: ${score}/100` : "No role score on file"}</p>
        {person?.profession === profession ? <MentorReviewForm id={user_id} profession={profession} /> : <p className="mt-2 text-sm">The applicant has changed professions.</p>}
      </section>;
    })}
  </main>;
}
