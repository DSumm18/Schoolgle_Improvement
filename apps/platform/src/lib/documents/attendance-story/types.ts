export interface AttendanceStoryInput {
  urn: number;
  organizationId: string;
  userId: string;
}

export interface AttendanceRow {
  time_period: string;
  term: string | null;
  overall_attendance_pct: number | null;
  overall_absence_pct: number | null;
  authorized_absence_pct: number | null;
  unauthorized_absence_pct: number | null;
  persistent_absence_pct: number | null;
  persistent_absence_count: number | null;
}

export interface CensusRow {
  time_period: string;
  number_on_roll: number | null;
  fsm_pct: number | null;
  eal_pct: number | null;
}

export interface ContextualFactor {
  factor_type: string;
  description: string;
  start_date: string | null;
  year_groups_affected: string[] | null;
}

export interface SchoolProfile {
  urn: number;
  name: string;
  la_name: string;
  phase_name: string;
  type_name: string;
  number_of_pupils: number | null;
  head_first_name: string | null;
  head_last_name: string | null;
}

export interface AttendanceStoryData {
  school: SchoolProfile;
  attendanceRows: AttendanceRow[];
  censusRows: CensusRow[];
  contextualFactors: ContextualFactor[];
}

export interface AttendanceStoryOutput {
  documentId: string;
  title: string;
  narrative: string;
  sourceConnectors: string[];
  missingConnectors: { id: string; name: string; reason: string }[];
  pdfUrl?: string;
  llmModel: string;
  llmTokensUsed: number;
  guardianCategoriesDetected: string[];
}
