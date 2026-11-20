import Link from "next/link";
import LocalDate from "@/components/shared/LocalDate";
import { signedPoints, type AssessmentSummary } from "@/lib/assessment/comparison";

export default function ProficiencySummary({ summary }: { summary?: AssessmentSummary | null }) {
  return <div>
    <h2 className="text-xl font-semibold">Current proficiency</h2>
    <p className="mt-2 text-3xl font-semibold text-[#ff9c77]">{summary?.current ? `${summary.current.score}/100` : "—"}</p>
    {summary?.current ? <p className="mt-1 text-sm text-white/70"><LocalDate value={summary.current.scored_at} /></p> : <>
      <p className="mt-1 text-sm text-white/70">{summary?.nextAction ?? "Select a profession to see your assessment options."}</p>
      <Link className="mt-2 inline-block text-sm text-[#ffad89] underline" href={summary ? "/dashboard/calibration" : "/dashboard/profile"}>
        {summary ? "Open Calibration" : "Open Profile"}
      </Link>
    </>}
    {summary?.current && <dl className="mt-4 grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2">
      <div><dt className="text-sm text-white/70">Original Imprint</dt><dd>{summary.original ? `${summary.original.score}/100` : "—"}</dd></div>
      <div><dt className="text-sm text-white/70">Change from your baseline</dt>
        <dd>{summary.difference === null ? `— ${summary.comparison}` : `${signedPoints(summary.difference)} points · ${summary.comparison}`}</dd></div>
    </dl>}
  </div>;
}
