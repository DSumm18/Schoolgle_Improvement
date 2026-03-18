/**
 * Staff Data Resolver
 *
 * Unified interface for staff data that reads from MIS (Drive/Wonde) as primary source,
 * never storing personal data in Supabase. Schoolgle-created data (appraisals, meeting notes)
 * is stored separately and linked by mis_employee_id.
 *
 * 3-TIER DATA MODEL:
 * Tier 1 — MIS data (read-only, never stored): name, email, DBS, RTW, qualifications, training
 * Tier 2 — Link records (IDs only): staff_links table maps mis_employee_id → organization
 * Tier 3 — Schoolgle-created data (we store): appraisals, risk assessments, meeting notes
 *
 * GDPR: Arbor/SIMS/Bromcom = Data Controller. Schoolgle = Processor/Connector.
 */

import type { MISStaffMember } from "./types";
import { getMISDataServiceForOrg } from "./data-service";

// ─── Types ───────────────────────────────────────────────

/** Resolved staff record combining MIS data + Schoolgle metadata */
export interface ResolvedStaffMember {
  // Identity (from MIS — Tier 1, not stored)
  staff_id: string;
  first_name: string;
  last_name: string;
  title?: string;
  display_name: string;
  email: string;
  phone?: string;
  job_title: string;
  role_type: "Teaching" | "Support" | "Leadership";
  department?: string;
  fte: number;
  contract_type: string;
  pay_scale?: string;
  start_date: string;
  continuous_service_date?: string;
  hours_per_week?: number;
  weeks_per_year?: number;
  notice_period_weeks?: number;
  gender?: string;
  date_of_birth?: string;
  ni_number?: string;
  trn?: string;
  payroll_number?: string;
  absence_days_this_year: number;
  absence_spells_this_year: number;

  // SCR / Compliance (from MIS — Tier 1)
  dbs?: MISStaffMember["dbs"];
  right_to_work?: MISStaffMember["right_to_work"];
  qualifications?: MISStaffMember["qualifications"];
  training?: MISStaffMember["training"];

  // Metadata (Tier 2 — link record)
  data_source: "mis" | "manual";
  mis_source?: string; // "arbor" | "sims" | "bromcom" | "wonde" | "local"
  is_active: boolean;

  // Schoolgle-created flags (Tier 3 — from our DB)
  has_appraisals?: boolean;
  has_meeting_records?: boolean;
  module_access?: string[];
}

/** SCR (Single Central Record) compliance view */
export interface SCREntry {
  staff_id: string;
  display_name: string;
  job_title: string;
  role_type: string;
  start_date: string;

  // DBS
  dbs_status: "valid" | "expired" | "missing" | "pending";
  dbs_date?: string;
  dbs_certificate_number?: string;
  dbs_update_service?: boolean;

  // Right to Work
  rtw_status: "valid" | "expired" | "missing";
  rtw_type?: string;
  rtw_check_date?: string;
  rtw_expiry?: string;

  // Qualifications
  qts_status: "qualified" | "not_required" | "missing" | "pending";
  qts_detail?: string;

  // Safeguarding Training
  safeguarding_status: "current" | "expired" | "missing";
  safeguarding_date?: string;
  safeguarding_expiry?: string;

  // Prevent Training
  prevent_status: "current" | "expired" | "missing";
  prevent_date?: string;

  // First Aid
  first_aid_status: "current" | "expired" | "missing" | "not_required";
  first_aid_type?: string;
  first_aid_expiry?: string;

  // Overall
  compliant: boolean;
  issues: string[];
}

// ─── Resolver ────────────────────────────────────────────

/**
 * Read all staff for an organization from MIS (never stored).
 * Returns resolved staff records with compliance data.
 */
export async function resolveStaffList(
  organizationId: string,
): Promise<{
  staff: ResolvedStaffMember[];
  source: string;
  warnings: string[];
}> {
  const service = await getMISDataServiceForOrg(organizationId);
  const result = await service.read<MISStaffMember>(organizationId, "staff");

  const staff: ResolvedStaffMember[] = result.data.map((m) => ({
    staff_id: m.staff_id,
    first_name: m.first_name,
    last_name: m.last_name,
    title: m.title,
    display_name: m.display_name,
    email: m.email,
    phone: m.phone,
    job_title: m.job_title,
    role_type: m.role_type,
    department: m.department,
    fte: m.fte,
    contract_type: m.contract_type,
    pay_scale: m.pay_scale,
    start_date: m.start_date,
    continuous_service_date: m.continuous_service_date,
    hours_per_week: m.hours_per_week,
    weeks_per_year: m.weeks_per_year,
    notice_period_weeks: m.notice_period_weeks,
    gender: m.gender,
    date_of_birth: m.date_of_birth,
    ni_number: m.ni_number,
    trn: m.trn,
    payroll_number: m.payroll_number,
    absence_days_this_year: m.absence_days_this_year,
    absence_spells_this_year: m.absence_spells_this_year,
    dbs: m.dbs,
    right_to_work: m.right_to_work,
    qualifications: m.qualifications,
    training: m.training,
    data_source: "mis",
    mis_source: result.source.type,
    is_active: true,
  }));

  return {
    staff,
    source: result.source.type,
    warnings: result.warnings,
  };
}

/**
 * Resolve a single staff member by staff_id from MIS.
 */
export async function resolveStaffMember(
  organizationId: string,
  staffId: string,
): Promise<ResolvedStaffMember | null> {
  const { staff } = await resolveStaffList(organizationId);
  return staff.find((s) => s.staff_id === staffId) || null;
}

/**
 * Build Single Central Record from MIS data.
 * Calculates compliance status for each staff member.
 */
export async function resolveSCR(
  organizationId: string,
): Promise<{ entries: SCREntry[]; source: string; warnings: string[] }> {
  const { staff, source, warnings } = await resolveStaffList(organizationId);
  const now = new Date();

  const entries: SCREntry[] = staff.map((s) => {
    const issues: string[] = [];

    // DBS status
    let dbs_status: SCREntry["dbs_status"] = "missing";
    if (s.dbs?.dbs_date) {
      const dbsDate = new Date(s.dbs.dbs_date);
      const threeYearsAgo = new Date(now);
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      dbs_status =
        dbsDate >= threeYearsAgo || s.dbs.update_service_registered
          ? "valid"
          : "expired";
    }
    if (dbs_status === "missing") issues.push("DBS check missing");
    if (dbs_status === "expired")
      issues.push("DBS expired (>3 years, no update service)");

    // RTW status
    let rtw_status: SCREntry["rtw_status"] = "missing";
    if (s.right_to_work?.check_date) {
      if (s.right_to_work.expiry_date) {
        rtw_status =
          new Date(s.right_to_work.expiry_date) > now ? "valid" : "expired";
      } else {
        rtw_status = "valid"; // No expiry = indefinite (British/Irish citizen)
      }
    }
    if (rtw_status === "missing") issues.push("Right to work check missing");
    if (rtw_status === "expired") issues.push("Right to work expired");

    // QTS status
    let qts_status: SCREntry["qts_status"] = "missing";
    let qts_detail: string | undefined;
    const qtsRecord = s.qualifications?.find((q) => q.type === "QTS");
    if (qtsRecord) {
      qts_status = qtsRecord.status?.toLowerCase().includes("qualified")
        ? "qualified"
        : "pending";
      qts_detail = qtsRecord.status;
    } else if (s.role_type === "Support") {
      qts_status = "not_required";
    }
    if (qts_status === "missing" && s.role_type === "Teaching") {
      issues.push("QTS status missing for teaching staff");
    }

    // Safeguarding training (must be annual)
    let safeguarding_status: SCREntry["safeguarding_status"] = "missing";
    let safeguarding_date: string | undefined;
    // Note: basic safeguarding often tracked in MIS training records
    // For now we flag as missing — schools confirm via Schoolgle compliance module
    if (safeguarding_status === "missing")
      issues.push("Safeguarding training record missing");

    // Prevent training
    const prevent_status: SCREntry["prevent_status"] = "missing";
    if (prevent_status === "missing")
      issues.push("Prevent training record missing");

    // First aid
    let first_aid_status: SCREntry["first_aid_status"] = "not_required";
    let first_aid_type: string | undefined;
    let first_aid_expiry: string | undefined;
    const faRecord = s.training?.find((t) => t.category === "first_aid");
    if (faRecord) {
      first_aid_type = "First Aid";
      first_aid_expiry = faRecord.expiry_date;
      if (faRecord.expiry_date) {
        first_aid_status =
          new Date(faRecord.expiry_date) > now ? "current" : "expired";
      } else {
        first_aid_status = "current";
      }
      if (first_aid_status === "expired")
        issues.push("First aid certificate expired");
    }

    return {
      staff_id: s.staff_id,
      display_name: s.display_name,
      job_title: s.job_title,
      role_type: s.role_type,
      start_date: s.start_date,
      dbs_status,
      dbs_date: s.dbs?.dbs_date,
      dbs_certificate_number: s.dbs?.certificate_number,
      dbs_update_service: s.dbs?.update_service_registered,
      rtw_status,
      rtw_type: s.right_to_work?.type,
      rtw_check_date: s.right_to_work?.check_date,
      rtw_expiry: s.right_to_work?.expiry_date,
      qts_status,
      qts_detail,
      safeguarding_status,
      safeguarding_date,
      prevent_status,
      prevent_date: undefined,
      first_aid_status,
      first_aid_type,
      first_aid_expiry,
      compliant: issues.length === 0,
      issues,
    };
  });

  return { entries, source, warnings };
}
