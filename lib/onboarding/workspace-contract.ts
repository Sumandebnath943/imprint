import { getOnboardingWorkspace } from "./workspace-catalog.ts";

export const WORKSPACE_CONSENT = "onboarding-work-consent-1";

export const WORKSPACE_COLUMNS = "id,user_id,role_id,rubric_version,form,difficulty,capture_reflections,answers,progress_version,feedback,assessment_id,created_at";

export type WorkspaceAnswer = {
  fields: string[];
  choices: string[];
  order: string[];
  artifact?: string;
  alternative?: boolean;
  files?: Record<string, string>;
  observations?: string[];
  beatGrid?: string[];
  palette?: string[];
};

export type WorkspaceFeedback = {
  question: number;
  skill: string;
  rating: number | null;
  evidence: string;
  feedback: string;
};

export type WorkspaceRecord = {
  id: string;
  role_id: string;
  rubric_version: string;
  form: number;
  difficulty: "Basic" | "Intermediate" | "Advanced";
  capture_reflections: boolean;
  answers: Record<string, WorkspaceAnswer>;
  progress_version: number;
  assessment_id: string | null;
  feedback: WorkspaceFeedback[] | null;
};

export function workspaceQuestionNumbers(workspace: WorkspaceRecord) {
  return workspace.capture_reflections ? [1, 2, 3, 4, 5, 6, 7] : [5, 6];
}

export const MEMORIES = ["How a core concept in your field works", "Five people who shaped your field", "A work that changed how you think", "An unsolved problem in your field", "Your morning routine and why it works for you"];
export const BELIEF_TOPICS = ["Climate change", "Social media", "Remote work", "Universal basic income"];
export const BEAT_NOTES = ["Rest", "C4", "C♯4", "D4", "D♯4", "E4", "F4", "F♯4", "G4", "G♯4", "A4", "A♯4", "B4", "C5", "C♯5", "D5"];

export function contrastRatio(first: string, second: string) {
  const luminance = (hex: string) => [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const levels = [luminance(first), luminance(second)];
  return (Math.max(...levels) + 0.05) / (Math.min(...levels) + 0.05);
}

export const REFLECTIONS: Record<number, { fields: string[]; mechanism: string; criteria: string[] }> = {
  1: { fields: ["Your position", "Your reason", "A concrete example"], mechanism: "Choose one topic and map your position to a reason and an example.", criteria: ["Clarity of the position", "Connection between position, reason, and example"] },
  2: { fields: ["Decision and what you knew", "Alternatives and what you ruled out", "Tradeoff", "What you would change"], mechanism: "Record what you considered at the time and what you would change now.", criteria: ["Alternatives and constraints considered", "Connection between tradeoff and decision"] },
  3: { fields: [], mechanism: "Choose three topics. Review which details you recalled and which details you would verify later.", criteria: ["Explanation and verifiable detail"] },
  4: { fields: ["Something that makes you angry", "Something unexpectedly beautiful", "When you feel most like yourself"], mechanism: "Privately review the three situations or reactions you chose to share. Your recording or notes stay outside AI scoring.", criteria: ["Your situations and reactions are available for private review"] },
  7: { fields: ["Your expression", "What you hope it conveys (optional)"], mechanism: "Keep a private text, recording, sketch, or photo. Review it against the intent you chose, or keep an empty response.", criteria: ["Review what your expression conveys"] },
};

export function blankWorkspaceAnswer(): WorkspaceAnswer { return { fields: [], choices: [], order: [] }; }

export function matchesWorkspaceEvidence(evidence: string, answer: WorkspaceAnswer, verifiedChecks: string[] = []) {
  const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
  const excerpt = normalize(evidence);
  if (!excerpt) return false;
  if (verifiedChecks.includes(evidence.trim())) return true;
  const lines = [...answer.fields, ...answer.choices, ...answer.order, ...(answer.observations ?? []),
    ...(answer.beatGrid ?? []), ...(answer.palette ?? []), ...Object.values(answer.files ?? {})];
  return lines.some((line) => normalize(line).includes(excerpt));
}

export function bookingObservation(value: number, flow: string, build: string) {
  const inRange = Number.isInteger(value) && value >= 1 && value <= 6;
  const permitted = inRange || (flow === "Edit" && build === "Original" && value === 0);
  return `${build} ${flow} with ${value}: ${permitted ? "Accepted" : "Rejected"}`;
}

export function checkWorkspaceAnswer(role: string, question: number, answer: WorkspaceAnswer, form: number): string | undefined {
  const workspace = getOnboardingWorkspace(role, question, form);
  if (workspace) {
    if (workspace.fields.some((_, index) => !answer.fields[index]?.trim())) return "Complete the labeled evidence fields.";
    if (workspace.artifact && !answer.artifact && !answer.alternative) return "Upload the work sample or choose the planning alternative.";
    if (answer.alternative && (!workspace.artifact || answer.artifact)) return "Choose the artifact or the planning alternative.";
    if (workspace.code && (!answer.files || !Object.values(answer.files).some((file) => file.trim()))) return "Add your code before continuing.";
    if (workspace.order && (answer.order.length !== workspace.order.length || new Set(answer.order).size !== workspace.order.length ||
      answer.order.some((value) => !workspace.order!.includes(value)))) return "Add the items to your sequence.";
    if (workspace.checks?.some((check, index) => "options" in check
      ? !check.options.includes(answer.choices[index] ?? "") : !answer.choices[index]?.trim() || !Number.isFinite(Number(answer.choices[index])))) {
      return "Complete the workspace checks.";
    }
    if (workspace.simulator && !answer.observations?.length) return "Record an observation in the simulator.";
    if (role === "musician" && (answer.beatGrid?.length !== 16 || answer.beatGrid.some((note) => !BEAT_NOTES.includes(note)) ||
      answer.beatGrid.filter((note) => note !== "Rest").length < 2)) return "Place at least two notes in the four-bar grid.";
    if (role === "designer" && !answer.alternative && (answer.palette?.length !== 2 || answer.palette.some((color) => !/^#[\da-f]{6}$/i.test(color)))) {
      return "Record the text and background colors you used.";
    }
    return;
  }
  if (question === 1 && !BELIEF_TOPICS.includes(answer.choices[0])) return "Choose a topic.";
  if (question === 3) {
    if (answer.choices.length !== 3 || new Set(answer.choices).size !== 3 ||
      answer.choices.some((choice) => !MEMORIES.includes(choice) || !answer.fields[MEMORIES.indexOf(choice)]?.trim())) {
      return "Answer three memory topics.";
    }
    return;
  }
  if (question === 4 && answer.artifact) return;
  if ((question === 1 || question === 2 || question === 4) && REFLECTIONS[question].fields.some((_, index) => !answer.fields[index]?.trim())) {
    return "Complete the reflection fields, using as much detail as you want to share.";
  }
}

export function rubricAnchors(skill: string) {
  return [
    `0 — Observable work conflicts with the exercise requirement for ${skill.toLowerCase()}.`,
    "1 — One relevant action is visible, with a major requirement missing or contradicted.",
    "2 — The work demonstrates part of the required action and leaves a consequential gap.",
    "3 — The work meets the main requirement with one minor gap in the evidence or execution.",
    `4 — The work demonstrates ${skill.toLowerCase()} under the exercise constraints, with a concrete artifact detail, calculation, or observed outcome supporting it.`,
  ];
}
