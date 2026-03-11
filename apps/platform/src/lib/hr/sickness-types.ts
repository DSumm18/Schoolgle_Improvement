// Sickness Absence Tracker types
// Matches DB schema from 20260311_meeting_workflow_hub.sql

export type AbsenceReasonCategory =
  | "cold_flu"
  | "stomach"
  | "headache_migraine"
  | "musculoskeletal"
  | "mental_health"
  | "surgery"
  | "injury"
  | "covid"
  | "pregnancy_related"
  | "hospital"
  | "dental"
  | "eye"
  | "chronic_condition"
  | "other";

export type FormalStage =
  | "none"
  | "informal"
  | "stage_1"
  | "stage_2"
  | "stage_3";

export interface SicknessAbsenceRecord {
  id: string;
  organization_id: string;
  staff_id: string;
  start_date: string;
  end_date: string | null;
  working_days_lost: number | null;
  reason_category: AbsenceReasonCategory;
  reason_detail: string | null;
  self_certified: boolean;
  fit_note_received: boolean;
  fit_note_expiry: string | null;
  occupational_health_referral: boolean;
  return_date: string | null;
  return_meeting_id: string | null;
  phased_return: boolean;
  phased_return_plan: any | null;
  trigger_hit: string | null;
  formal_stage: FormalStage;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  staff_name?: string;
  staff_role?: string;
  staff_department?: string;
}

export interface SicknessTriggerConfig {
  id: string;
  organization_id: string;
  trigger_name: string;
  trigger_value: number;
  review_period_months: number;
  action_required: string;
  is_active: boolean;
  created_at: string;
}

export interface BradfordFactorResult {
  occasions: number;
  total_days: number;
  bradford_score: number;
  trigger_level: string;
}

export interface StaffSicknessSummary {
  staff_id: string;
  staff_name: string;
  staff_role: string;
  staff_department: string | null;
  total_absences: number;
  total_days: number;
  bradford_factor: number;
  is_currently_absent: boolean;
  last_absence_date: string | null;
  triggers_breached: string[];
  trigger_level: string;
}

export interface SicknessStats {
  total_absences_ytd: number;
  currently_absent: number;
  average_days_lost_per_staff: number;
  top_reasons: Array<{ category: AbsenceReasonCategory; count: number }>;
  staff_above_trigger: StaffSicknessSummary[];
  monthly_trend: Array<{ month: string; count: number }>;
}

export const REASON_CATEGORIES: Array<{
  value: AbsenceReasonCategory;
  label: string;
  color: string;
}> = [
  { value: "cold_flu", label: "Cold/Flu", color: "#60a5fa" },
  { value: "stomach", label: "Stomach/Gastric", color: "#34d399" },
  { value: "headache_migraine", label: "Headache/Migraine", color: "#c084fc" },
  { value: "musculoskeletal", label: "Musculoskeletal", color: "#f97316" },
  { value: "mental_health", label: "Mental Health", color: "#a78bfa" },
  { value: "surgery", label: "Surgery", color: "#ef4444" },
  { value: "injury", label: "Injury", color: "#f59e0b" },
  { value: "covid", label: "COVID-19", color: "#14b8a6" },
  { value: "pregnancy_related", label: "Pregnancy Related", color: "#ec4899" },
  { value: "hospital", label: "Hospital", color: "#e11d48" },
  { value: "dental", label: "Dental", color: "#06b6d4" },
  { value: "eye", label: "Eye", color: "#0ea5e9" },
  { value: "chronic_condition", label: "Chronic Condition", color: "#8b5cf6" },
  { value: "other", label: "Other", color: "#94a3b8" },
];

export const FORMAL_STAGES: Array<{
  value: FormalStage;
  label: string;
  color: string;
}> = [
  { value: "none", label: "No Action", color: "#22c55e" },
  { value: "informal", label: "Informal Review", color: "#f59e0b" },
  { value: "stage_1", label: "Stage 1 Warning", color: "#f97316" },
  { value: "stage_2", label: "Stage 2 Warning", color: "#ef4444" },
  { value: "stage_3", label: "Stage 3 / Final", color: "#dc2626" },
];

export const BRADFORD_THRESHOLDS = {
  low: { max: 200, color: "#22c55e", label: "Low" },
  medium: { min: 200, max: 500, color: "#f59e0b", label: "Medium" },
  high: { min: 500, color: "#ef4444", label: "High" },
} as const;

export function getBradfordLevel(score: number): {
  color: string;
  label: string;
} {
  if (score >= 500) return BRADFORD_THRESHOLDS.high;
  if (score >= 200) return BRADFORD_THRESHOLDS.medium;
  return BRADFORD_THRESHOLDS.low;
}

export function getReasonLabel(category: AbsenceReasonCategory): string {
  return REASON_CATEGORIES.find((r) => r.value === category)?.label || category;
}

export function getReasonColor(category: AbsenceReasonCategory): string {
  return (
    REASON_CATEGORIES.find((r) => r.value === category)?.color || "#94a3b8"
  );
}
