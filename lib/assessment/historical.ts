import type { RoleTrack } from "./catalog";

// Only criteria that can be observed in a durable work product are eligible.
const eligible: Record<string, number[]> = {
  writer: [0, 1], journalist: [1], screenwriter: [0], marketer: [0],
  designer: [0], illustrator: [0], photographer: [0], videographer: [0], architect: [0],
  musician: [0], "software-developer": [0], "software-qa": [1],
  "data-scientist": [0], researcher: [0, 1], scientist: [0], educator: [1], "product-manager": [1],
};

export function historicalCriteria(role: RoleTrack) {
  return (eligible[role.id] ?? []).map((index) => ({
    id: `${role.id}-${index + 1}`, ...role.tasks[index],
  }));
}

export function historicalComparison(
  samples: { criterion_id: string; score: number | null; work_date: string; prior_period_end: string; model: string | null; evaluator: string | null }[],
  criteria: { taskId: string; skill: string; rubricRating?: number }[],
  model?: string,
  evaluator?: string,
) {
  return criteria.flatMap((criterion) => {
    const matches = samples.filter((sample) => sample.criterion_id === criterion.taskId && sample.score !== null &&
      sample.model === model && sample.evaluator === evaluator);
    const periods = Array.from(new Set(matches.map((sample) => sample.prior_period_end))).sort().reverse();
    const usable = periods.map((period) => matches.filter((sample) => sample.prior_period_end === period))
      .find((group) => group.length >= 2) ?? [];
    if (usable.length < 2 || typeof criterion.rubricRating !== "number") return [];
    const earlier = Math.round(usable.reduce((sum, sample) => sum + Number(sample.score), 0) / usable.length);
    const current = criterion.rubricRating * 25;
    const dates = usable.map((sample) => sample.work_date).sort();
    return [{ skill: criterion.skill, earlier, current, gap: current - earlier, from: dates[0], to: dates.at(-1), count: usable.length }];
  });
}
