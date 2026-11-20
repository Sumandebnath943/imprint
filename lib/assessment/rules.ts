import { getRoleTasks, type RoleTrack } from "./catalog";

export const ASSESSMENT_CONSENT_VERSION = "assessment-ai-pilot-2";

export const BASE_RUBRIC_ANCHORS = [
  "The submitted work visibly fails the core criterion.",
  "One relevant element is visible, with a major gap in the required behavior.",
  "The work demonstrates part of the core behavior.",
  "The work meets the core criterion with minor gaps.",
  "The work consistently meets the criterion and handles the stated constraints.",
];

export const CONTRIBUTIONS = ["none", "hint-or-critique", "partial-draft", "core-step"] as const;
export const VERIFICATIONS = ["independently-checked", "ai-checked-only", "unchecked", "not-applicable"] as const;
export const TASK_CONTEXTS = ["optional", "required-tool", "accessibility", "no-ai"] as const;

export interface RoleAnswer {
  text: string;
  evidencePath?: string;
  checkValue?: string;
}

export interface CriterionScore {
  taskId: string;
  skill: string;
  score: number;
  rubricRating?: number;
  evidence: string;
  feedback: string;
  objectiveCheck?: boolean;
}

export function getObjectiveCheck(roleId: string, form: number, index: number) {
  if (roleId === "student" && index === 0) {
    return { label: "Enter the final share per person as a number", expected: form % 2 === 0 ? 15 : 18 };
  }
  if (roleId === "data-scientist" && index === 1) {
    return { label: "Enter the recall percentage as a number", expected: 80 };
  }
  return undefined;
}

export function getPublicTasks(role: RoleTrack, form: number) {
  return getRoleTasks(role, form).map((task, index) => ({
    id: task.id, skill: task.skill, mode: task.mode, prompt: task.prompt, criterion: task.evidence,
    check: getObjectiveCheck(role.id, form, index)?.label,
    anchors: task.anchors ?? BASE_RUBRIC_ANCHORS,
    exercise: task.exercise,
  }));
}

export function criterionScore(rating: number, checked?: boolean) {
  const rubric = rating * 25;
  return Math.round(checked === undefined ? rubric : rubric * 0.75 + (checked ? 25 : 0));
}

export function overallScore(criteria: CriterionScore[]) {
  return Math.round(criteria.reduce((total, criterion) => total + criterion.score, 0) / criteria.length);
}

export function evidenceGap(current: number, earlier: number) {
  return current - earlier;
}

export function graceDeadline(dueAt: string, kind: string) {
  return Date.parse(dueAt) + (kind === "reassessment" ? 7 : 2) * 86400000;
}

export function isPastGrace(task: { due_at: string; kind: string; completed_at?: string | null }, now = Date.now()) {
  return !task.completed_at && now > graceDeadline(task.due_at, task.kind);
}
