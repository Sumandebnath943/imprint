type TestCase = { label: string; input: unknown; expected: number };

// Keep this as source text so standalone Node and bundled Next.js send identical code.
const harness = String.raw`
const vm = require("node:vm");
const results = cases.map(({ label, input, expected }) => {
  try {
    const modules = Object.create(null);
    const context = vm.createContext(Object.assign(Object.create(null), { submittedModules: modules }), {
      codeGeneration: { strings: false, wasm: false }, microtaskMode: "afterEvaluate",
    });
    for (const [name, content] of Object.entries(files)) {
      modules[name] = vm.compileFunction(content, ["module", "require"], { parsingContext: context });
    }
    const test = new vm.Script([
      "'use strict';",
      "(() => {",
      "  const modules = submittedModules;",
      "  delete globalThis.submittedModules;",
      "  const cache = Object.create(null);",
      "  function load(name) {",
      "    if (!Object.hasOwn(modules, name)) throw new Error('Module unavailable');",
      "    if (cache[name]) return cache[name].exports;",
      "    const module = { exports: {} };",
      "    cache[name] = module;",
      "    modules[name](module, request => {",
      "      if (typeof request !== 'string' || !request.startsWith('./')) throw new Error('Only starter files can be imported');",
      "      return load(request.slice(2));",
      "    });",
      "    return module.exports;",
      "  }",
      "  return load('total.js')(" + JSON.stringify(input) + ") === " + JSON.stringify(expected) + ";",
      "})()",
    ].join("\n"));
    return { label, outcome: test.runInContext(context, { timeout: 200 }) === true ? "passed" : "failed" };
  } catch (error) {
    return { label, outcome: error?.code === "ERR_SCRIPT_EXECUTION_TIMEOUT" ? "timed-out" : "failed" };
  }
});
process.stdout.write(JSON.stringify(results));
`;

export function createCodeCheckScript(cases: readonly TestCase[], files: Readonly<Record<string, string>>) {
  const submission = JSON.stringify({ cases, files });
  return `const { cases, files } = JSON.parse(${JSON.stringify(submission)});\n${harness}`;
}
