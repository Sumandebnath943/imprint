import { DEVELOPER_ASSESSMENT_FORMS, developerExerciseBrief } from "./developer-bank.ts";

export const WORKSPACE_RUBRIC_VERSION = "work-sample-2";

const illustratorForms = [
  ["Make a monochrome thumbnail showing hesitation at an open door, without a caption.", "Shrink the image and revise the values so the viewer sees the character before the door."],
  ["Make a monochrome thumbnail showing anticipation at a bus stop, without a caption.", "Revise for a narrow crop. Keep the primary figure and make the waiting location readable."],
  ["Make a monochrome thumbnail showing hesitation at the entrance to an empty stage, without a caption.", "Revise for a narrow crop. Clarify where the figure might go and keep the gesture readable."],
  ["Make a monochrome thumbnail showing anticipation as a boat approaches a dock, without a caption.", "Reduce the design to three value groups. Keep the person waiting as the focal point."],
];

const illustrationRubrics = [
  ["The artifact shows an unrelated action or no readable figure or setting.", "A figure or setting is visible but its pose gives little evidence of the intended moment.", "One readable visual cue conveys the intended moment but competes with the composition.", "Pose and focal placement convey the moment at thumbnail size with a minor ambiguity.", "Pose, value grouping and focal placement work together to convey both the narrative moment and setting at thumbnail size."],
  ["The revision visibly removes the focal point or ignores the hard constraint.", "An identifiable edit is visible but has little relationship to the focal point or constraint.", "The change improves one aspect of the focal point or constraint while leaving the other unclear.", "The revision satisfies the new constraint and improves focal clarity, with a small loss of legibility.", "The revision visibly meets the new constraint, clarifies focal hierarchy, and preserves the narrative action. The rationale links the edit to that change."],
];

const developerRubrics = [
  ["The patch visibly preserves the counting defect or breaks the function contract.", "The patch attempts to sum but mishandles qualification or empty input.", "Core summing is visible but the patch leaves a material condition or edge case ambiguous.", "The patch implements the core behavior and handles the main edge cases with a minor clarity issue.", "The patch clearly implements strict qualification, summing, and empty input, with a concise explanation of the original defect."],
  ["The proposed checks visibly assert the wrong behavior and miss the defect.", "A check is relevant but omits expected output or cannot expose the original defect.", "The explanation gives correct expected output for a core case and misses an important regression.", "The explanation covers empty, mixed, and count-versus-sum cases with correct expected outputs.", "The explanation connects correct boundary and distinguishing checks to the observed defect and states how actual results support or limit the diagnosis."],
];

const developerDomains = ["invoice", "stock", "reading log", "volunteer"];

export function isWorkspaceRole(roleId: string) {
  return roleId === "illustrator" || roleId === "software-developer";
}

export function workspaceTask(roleId: string, form: number, index: number) {
  if (roleId === "illustrator") {
    const brief = illustratorForms[form % illustratorForms.length];
    return { prompt: brief[index], anchors: illustrationRubrics[index] };
  }
  if (roleId === "software-developer") {
    const exercise = DEVELOPER_ASSESSMENT_FORMS[form % DEVELOPER_ASSESSMENT_FORMS.length];
    return index === 0 ? { prompt: exercise.brief, anchors: developerRubrics[index], exercise: developerExerciseBrief(exercise) }
      : { prompt: `Explain the defect in the ${developerDomains[form % developerDomains.length]} total. Give expected results for an empty input, a mixed input, and a case where the count differs from the sum. Use the runner output to explain how you verified the fix.`, anchors: developerRubrics[index] };
  }
  return undefined;
}
