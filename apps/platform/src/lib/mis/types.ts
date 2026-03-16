/**
 * MIS Data Service Types
 *
 * These types represent the canonical data shapes that Ed works with,
 * regardless of source (Arbor, SIMS, Bromcom, Wonde, CSV upload, or test harness).
 *
 * CRITICAL ARCHITECTURE RULE:
 * MIS data is NEVER stored in Supabase. It is read from source, processed
 * in memory, and garbage collected. Schools retain full data sovereignty.
 */

// ─── Pupil Data ──────────────────────────────────────────

export interface MISPupil {
  student_id: string;
  upn: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  date_of_birth: string; // ISO date
  gender: "M" | "F" | "O";
  year_group: number; // 0 = Reception, 1-6 = Y1-Y6
  registration_group: string; // Class name e.g. "Oak", "Maple"
  ethnicity?: string;
  first_language?: string;
  fsm_eligible: boolean;
  pupil_premium: boolean;
  in_care: boolean;
  ever_in_care: boolean;
  service_child: boolean;
  sen_status: "N" | "K" | "E"; // None, SEN Support, EHCP
  sen_primary_need?: string; // SEMH, SpLD, SLCN, MLD, ASD, PD, VI, HI, etc.
  sen_secondary_need?: string;
  ehcp: boolean;
  country_of_birth?: string;
  admission_date: string; // ISO date
  enrolment_status: "Current" | "Leaver";
  eal: boolean;
}

// ─── Attendance Data ─────────────────────────────────────

export interface MISAttendanceRecord {
  student_id: string;
  upn: string;
  first_name: string;
  last_name: string;
  year_group: number;
  registration_group: string;
  academic_year: string; // e.g. "2025-26"
  academic_year_start: number; // e.g. 2025
  term: "Autumn" | "Spring" | "Summer";
  possible_sessions: number;
  attended_sessions: number;
  authorised_absences: number;
  unauthorised_absences: number;
  late_before_close: number;
  late_after_close: number;
  overall_absence_pct: number;
  persistent_absence: boolean; // true if below 90%
}

// ─── Assessment Data ─────────────────────────────────────

export type AttainmentLevel = "PKF" | "WTS" | "EXS" | "GDS" | "EMG" | "EXP"; // PKF=Pre-Key Stage, EMG/EXP for EYFS

export type AssessmentSubject =
  | "reading"
  | "writing"
  | "maths"
  | "science"
  | "phonics"
  | "spag"
  | "combined";

export type AssessmentPeriod =
  | "Aut1"
  | "Aut2"
  | "Spr1"
  | "Spr2"
  | "Sum1"
  | "Sum2"
  | "Autumn"
  | "Spring"
  | "Summer";

/** Statutory assessment results (EYFS, Phonics, KS1, MTC, KS2) */
export interface MISStatutoryResult {
  student_id: string;
  upn: string;
  first_name: string;
  last_name: string;
  year_group: number;
  registration_group: string;
  academic_year: string;
  academic_year_start: number;
  assessment_type:
    | "EYFS"
    | "Phonics"
    | "Phonics_Retake"
    | "KS1"
    | "MTC"
    | "KS2";

  // EYFS fields
  eyfs_gld?: boolean;
  eyfs_goals?: Record<string, "EXP" | "EMG">; // 17 ELG columns

  // Phonics fields
  phonics_mark?: number; // 0-40
  phonics_met_threshold?: boolean; // 32+ = met

  // KS1 fields (internal since 2023-24)
  ks1_reading?: AttainmentLevel;
  ks1_writing?: AttainmentLevel;
  ks1_maths?: AttainmentLevel;
  ks1_science?: AttainmentLevel;

  // MTC fields
  mtc_score?: number; // 0-25

  // KS2 fields
  ks2_reading_scaled?: number; // 80-120
  ks2_reading_met?: boolean; // 100+ = met
  ks2_maths_scaled?: number;
  ks2_maths_met?: boolean;
  ks2_gps_scaled?: number;
  ks2_gps_met?: boolean;
  ks2_writing_ta?: AttainmentLevel;
  ks2_science_ta?: "Met" | "Not Met";
  ks2_combined_rwm?: boolean;
}

/** Internal/termly teacher assessment (from Insight/tracker/MIS) */
export interface MISTermlyAssessment {
  student_id: string;
  upn: string;
  pupil_name: string; // "Surname, Forename" format (tracker style)
  admission_number?: string;
  registration_group: string;
  year_group: number;
  subject: AssessmentSubject;
  assessment_period: AssessmentPeriod;
  academic_year: string;
  academic_year_start: number;
  teacher_name: string;
  staff_id: string;
  teacher_assessment: AttainmentLevel;
  standardised_score?: number; // PiRA/PUMA/NFER (mean 100, SD 15)
  age_standardised_score?: number;
  reading_band?: string; // Reception-Y2 only
  target: AttainmentLevel;
  on_track: "Yes" | "No" | "Concern";
  notes?: string;
}

// ─── Behaviour Data ──────────────────────────────────────

export interface MISBehaviourIncident {
  incident_id: string;
  student_id: string;
  student_name: string;
  year_group: number;
  registration_group: string;
  date: string; // ISO date
  time: string; // HH:mm
  type: "Positive" | "Negative";
  category: string; // School-defined categories
  points: number;
  recorded_by: string; // Staff name
  location: string;
  action_taken?: string;
  parent_notified: boolean;
  is_exclusion: boolean;
  exclusion_type?: "FTE" | "PEX"; // Fixed-term or Permanent
  exclusion_days?: number;
}

// ─── Staff Data ──────────────────────────────────────────

export interface MISStaffMember {
  staff_id: string; // STF-001 format
  first_name: string;
  last_name: string;
  title?: string;
  display_name: string;
  email: string;
  phone?: string;
  job_title: string;
  role_type: "Teaching" | "Support" | "Leadership";
  department?: string;
  fte: number; // 0.0-1.0
  contract_type: "Permanent" | "Fixed Term" | "Supply" | "Casual";
  pay_scale?: string; // MPS M1, UPS3, L12, etc.
  start_date: string;
  continuous_service_date?: string;
  hours_per_week?: number;
  weeks_per_year?: number;
  notice_period_weeks?: number;
  gender?: string;
  date_of_birth?: string;
  ni_number?: string; // National Insurance
  trn?: string; // Teacher Reference Number
  payroll_number?: string;
  absence_days_this_year: number;
  absence_days_last_year: number;
  absence_spells_this_year: number;
  // SCR / Compliance fields (read from MIS, never stored)
  dbs?: MISStaffDBS;
  right_to_work?: MISStaffRTW;
  qualifications?: MISStaffQualification[];
  training?: MISStaffTraining[];
}

/** DBS record from MIS export */
export interface MISStaffDBS {
  certificate_number?: string;
  dbs_date?: string;
  dbs_type?: string; // Enhanced, Enhanced with Barred List, Standard
  update_service_registered?: boolean;
}

/** Right to work from MIS export */
export interface MISStaffRTW {
  type?: string; // British Citizen, Settled Status, etc.
  check_date?: string;
  expiry_date?: string;
}

/** Qualification from MIS export */
export interface MISStaffQualification {
  type: string; // QTS, NPQH, PGCE, etc.
  status?: string; // Qualified, Pending
  date_awarded?: string;
}

/** Training record from MIS export */
export interface MISStaffTraining {
  category: string; // safeguarding, prevent, first_aid, fire_safety, etc.
  completion_date?: string;
  expiry_date?: string;
  provider?: string;
}

// ─── Teacher-Class History ───────────────────────────────

export interface MISTeacherClassHistory {
  staff_id: string;
  staff_name: string;
  academic_year: string;
  academic_year_start: number;
  year_group: number;
  registration_group: string;
  role: "Class Teacher" | "PPA Cover" | "Supply" | "Job Share" | "Teaching HT";
  fte_for_class: number;
  term:
    | "All Year"
    | "Autumn Only"
    | "Spring Only"
    | "Summer Only"
    | "Spring+Summer"
    | "Autumn+Spring";
  subject_lead_role?: string; // "Maths Lead", "English Lead", etc.
  notes?: string;
}

// ─── SEN Register ────────────────────────────────────────

export interface MISSENRecord {
  student_id: string;
  upn: string;
  first_name: string;
  last_name: string;
  year_group: number;
  registration_group: string;
  sen_status: "K" | "E";
  sen_primary_need: string;
  sen_secondary_need?: string;
  date_identified: string;
  ehcp: boolean;
  ehcp_start_date?: string;
  ehcp_review_date?: string;
  next_annual_review?: string;
  external_agencies?: string;
  key_worker?: string; // Named TA
  provision_description?: string;
  pupil_premium: boolean;
  attendance_pct?: number;
}

// ─── Historical KS2 (School-Level Aggregated) ────────────

export interface MISHistoricalKS2 {
  academic_year: string;
  cohort_size: number;
  reading_expected_pct: number;
  reading_higher_pct: number;
  reading_avg_scaled: number;
  maths_expected_pct: number;
  maths_higher_pct: number;
  maths_avg_scaled: number;
  gps_expected_pct: number;
  gps_higher_pct: number;
  gps_avg_scaled: number;
  writing_expected_pct: number;
  writing_higher_pct: number;
  combined_rwm_pct: number;
  combined_higher_pct: number;
  reading_progress: number;
  writing_progress: number;
  maths_progress: number;
  // Breakdowns
  pp_combined_pct: number;
  non_pp_combined_pct: number;
  boys_combined_pct: number;
  girls_combined_pct: number;
  sen_combined_pct: number;
  non_sen_combined_pct: number;
  // National averages for comparison
  national_reading_expected: number;
  national_maths_expected: number;
  national_combined_rwm: number;
}

// ─── MIS Data Service Interface ──────────────────────────

export type MISDataType =
  | "pupils"
  | "attendance"
  | "statutory_results"
  | "termly_assessments"
  | "behaviour"
  | "staff"
  | "teacher_class_history"
  | "sen_register"
  | "historical_ks2";

export interface MISDataSource {
  type: "local" | "google_drive" | "wonde" | "csv_upload";
  lastUpdated: string; // ISO datetime
  path?: string; // File path (local) or Drive folder path
  fileName?: string;
  driveFileId?: string; // Google Drive file ID (for google_drive source)
}

export interface MISReadResult<T> {
  data: T[];
  source: MISDataSource;
  recordCount: number;
  warnings: string[];
}

export interface IMISDataService {
  /** Read data of a specific type for a school */
  read<T>(
    organizationId: string,
    dataType: MISDataType,
  ): Promise<MISReadResult<T>>;

  /** Get available data types and their freshness */
  getAvailableSources(
    organizationId: string,
  ): Promise<Record<MISDataType, MISDataSource | null>>;

  /** Check if a specific data type is available */
  hasData(organizationId: string, dataType: MISDataType): Promise<boolean>;
}

// ─── School Profile (for test harness configuration) ─────

export interface TestSchoolProfile {
  name: string;
  organizationId: string;
  urn: number;
  type: string;
  phase: string;
  location: string;
  nor: number; // Number on roll
  formEntry: number; // 1FE, 2FE, 3FE
  fsm_pct: number;
  pp_pct: number;
  sen_pct: number;
  eal_pct: number;
  ofsted_rating: string;
  ofsted_date: string;
  mis_system: string;
  tracker_system: string;
}
