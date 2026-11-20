import "server-only";

export function isAIEnabled() {
  return process.env.IMPRINT_AI_ENABLED === "true";
}
