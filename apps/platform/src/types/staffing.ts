// ─── Staffing Modeller Types ────────────────────────────────────────
// Maps to Supabase tables in 20260314_icfp_staffing_modeller.sql

export type Phase = "primary" | "secondary" | "special" | "all_through";
export type Tier = "headteacher" | "slt" | "teachers" | "tas" | "support" | "volunteers";
export type PayFramework = "STPCD" | "NJC" | "HTPR" | "unpaid";
export type ContractType = "permanent" | "fixed_term" | "supply";
export type ScenarioPostStatus = "active" | "released" | "added";

// ─── school_settings ────────────────────────────────────────────────

export interface SchoolSettings {
  id: string;
  organization_id: string;
  phase: Phase | null;
  roll: number;
  gag_per_pupil: number;
  financial_year_start: string | null;
  created_at: string;
  updated_at: string;
}

// ─── staff_posts ────────────────────────────────────────────────────

export interface StaffPost {
  id: string;
  organization_id: string;
  name: string | null;
  role: string;
  tier: Tier | null;
  salary: number;
  fte: number;
  on_cost_rate: number;
  dfe_code: string | null;
  pay_framework: PayFramework | null;
  contract_type: ContractType | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── staffing_scenarios ─────────────────────────────────────────────

export interface StaffingScenario {
  id: string;
  organization_id: string;
  name: string;
  is_baseline: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── scenario_posts ─────────────────────────────────────────────────

export interface ScenarioPost {
  id: string;
  scenario_id: string;
  staff_post_id: string;
  status: ScenarioPostStatus;
  override_salary: number | null;
  override_fte: number | null;
  position_order: number;
}

// ─── pay_assumptions ────────────────────────────────────────────────

export interface PayAssumption {
  id: string;
  scenario_id: string;
  framework: PayFramework | null;
  award_rate: number;
  effective_month: number | null;
  financial_year: number | null;
}

// ─── icfp_scenario_snapshots ────────────────────────────────────────

export interface ICFPScenarioSnapshot {
  id: string;
  organization_id: string;
  scenario_id: string;
  snapshot_date: string;
  staffing_pct: number | null;
  ptr: number | null;
  slt_pct: number | null;
  teach_pct: number | null;
  total_income: number | null;
  total_staffing: number | null;
  raw_data: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

// ─── Computed Metrics ───────────────────────────────────────────────

export interface ICFPMetrics {
  totalIncome: number;
  totalStaffingCost: number;
  baselineCost: number;
  staffingPct: number;
  pupilTeacherRatio: number;
  averageTeacherCost: number;
  sltPct: number;
  teachersPct: number;
  tasPct: number;
  supportPct: number;
  totalFte: number;
  teacherFte: number;
  tierBreakdown: Record<Tier, { cost: number; fte: number; count: number }>;
}

// ─── Scenario with joined data ──────────────────────────────────────

export interface ScenarioWithPosts extends StaffingScenario {
  posts: (ScenarioPost & { staff_post: StaffPost })[];
}

// ─── Pay assumption input (for create/update) ───────────────────────

export interface PayAssumptionInput {
  framework: PayFramework;
  award_rate: number;
  effective_month: number;
  financial_year: number;
}
