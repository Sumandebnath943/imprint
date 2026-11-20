const { readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { transpileModule, ModuleKind, ScriptTarget } = require("typescript");

// Load the production pure modules with the same TypeScript compiler as the app.
require.extensions[".ts"] = (module, filename) => {
  const { outputText } = transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { ROLE_TRACKS, findRoleTrack } = require("../lib/assessment/catalog.ts");
const { criterionScore, overallScore, getPublicTasks, isPastGrace } = require("../lib/assessment/rules.ts");
const { historicalComparison } = require("../lib/assessment/historical.ts");
const { getTextMetrics } = require("../lib/forge/types.ts");
const { getOnboardingWorkspace, getWorkspaceExercise } = require("../lib/onboarding/workspace-catalog.ts");
const { blankWorkspaceAnswer, bookingObservation, checkWorkspaceAnswer, contrastRatio } = require("../lib/onboarding/workspace-contract.ts");
const { createCodeCheckScript } = require("../lib/assessment/code-check-script.ts");
const { findDeveloperExercise } = require("../lib/assessment/developer-bank.ts");

test("the shared Docker and Vercel harness returns bounded, deterministic case results", () => {
  const exercise = findDeveloperExercise("basic-invoices");
  const run = (files, cases = exercise.cases) => {
    const result = spawnSync(process.execPath, ["--input-type=commonjs", "-"], {
      input: createCodeCheckScript(cases, files), encoding: "utf8", timeout: 5000,
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };
  const passing = run({
    "total.js": "module.exports = rows => rows.filter(row => row.paid === true).reduce((total, row) => total + row.amount, 0);",
  });
  assert.deepEqual(passing, exercise.cases.map(({ label }) => ({ label, outcome: "passed" })));
  assert.equal(run({ "total.js": "module.exports = () => require('node:fs');" }, exercise.cases.slice(0, 1))[0].outcome, "failed");
  assert.equal(run({ "total.js": "module.exports = () => { while (true) {} };" }, exercise.cases.slice(0, 1))[0].outcome, "timed-out");
});

test("every onboarding profession has two concrete work samples and a separate follow-up condition", () => {
  const titles = new Set();
  for (const role of ROLE_TRACKS) {
    for (const question of [5, 6]) {
      const original = getOnboardingWorkspace(role.id, question);
      const next = getOnboardingWorkspace(role.id, question, 1);
      assert.ok(original);
      assert.ok(original.fields.length && original.criteria.every(Boolean));
      assert.ok(!titles.has(original.name));
      titles.add(original.name);
      assert.equal(Boolean(checkWorkspaceAnswer(role.id, question, blankWorkspaceAnswer(), 0)), true);
      if (role.id !== "software-developer") assert.notEqual(original.prompt, next.prompt);
    }
  }
  assert.equal(titles.size, 72);
  for (const level of ["Basic", "Intermediate", "Advanced"]) {
    assert.notEqual(getWorkspaceExercise(0, level).id, getWorkspaceExercise(1, level).id);
  }
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
  assert.match(bookingObservation(0, "Edit", "Original"), /Accepted$/);
  assert.match(bookingObservation(0, "Edit", "Candidate"), /Rejected$/);
});
const { assessmentSummary, signedPoints } = require("../lib/assessment/comparison.ts");

test("versioned proficiency differences use each result's own score and exclude fallback comparisons", () => {
  const baseline = { form: 0, score: 75, scored_at: "2026-11-20", results: { provider: "gemini", model: "gemini:model-a", evaluator: "v2", difficulty: "Basic" } };
  const latest = { ...baseline, form: 1, score: 63 };
  const summary = assessmentSummary(latest, baseline, "enabled", false);
  assert.equal(summary.difference, -12);
  assert.equal(signedPoints(summary.difference), "−12");
  assert.equal(assessmentSummary({ ...latest, form: 2 }, baseline, "enabled", false).difference, -12);
  assert.equal(assessmentSummary(baseline, baseline, "enabled", false).comparison, "Awaiting reassessment");
  assert.equal(assessmentSummary({ ...latest, results: { ...latest.results, provider: "groq" } }, baseline, "enabled", false).comparison, "Scoring versions differ");
  assert.equal(assessmentSummary(null, null, "unavailable", true).nextAction, "Resume your saved work");
});

test("every selectable role has distinct work, check-in stages and alternate tasks", () => {
  assert.equal(ROLE_TRACKS.length, 36);
  assert.equal(new Set(ROLE_TRACKS.map((role) => role.id)).size, 36);
  assert.equal(new Set(ROLE_TRACKS.map((role) => role.cluster)).size, 6);
  assert.equal(new Set(ROLE_TRACKS.map((role) => role.intake)).size, 36);
  for (const role of ROLE_TRACKS) {
    assert.equal(findRoleTrack(role.name), role);
    const initial = getPublicTasks(role, 0);
    const retest = getPublicTasks(role, 1);
    assert.equal(initial.length, 2);
    assert.equal(role.workStages.length, 3);
    assert.deepEqual(initial.map((task) => task.id), retest.map((task) => task.id));
    initial.forEach((task, index) => {
      assert.notEqual(task.prompt, retest[index].prompt);
      assert.ok(task.criterion);
    });
  }
  assert.notEqual(findRoleTrack("software-qa").tasks[0].skill, findRoleTrack("software_developer").tasks[0].skill);
});

test("objective checks affect only their own criteria and score output is normalized", () => {
  assert.equal(criterionScore(4), 100);
  assert.equal(criterionScore(0, false), 0);
  assert.equal(criterionScore(3, true), 81);
  assert.equal(overallScore([{ score: 75 }, { score: 25 }]), 50);
  assert.equal(getPublicTasks(findRoleTrack("student"), 0)[0].check, "Enter the final share per person as a number");
});

test("earlier-work comparison requires the same criterion, evaluator, model and reference period", () => {
  const sample = { criterion_id: "writer-1", score: 75, work_date: "2022-07-01", prior_period_end: "2023-01-01", model: "model-a", evaluator: "rubric-a" };
  const current = [{ taskId: "writer-1", skill: "Argument and structure", rubricRating: 2 }];
  assert.deepEqual(historicalComparison([sample], current, "model-a", "rubric-a"), []);
  assert.deepEqual(historicalComparison([sample, { ...sample, model: "model-b" }], current, "model-a", "rubric-a"), []);
  assert.deepEqual(historicalComparison([sample, { ...sample, prior_period_end: "2024-01-01" }], current, "model-a", "rubric-a"), []);
  const result = historicalComparison([sample, { ...sample, work_date: "2022-11-20" }], current, "model-a", "rubric-a");
  assert.deepEqual(result.map(({ earlier, current, gap }) => [earlier, current, gap]), [[75, 50, -25]]);
});

test("task gates become active only after kind-specific grace and ignore completed tasks", () => {
  const due = "2026-11-19T00:00:00.000Z";
  const twoDays = Date.parse(due) + 2 * 86400000;
  assert.equal(isPastGrace({ due_at: due, kind: "check-in" }, twoDays), false);
  assert.equal(isPastGrace({ due_at: due, kind: "check-in" }, twoDays + 1), true);
  assert.equal(isPastGrace({ due_at: due, kind: "reassessment" }, twoDays + 1), false);
  assert.equal(isPastGrace({ due_at: due, kind: "practice", completed_at: due }, twoDays + 1), false);
});

test("Forge metrics use identical empty, live and final calculations", () => {
  assert.deepEqual(getTextMetrics("", 0), { words: 0, duration: 0, wordsPerMinute: 0, vocabularyRichness: 0, averageSentenceLength: 0 });
  assert.deepEqual(getTextMetrics("Try that. Try again.", 30), {
    words: 4, duration: 30, wordsPerMinute: 8, vocabularyRichness: 0.75, averageSentenceLength: 2,
  });
});
