import "server-only";
import { Sandbox } from "@vercel/sandbox";
import { createCodeCheckScript } from "./code-check-script";

export async function runSandboxedCodeCheck(...input: Parameters<typeof createCodeCheckScript>): Promise<unknown> {
  const script = createCodeCheckScript(...input);
  const signal = AbortSignal.timeout(15000);
  const sandbox = await Sandbox.create({
    image: "vcr.vercel.com/vercel/sandbox/node:22",
    resources: { vcpus: 1 },
    networkPolicy: "deny-all",
    persistent: false,
    timeout: 20000,
    signal,
  });
  try {
    const path = "assessment.cjs";
    await sandbox.writeFiles([{ path, content: Buffer.from(script) }], { signal });
    const result = await sandbox.runCommand({
      cmd: "node", args: ["--max-old-space-size=64", path], sudo: false, timeoutMs: 5000, signal,
    });
    if (result.exitCode !== 0) throw new Error("Sandbox test command failed");
    const output = await result.stdout({ signal });
    if (Buffer.byteLength(output) > 4096) throw new Error("Sandbox tests returned excess output");
    return JSON.parse(output);
  } finally {
    // The session's own expiry also releases it if the stop request cannot reach Vercel.
    await sandbox.stop({ signal: AbortSignal.timeout(2500) }).catch(() => undefined);
  }
}
