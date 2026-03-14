"use server";

import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  SchoolSettings,
  StaffPost,
  StaffingScenario,
  ScenarioPost,
  PayAssumption,
  PayAssumptionInput,
  ICFPScenarioSnapshot,
} from "@/types/staffing";

// ─── Helpers ────────────────────────────────────────────────────────

function serviceClient() {
  return createServiceRoleClient();
}

// ─── School Settings ────────────────────────────────────────────────

export async function getSchoolSettings(
  orgId: string,
): Promise<SchoolSettings | null> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("school_settings")
    .select("*")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load school settings: ${error.message}`);
  return data;
}

export async function upsertSchoolSettings(
  orgId: string,
  settings: Partial<Pick<SchoolSettings, "phase" | "roll" | "gag_per_pupil" | "financial_year_start">>,
): Promise<SchoolSettings> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("school_settings")
    .upsert(
      { organization_id: orgId, ...settings, updated_at: new Date().toISOString() },
      { onConflict: "organization_id" },
    )
    .select()
    .single();

  if (error) throw new Error(`Failed to save school settings: ${error.message}`);
  return data;
}

// ─── Staff Posts ────────────────────────────────────────────────────

export async function getStaffPosts(orgId: string): Promise<StaffPost[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("staff_posts")
    .select("*")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("tier")
    .order("salary", { ascending: false });

  if (error) throw new Error(`Failed to load staff posts: ${error.message}`);
  return data ?? [];
}

export async function createStaffPost(
  orgId: string,
  post: Pick<StaffPost, "name" | "role" | "tier" | "salary" | "fte" | "on_cost_rate" | "dfe_code" | "pay_framework" | "contract_type">,
): Promise<StaffPost> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("staff_posts")
    .insert({ organization_id: orgId, ...post })
    .select()
    .single();

  if (error) throw new Error(`Failed to create staff post: ${error.message}`);
  return data;
}

// ─── Scenarios ──────────────────────────────────────────────────────

export async function getScenarios(orgId: string): Promise<StaffingScenario[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("staffing_scenarios")
    .select("*")
    .eq("organization_id", orgId)
    .order("is_baseline", { ascending: false })
    .order("created_at");

  if (error) throw new Error(`Failed to load scenarios: ${error.message}`);
  return data ?? [];
}

export async function createScenario(
  orgId: string,
  name: string,
  userId?: string,
): Promise<StaffingScenario> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("staffing_scenarios")
    .insert({
      organization_id: orgId,
      name,
      is_baseline: false,
      created_by: userId ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create scenario: ${error.message}`);
  return data;
}

export async function createBaselineScenario(
  orgId: string,
  staffPosts: StaffPost[],
  userId?: string,
): Promise<StaffingScenario> {
  const supabase = serviceClient();

  // Create the baseline scenario
  const { data: scenario, error: scenarioError } = await supabase
    .from("staffing_scenarios")
    .insert({
      organization_id: orgId,
      name: "Current Staffing (Baseline)",
      is_baseline: true,
      created_by: userId ?? null,
    })
    .select()
    .single();

  if (scenarioError) throw new Error(`Failed to create baseline: ${scenarioError.message}`);

  // Add all active posts to it
  if (staffPosts.length > 0) {
    const scenarioPosts = staffPosts.map((post, idx) => ({
      scenario_id: scenario.id,
      staff_post_id: post.id,
      status: "active" as const,
      position_order: idx,
    }));

    const { error: postsError } = await supabase
      .from("scenario_posts")
      .insert(scenarioPosts);

    if (postsError) throw new Error(`Failed to add posts to baseline: ${postsError.message}`);
  }

  return scenario;
}

// ─── Scenario Posts ─────────────────────────────────────────────────

export async function getScenarioPosts(
  scenarioId: string,
): Promise<(ScenarioPost & { staff_post: StaffPost })[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("scenario_posts")
    .select("*, staff_post:staff_posts(*)")
    .eq("scenario_id", scenarioId)
    .order("position_order");

  if (error) throw new Error(`Failed to load scenario posts: ${error.message}`);
  return data ?? [];
}

export async function updateScenarioPost(
  scenarioPostId: string,
  updates: Partial<Pick<ScenarioPost, "status" | "override_salary" | "override_fte" | "position_order">>,
): Promise<ScenarioPost> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("scenario_posts")
    .update(updates)
    .eq("id", scenarioPostId)
    .select()
    .single();

  if (error) throw new Error(`Failed to update scenario post: ${error.message}`);
  return data;
}

export async function addPostToScenario(
  scenarioId: string,
  staffPostId: string,
  overrides?: { override_salary?: number; override_fte?: number },
): Promise<ScenarioPost> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("scenario_posts")
    .insert({
      scenario_id: scenarioId,
      staff_post_id: staffPostId,
      status: "added" as const,
      ...overrides,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to add post to scenario: ${error.message}`);
  return data;
}

// ─── Pay Assumptions ────────────────────────────────────────────────

export async function getPayAssumptions(
  scenarioId: string,
): Promise<PayAssumption[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("pay_assumptions")
    .select("*")
    .eq("scenario_id", scenarioId);

  if (error) throw new Error(`Failed to load pay assumptions: ${error.message}`);
  return data ?? [];
}

export async function savePayAssumptions(
  scenarioId: string,
  assumptions: PayAssumptionInput[],
): Promise<PayAssumption[]> {
  const supabase = serviceClient();

  // Delete existing assumptions for this scenario
  const { error: deleteError } = await supabase
    .from("pay_assumptions")
    .delete()
    .eq("scenario_id", scenarioId);

  if (deleteError) throw new Error(`Failed to clear pay assumptions: ${deleteError.message}`);

  if (assumptions.length === 0) return [];

  // Insert new ones
  const rows = assumptions.map((a) => ({ scenario_id: scenarioId, ...a }));
  const { data, error } = await supabase
    .from("pay_assumptions")
    .insert(rows)
    .select();

  if (error) throw new Error(`Failed to save pay assumptions: ${error.message}`);
  return data ?? [];
}

// ─── ICFP Snapshots ─────────────────────────────────────────────────

export async function saveICFPSnapshot(
  orgId: string,
  scenarioId: string,
  metrics: {
    staffing_pct: number;
    ptr: number;
    slt_pct: number;
    teach_pct: number;
    total_income: number;
    total_staffing: number;
  },
  rawData?: Record<string, unknown>,
  userId?: string,
): Promise<ICFPScenarioSnapshot> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("icfp_scenario_snapshots")
    .insert({
      organization_id: orgId,
      scenario_id: scenarioId,
      ...metrics,
      raw_data: rawData ?? null,
      created_by: userId ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save ICFP snapshot: ${error.message}`);
  return data;
}

export async function getICFPSnapshots(
  orgId: string,
  scenarioId?: string,
): Promise<ICFPScenarioSnapshot[]> {
  const supabase = serviceClient();
  let query = supabase
    .from("icfp_scenario_snapshots")
    .select("*")
    .eq("organization_id", orgId)
    .order("snapshot_date", { ascending: false });

  if (scenarioId) {
    query = query.eq("scenario_id", scenarioId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load ICFP snapshots: ${error.message}`);
  return data ?? [];
}
