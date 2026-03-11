/**
 * Budget Decision Engine Types
 *
 * Central nervous system connecting all modules:
 * Finance -> Estates -> Vision (stock) -> HR -> Teaching -> Compliance -> Governance
 *
 * The engine reads the budget plan, monitors spend across all modules,
 * detects issues (boiler breaks, overspend, stock shortages), and presents
 * decision cards that heads/SBMs approve or reject with one click.
 *
 * Outputs auto-flow to: SEF/SIP updates, Climate Action Plan, Risk Register,
 * Staff Communications, Department Strategy docs.
 */

// =====================================================
// CFR CODE SYSTEM (DfE Consistent Financial Reporting)
// =====================================================

export const CFR_EXPENDITURE = {
  E01: "Teaching staff",
  E02: "Supply teaching staff",
  E03: "Education support staff",
  E04: "Premises staff",
  E05: "Administrative and clerical staff",
  E06: "Catering staff",
  E07: "Cost of other staff",
  E08: "Indirect employee expenses",
  E09: "Staff development and training",
  E10: "Supply teacher insurance",
  E11: "Staff-related insurance",
  E12: "Building maintenance and improvement",
  E13: "Grounds maintenance and improvement",
  E14: "Cleaning and caretaking",
  E15: "Water and sewerage",
  E16: "Energy",
  E17: "Rates",
  E18: "Other occupation costs",
  E19: "Learning resources",
  E20A: "ICT - Connectivity",
  E20B: "ICT - Onsite servers",
  E20C: "ICT - Learning resources",
  E20D: "ICT - Administration software",
  E20E: "ICT - Laptops, desktops, tablets",
  E20F: "ICT - Other hardware",
  E20G: "ICT - IT support",
  E21: "Examination fees",
  E22: "Administrative supplies",
  E23: "Other insurance premiums",
  E24: "Special facilities",
  E25: "Catering supplies",
  E26: "Agency supply teaching staff",
  E27: "Bought-in professional services - curriculum",
  E28a: "Bought-in professional services - other",
  E28b: "Bought-in professional services - PFI",
  E29: "Loan interest",
  E30: "Direct revenue financing",
  E31: "Community-focused school staff",
  E32: "Community-focused school costs",
} as const;

export type CFRCode = keyof typeof CFR_EXPENDITURE;

// =====================================================
// ICFP BENCHMARKS (DfE Integrated Curriculum & Financial Planning)
// =====================================================

export interface ICFPMetrics {
  /** Total staff costs as % of income. Target: 75-80%, max 78% recommended */
  staffing_percent: number;
  /** FTE teachers / pupils. Compared to 30 similar schools */
  pupil_teacher_ratio: number;
  /** Total pupil periods / total teaching periods */
  average_class_size: number;
  /** Total teacher pay / FTE teachers */
  average_teacher_cost: number;
  /** Total planned curriculum periods / total bought teacher periods. Target: 0.78 */
  teacher_contact_ratio: number;
  /** Leadership pay / total grant income */
  leadership_percent: number;
  /** Leadership FTE / total teacher FTE */
  leadership_fte_percent: number;
}

export interface ICFPBenchmark {
  metric: keyof ICFPMetrics;
  school_value: number;
  national_average: number;
  similar_schools_average: number;
  percentile: number;
  rag: "red" | "amber" | "green";
  narrative: string;
}

export interface StructuralViabilityResult {
  viable: boolean;
  risks: string[];
  suggestions: string[];
}

// =====================================================
// BUDGET PLAN (what was agreed at start of year)
// =====================================================

export interface BudgetPlan {
  id: string;
  organization_id: string;
  school_id: string;
  financial_year: string;
  /** April-March for LA, September-August for academies */
  budget_cycle: "la" | "academy";
  fy_start: string;
  fy_end: string;
  total_income: number;
  total_expenditure_planned: number;
  planned_surplus_deficit: number;
  status: "draft" | "approved" | "revised" | "year_end";
  approved_by?: string;
  approved_date?: string;
  /** Budget lines by CFR code */
  lines: BudgetLine[];
  /** Strategic priorities from SIP/SEF */
  strategic_priorities: StrategicPriority[];
  created_at: string;
  updated_at: string;

  // --- ICFP workforce fields (from census / HR module) ---

  /** Number on roll — total pupil count */
  number_on_roll?: number;
  /** Number of classes (teaching groups) */
  number_of_classes?: number;
  /** Total teacher FTE (classroom + leadership) */
  teacher_fte?: number;
  /** Total staff FTE across all roles */
  total_staff_fte?: number;
  /** Leadership FTE (head, deputies, assistant heads) */
  leadership_fte?: number;
  /** Leadership pay cost (head + deputies + assistant heads, including on-costs) */
  leadership_cost?: number;
  /** Total curriculum teaching periods per week (e.g. 25 × number_of_classes) */
  teaching_periods?: number;
  /** Total available teacher periods per week (teacher_fte × periods_per_teacher) */
  total_available_periods?: number;
}

export interface BudgetLine {
  cfr_code: CFRCode;
  category: string;
  department?: string;
  planned_amount: number;
  /** Actual spend to date */
  actual_ytd: number;
  /** Committed (POs raised but not yet paid) */
  committed: number;
  /** Available = planned - actual - committed */
  available: number;
  /** Projected full-year spend based on trend */
  projected_outturn: number;
  variance_percent: number;
  rag: "red" | "amber" | "green";
  /** Monthly spend profile for trend analysis */
  monthly_profile: MonthlySpend[];
  /** Is this line currently frozen/blocked? */
  frozen: boolean;
  freeze_reason?: string;
}

export interface MonthlySpend {
  month: string;
  planned: number;
  actual: number;
  cumulative_planned: number;
  cumulative_actual: number;
}

export interface StrategicPriority {
  id: string;
  title: string;
  /** Links to SEF/SIP */
  source: "sef" | "sip" | "ofsted" | "estates_strategy" | "hr_plan" | "manual";
  source_id?: string;
  planned_spend: number;
  actual_spend: number;
  status: "on_track" | "at_risk" | "paused" | "deferred" | "completed";
  /** If paused/deferred, why and when */
  pause_reason?: string;
  pause_date?: string;
  deferred_to?: string;
  risk_score?: number;
}

// =====================================================
// BUDGET POSITION (where we are right now)
// =====================================================

export interface BudgetPosition {
  school_id: string;
  as_at_date: string;
  months_elapsed: number;
  months_remaining: number;
  /** % through the financial year */
  year_progress: number;

  total_income_received: number;
  total_expenditure_ytd: number;
  total_committed: number;
  available_budget: number;

  projected_year_end_position: number;
  projected_surplus_deficit: number;

  /** Spend rate: are we on track, ahead, or behind? */
  burn_rate: "under" | "on_track" | "over";
  burn_rate_percent: number;

  /** ICFP analysis */
  icfp: ICFPMetrics;
  icfp_benchmarks: ICFPBenchmark[];

  /** Lines that need attention */
  alerts: BudgetAlert[];

  /** Cross-module issues affecting budget */
  active_issues: BudgetIssue[];
}

export interface BudgetAlert {
  id: string;
  cfr_code: CFRCode;
  category: string;
  severity: "info" | "warning" | "critical";
  message: string;
  /** e.g., "68% spent with 5 months remaining" */
  detail: string;
  suggested_action?: string;
}

// =====================================================
// BUDGET ISSUES (things that have happened)
// =====================================================

export interface BudgetIssue {
  id: string;
  school_id: string;
  /** Which module raised this issue */
  source_module:
    | "estates"
    | "hr"
    | "teaching"
    | "compliance"
    | "governance"
    | "vision"
    | "finance"
    | "safeguarding";
  source_id?: string;
  title: string;
  description: string;
  /** Financial impact (cost or saving) */
  financial_impact: number;
  impact_type: "cost" | "saving" | "unknown";
  /** CFR codes affected */
  cfr_codes_affected: CFRCode[];
  severity: "low" | "medium" | "high" | "critical";
  status: "new" | "acknowledged" | "decision_pending" | "resolved" | "deferred";
  /** What strategic priorities does this affect? */
  affected_priorities: string[];
  raised_date: string;
  resolved_date?: string;
  resolution?: string;
}

// =====================================================
// DECISION CARDS (AI-generated options for heads)
// =====================================================

export interface DecisionCard {
  id: string;
  school_id: string;
  /** The issue or trigger that created this decision */
  trigger_issue_id?: string;
  trigger_type:
    | "overspend"
    | "emergency"
    | "opportunity"
    | "compliance"
    | "strategic_review"
    | "stock_alert"
    | "benchmark_flag";

  title: string;
  /** Plain-English summary of the situation */
  situation: string;

  /** Options presented — school picks one */
  options: DecisionOption[];

  /** AI recommendation with reasoning */
  ai_recommendation: number;
  ai_reasoning: string;

  /** What gets affected across modules */
  cross_module_impacts: CrossModuleImpact[];

  status: "pending" | "decided" | "expired" | "superseded";
  decided_option?: number;
  decided_by?: string;
  decided_date?: string;
  decision_notes?: string;

  created_at: string;
  expires_at?: string;
}

export interface DecisionOption {
  index: number;
  title: string;
  description: string;
  financial_impact: number;
  risk_level: "low" | "medium" | "high";
  risk_detail: string;

  /** What gets paused, cut, or changed */
  actions: DecisionAction[];

  /** Impact on ICFP metrics */
  icfp_impact?: Partial<ICFPMetrics>;

  /** Timeline */
  implementation: string;
}

export interface DecisionAction {
  type:
    | "pause"
    | "cut"
    | "defer"
    | "reallocate"
    | "approve"
    | "block_orders"
    | "reduce"
    | "monitor";
  target_module: string;
  target_id?: string;
  cfr_code?: CFRCode;
  description: string;
  amount?: number;
  /** Auto-updates to make if this option is chosen */
  auto_updates: AutoUpdate[];
}

export interface AutoUpdate {
  /** Which document/plan gets updated */
  target:
    | "sef"
    | "sip"
    | "risk_register"
    | "estates_strategy"
    | "climate_action"
    | "budget_line"
    | "staff_comms"
    | "department_strategy";
  target_id?: string;
  update_type:
    | "status_change"
    | "narrative_update"
    | "date_change"
    | "amount_change"
    | "new_entry";
  description: string;
  /** AI-generated content for the update */
  content?: string;
}

// =====================================================
// CROSS-MODULE IMPACTS
// =====================================================

export interface CrossModuleImpact {
  module: string;
  impact_type: "positive" | "negative" | "neutral";
  description: string;
  risk_change?: number;
  /** Specific items affected in that module */
  affected_items: string[];
}

// =====================================================
// STAFF COMMUNICATIONS (auto-generated)
// =====================================================

export interface StaffCommunication {
  id: string;
  school_id: string;
  decision_id: string;
  /** Different comms for different audiences */
  audience:
    | "all_staff"
    | "slt"
    | "department_heads"
    | "governors"
    | "specific_department";
  department?: string;

  subject: string;
  /** High-level, positive, solution-focused message */
  body: string;
  /** Tone: professional but human */
  tone: "informative" | "reassuring" | "action_required";

  status: "draft" | "approved" | "sent";
  approved_by?: string;
  created_at: string;
}

// =====================================================
// DEPARTMENT STRATEGIES (what each dept can do to help)
// =====================================================

export interface DepartmentStrategy {
  id: string;
  school_id: string;
  decision_id?: string;
  department: string;

  /** Suggested initiatives from AI */
  initiatives: SavingInitiative[];

  total_potential_saving: number;
  status: "suggested" | "approved" | "in_progress" | "completed";
  created_at: string;
}

export interface SavingInitiative {
  id: string;
  title: string;
  description: string;
  department: string;
  category:
    | "energy"
    | "procurement"
    | "staffing"
    | "resources"
    | "waste"
    | "process"
    | "contracts";

  estimated_saving: number;
  saving_period: "monthly" | "termly" | "annual";
  effort: "low" | "medium" | "high";
  implementation: string;

  /** Does this also count as a climate/sustainability action? */
  climate_action: boolean;
  /** Auto-tag into climate action plan categories */
  climate_category?:
    | "energy_reduction"
    | "waste_reduction"
    | "sustainable_procurement"
    | "transport"
    | "water"
    | "biodiversity";
  /** Estimated CO2 saving in kg */
  co2_saving_kg?: number;

  status:
    | "suggested"
    | "accepted"
    | "rejected"
    | "in_progress"
    | "completed"
    | "measured";
  accepted_by?: string;
  measured_saving?: number;
}

// =====================================================
// CLIMATE ACTION PLAN (auto-populated from initiatives)
// =====================================================

export interface ClimateActionPlan {
  id: string;
  school_id: string;
  academic_year: string;

  /** Auto-populated from accepted SavingInitiatives where climate_action=true */
  actions: ClimateAction[];

  total_co2_target_kg: number;
  total_co2_achieved_kg: number;

  /** Carbon reporting summary */
  carbon_report: CarbonReport;

  status: "draft" | "active" | "year_end";
  created_at: string;
  updated_at: string;
}

export interface ClimateAction {
  initiative_id: string;
  category:
    | "energy_reduction"
    | "waste_reduction"
    | "sustainable_procurement"
    | "transport"
    | "water"
    | "biodiversity";
  title: string;
  description: string;
  department: string;
  co2_target_kg: number;
  co2_achieved_kg: number;
  financial_saving: number;
  status: "planned" | "in_progress" | "completed" | "measured";
  evidence?: string;
}

export interface CarbonReport {
  /** Baseline year for comparison */
  baseline_year: string;
  baseline_co2_kg: number;
  current_year_co2_kg: number;
  reduction_percent: number;

  /** Breakdown by scope */
  scope1_kg: number;
  scope2_kg: number;
  scope3_kg: number;

  /** Top sources */
  by_category: {
    category: string;
    co2_kg: number;
    change_percent: number;
  }[];
}

// =====================================================
// STOCK INTELLIGENCE (from Vision AI)
// =====================================================

export interface StockLevel {
  id: string;
  school_id: string;
  item_name: string;
  category: string;
  cfr_code: CFRCode;
  location: string;

  /** Current quantity (from vision scan or manual) */
  current_qty: number;
  unit: string;
  /** Average consumption per week/month */
  consumption_rate: number;
  consumption_period: "weekly" | "monthly";
  /** Estimated weeks of stock remaining */
  weeks_remaining: number;
  /** Minimum stock level before reorder */
  reorder_threshold: number;

  /** Last vision scan */
  last_scanned: string;
  last_scanned_by: string;
  scan_confidence: number;

  /** Order status */
  order_blocked: boolean;
  block_reason?: string;
  /** When does budget renew? If enough stock to last, block orders */
  budget_renewal_date: string;
  enough_until_renewal: boolean;
}

export interface StockAlert {
  stock_id: string;
  alert_type:
    | "low_stock"
    | "overstocked"
    | "order_blocked"
    | "reorder_suggested"
    | "consumption_spike";
  message: string;
  suggested_action: string;
  /** Link to Deal Finder for procurement */
  deal_finder_url?: string;
}

// =====================================================
// RISK ESCALATION
// =====================================================

export interface RiskEscalation {
  id: string;
  school_id: string;
  source_module: string;
  source_id: string;
  title: string;

  /** Risk score increases if mitigation not completed */
  base_risk_score: number;
  current_risk_score: number;
  /** Score increases by this per day overdue */
  escalation_rate: number;

  /** Who is responsible */
  assigned_to: string;
  /** What they need to do */
  mitigation_task: string;
  due_date: string;

  /** Escalation chain */
  escalation_level: number;
  escalation_chain: EscalationStep[];

  status: "active" | "mitigated" | "escalated" | "resolved";
  last_checked?: string;
  last_checked_by?: string;
}

export interface EscalationStep {
  level: number;
  /** Days overdue before this level triggers */
  trigger_days: number;
  notify_role: string;
  notify_person?: string;
  action: string;
  /** Additional checks added at this level */
  additional_checks?: string[];
}

// =====================================================
// MAT OVERVIEW (Multi-Academy Trust)
// =====================================================

export interface MATOverview {
  trust_id: string;
  trust_name: string;
  schools: MATSchoolSummary[];
  consolidated: {
    total_income: number;
    total_expenditure: number;
    total_surplus_deficit: number;
    staffing_percent: number;
    premises_percent: number;
  };
  /** Cross-school procurement opportunities */
  procurement_opportunities: ProcurementOpportunity[];
  /** Schools flagged for investigation */
  flags: MATFlag[];
}

export interface MATSchoolSummary {
  school_id: string;
  school_name: string;
  phase: string;
  pupil_count: number;
  budget_position: number;
  staffing_percent: number;
  premises_percent: number;
  icfp_rag: Record<string, "red" | "amber" | "green">;
  active_issues: number;
  pending_decisions: number;
}

export interface ProcurementOpportunity {
  item_category: string;
  schools_ordering: string[];
  individual_total: number;
  bulk_estimated_total: number;
  potential_saving: number;
  supplier_recommendation: string;
}

export interface MATFlag {
  school_id: string;
  school_name: string;
  flag_type:
    | "staffing_high"
    | "deficit_risk"
    | "overspend"
    | "benchmark_outlier"
    | "decision_overdue";
  metric: string;
  value: number;
  threshold: number;
  narrative: string;
}
