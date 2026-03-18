/**
 * MIS Data Service
 *
 * Reads school MIS data from source (local test harness, Google Drive, or Wonde API).
 * Data is processed IN MEMORY only — never stored in Supabase.
 *
 * ARCHITECTURE:
 * - Dev/Demo: reads from local test harness files (Excel/CSV)
 * - Production: reads from Google Drive API or Wonde API
 * - Same code path, same result, same types
 *
 * GDPR: Schools retain full data sovereignty. Revoking Drive access = instant data removal.
 */

import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import type {
  IMISDataService,
  MISDataType,
  MISDataSource,
  MISReadResult,
  MISPupil,
  MISAttendanceRecord,
  MISStatutoryResult,
  MISTermlyAssessment,
  MISBehaviourIncident,
  MISStaffMember,
  MISStaffQualification,
  MISStaffTraining,
  MISTeacherClassHistory,
  MISSENRecord,
  MISHistoricalKS2,
  MISEnergyInvoice,
  AttainmentLevel,
  AssessmentPeriod,
} from "./types";

// ─── File Mapping ────────────────────────────────────────

const DATA_TYPE_FILES: Record<
  MISDataType,
  { folder: string; filename: string }
> = {
  pupils: { folder: "arbor-exports", filename: "arbor_pupil_roll.xlsx" },
  attendance: {
    folder: "arbor-exports",
    filename: "arbor_attendance_termly.xlsx",
  },
  statutory_results: {
    folder: "arbor-exports",
    filename: "arbor_statutory_results.xlsx",
  },
  termly_assessments: {
    folder: "tracker-exports",
    filename: "insight_tracker_export.xlsx",
  },
  behaviour: {
    folder: "arbor-exports",
    filename: "arbor_behaviour_export.xlsx",
  },
  staff: { folder: "arbor-exports", filename: "arbor_staff_export.xlsx" },
  teacher_class_history: {
    folder: "arbor-exports",
    filename: "arbor_teacher_class_history.xlsx",
  },
  sen_register: {
    folder: "arbor-exports",
    filename: "sen_register_arbor.xlsx",
  },
  historical_ks2: {
    folder: "dfe-data",
    filename: "historical_ks2_results.xlsx",
  },
  energy_invoices: {
    folder: "energy-invoices",
    filename: "*", // multiple files — read all XLSX in folder
  },
};

// ─── Data Transformers ───────────────────────────────────
// Map raw Excel column names to canonical TypeScript interface fields

/* eslint-disable @typescript-eslint/no-explicit-any */

function toBool(val: any): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string")
    return (
      val.toUpperCase() === "Y" ||
      val.toUpperCase() === "YES" ||
      val === "1" ||
      val.toUpperCase() === "TRUE"
    );
  return !!val;
}

function toInt(val: any, fallback = 0): number {
  const n = parseInt(String(val), 10);
  return isNaN(n) ? fallback : n;
}

function toFloat(val: any, fallback = 0): number {
  const n = parseFloat(String(val));
  return isNaN(n) ? fallback : n;
}

function parseYearGroup(val: any): number {
  const s = String(val);
  if (s.startsWith("Year ")) return parseInt(s.replace("Year ", ""), 10);
  if (s === "Reception" || s === "R") return 0;
  return toInt(val);
}

function transformPupil(raw: any): MISPupil {
  return {
    student_id: String(raw["Student ID"] || ""),
    upn: String(raw["UPN"] || ""),
    first_name: String(raw["Legal First Name"] || raw["First Name"] || ""),
    last_name: String(raw["Legal Last Name"] || raw["Last Name"] || ""),
    preferred_name: raw["Preferred Name"],
    date_of_birth: String(raw["Date of Birth"] || ""),
    gender: (raw["Gender"] || "O") as "M" | "F" | "O",
    year_group: parseYearGroup(raw["Year Group"]),
    registration_group: String(raw["Registration Group"] || raw["Class"] || ""),
    ethnicity: raw["Ethnicity"],
    first_language: raw["First Language"],
    fsm_eligible: toBool(raw["FSM Eligible"] ?? raw["FSM"]),
    pupil_premium: toBool(raw["Pupil Premium"] ?? raw["PP"]),
    in_care: toBool(raw["In Care (LAC)"] ?? raw["LAC"]),
    ever_in_care: toBool(
      raw["Ever In Care"] ?? raw["In Care (LAC)"] ?? raw["LAC"],
    ),
    service_child: toBool(raw["Service Child"]),
    sen_status: (raw["SEN Status"] === "K" || raw["SEN Status"] === "E"
      ? raw["SEN Status"]
      : "N") as "N" | "K" | "E",
    sen_primary_need: raw["SEN Primary Need"],
    sen_secondary_need: raw["SEN Secondary Need"],
    ehcp: toBool(raw["EHCP"]),
    country_of_birth: raw["Country of Birth"],
    admission_date: String(raw["Admission Date"] || ""),
    enrolment_status: (raw["Enrolment Status"] || "Current") as
      | "Current"
      | "Leaver",
    eal: toBool(raw["EAL"]),

    // Adaptive teaching fields
    eal_stage: (["A", "B", "C", "D", "E"].includes(raw["EAL Stage"])
      ? raw["EAL Stage"]
      : undefined) as "A" | "B" | "C" | "D" | "E" | undefined,
    medical_conditions: raw["Medical Conditions"] || undefined,
    accessibility_needs: raw["Accessibility Needs"] || undefined,
    ehcp_provisions: raw["EHCP Provisions"] || undefined,
    standardised_score_reading: raw["Standardised Score Reading"]
      ? toInt(raw["Standardised Score Reading"])
      : undefined,
    standardised_score_maths: raw["Standardised Score Maths"]
      ? toInt(raw["Standardised Score Maths"])
      : undefined,
    reading_age: raw["Reading Age"] || undefined,
    spelling_age: raw["Spelling Age"] || undefined,
    communication_method: raw["Communication Method"] || undefined,
  };
}

function transformAttendance(raw: any): MISAttendanceRecord {
  const ayStr = String(raw["Academic Year"] || "");
  const ayStart = parseInt(ayStr.split("-")[0], 10) || 0;
  const totalPossible = toInt(raw["Possible Sessions"]);
  const present = toInt(raw["Present Sessions"]);
  const authAbs = toInt(raw["Absent Sessions (Authorised)"]);
  const unauthAbs = toInt(raw["Absent Sessions (Unauthorised)"]);
  const overallPct = toFloat(raw["Attendance %"]);
  return {
    student_id: String(raw["Student ID"] || ""),
    upn: String(raw["UPN"] || ""),
    first_name: String(raw["Legal First Name"] || ""),
    last_name: String(raw["Legal Last Name"] || ""),
    year_group: parseYearGroup(raw["Year Group"]),
    registration_group: String(raw["Registration Group"] || ""),
    academic_year: ayStr,
    academic_year_start: ayStart,
    term: (raw["Term"] || "Autumn") as "Autumn" | "Spring" | "Summer",
    possible_sessions: totalPossible,
    attended_sessions: present,
    authorised_absences: authAbs,
    unauthorised_absences: unauthAbs,
    late_before_close: toInt(raw["Late (Before Close)"]),
    late_after_close: toInt(raw["Late (After Close)"]),
    overall_absence_pct: totalPossible > 0 ? 100 - overallPct : 0,
    persistent_absence: toBool(raw["PA Flag"]) || overallPct < 90,
  };
}

function transformStaff(raw: any): MISStaffMember {
  const title = String(raw["Title"] || "");
  const first = String(raw["First Name"] || "");
  const last = String(raw["Last Name"] || "");
  const roleStr = String(raw["Role"] || "");
  let roleType: "Teaching" | "Support" | "Leadership" = "Support";
  if (/head|principal|deputy|assistant head/i.test(roleStr))
    roleType = "Leadership";
  else if (/teacher|class teacher|nqt|ect/i.test(roleStr))
    roleType = "Teaching";

  // Build DBS sub-record if columns present
  const dbs =
    raw["DBS Date"] || raw["DBS Certificate Number"]
      ? {
          certificate_number: raw["DBS Certificate Number"]
            ? String(raw["DBS Certificate Number"])
            : undefined,
          dbs_date: raw["DBS Date"] ? String(raw["DBS Date"]) : undefined,
          dbs_type: "Enhanced with Barred List",
          update_service_registered: toBool(raw["DBS Update Service"]),
        }
      : undefined;

  // Build RTW sub-record
  const right_to_work =
    raw["RTW Type"] || raw["RTW Check Date"]
      ? {
          type: raw["RTW Type"] ? String(raw["RTW Type"]) : undefined,
          check_date: raw["RTW Check Date"]
            ? String(raw["RTW Check Date"])
            : undefined,
          expiry_date: raw["RTW Expiry"]
            ? String(raw["RTW Expiry"])
            : undefined,
        }
      : undefined;

  // Build qualifications array
  const qualifications: MISStaffQualification[] = [];
  if (raw["QTS Status"]) {
    qualifications.push({
      type: "QTS",
      status: String(raw["QTS Status"]),
    });
  }

  // Build training array
  const training: MISStaffTraining[] = [];
  if (raw["First Aid Type"]) {
    training.push({
      category: "first_aid",
      completion_date: raw["First Aid Date"]
        ? String(raw["First Aid Date"])
        : undefined,
      expiry_date: raw["First Aid Expiry"]
        ? String(raw["First Aid Expiry"])
        : undefined,
    });
  }

  return {
    staff_id: String(raw["Staff ID"] || ""),
    first_name: first,
    last_name: last,
    title: title || undefined,
    display_name: `${title} ${first} ${last}`.trim(),
    email: String(
      raw["Email"] ||
        `${first.toLowerCase()}.${last.toLowerCase()}@auroraprimary.example.com`,
    ),
    phone: raw["Phone"] ? String(raw["Phone"]) : undefined,
    job_title: roleStr,
    role_type: roleType,
    department: raw["Department"],
    fte: toFloat(raw["FTE"], 1),
    contract_type: (raw["Contract Type"] || "Permanent") as
      | "Permanent"
      | "Fixed Term"
      | "Supply"
      | "Casual",
    pay_scale: raw["Pay Scale"],
    start_date: String(raw["Start Date"] || ""),
    continuous_service_date: raw["Continuous Service Date"]
      ? String(raw["Continuous Service Date"])
      : undefined,
    hours_per_week: raw["Hours Per Week"]
      ? toFloat(raw["Hours Per Week"])
      : undefined,
    weeks_per_year: raw["Weeks Per Year"]
      ? toFloat(raw["Weeks Per Year"])
      : undefined,
    notice_period_weeks: raw["Notice Period (Weeks)"]
      ? toInt(raw["Notice Period (Weeks)"])
      : undefined,
    gender: raw["Gender"] ? String(raw["Gender"]).toLowerCase() : undefined,
    date_of_birth: raw["Date of Birth"]
      ? String(raw["Date of Birth"])
      : undefined,
    ni_number: raw["NI Number"] ? String(raw["NI Number"]) : undefined,
    trn: raw["TRN"] ? String(raw["TRN"]) : undefined,
    payroll_number: raw["Payroll Number"]
      ? String(raw["Payroll Number"])
      : undefined,
    absence_days_this_year: toFloat(raw["Total Absence Days (Rolling 12m)"]),
    absence_days_last_year: 0,
    absence_spells_this_year: toInt(raw["Absence Spells (Rolling 12m)"]),
    dbs,
    right_to_work,
    qualifications: qualifications.length > 0 ? qualifications : undefined,
    training: training.length > 0 ? training : undefined,
  };
}

function transformBehaviour(raw: any): MISBehaviourIncident {
  return {
    incident_id: `BEH-${String(raw["Student ID"] || "")}-${String(raw["Date"] || "")}-${String(raw["Time"] || "")}`,
    student_id: String(raw["Student ID"] || ""),
    student_name:
      `${raw["Legal First Name"] || ""} ${raw["Legal Last Name"] || ""}`.trim(),
    year_group: parseYearGroup(raw["Year Group"]),
    registration_group: String(raw["Registration Group"] || ""),
    date: String(raw["Date"] || ""),
    time: String(raw["Time"] || ""),
    type: (raw["Type"] || "Negative") as "Positive" | "Negative",
    category: String(raw["Category"] || ""),
    points: toInt(raw["Points"]),
    recorded_by: String(raw["Recorded By"] || ""),
    location: String(raw["Location"] || ""),
    action_taken: raw["Notes"],
    parent_notified: toBool(raw["Parent Notified"]),
    is_exclusion: toBool(raw["FTE"]),
    exclusion_type: toBool(raw["FTE"]) ? "FTE" : undefined,
    exclusion_days: toBool(raw["FTE"]) ? 1 : undefined,
  };
}

function transformTeacherHistory(raw: any): MISTeacherClassHistory {
  const ayStr = String(raw["Academic Year"] || "");
  return {
    staff_id: String(raw["Staff ID"] || ""),
    staff_name:
      `${raw["Title"] || ""} ${raw["First Name"] || ""} ${raw["Last Name"] || ""}`.trim(),
    academic_year: ayStr,
    academic_year_start: parseInt(ayStr.split("-")[0], 10) || 0,
    year_group: parseYearGroup(raw["Year Group"]),
    registration_group: String(raw["Class Name"] || ""),
    role: (raw["Role"] || "Class Teacher") as MISTeacherClassHistory["role"],
    fte_for_class: toFloat(raw["FTE"], 1),
    term: (raw["Term"] || "All Year") as MISTeacherClassHistory["term"],
    subject_lead_role: raw["Subject Lead"],
    notes: raw["Notes"],
  };
}

function transformSENRecord(raw: any): MISSENRecord {
  return {
    student_id: String(raw["Student ID"] || ""),
    upn: String(raw["UPN"] || ""),
    first_name: String(raw["First Name"] || raw["Legal First Name"] || ""),
    last_name: String(raw["Last Name"] || raw["Legal Last Name"] || ""),
    year_group: parseYearGroup(raw["Year Group"]),
    registration_group: String(raw["Registration Group"] || raw["Class"] || ""),
    sen_status: (raw["SEN Status"] === "E" || raw["SEN Status"] === "EHCP"
      ? "E"
      : "K") as "K" | "E",
    sen_primary_need: String(
      raw["Primary Need"] || raw["SEN Primary Need"] || "",
    ),
    sen_secondary_need: raw["Secondary Need"] || raw["SEN Secondary Need"],
    date_identified: String(
      raw["Date Identified"] ||
        raw["Identification Date"] ||
        raw["EHCP Start Date"] ||
        "",
    ),
    ehcp: toBool(raw["EHCP"]),
    ehcp_start_date: raw["EHCP Start Date"],
    ehcp_review_date: raw["EHCP Review Date"],
    next_annual_review: raw["Next Annual Review"] || raw["Annual Review Date"],
    external_agencies: raw["External Agencies"] || raw["External Agency"],
    key_worker: raw["Key Worker"] || raw["Named TA"],
    provision_description: raw["Provision"] || raw["Provision Map"],
    pupil_premium: toBool(raw["PP"] ?? raw["Pupil Premium"]),
    attendance_pct: raw["Attendance %"]
      ? toFloat(raw["Attendance %"])
      : undefined,
  };
}

/**
 * Transform Insight Tracker pivot format into flat MISTermlyAssessment rows.
 * Columns like "2024-25 Aut1", "2024-25 Aut1 Staff" are unpivoted into individual records.
 */
function transformInsightTracker(rawRows: any[]): MISTermlyAssessment[] {
  const results: MISTermlyAssessment[] = [];
  const periodRegex = /^(\d{4}-\d{2})\s+(Aut1|Aut2|Spr1|Spr2|Sum1|Sum2)$/;

  for (const raw of rawRows) {
    const studentId = String(raw["Admission Number"] || "");
    const pupilName = String(raw["Pupil Name"] || "");
    const yearGroupStr = String(raw["Year Group"] || "");
    const yearGroup = parseYearGroup(yearGroupStr);
    const regGroup = String(raw["Class"] || "");
    const subject = String(raw["Subject"] || "").toLowerCase() as any;
    const isPP = toBool(raw["PP"]);
    const isFSM = toBool(raw["FSM"]);

    // Extract UPN-like id from name
    const nameParts = pupilName.split(", ");
    const lastName = nameParts[0] || "";
    const firstName = nameParts[1] || "";

    // Iterate over columns to find assessment period columns
    for (const colName of Object.keys(raw)) {
      const match = colName.match(periodRegex);
      if (!match) continue;

      const academicYear = match[1];
      const period = match[2] as AssessmentPeriod;
      const grade = String(raw[colName] || "").replace(/[+-]$/, ""); // strip trailing +/-
      const staffCol = `${colName} Staff`;
      const staffId = String(raw[staffCol] || "");

      if (!grade || grade === "undefined" || grade === "null") continue;

      // Only include valid attainment levels
      if (!["PKF", "WTS", "EXS", "GDS", "EMG", "EXP"].includes(grade)) continue;

      results.push({
        student_id: studentId,
        upn: "",
        pupil_name: pupilName,
        admission_number: studentId,
        registration_group: regGroup,
        year_group: yearGroup,
        subject: subject,
        assessment_period: period,
        academic_year: academicYear,
        academic_year_start: parseInt(academicYear.split("-")[0], 10) || 0,
        teacher_name: "",
        staff_id: staffId,
        teacher_assessment: grade as AttainmentLevel,
        standardised_score: undefined,
        target: "EXS" as AttainmentLevel,
        on_track: grade === "EXS" || grade === "GDS" ? "Yes" : "No",
      });
    }
  }

  return results;
}

function transformHistoricalKS2(raw: any): MISHistoricalKS2 {
  return {
    academic_year: String(raw["Academic Year"] || ""),
    cohort_size: toInt(raw["Cohort Size"]),
    reading_expected_pct: toFloat(raw["Reading Expected %"]),
    reading_higher_pct: toFloat(raw["Reading Higher %"]),
    reading_avg_scaled: toFloat(raw["Reading Avg Scaled"]),
    maths_expected_pct: toFloat(raw["Maths Expected %"]),
    maths_higher_pct: toFloat(raw["Maths Higher %"]),
    maths_avg_scaled: toFloat(raw["Maths Avg Scaled"]),
    gps_expected_pct: toFloat(raw["GPS Expected %"] ?? raw["SPaG Expected %"]),
    gps_higher_pct: toFloat(raw["GPS Higher %"] ?? raw["SPaG Higher %"]),
    gps_avg_scaled: toFloat(raw["GPS Avg Scaled"] ?? raw["SPaG Avg Scaled"]),
    writing_expected_pct: toFloat(raw["Writing Expected %"]),
    writing_higher_pct: toFloat(raw["Writing Higher %"]),
    combined_rwm_pct: toFloat(raw["Combined RWM %"]),
    combined_higher_pct: toFloat(raw["Combined Higher %"]),
    reading_progress: toFloat(raw["Reading Progress"]),
    writing_progress: toFloat(raw["Writing Progress"]),
    maths_progress: toFloat(raw["Maths Progress"]),
    pp_combined_pct: toFloat(raw["PP Combined %"]),
    non_pp_combined_pct: toFloat(raw["Non-PP Combined %"]),
    boys_combined_pct: toFloat(raw["Boys Combined %"]),
    girls_combined_pct: toFloat(raw["Girls Combined %"]),
    sen_combined_pct: toFloat(raw["SEN Combined %"]),
    non_sen_combined_pct: toFloat(raw["Non-SEN Combined %"]),
    national_reading_expected: toFloat(raw["National Reading Expected"]),
    national_maths_expected: toFloat(raw["National Maths Expected"]),
    national_combined_rwm: toFloat(raw["National Combined RWM"]),
  };
}

/**
 * Transform energy invoice "Extracted Data" sheet (key-value pairs + monthly breakdown)
 * into a structured MISEnergyInvoice record.
 */
function transformEnergyInvoice(rawRows: any[]): MISEnergyInvoice[] {
  // rawRows are key-value pairs from the "Extracted Data" sheet
  const fields: Record<string, any> = {};
  const monthlyBreakdown: any[] = [];
  let inMonthly = false;
  let monthlyHeaders: string[] = [];

  for (const row of rawRows) {
    const cell0 = String(row["Field"] || row["__EMPTY"] || "").trim();

    if (cell0 === "MONTHLY BREAKDOWN") {
      inMonthly = true;
      continue;
    }

    if (inMonthly) {
      if (cell0 === "Month") {
        monthlyHeaders = Object.values(row).map((c: any) =>
          String(c || "").trim(),
        );
        continue;
      }
      if (cell0) {
        const entry: Record<string, any> = {};
        const values = Object.values(row);
        for (let i = 0; i < monthlyHeaders.length; i++) {
          entry[monthlyHeaders[i]] = values[i];
        }
        monthlyBreakdown.push(entry);
      }
      continue;
    }

    if (row["Value"] !== undefined) {
      fields[cell0] = row["Value"];
    }
  }

  if (!fields["Supplier"]) return [];

  const invoice: MISEnergyInvoice = {
    supplier: String(fields["Supplier"] || ""),
    invoice_number: String(fields["Invoice Number"] || ""),
    invoice_date: String(fields["Invoice Date"] || ""),
    due_date: String(fields["Due Date"] || ""),
    account_reference: String(fields["Account Reference"] || ""),
    contract_reference: String(fields["Contract Reference"] || ""),
    customer_name: String(fields["Customer Name"] || ""),
    supply_address: String(fields["Supply Address"] || ""),
    meter_reference: String(fields["MPAN"] || fields["MPRN"] || ""),
    meter_serial: String(fields["Meter Serial"] || ""),
    energy_type: String(fields["Energy Type"] || "").toLowerCase() as
      | "electricity"
      | "gas",
    billing_period_start: String(fields["Billing Period Start"] || ""),
    billing_period_end: String(fields["Billing Period End"] || ""),
    supply_days: Number(fields["Supply Days"] || 0),
    opening_reading: Number(fields["Opening Reading"] || 0),
    closing_reading: Number(fields["Closing Reading"] || 0),
    total_kwh: Number(fields["Total kWh"] || 0),
    unit_rate_pence: Number(fields["Unit Rate (p/kWh)"] || 0),
    standing_charge_pence: Number(fields["Standing Charge (p/day)"] || 0),
    ccl_rate_pence: Number(fields["CCL Rate (p/kWh)"] || 0),
    energy_charge: Number(fields["Energy Charge"] || 0),
    standing_charge_total: Number(fields["Standing Charge Total"] || 0),
    ccl_charge: Number(fields["CCL Charge"] || 0),
    net_amount: Number(fields["Net Amount"] || 0),
    vat_rate: parseFloat(String(fields["VAT Rate"] || "5").replace("%", "")),
    vat_amount: Number(fields["VAT Amount"] || 0),
    total_amount: Number(fields["Total Amount"] || 0),
    co2_tonnes: Number(fields["CO2 Tonnes"] || 0),
    calorific_value: fields["Calorific Value"]
      ? Number(fields["Calorific Value"])
      : undefined,
    correction_factor: fields["Correction Factor"]
      ? Number(fields["Correction Factor"])
      : undefined,
    monthly_breakdown: monthlyBreakdown.map((mb) => ({
      month: String(mb["Month"] || ""),
      days: Number(mb["Days"] || 0),
      kwh: Number(mb["kWh"] || 0),
      opening_reading: Number(mb["Opening Reading"] || 0),
      closing_reading: Number(mb["Closing Reading"] || 0),
    })),
  };

  return [invoice];
}

/** Apply appropriate transformer based on data type */
function transformData<T>(dataType: MISDataType, rawData: any[]): T[] {
  switch (dataType) {
    case "pupils":
      return rawData.map(transformPupil) as T[];
    case "attendance":
      return rawData.map(transformAttendance) as T[];
    case "staff":
      return rawData.map(transformStaff) as T[];
    case "behaviour":
      return rawData.map(transformBehaviour) as T[];
    case "teacher_class_history":
      return rawData.map(transformTeacherHistory) as T[];
    case "sen_register":
      return rawData.map(transformSENRecord) as T[];
    case "termly_assessments":
      return transformInsightTracker(rawData) as T[];
    case "historical_ks2":
      return rawData.map(transformHistoricalKS2) as T[];
    case "energy_invoices":
      return transformEnergyInvoice(rawData) as T[];
    default:
      return rawData as T[];
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Local File Data Service (Test Harness) ──────────────

export class LocalMISDataService implements IMISDataService {
  private basePath: string;

  constructor(basePath?: string) {
    // Try both paths: cwd may be project root or apps/platform
    if (!basePath) {
      const fromCwd = path.join(
        process.cwd(),
        "test-harness",
        "aurora-primary",
      );
      const fromRoot = path.join(
        process.cwd(),
        "apps",
        "platform",
        "test-harness",
        "aurora-primary",
      );
      this.basePath = fs.existsSync(fromCwd) ? fromCwd : fromRoot;
    } else {
      this.basePath = basePath;
    }
  }

  async read<T>(
    _organizationId: string,
    dataType: MISDataType,
  ): Promise<MISReadResult<T>> {
    const fileInfo = DATA_TYPE_FILES[dataType];

    // Energy invoices: read all XLSX files in folder, each producing one record
    if (dataType === "energy_invoices") {
      return this.readEnergyInvoices<T>(fileInfo);
    }

    const filePath = path.join(
      this.basePath,
      fileInfo.folder,
      fileInfo.filename,
    );

    if (!fs.existsSync(filePath)) {
      return {
        data: [],
        source: {
          type: "local",
          lastUpdated: new Date().toISOString(),
          path: filePath,
          fileName: fileInfo.filename,
        },
        recordCount: 0,
        warnings: [`File not found: ${fileInfo.filename}`],
      };
    }

    // Use fs.readFileSync + XLSX.read instead of XLSX.readFile
    // to avoid path resolution issues in webpack-compiled server context
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer);
    const warnings: string[] = [];

    // Read raw data from sheets
    let rawData: Record<string, unknown>[] = [];

    if (dataType === "statutory_results") {
      // Statutory results may have multiple sheets (EYFS, Phonics, KS1, KS2, MTC)
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet) as Record<
          string,
          unknown
        >[];
        rawData = rawData.concat(rows);
      }
    } else {
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      rawData = XLSX.utils.sheet_to_json(firstSheet) as Record<
        string,
        unknown
      >[];
    }

    // Transform raw Excel data into canonical TypeScript types
    const allData = transformData<T>(dataType, rawData);

    const stat = fs.statSync(filePath);

    return {
      data: allData,
      source: {
        type: "local",
        lastUpdated: stat.mtime.toISOString(),
        path: filePath,
        fileName: fileInfo.filename,
      },
      recordCount: allData.length,
      warnings,
    };
  }

  /**
   * Read all XLSX invoice files from a folder, extracting data from
   * the "Extracted Data" sheet in each file.
   */
  private async readEnergyInvoices<T>(fileInfo: {
    folder: string;
    filename: string;
  }): Promise<MISReadResult<T>> {
    const folderPath = path.join(this.basePath, fileInfo.folder);
    const warnings: string[] = [];

    if (!fs.existsSync(folderPath)) {
      return {
        data: [],
        source: {
          type: "local",
          lastUpdated: new Date().toISOString(),
          path: folderPath,
          fileName: fileInfo.folder,
        },
        recordCount: 0,
        warnings: [`Folder not found: ${fileInfo.folder}`],
      };
    }

    const xlsxFiles = fs
      .readdirSync(folderPath)
      .filter((f: string) => f.endsWith(".xlsx"))
      .sort();

    const allInvoices: T[] = [];
    let latestMtime = new Date(0);

    for (const fileName of xlsxFiles) {
      const filePath = path.join(folderPath, fileName);
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer);

      // Read "Extracted Data" sheet
      const dataSheet = workbook.Sheets["Extracted Data"];
      if (!dataSheet) {
        warnings.push(`No "Extracted Data" sheet in ${fileName}`);
        continue;
      }

      const rawData = XLSX.utils.sheet_to_json(dataSheet) as Record<
        string,
        unknown
      >[];
      const invoices = transformData<T>("energy_invoices", rawData);
      allInvoices.push(...invoices);

      const stat = fs.statSync(filePath);
      if (stat.mtime > latestMtime) latestMtime = stat.mtime;
    }

    return {
      data: allInvoices,
      source: {
        type: "local",
        lastUpdated: latestMtime.toISOString(),
        path: folderPath,
        fileName: `${xlsxFiles.length} invoice files`,
      },
      recordCount: allInvoices.length,
      warnings,
    };
  }

  async getAvailableSources(
    _organizationId: string,
  ): Promise<Record<MISDataType, MISDataSource | null>> {
    const result = {} as Record<MISDataType, MISDataSource | null>;

    for (const [dataType, fileInfo] of Object.entries(DATA_TYPE_FILES)) {
      if (fileInfo.filename === "*") {
        // Folder-based: check if folder exists and has files
        const folderPath = path.join(this.basePath, fileInfo.folder);
        if (
          fs.existsSync(folderPath) &&
          fs.readdirSync(folderPath).some((f: string) => f.endsWith(".xlsx"))
        ) {
          const stat = fs.statSync(folderPath);
          result[dataType as MISDataType] = {
            type: "local",
            lastUpdated: stat.mtime.toISOString(),
            path: folderPath,
            fileName: fileInfo.folder,
          };
        } else {
          result[dataType as MISDataType] = null;
        }
        continue;
      }

      const filePath = path.join(
        this.basePath,
        fileInfo.folder,
        fileInfo.filename,
      );
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        result[dataType as MISDataType] = {
          type: "local",
          lastUpdated: stat.mtime.toISOString(),
          path: filePath,
          fileName: fileInfo.filename,
        };
      } else {
        result[dataType as MISDataType] = null;
      }
    }

    return result;
  }

  async hasData(
    _organizationId: string,
    dataType: MISDataType,
  ): Promise<boolean> {
    const fileInfo = DATA_TYPE_FILES[dataType];
    if (fileInfo.filename === "*") {
      const folderPath = path.join(this.basePath, fileInfo.folder);
      return (
        fs.existsSync(folderPath) &&
        fs.readdirSync(folderPath).some((f: string) => f.endsWith(".xlsx"))
      );
    }
    const filePath = path.join(
      this.basePath,
      fileInfo.folder,
      fileInfo.filename,
    );
    return fs.existsSync(filePath);
  }
}

// ─── Service Factory ─────────────────────────────────────

let _instance: IMISDataService | null = null;
let _driveInstance: IMISDataService | null = null;

/**
 * Get MIS data service based on environment config.
 * Default: local test harness. Set MIS_DATA_SOURCE=google_drive for production.
 */
export function getMISDataService(source?: string): IMISDataService {
  const dataSource = source || process.env.MIS_DATA_SOURCE || "local";

  switch (dataSource) {
    case "local":
      if (!_instance) _instance = new LocalMISDataService();
      return _instance;
    case "google_drive": {
      if (!_driveInstance) {
        // Dynamic import to avoid loading Google Drive deps in local mode
        const { GoogleDriveMISDataService } = require("./google-drive-service");
        _driveInstance = new GoogleDriveMISDataService();
      }
      return _driveInstance!;
    }
    case "wonde":
      throw new Error(
        "Wonde MIS data source not yet implemented. Use MIS_DATA_SOURCE=local",
      );
    default:
      if (!_instance) _instance = new LocalMISDataService();
      return _instance;
  }
}

/**
 * Smart service that checks if a school has a Google Drive connection,
 * and falls back to local test harness if not.
 */
export async function getMISDataServiceForOrg(
  organizationId: string,
): Promise<IMISDataService> {
  // If explicitly set to local, use local
  if (process.env.MIS_DATA_SOURCE === "local") {
    return getMISDataService("local");
  }

  // In development, default to local test harness for speed
  if (process.env.NODE_ENV === "development") {
    return getMISDataService("local");
  }

  // Check if org has a Google Drive connection (production only)
  try {
    const { createServiceRoleClient } = await import("@/lib/supabase-server");
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("school_data_connections")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .eq("provider", "google")
      .maybeSingle();

    if (data) {
      return getMISDataService("google_drive");
    }
  } catch {
    // No connection found, fall through to local
  }

  return getMISDataService("local");
}

// ─── Convenience Functions ───────────────────────────────

export async function readPupils(
  orgId: string,
): Promise<MISReadResult<MISPupil>> {
  return getMISDataService().read<MISPupil>(orgId, "pupils");
}

export async function readAttendance(
  orgId: string,
): Promise<MISReadResult<MISAttendanceRecord>> {
  return getMISDataService().read<MISAttendanceRecord>(orgId, "attendance");
}

export async function readStatutoryResults(
  orgId: string,
): Promise<MISReadResult<MISStatutoryResult>> {
  return getMISDataService().read<MISStatutoryResult>(
    orgId,
    "statutory_results",
  );
}

export async function readTermlyAssessments(
  orgId: string,
): Promise<MISReadResult<MISTermlyAssessment>> {
  return getMISDataService().read<MISTermlyAssessment>(
    orgId,
    "termly_assessments",
  );
}

export async function readBehaviour(
  orgId: string,
): Promise<MISReadResult<MISBehaviourIncident>> {
  return getMISDataService().read<MISBehaviourIncident>(orgId, "behaviour");
}

export async function readStaff(
  orgId: string,
): Promise<MISReadResult<MISStaffMember>> {
  return getMISDataService().read<MISStaffMember>(orgId, "staff");
}

export async function readTeacherHistory(
  orgId: string,
): Promise<MISReadResult<MISTeacherClassHistory>> {
  return getMISDataService().read<MISTeacherClassHistory>(
    orgId,
    "teacher_class_history",
  );
}

export async function readSENRegister(
  orgId: string,
): Promise<MISReadResult<MISSENRecord>> {
  return getMISDataService().read<MISSENRecord>(orgId, "sen_register");
}

export async function readHistoricalKS2(
  orgId: string,
): Promise<MISReadResult<MISHistoricalKS2>> {
  return getMISDataService().read<MISHistoricalKS2>(orgId, "historical_ks2");
}

export async function readEnergyInvoices(
  orgId: string,
): Promise<MISReadResult<MISEnergyInvoice>> {
  return getMISDataService().read<MISEnergyInvoice>(orgId, "energy_invoices");
}
