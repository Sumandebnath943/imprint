export const DEVELOPER_EVIDENCE_VERSION = "javascript-tests-1";

type TestCase = { label: string; input: unknown; expected: number };
type Exercise = {
  id: string;
  difficulty: "Basic" | "Intermediate" | "Advanced";
  brief: string;
  files: Record<string, string>;
  cases: TestCase[];
};

const basic = (id: string, domain: string, flag: string, amount: string): Exercise => ({
  id, difficulty: "Basic",
  brief: `Fix the ${domain} total. Sum ${amount} for entries with ${flag} set to true. An empty list returns 0. Preserve the exported total function.`,
  files: { "total.js": `module.exports = function total(items) {\n  return items.filter(item => item.${flag}).length;\n};\n` },
  cases: [
    { label: "Empty input", input: [], expected: 0 },
    { label: "Mixed entries", input: [{ [flag]: true, [amount]: 8 }, { [flag]: false, [amount]: 2 }, { [flag]: true, [amount]: 3 }], expected: 11 },
    { label: "Count differs from sum", input: [{ [flag]: true, [amount]: 12 }], expected: 12 },
    { label: "Strict qualification", input: [{ [flag]: 1, [amount]: 20 }, { [flag]: true, [amount]: 2 }], expected: 2 },
    { label: "Signed amounts", input: [{ [flag]: true, [amount]: -4 }, { [flag]: true, [amount]: 9 }], expected: 5 },
  ],
});

const intermediate: Exercise = {
  id: "intermediate-payments", difficulty: "Intermediate",
  brief: "Sum the amounts of confirmed payments. Ignore null entries, records with a non-finite numeric amount, numeric strings, and records without confirmed set to true. Keep negative adjustments. A non-array input returns 0.",
  files: { "total.js": "module.exports = function total(items) {\n  return items.filter(item => item.confirmed).length;\n};\n" },
  cases: [
    { label: "Empty payments", input: [], expected: 0 },
    { label: "Confirmed payment and negative adjustment", input: [{ confirmed: true, amount: 11 }, { confirmed: true, amount: -4 }], expected: 7 },
    { label: "Null list", input: null, expected: 0 },
    { label: "Malformed payments", input: [null, { confirmed: true, amount: "30" }, { confirmed: 1, amount: 8 }, { confirmed: true, amount: 9 }], expected: 9 },
  ],
};

const advanced: Exercise = {
  id: "advanced-inventory", difficulty: "Advanced",
  brief: "Fix the inventory summary across both starter files. A row is eligible only when it is present, active is true, and units is a nonnegative safe integer. Count each eligible SKU once, using its first eligible row. Preserve the exported total and the eligible helper.",
  files: {
    "total.js": "const eligible = require('./eligible.js');\nmodule.exports = function total(items) {\n  return items.filter(eligible).length;\n};\n",
    "eligible.js": "module.exports = function eligible(row) {\n  return Boolean(row && row.active);\n};\n",
  },
  cases: [
    { label: "Empty inventory", input: [], expected: 0 },
    { label: "First eligible row per SKU", input: [{ sku: "a", active: true, units: 7 }, { sku: "a", active: true, units: 20 }, { sku: "b", active: true, units: 4 }], expected: 11 },
    { label: "Invalid and inactive rows", input: [null, { sku: "a", active: 1, units: 5 }, { sku: "b", active: true, units: 2.5 }, { sku: "c", active: true, units: -9 }], expected: 0 },
    { label: "Ineligible rows do not reserve SKU", input: [{ sku: "a", active: false, units: 99 }, { sku: "a", active: true, units: 3 }], expected: 3 },
  ],
};

export const DEVELOPER_LEVEL_REASSESSMENTS: Exercise[] = [
  {
    ...intermediate,
    id: "intermediate-adjustments",
    brief: "Sum the cents of approved adjustments. Ignore null entries, non-finite numeric values, numeric strings, and entries without approved set to true. Preserve negative adjustments. A non-array input returns 0.",
    files: { "total.js": "module.exports = function total(entries) {\n  return entries.filter(entry => entry.approved).length;\n};\n" },
    cases: [
      { label: "Empty adjustment list", input: [], expected: 0 },
      { label: "Mixed approved adjustments", input: [{ approved: true, cents: 13 }, { approved: true, cents: -5 }], expected: 8 },
      { label: "Non-array source", input: {}, expected: 0 },
      { label: "Invalid adjustment values", input: [null, { approved: 1, cents: 6 }, { approved: true, cents: "7" }, { approved: true, cents: 8 }], expected: 8 },
    ],
  },
  {
    ...advanced,
    id: "advanced-reading-log",
    brief: "Fix the reading total across both starter files. A row qualifies when it exists, complete is true, and minutes is a nonnegative safe integer. Each book contributes only its first qualifying reading. Preserve the total and eligible exports.",
    files: {
      "total.js": "const eligible = require('./eligible.js');\nmodule.exports = function total(entries) {\n  return entries.filter(eligible).length;\n};\n",
      "eligible.js": "module.exports = function eligible(row) {\n  return Boolean(row && row.complete);\n};\n",
    },
    cases: [
      { label: "Empty reading log", input: [], expected: 0 },
      { label: "One qualifying reading per book", input: [{ book: "one", complete: true, minutes: 6 }, { book: "one", complete: true, minutes: 18 }, { book: "two", complete: true, minutes: 4 }], expected: 10 },
      { label: "Incomplete and malformed readings", input: [null, { book: "one", complete: 1, minutes: 20 }, { book: "two", complete: true, minutes: 2.5 }, { book: "three", complete: true, minutes: -8 }], expected: 0 },
      { label: "Incomplete entry does not reserve the book", input: [{ book: "one", complete: false, minutes: 40 }, { book: "one", complete: true, minutes: 9 }], expected: 9 },
    ],
  },
] satisfies Exercise[];

export const DEVELOPER_ASSESSMENT_FORMS = [
  basic("basic-invoices", "invoice", "paid", "amount"),
  basic("basic-stock", "stock", "available", "units"),
  basic("basic-readings", "reading log", "verified", "pages"),
  basic("basic-volunteers", "volunteer", "approved", "hours"),
];

const exercises = [...DEVELOPER_ASSESSMENT_FORMS, intermediate, advanced, ...DEVELOPER_LEVEL_REASSESSMENTS];

export function findDeveloperExercise(id: string) {
  return exercises.find((exercise) => exercise.id === id);
}

export function developerExerciseBrief(exercise: Exercise) {
  const { cases, ...brief } = exercise;
  return { ...brief, examples: cases.slice(0, 2) };
}

export const DEVELOPER_PRACTICE = [DEVELOPER_ASSESSMENT_FORMS[0], intermediate, advanced].map(developerExerciseBrief);
