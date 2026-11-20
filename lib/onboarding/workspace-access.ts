import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hasConfirmedAdultAge } from "@/lib/auth/eligibility";
import { findRoleTrack, type RoleTrack } from "@/lib/assessment/catalog";
import { WORKSPACE_COLUMNS, type WorkspaceRecord } from "./workspace-contract";
import { ONBOARDING_WORK_VERSION, workspaceRole } from "./workspace-catalog";

export async function workspaceAccess() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !hasConfirmedAdultAge(user)) return null;
  const { data, error } = await supabase.from("profiles").select("profession,onboarding_completed").eq("id", user.id).single();
  if (error) throw error;
  const role = findRoleTrack(data.profession);
  return role ? { supabase, user, role, profession: data.profession as string, completed: Boolean(data.onboarding_completed) } : null;
}

export async function getRoleSeries(supabase: ReturnType<typeof createClient>, userId: string, role: RoleTrack) {
  const { data, error } = await supabase.from("onboarding_workspaces").select("id,assessment_id")
    .eq("user_id", userId).eq("role_id", role.id).eq("rubric_version", ONBOARDING_WORK_VERSION)
    .order("form", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return { role: data ? workspaceRole(role) : role, draft: Boolean(data && !data.assessment_id) };
}

export async function loadWorkspace(supabase: ReturnType<typeof createClient>, userId: string, roleId: string, id?: string, baseline = false) {
  const query = supabase.from("onboarding_workspaces").select(WORKSPACE_COLUMNS).eq("user_id", userId).eq("role_id", roleId)
    .eq("rubric_version", ONBOARDING_WORK_VERSION);
  if (id) query.eq("id", id);
  if (baseline) query.eq("form", 0);
  const { data, error } = await query.order("form", { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data as WorkspaceRecord | null;
}
