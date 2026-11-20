import "server-only";
import { z } from "zod";
import { getVercelOidcTokenSync } from "@vercel/oidc";
import { runSandboxedCodeCheck } from "./sandbox-code-check";
import { DEVELOPER_EVIDENCE_VERSION, findDeveloperExercise } from "./developer-bank";

const checkResults = z.object({
  version: z.literal(DEVELOPER_EVIDENCE_VERSION), exercise: z.string(),
  cases: z.array(z.object({ label: z.string(), outcome: z.enum(["passed", "failed", "timed-out"]) })).min(1).max(12),
});
export type CodeChecks = z.infer<typeof checkResults>;

function externalRunner() {
  const origin = process.env.IMPRINT_RUNNER_ORIGIN?.trim() ?? "";
  const token = process.env.IMPRINT_RUNNER_TOKEN?.trim() ?? "";
  return /^(?:https:\/\/[^/]+|http:\/\/127\.0\.0\.1:\d{1,5})$/.test(origin) && token.length >= 24 ? { origin, token } : null;
}

function hasVercelIdentity() {
  try {
    return Boolean(getVercelOidcTokenSync());
  } catch {
    return false;
  }
}

export function isCodeRunnerConfigured() {
  return Boolean(externalRunner()) || hasVercelIdentity();
}

export async function runCodeChecks(exerciseId: string, files: Record<string, string>): Promise<CodeChecks> {
  const exercise = findDeveloperExercise(exerciseId);
  if (!exercise || Object.keys(files).length !== Object.keys(exercise.files).length ||
      Object.keys(exercise.files).some((name) => typeof files[name] !== "string" ||
        !files[name].trim() || files[name].length > 12000)) throw new Error("Invalid starter files");

  const runner = externalRunner();
  if (!runner && !hasVercelIdentity()) throw new Error("Test runner unavailable");
  const payload = runner ? await runExternalCheck(runner, exercise.id, files) : {
    version: DEVELOPER_EVIDENCE_VERSION,
    exercise: exercise.id,
    cases: await runSandboxedCodeCheck(exercise.cases, files),
  };
  const results = checkResults.parse(payload);
  if (results.exercise !== exercise.id || results.cases.length !== exercise.cases.length ||
      !results.cases.every(({ label }, index) => label === exercise.cases[index].label)) throw new Error("Unrecognized test evidence");
  return results;
}

async function runExternalCheck({ origin, token }: { origin: string; token: string }, exercise: string, files: Record<string, string>) {
  const response = await fetch(`${origin}/checks`, {
    method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ exercise, files }),
  });
  if (!response.ok) throw new Error("Test runner unavailable");
  return response.json();
}
