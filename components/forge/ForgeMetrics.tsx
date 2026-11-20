import { formatTime, getTextMetrics } from "@/lib/forge/types";

export default function ForgeMetrics({ content, elapsed }: { content: string; elapsed: number }) {
  const metrics = getTextMetrics(content, elapsed);
  const rows = [
    { label: "Words written", value: metrics.words },
    { label: "Time spent", value: formatTime(metrics.duration) },
    { label: "Words per minute", value: metrics.wordsPerMinute },
    { label: "Unique word share", value: metrics.words ? `${Math.round(metrics.vocabularyRichness * 100)}%` : "—" },
    { label: "Average sentence length", value: metrics.words ? `${metrics.averageSentenceLength} words` : "—" },
  ];
  return (
    <dl className="grid gap-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between gap-3 border-b border-white/10 py-2 text-sm">
          <dt className="text-white/70">{label}</dt>
          <dd className="font-medium tabular-nums text-white">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
