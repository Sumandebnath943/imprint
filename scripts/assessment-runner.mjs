import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomUUID, timingSafeEqual } from "node:crypto";
import { DEVELOPER_EVIDENCE_VERSION, findDeveloperExercise } from "../lib/assessment/developer-bank.ts";
import { createCodeCheckScript } from "../lib/assessment/code-check-script.ts";

const token = process.env.IMPRINT_RUNNER_TOKEN?.trim();
const port = Number(process.env.IMPRINT_RUNNER_PORT ?? 3495);
const host = process.env.IMPRINT_RUNNER_BIND ?? "127.0.0.1";
const image = process.env.IMPRINT_RUNNER_IMAGE ?? "node:22-alpine@sha256:1314fb30ec37592d5845e5a160d522c0e680972aa534549940b8d73bde88481a";
const localWsl = process.env.QA_RUNNER_DOCKER_WSL === "1";
if (!token || token.length < 24) throw new Error("Set an assessment runner token of at least 24 characters.");

const docker = (args, options) => localWsl
  ? spawn("wsl.exe", ["-d", "Imprint-QA", "-u", "root", "--", "docker", ...args], options)
  : spawn("docker", args, options);

async function evaluate(exercise, files) {
  const container = `imprint-assessment-${randomUUID()}`;
  const child = docker([
    "run", "--rm", "-i", "--pull", "never", "--name", container, "--network", "none", "--read-only",
    "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--memory", "96m", "--memory-swap", "96m",
    "--pids-limit", "24", "--cpus", "0.5", "--user", "65534:65534", "--log-driver", "none", "--entrypoint", "node", image, "-",
  ], { stdio: ["pipe", "pipe", "ignore"], windowsHide: true });
  child.stdin.on("error", () => {});
  child.stdin.end(createCodeCheckScript(exercise.cases, files));
  let output = "";
  let exceeded = false;
  const terminate = () => {
    child.kill();
    const cleanup = docker(["rm", "-f", container], { stdio: "ignore", windowsHide: true });
    cleanup.on("error", () => {});
  };
  child.stdout.setEncoding("utf8").on("data", (chunk) => {
    if (output.length + chunk.length > 4096) { exceeded = true; terminate(); return; }
    output += chunk;
  });
  const deadline = setTimeout(terminate, 8000);
  try {
    const status = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", resolve);
    });
    if (status !== 0 || exceeded) throw new Error("Test container unavailable");
    const cases = JSON.parse(output);
    const valid = Array.isArray(cases) && cases.length === exercise.cases.length && cases.every((item, index) =>
      item?.label === exercise.cases[index].label && ["passed", "failed", "timed-out"].includes(item.outcome));
    if (!valid) throw new Error("Test container returned invalid results");
    return { version: DEVELOPER_EVIDENCE_VERSION, exercise: exercise.id, cases };
  } finally {
    clearTimeout(deadline);
  }
}

const authorization = Buffer.from(`Bearer ${token}`);
let active = 0;
createServer({ requestTimeout: 15000, headersTimeout: 5000 }, async (request, response) => {
  const send = (status, data) => {
    response.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    response.end(JSON.stringify(data));
  };
  const header = Buffer.from(request.headers.authorization ?? "");
  if (request.method !== "POST" || request.url !== "/checks" || header.length !== authorization.length || !timingSafeEqual(header, authorization)) {
    send(404, { error: "Unavailable" });
    return;
  }
  if (active >= 2) { send(503, { error: "Runner busy" }); return; }
  active++;
  try {
    let size = 0;
    const chunks = [];
    for await (const chunk of request) {
      size += chunk.length;
      if (size > 40000) { send(413, { error: "Submission too large" }); return; }
      chunks.push(chunk);
    }
    const parsed = JSON.parse(Buffer.concat(chunks).toString());
    const exercise = findDeveloperExercise(parsed?.exercise);
    const files = parsed?.files;
    if (!exercise || !files || typeof files !== "object" || Object.keys(files).length !== Object.keys(exercise.files).length ||
        !Object.keys(exercise.files).every((name) => typeof files[name] === "string" && files[name].length <= 12000)) {
      send(400, { error: "Invalid exercise or starter files" });
      return;
    }
    send(200, await evaluate(exercise, files));
  } catch {
    send(503, { error: "Test runner unavailable" });
  } finally {
    active--;
  }
}).listen(port, host, () => console.log(`Assessment runner listening on ${host}:${port}`));
