// Schoolgle Finance Module TypeScript Types

// =====================================================
// CORE FINANCE TYPES
// =====================================================

export interface FinanceBudget {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year: string;
  fy_start: string;
  fy_end: string;
  total_budget: number;
  total_income: number;
  total_expenditure: number;
  budget_source: 'upload' | 'manual';
  file_url?: string;
  file_name?: string;
  uploaded_by?: string;
  uploaded_at?: string;
  status: 'draft' | 'active' | 'archived';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceTransaction {
  id: string;
  organization_id: string;
  school_id: string;
  budget_id: string;
  transaction_date: string;
  description: string;
  category: string;
  cost_centre?: string;
  amount: number;
  transaction_type: 'income' | 'expenditure';
  budget_line?: string;
  supplier?: string;
  invoice_number?: string;
  reference?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancePayroll {
  id: string;
  organization_id: string;
  school_id: string;
  period_month: number;
  period_year: number;
  staff_name: string;
  staff_id?: string;
  gross_pay: number;
  net_pay: number;
  pension: number;
  ni: number;
  tax: number;
  cost_centre?: string;
  budget_line?: string;
  role?: string;
  uploaded_by?: string;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceVarianceAnalysis {
  id: string;
  organization_id: string;
  school_id: string;
  budget_id: string;
  category: string;
  budgeted_amount: number;
  actual_amount: number;
  variance_amount: number;
  variance_percent: number;
  ai_narrative?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface FinanceAction {
  id: string;
  organization_id: string;
  school_id: string;
  variance_id?: string;
  action_type: 'review' | 'investigate' | 'adjust_budget' | 'meeting' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string;
  due_date?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceScenario {
  id: string;
  organization_id: string;
  school_id: string;
  scenario_name: string;
  description?: string;
  target_saving: number;
  assumptions: Record<string, any>;
  results: Record<string, any>;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceFundingStream {
  id: string;
  organization_id: string;
  school_id: string;
  academic_year: string;
  stream_type: 'GAG' | 'Pupil_Premium' | 'High_Needs' | 'PE_Sport' | 'Other';
  amount: number;
  source?: string;
  received_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceBenchmark {
  id: string;
  school_phase: 'primary' | 'secondary' | 'all_through' | 'special';
  region: string;
  data_source: 'dfe' | 'fbit' | 'obr' | 'manual';
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  metadata: Record<string, any>;
  updated_at: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface UploadBudgetRequest {
  file: File;
  academic_year: string;
  budget_source: 'upload' | 'manual';
  notes?: string;
}

export interface UploadBudgetResponse {
  success: boolean;
  budget_id: string;
  transaction_count: number;
  errors?: string[];
}

export interface UploadPayrollRequest {
  file: File;
  period_month: number;
  period_year: number;
}

export interface UploadPayrollResponse {
  success: boolean;
  payroll_count: number;
  anomalies: PayrollAnomaly[];
  errors?: string[];
}

export interface PayrollAnomaly {
  staff_name: string;
  issue_type: 'variance' | 'leaver_still_paid' | 'missing_staff' | 'duplicate';
  amount?: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface GenerateScenarioRequest {
  target_saving: number;
  constraints?: {
    exclude_redundancy?: boolean;
    max_staff_reduction?: number;
    protected_areas?: string[];
  };
}

export interface GenerateScenarioResponse {
  scenarios: ScenarioResult[];
  total_possible_saving: number;
  recommendations: string[];
}

export interface ScenarioResult {
  id: string;
  name: string;
  description: string;
  total_saving: number;
  breakdown: {
    staffing: number;
    premises: number;
    supplies: number;
    other: number;
  };
  impact_description: string;
  risk_level: 'low' | 'medium' | 'high';
  redundancy_cost?: number;
  implementation_time: string;
}

// =====================================================
// AI NARRATIVE TYPES
// =====================================================

export interface VarianceNarrativeRequest {
  category: string;
  budgeted_amount: number;
  actual_amount: number;
  variance_percent: number;
  historical_data?: VarianceDataPoint[];
  context?: string;
}

export interface VarianceNarrativeResponse {
  narrative: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggested_actions: string[];
  confidence_score: number;
}

export interface VarianceDataPoint {
  month: string;
  budgeted: number;
  actual: number;
  variance_percent: number;
}

export interface AIProviderConfig {
  provider: 'GEMINI' | 'OPENAI';
  model: string;
  temperature: number;
  max_tokens?: number;
}

// =====================================================
// BENCHMARKING TYPES
// =====================================================

export interface BenchmarkComparison {
  school_phase: string;
  region: string;
  metrics: {
    spend_per_pupil: {
      school: number;
      national_average: number;
      difference_percent: number;
    };
    staffing_percentage: {
      school: number;
      national_average: number;
      difference_percent: number;
    };
    premises_percentage: {
      school: number;
      national_average: number;
      difference_percent: number;
    };
  };
  narrative?: string;
  recommendations: string[];
}

export interface DfEFundingData {
  schoolUrn: string;
  academicYear: string;
  totalFunding: number;
  fundingStreams: FundingStream[];
}

export interface FundingStream {
  type: string;
  amount: number;
  source: string;
}

export interface FBITBenchmark {
  schoolPhase: string;
  region: string;
  staffingPercent: number;
  premisesPercent: number;
  suppliesPercent: number;
}

export interface PayForecast {
  year: number;
  teacherPayAward: number;
  supportStaffAward: number;
  inflation: number;
}

// =====================================================
// DASHBOARD TYPES
// =====================================================

export interface FinanceKPIs {
  total_budget: number;
  ytd_spend: number;
  ytd_income: number;
  variance_percent: number;
  top_variance_category: string;
  top_variance_amount: number;
  actions_pending: number;
  scenarios_saved: number;
}

export interface BudgetOverviewData {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variance_percent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PayrollSummaryData {
  total_gross_pay: number;
  total_net_pay: number;
  staff_count: number;
  variance_from_budget: number;
  anomalies_count: number;
  monthly_trend: PayrollTrendPoint[];
}

export interface PayrollTrendPoint {
  month: string;
  gross_pay: number;
  staff_count: number;
  variance_percent: number;
}

// =====================================================
// COMPONENT PROPS TYPES
// =====================================================

export interface FinanceDashboardProps {
  schoolId: string;
  organizationId: string;
  academicYear?: string;
}

export interface BudgetUploaderProps {
  onUploadComplete: (response: UploadBudgetResponse) => void;
  academicYear: string;
  schoolId: string;
}

export interface VarianceTableProps {
  variances: FinanceVarianceAnalysis[];
  onActionCreate: (varianceId: string, action: Partial<FinanceAction>) => void;
}

export interface ScenarioCardProps {
  scenario: ScenarioResult;
  onSave?: (scenario: ScenarioResult) => void;
  onCompare?: (scenario: ScenarioResult) => void;
}

export interface AIInsightCardProps {
  variance: FinanceVarianceAnalysis;
  narrative?: string;
  suggestedActions?: string[];
  onActionCreate?: (action: Partial<FinanceAction>) => void;
}

// =====================================================
// FILTER AND SEARCH TYPES
// =====================================================

export interface FinanceFilters {
  academic_year?: string;
  category?: string;
  cost_centre?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  severity?: string;
  status?: string;
}

export interface FinanceSearchParams {
  query?: string;
  filters?: FinanceFilters;
  sortBy?: 'date' | 'amount' | 'variance_percent' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// =====================================================
// ERROR TYPES
// =====================================================

export interface FinanceModuleError {
  code: string;
  message: string;
  details?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// =====================================================
// CONSTANTS
// =====================================================

export const FINANCE_CATEGORIES = [
  'Teaching Staff',
  'Support Staff',
  'Premises',
  'Supplies & Services',
  'Utilities',
  'ICT',
  'Professional Development',
  'Administration',
  'Other'
] as const;

export const COST_CENTRES = [
  'Leadership',
  'Teaching & Learning',
  'Pupil Support',
  'Premises',
  'Administration',
  'ICT',
  'Other'
] as const;

export const FUNDING_STREAM_TYPES = [
  'GAG',
  'Pupil_Premium',
  'High_Needs',
  'PE_Sport',
  'Other'
] as const;

export const SEVERITY_COLORS = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  critical: 'red'
} as const;

export const PRIORITY_COLORS = {
  low: 'blue',
  medium: 'yellow',
  high: 'orange',
  urgent: 'red'
} as const;

export type FinanceCategory = typeof FINANCE_CATEGORIES[number];
export type CostCentre = typeof COST_CENTRES[number];
export type FundingStreamType = typeof FUNDING_STREAM_TYPES[number];
export type SeverityLevel = keyof typeof SEVERITY_COLORS;
export type PriorityLevel = keyof typeof PRIORITY_COLORS;
