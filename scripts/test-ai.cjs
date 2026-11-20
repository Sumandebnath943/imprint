const { readFileSync } = require("node:fs");
const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { transpileModule, ModuleKind, ScriptTarget } = require("typescript");
const { z } = require("zod");

require.extensions[".ts"] = (module, filename) => {
  const { outputText } = transpileModule(readFileSync(filename, "utf8").replace('import "server-only";', ""), {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { assessmentModel, structuredAI, transcribeAI, withAIProvider } = require("../lib/ai/providers.ts");
const { reflect } = require("../lib/ai/mirror.ts");
const check = { name: "check", schema: z.object({ ready: z.boolean() }), system: "Return JSON", text: "Synthetic input" };
const generate = () => withAIProvider(1000, (context) => structuredAI(context, { ...check, model: assessmentModel(context.provider) }));
const gemini = (output, fields = {}) => Response.json({
  modelVersion: "gemini-fixture-revision",
  candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(output) }] } }],
  ...fields,
});
const groq = (output) => Response.json({
  model: "groq-fixture-revision",
  choices: [{ finish_reason: "stop", message: { content: JSON.stringify(output) } }],
});

beforeEach(() => {
  for (const key of Object.keys(process.env)) {
    if (/^(IMPRINT_(AI|GEMINI|GROQ)_|GEMINI_API_KEY$|GROQ_API_KEY$)/.test(key)) delete process.env[key];
  }
  Object.assign(process.env, { GEMINI_API_KEY: "fixture-gemini", GROQ_API_KEY: "fixture-groq", IMPRINT_AI_ENABLED: "true" });
});

test("Gemini is primary, uses native structured output and reports the returned model revision", async (t) => {
  const request = t.mock.method(global, "fetch", async (url, options) => {
    assert.match(url, /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/.+:generateContent$/);
    assert.equal(options.headers["x-goog-api-key"], "fixture-gemini");
    assert.equal(options.cache, "no-store");
    assert.equal(options.redirect, "error");
    assert.deepEqual(JSON.parse(options.body).generationConfig.responseJsonSchema.required, ["ready"]);
    return gemini({ ready: true });
  });
  assert.deepEqual(await generate(), { data: { ready: true }, provider: "gemini", model: "gemini-fixture-revision" });
  assert.equal(request.mock.callCount(), 1);
});

test("quota, timeout, and service failures retry on Groq with its own key", async (t) => {
  let upstreamStatus;
  const request = t.mock.method(global, "fetch", async (url, options) => {
    if (url.includes("googleapis.com")) {
      if (upstreamStatus) return new Response(null, { status: upstreamStatus });
      return new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(options.signal.reason)));
    }
    assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
    assert.equal(options.headers.Authorization, "Bearer fixture-groq");
    assert.equal(JSON.parse(options.body).response_format.json_schema.strict, true);
    return groq({ ready: true });
  });
  for (upstreamStatus of [429, 503, undefined]) {
    const result = await withAIProvider(30, (context) => structuredAI(context, { ...check, model: assessmentModel(context.provider) }));
    assert.deepEqual(result, { data: { ready: true }, provider: "groq", model: "groq-fixture-revision" });
  }
  assert.equal(request.mock.callCount(), 6);
});

test("refusals, broken schemas, disabled AI and bad credentials never start Groq", async (t) => {
  let upstream;
  const request = t.mock.method(global, "fetch", async (url) => {
    assert.match(url, /googleapis\.com/);
    return upstream;
  });
  upstream = gemini(null, { promptFeedback: { blockReason: "SAFETY" }, candidates: [] });
  await assert.rejects(generate, { kind: "blocked" });
  upstream = gemini({ ready: "yes" });
  await assert.rejects(generate, { kind: "invalid-output" });
  upstream = new Response(null, { status: 401 });
  await assert.rejects(generate, { kind: "configuration" });
  delete process.env.IMPRINT_AI_ENABLED;
  await assert.rejects(generate, { kind: "configuration" });
  assert.equal(request.mock.callCount(), 3);
});

test("Groq uses validated best-effort JSON for images and uploads audio with multipart encoding", async (t) => {
  const context = { provider: "groq", signal: AbortSignal.timeout(1000), key: "fixture-groq" };
  const request = t.mock.method(global, "fetch", async (url, options) => {
    if (url.endsWith("/audio/transcriptions")) {
      assert.equal(options.headers["Content-Type"], undefined);
      const file = options.body.get("file");
      assert.equal(file.name, "test.webm");
      assert.equal(file.type, "audio/webm");
      return Response.json({ text: "Synthetic audio" });
    }
    const body = JSON.parse(options.body);
    assert.equal(body.response_format.json_schema.strict, false);
    assert.equal(body.reasoning_effort, "none");
    assert.equal(body.messages[1].content[1].image_url.url, "data:image/png;base64,TEST");
    return groq({ ready: true });
  });
  const result = await structuredAI(context, { ...check, model: assessmentModel("groq", true), image: { mimeType: "image/png", data: "TEST" } });
  assert.equal(result.data.ready, true);
  const transcript = await transcribeAI(context, new Blob(["Synthetic bytes"], { type: "audio/webm" }), "test.webm");
  assert.deepEqual(transcript, { data: { text: "Synthetic audio" }, provider: "groq", model: "whisper-large-v3" });
  assert.equal(request.mock.callCount(), 2);
});

test("Mirror repeats screening on fallback before sending recent dialogue", async (t) => {
  const calls = [];
  t.mock.method(global, "fetch", async (url, options) => {
    const body = JSON.parse(options.body);
    if (url.includes("googleapis.com")) {
      const isScreen = Boolean(body.generationConfig.responseJsonSchema.properties.urgent);
      calls.push(isScreen ? "gemini-screen" : "gemini-question");
      return isScreen ? gemini({ urgent: false }) : new Response(null, { status: 503 });
    }
    calls.push(body.response_format.json_schema.name);
    assert.deepEqual(JSON.parse(body.messages[1].content), { message: "Synthetic reflection." });
    return groq({ urgent: true });
  });
  const result = await reflect({ message: "Synthetic reflection.", history: [], topic: "Planning", mode: "question" });
  assert.equal(result.kind, "safety");
  assert.deepEqual(calls, ["gemini-screen", "gemini-question", "mirror_safety"]);
});
