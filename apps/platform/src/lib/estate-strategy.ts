export type StrategicPlanType =
  | "capital"
  | "improvement"
  | "financial"
  | "estates";

export type StrategicPlanStatus =
  | "draft"
  | "approved"
  | "active"
  | "archived";

export type StrategicPlanItemStatus =
  | "draft"
  | "planned"
  | "approved"
  | "in_progress"
  | "complete"
  | "deferred";

export type MoscowBand = "must" | "should" | "could" | "wont";

export interface StrategicPlanDbRow {
  id: string;
  title: string;
  description?: string | null;
  plan_type?: string | null;
  status?: string | null;
  start_year: string;
  end_year: string;
  total_budget?: number | null;
  year_1_budget?: number | null;
  year_2_budget?: number | null;
  year_3_budget?: number | null;
  created_at: string;
}

export interface StrategicPlanItemCostRow {
  estimated_cost?: number | null;
}

export interface StrategicPlanUi {
  id: string;
  title: string;
  description?: string | null;
  type: StrategicPlanType;
  plan_type: StrategicPlanType;
  status: string;
  academic_year_start: string;
  start_year: string;
  end_year: string;
  duration_years: number;
  total_estimated_cost: number;
  item_count: number;
  created_at: string;
}

export interface StrategicPlanItemDbRow {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  year?: number | null;
  estimated_cost?: number | null;
  priority_band?: string | null;
  priority_rank?: number | null;
  risk_score?: number | null;
  is_statutory?: boolean | null;
  risk_register_id?: string | null;
  sdp_priority_id?: string | null;
  status?: string | null;
}

export interface StrategicPlanItemUi {
  id: string;
  title: string;
  description: string;
  category: string;
  year: number;
  moscow_band: MoscowBand;
  priority_band: MoscowBand;
  estimated_cost: number;
  risk_score: number;
  statutory: boolean;
  is_statutory: boolean;
  status: "draft" | "approved" | "in_progress" | "complete" | "deferred";
  linked_risk_id?: string;
  linked_sdp_priority_id?: string;
  risk_register_id?: string;
  sdp_priority_id?: string;
  priority_rank?: number;
}

export interface BuildStrategicPlanInsertInput {
  organizationId: string;
  title: string;
  description?: string | null;
  academicYearStart?: string | null;
  startYear?: string | null;
  endYear?: string | null;
  durationYears?: number | null;
  planType?: StrategicPlanType | null;
  totalBudget?: number | null;
  year1Budget?: number | null;
  year2Budget?: number | null;
  year3Budget?: number | null;
}

export interface StrategicPlanInsert {
  organization_id: string;
  title: string;
  description?: string | null;
  plan_type: StrategicPlanType;
  status: StrategicPlanStatus;
  start_year: string;
  end_year: string;
  total_budget?: number | null;
  year_1_budget?: number | null;
  year_2_budget?: number | null;
  year_3_budget?: number | null;
}

export interface BuildStrategicPlanItemInsertInput {
  organizationId: string;
  planId: string;
  title: string;
  description?: string | null;
  category?: string | null;
  year?: number | null;
  estimatedCost?: number | null;
  priorityBand?: MoscowBand | null;
  riskScore?: number | null;
  isStatutory?: boolean | null;
  riskRegisterId?: string | null;
  schoolId?: string | null;
  sdpPriorityId?: string | null;
  sefAreaId?: string | null;
  cfrCode?: string | null;
  fundingSource?: string | null;
  sourceModule?: string | null;
  sourceEntityId?: string | null;
  consequenceIfUnfunded?: string | null;
}

export interface StrategicPlanItemInsert {
  organization_id: string;
  strategic_plan_id: string;
  title: string;
  description?: string | null;
  category: string;
  year: number;
  estimated_cost: number;
  priority_band: MoscowBand;
  status: "planned";
  risk_score?: number | null;
  is_statutory?: boolean | null;
  risk_register_id?: string | null;
  school_id?: string | null;
  sdp_priority_id?: string | null;
  sef_area_id?: string | null;
  cfr_code?: string | null;
  funding_source?: string | null;
  source_module?: string | null;
  source_entity_id?: string | null;
  consequence_if_unfunded?: string | null;
}

export function buildStrategicPlanInsert(
  input: BuildStrategicPlanInsertInput,
): StrategicPlanInsert {
  const startYear =
    input.startYear || input.academicYearStart || currentAcademicYear();
  const durationYears = clampDuration(input.durationYears ?? 3);

  return stripUndefined({
    organization_id: input.organizationId,
    title: input.title,
    description: input.description,
    plan_type: input.planType ?? "estates",
    status: "draft",
    start_year: startYear,
    end_year: input.endYear || addAcademicYears(startYear, durationYears - 1),
    total_budget: input.totalBudget,
    year_1_budget: input.year1Budget,
    year_2_budget: input.year2Budget,
    year_3_budget: input.year3Budget,
  }) as StrategicPlanInsert;
}

export function buildStrategicPlanItemInsert(
  input: BuildStrategicPlanItemInsertInput,
): StrategicPlanItemInsert {
  return stripUndefined({
    organization_id: input.organizationId,
    strategic_plan_id: input.planId,
    title: input.title,
    description: input.description,
    category: input.category ?? "estates",
    year: clampPlanYear(input.year ?? 1),
    estimated_cost: input.estimatedCost ?? 0,
    priority_band: input.priorityBand ?? "could",
    status: "planned",
    risk_score: input.riskScore,
    is_statutory: input.isStatutory,
    risk_register_id: input.riskRegisterId,
    school_id: input.schoolId,
    sdp_priority_id: input.sdpPriorityId,
    sef_area_id: input.sefAreaId,
    cfr_code: input.cfrCode,
    funding_source: input.fundingSource,
    source_module: input.sourceModule,
    source_entity_id: input.sourceEntityId,
    consequence_if_unfunded: input.consequenceIfUnfunded,
  }) as StrategicPlanItemInsert;
}

export function mapStrategicPlanForUi(
  plan: StrategicPlanDbRow,
  items: StrategicPlanItemCostRow[] = [],
): StrategicPlanUi {
  const planType = normalisePlanType(plan.plan_type);

  return {
    ...plan,
    type: planType,
    plan_type: planType,
    status: plan.status ?? "draft",
    academic_year_start: plan.start_year,
    duration_years: calculateAcademicYearDuration(plan.start_year, plan.end_year),
    total_estimated_cost: items.reduce(
      (sum, item) => sum + (Number(item.estimated_cost) || 0),
      0,
    ),
    item_count: items.length,
  };
}

export function mapStrategicPlanItemForUi(
  item: StrategicPlanItemDbRow,
): StrategicPlanItemUi {
  const priorityBand = normaliseMoscowBand(item.priority_band);
  const status = normaliseItemStatus(item.status);

  return {
    ...item,
    description: item.description ?? "",
    category: item.category ?? "estates",
    year: item.year ?? 1,
    moscow_band: priorityBand,
    priority_band: priorityBand,
    estimated_cost: Number(item.estimated_cost) || 0,
    risk_score: Number(item.risk_score) || 0,
    statutory: Boolean(item.is_statutory),
    is_statutory: Boolean(item.is_statutory),
    status,
    linked_risk_id: item.risk_register_id ?? undefined,
    linked_sdp_priority_id: item.sdp_priority_id ?? undefined,
    risk_register_id: item.risk_register_id ?? undefined,
    sdp_priority_id: item.sdp_priority_id ?? undefined,
    priority_rank: item.priority_rank ?? undefined,
  };
}

export function addAcademicYears(
  academicYearStart: string,
  offset: number,
): string {
  const match = academicYearStart.match(/(\d{4})(?:\/(\d{4}))?/);
  if (!match) {
    return academicYearStart;
  }

  const firstYear = Number(match[1]) + offset;
  return `${firstYear}/${firstYear + 1}`;
}

function currentAcademicYear(): string {
  const now = new Date();
  const firstYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${firstYear}/${firstYear + 1}`;
}

function calculateAcademicYearDuration(startYear: string, endYear: string): number {
  const start = Number(startYear.match(/\d{4}/)?.[0]);
  const end = Number(endYear.match(/\d{4}/)?.[0]);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return 3;
  }
  return end - start + 1;
}

function clampDuration(durationYears: number): number {
  return Math.min(Math.max(Math.round(durationYears), 1), 5);
}

function clampPlanYear(year: number): number {
  return Math.min(Math.max(Math.round(year), 1), 5);
}

function normalisePlanType(value?: string | null): StrategicPlanType {
  if (
    value === "capital" ||
    value === "improvement" ||
    value === "financial" ||
    value === "estates"
  ) {
    return value;
  }
  return "estates";
}

function normaliseMoscowBand(value?: string | null): MoscowBand {
  if (
    value === "must" ||
    value === "should" ||
    value === "could" ||
    value === "wont"
  ) {
    return value;
  }
  return "could";
}

function normaliseItemStatus(
  value?: string | null,
): StrategicPlanItemUi["status"] {
  if (
    value === "approved" ||
    value === "in_progress" ||
    value === "complete" ||
    value === "deferred"
  ) {
    return value;
  }
  return "draft";
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as T;
}
