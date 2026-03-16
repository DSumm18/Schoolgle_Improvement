/**
 * Data transformation functions extracted for reuse across data services.
 * Maps raw Excel column names to canonical TypeScript interface fields.
 */

import type {
  MISDataType,
  MISPupil,
  MISAttendanceRecord,
  MISStatutoryResult,
  MISTermlyAssessment,
  MISBehaviourIncident,
  MISStaffMember,
  MISTeacherClassHistory,
  MISSENRecord,
  MISHistoricalKS2,
  AttainmentLevel,
  AssessmentPeriod,
} from "./types";

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
  };
}

function transformAttendance(raw: any): MISAttendanceRecord {
  const ayStr = String(raw["Academic Year"] || "");
  const ayStart = parseInt(ayStr.split("-")[0], 10) || 0;
  const totalPossible = toInt(raw["Possible Sessions"]);
  const present = toInt(raw["Present Sessions"]);
  const authAbs = toInt(raw["Absent Sessions (Authorised)"]);
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
    unauthorised_absences: toInt(raw["Absent Sessions (Unauthorised)"]),
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
  return {
    staff_id: String(raw["Staff ID"] || ""),
    display_name: `${title} ${first} ${last}`.trim(),
    email: String(
      raw["Email"] ||
        `${first.toLowerCase()}.${last.toLowerCase()}@school.example.com`,
    ),
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
    absence_days_this_year: toFloat(raw["Total Absence Days (Rolling 12m)"]),
    absence_days_last_year: 0,
    absence_spells_this_year: toInt(raw["Absence Spells (Rolling 12m)"]),
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
    sen_status: (raw["SEN Status"] === "E" ? "E" : "K") as "K" | "E",
    sen_primary_need: String(
      raw["Primary Need"] || raw["SEN Primary Need"] || "",
    ),
    sen_secondary_need: raw["Secondary Need"] || raw["SEN Secondary Need"],
    date_identified: String(
      raw["Date Identified"] || raw["Identification Date"] || "",
    ),
    ehcp: toBool(raw["EHCP"]),
    ehcp_start_date: raw["EHCP Start Date"],
    ehcp_review_date: raw["EHCP Review Date"],
    next_annual_review: raw["Next Annual Review"],
    external_agencies: raw["External Agencies"],
    key_worker: raw["Key Worker"] || raw["Named TA"],
    provision_description: raw["Provision"],
    pupil_premium: toBool(raw["PP"] ?? raw["Pupil Premium"]),
    attendance_pct: raw["Attendance %"]
      ? toFloat(raw["Attendance %"])
      : undefined,
  };
}

function transformInsightTracker(rawRows: any[]): MISTermlyAssessment[] {
  const results: MISTermlyAssessment[] = [];
  const periodRegex = /^(\d{4}-\d{2})\s+(Aut1|Aut2|Spr1|Spr2|Sum1|Sum2)$/;

  for (const raw of rawRows) {
    const studentId = String(raw["Admission Number"] || "");
    const pupilName = String(raw["Pupil Name"] || "");
    const yearGroup = parseYearGroup(raw["Year Group"]);
    const regGroup = String(raw["Class"] || "");
    const subject = String(raw["Subject"] || "").toLowerCase() as any;

    for (const colName of Object.keys(raw)) {
      const match = colName.match(periodRegex);
      if (!match) continue;

      const academicYear = match[1];
      const period = match[2] as AssessmentPeriod;
      const grade = String(raw[colName] || "").replace(/[+-]$/, "");
      const staffCol = `${colName} Staff`;
      const staffId = String(raw[staffCol] || "");

      if (!grade || grade === "undefined" || grade === "null") continue;
      if (!["PKF", "WTS", "EXS", "GDS", "EMG", "EXP"].includes(grade)) continue;

      results.push({
        student_id: studentId,
        upn: "",
        pupil_name: pupilName,
        admission_number: studentId,
        registration_group: regGroup,
        year_group: yearGroup,
        subject,
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

/* eslint-enable @typescript-eslint/no-explicit-any */

/** Apply appropriate transformer based on data type */
export function transformData<T>(dataType: MISDataType, rawData: any[]): T[] {
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
    default:
      return rawData as T[];
  }
}
