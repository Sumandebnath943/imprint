import "server-only";
import { isAIEnabled } from "@/lib/ai/config";

export function isRolePilotEnabled(roleId: string) {
  return (process.env.IMPRINT_PILOT_ROLES ?? "").split(",").some((role) => role.trim() === roleId);
}

export function isRoleScoringEnabled(roleId: string) {
  return isAIEnabled() && isRolePilotEnabled(roleId);
}

export function reviewerAllowed(id: string) {
  return (process.env.IMPRINT_REVIEWER_IDS ?? "").split(",").some((value) => value.trim() === id);
}
