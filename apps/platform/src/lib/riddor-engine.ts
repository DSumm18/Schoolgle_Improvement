/**
 * RIDDOR Auto-Detection Engine
 *
 * Analyses incident data and determines:
 * 1. Is this RIDDOR reportable?
 * 2. Which category?
 * 3. What's the deadline?
 * 4. Pre-fills the HSE F2508 form data
 *
 * Based on: Reporting of Injuries, Diseases and Dangerous Occurrences
 * Regulations 2013 (RIDDOR) — HSE guidance for schools
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IncidentData {
  id?: string;
  incident_type: string;
  severity: string;
  incident_date: string;
  incident_time?: string | null;
  location: string;
  location_detail?: string | null;

  // Injured person
  injured_person_name?: string | null;
  injured_person_type?: string | null; // pupil, staff, visitor, contractor
  injured_person_role?: string | null;
  injured_person_year_group?: string | null;
  injured_person_dob?: string | null;
  injured_person_address?: string | null;
  injured_person_phone?: string | null;

  // What happened
  title: string;
  description: string;
  immediate_actions?: string | null;

  // Injury details
  injury_type?: string | null;
  injury_body_part?: string | null;
  injury_is_fracture_excluded?: boolean;

  // Hospital
  hospital_attendance?: boolean;
  hospital_admission_type?: string | null; // admitted, treated_and_discharged, not_attended
  hospital_name?: string | null;
  hospital_admission_date?: string | null;
  hospital_details?: string | null;

  // First aid
  first_aid_given?: boolean;
  first_aid_details?: string | null;
  first_aider_name?: string | null;

  // Work absence
  days_off_work?: number | null;

  // Dangerous occurrences
  dangerous_occurrence_type?: string | null;

  // Occupational disease
  occupational_disease_type?: string | null;
  medical_diagnosis_date?: string | null;
  is_work_related?: boolean;

  // Witnesses
  witnesses?: any[];

  // Reporter
  reported_by_name?: string | null;
}

export interface RIDDORDetection {
  is_reportable: boolean;
  category: string | null;
  reason: string;
  urgency: "immediate" | "next_working_day" | "10_working_days" | null;
  deadline: string | null; // ISO date
  confidence: "high" | "medium" | "low";
  guidance: string;
}

export interface F2508FormData {
  // Part A: About the reporter
  reporter_name: string;
  reporter_role: string;
  organization_name: string;
  organization_address: string;
  organization_type: string;
  reporter_phone: string;
  reporter_email: string;

  // Part B: About the incident
  incident_date: string;
  incident_time: string;
  incident_location: string;
  incident_description: string;
  how_it_happened: string;

  // About the injured person
  injured_person_name: string;
  injured_person_dob: string;
  injured_person_occupation: string;
  injured_person_type: string; // employee | non-worker | self-employed
  injured_person_contact: string;

  // Injury details
  injury_type: string;
  injury_description: string;
  hospital_attended: boolean;
  hospital_name: string;
  hospital_admission_date: string;

  // RIDDOR category
  riddor_category: string;
  riddor_category_label: string;

  // Witnesses
  witnesses: string;

  // Additional
  equipment_involved: string;
  substance_involved: string;
  days_off_work: number | null;

  // Declaration
  declaration_name: string;
  declaration_date: string;
}

// ---------------------------------------------------------------------------
// Specified Injury Checks
// ---------------------------------------------------------------------------

const SPECIFIED_INJURY_TYPES = [
  "fracture",
  "amputation",
  "loss_of_sight",
  "crush_injury",
  "scalping",
  "thermal_burns",
  "chemical_burns",
  "loss_of_consciousness",
  "hypothermia",
  "heat_illness",
  "permanent_loss_of_function",
  "acute_illness_from_substance",
];

const FRACTURE_EXCLUDED_PARTS = [
  "finger",
  "thumb",
  "toe",
  "phalanx",
  "phalange",
  "little finger",
  "ring finger",
  "middle finger",
  "index finger",
  "big toe",
  "little toe",
];

function isSpecifiedInjury(
  injuryType: string | null | undefined,
  bodyPart: string | null | undefined,
  isFractureExcluded: boolean | undefined,
): boolean {
  if (!injuryType) return false;
  const type = injuryType.toLowerCase();

  if (!SPECIFIED_INJURY_TYPES.includes(type)) return false;

  // Fractures of fingers/thumbs/toes are NOT specified injuries
  if (type === "fracture") {
    if (isFractureExcluded) return false;
    if (bodyPart) {
      const part = bodyPart.toLowerCase();
      if (FRACTURE_EXCLUDED_PARTS.some((ex) => part.includes(ex))) {
        return false;
      }
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// Dangerous Occurrence Types
// ---------------------------------------------------------------------------

const DANGEROUS_OCCURRENCE_TYPES = [
  "scaffolding_collapse",
  "electrical_contact",
  "fire_serious",
  "structural_collapse",
  "substance_release",
  "gas_leak",
  "asbestos_disturbance",
  "breathing_apparatus_failure",
  "pressure_equipment_failure",
  "lifting_equipment_failure",
  "control_system_failure",
  "explosion",
];

// ---------------------------------------------------------------------------
// Keyword Detection (fallback for free-text analysis)
// ---------------------------------------------------------------------------

const RIDDOR_KEYWORDS = {
  death: ["died", "fatal", "death", "deceased", "killed"],
  fracture: [
    "fracture",
    "broken bone",
    "broken arm",
    "broken leg",
    "broken wrist",
    "broken ankle",
    "broken collarbone",
    "broken rib",
    "greenstick",
  ],
  amputation: [
    "amputation",
    "amputated",
    "severed",
    "lost finger",
    "lost hand",
  ],
  hospital_admission: [
    "admitted to hospital",
    "hospital admission",
    "kept in hospital",
    "overnight in hospital",
    "a&e admission",
    "admitted to a&e",
  ],
  loss_of_consciousness: [
    "unconscious",
    "loss of consciousness",
    "lost consciousness",
    "knocked out",
    "blacked out",
    "concussion",
  ],
  gas_leak: ["gas leak", "gas smell", "gas detected", "gas escape"],
  structural: [
    "ceiling collapse",
    "roof collapse",
    "wall collapse",
    "floor collapse",
    "structural failure",
    "building collapse",
  ],
  burns: [
    "severe burn",
    "chemical burn",
    "thermal burn",
    "scalding",
    "third degree",
    "second degree",
  ],
};

function detectKeywordsInText(text: string): string[] {
  const lower = text.toLowerCase();
  const detected: string[] = [];
  for (const [category, keywords] of Object.entries(RIDDOR_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      detected.push(category);
    }
  }
  return detected;
}

// ---------------------------------------------------------------------------
// Main Detection Function
// ---------------------------------------------------------------------------

export function detectRIDDOR(incident: IncidentData): RIDDORDetection {
  // Category 1: Death
  if (
    incident.severity === "critical" &&
    (incident.injury_type === "death" ||
      detectKeywordsInText(
        `${incident.title} ${incident.description}`,
      ).includes("death"))
  ) {
    return {
      is_reportable: true,
      category: "death",
      reason: "Fatality resulting from workplace incident",
      urgency: "immediate",
      deadline: incident.incident_date, // Same day — phone HSE immediately
      confidence: "high",
      guidance:
        "IMMEDIATE ACTION REQUIRED: Call HSE Incident Contact Centre on 0345 300 9923 within 15 minutes. A written report (F2508) must follow within 10 working days.",
    };
  }

  // Category 2: Specified Injuries (any person)
  if (
    isSpecifiedInjury(
      incident.injury_type,
      incident.injury_body_part,
      incident.injury_is_fracture_excluded,
    )
  ) {
    const injuryLabel =
      incident.injury_type?.replace(/_/g, " ") || "specified injury";
    return {
      is_reportable: true,
      category: "specified_injury",
      reason: `Specified injury: ${injuryLabel}${incident.injury_body_part ? ` (${incident.injury_body_part})` : ""}`,
      urgency: "10_working_days",
      deadline: calculateWorkingDayDeadline(incident.incident_date, 10),
      confidence: "high",
      guidance: `This is a specified injury under RIDDOR. Report to HSE within 10 working days using form F2508. The injury type "${injuryLabel}" is on the HSE specified injuries list.`,
    };
  }

  // Keyword-based fracture detection from free text
  const textKeywords = detectKeywordsInText(
    `${incident.title} ${incident.description} ${incident.hospital_details || ""}`,
  );
  if (
    textKeywords.includes("fracture") &&
    !incident.injury_is_fracture_excluded
  ) {
    return {
      is_reportable: true,
      category: "specified_injury",
      reason:
        "Possible fracture detected from incident description. Please confirm the injury type.",
      urgency: "10_working_days",
      deadline: calculateWorkingDayDeadline(incident.incident_date, 10),
      confidence: "medium",
      guidance:
        "The incident description mentions a fracture. If confirmed as a fracture (other than fingers, thumbs, or toes), this is RIDDOR reportable. Please confirm the injury type in the form.",
    };
  }

  // Category 3: Over 7-day incapacitation (STAFF ONLY)
  if (
    incident.injured_person_type === "staff" &&
    incident.days_off_work != null &&
    incident.days_off_work > 7
  ) {
    return {
      is_reportable: true,
      category: "over_7_day",
      reason: `Staff member absent from work for ${incident.days_off_work} consecutive days (exceeds 7-day threshold)`,
      urgency: "next_working_day",
      deadline: calculateWorkingDayDeadline(incident.incident_date, 8), // Day after day 7
      confidence: "high",
      guidance: `Under RIDDOR, if a worker is incapacitated for more than 7 consecutive days (not counting the day of the incident), it must be reported by the end of the next working day after day 7. Report using form F2508.`,
    };
  }

  // Category 4: Non-fatal accident to non-worker → hospital ADMISSION
  if (
    (incident.injured_person_type === "pupil" ||
      incident.injured_person_type === "visitor" ||
      incident.injured_person_type === "other") &&
    incident.hospital_admission_type === "admitted"
  ) {
    return {
      is_reportable: true,
      category: "non_fatal_non_worker",
      reason: `Non-worker (${incident.injured_person_type}) admitted to hospital for treatment of injuries`,
      urgency: "10_working_days",
      deadline: calculateWorkingDayDeadline(incident.incident_date, 10),
      confidence: "high",
      guidance: `Under RIDDOR, if a member of the public (including pupils) is taken directly to hospital for treatment of an injury arising from a work-related accident, it must be reported. Note: being taken to A&E for examination but NOT admitted does not trigger RIDDOR.`,
    };
  }

  // Also check hospital_attendance + keywords for non-workers
  if (
    (incident.injured_person_type === "pupil" ||
      incident.injured_person_type === "visitor") &&
    incident.hospital_attendance &&
    textKeywords.includes("hospital_admission")
  ) {
    return {
      is_reportable: true,
      category: "non_fatal_non_worker",
      reason:
        "Non-worker appears to have been admitted to hospital based on description",
      urgency: "10_working_days",
      deadline: calculateWorkingDayDeadline(incident.incident_date, 10),
      confidence: "medium",
      guidance:
        "The description suggests the injured person was admitted to hospital. Please confirm: was the person admitted as an in-patient, or only treated in A&E and discharged? Only hospital ADMISSION triggers RIDDOR for non-workers.",
    };
  }

  // Category 5: Dangerous Occurrences
  if (
    incident.incident_type === "dangerous_occurrence" ||
    (incident.dangerous_occurrence_type &&
      DANGEROUS_OCCURRENCE_TYPES.includes(incident.dangerous_occurrence_type))
  ) {
    const doType =
      incident.dangerous_occurrence_type?.replace(/_/g, " ") ||
      "dangerous occurrence";
    return {
      is_reportable: true,
      category: "dangerous_occurrence",
      reason: `Dangerous occurrence: ${doType}`,
      urgency: "immediate",
      deadline: calculateWorkingDayDeadline(incident.incident_date, 10),
      confidence: "high",
      guidance: `This is a dangerous occurrence under RIDDOR Schedule 2. Report immediately to HSE (phone 0345 300 9923) and follow up with written report (F2508A) within 10 working days. Even though no one may have been injured, the potential for harm triggers the requirement.`,
    };
  }

  // Keyword-based dangerous occurrence detection
  if (
    textKeywords.includes("gas_leak") ||
    textKeywords.includes("structural")
  ) {
    return {
      is_reportable: true,
      category: "dangerous_occurrence",
      reason:
        "Possible dangerous occurrence detected from incident description",
      urgency: "immediate",
      deadline: calculateWorkingDayDeadline(incident.incident_date, 10),
      confidence: "medium",
      guidance:
        "The incident description suggests a dangerous occurrence (gas leak or structural issue). Please confirm the details. If confirmed, report immediately to HSE.",
    };
  }

  // Category 6: Occupational Disease
  if (
    incident.incident_type === "ill_health" &&
    incident.is_work_related &&
    incident.occupational_disease_type &&
    incident.medical_diagnosis_date
  ) {
    return {
      is_reportable: true,
      category: "occupational_disease",
      reason: `Occupational disease: ${incident.occupational_disease_type.replace(/_/g, " ")}`,
      urgency: "10_working_days",
      deadline: calculateWorkingDayDeadline(
        incident.medical_diagnosis_date,
        10,
      ),
      confidence: "high",
      guidance: `Report using form F2508A within 10 working days of the diagnosis date. The employer must report when they receive a written diagnosis from a doctor.`,
    };
  }

  // Loss of consciousness from text
  if (textKeywords.includes("loss_of_consciousness")) {
    return {
      is_reportable: true,
      category: "specified_injury",
      reason: "Loss of consciousness detected from incident description",
      urgency: "10_working_days",
      deadline: calculateWorkingDayDeadline(incident.incident_date, 10),
      confidence: "medium",
      guidance:
        "The description mentions loss of consciousness. If caused by head injury or asphyxia, this is a specified injury under RIDDOR. Please confirm.",
    };
  }

  // Burns with hospital
  if (textKeywords.includes("burns") && incident.hospital_attendance) {
    return {
      is_reportable: true,
      category: "specified_injury",
      reason: "Burns requiring hospital treatment detected",
      urgency: "10_working_days",
      deadline: calculateWorkingDayDeadline(incident.incident_date, 10),
      confidence: "medium",
      guidance:
        "Burns or scalds that lead to hospital admission are RIDDOR reportable as a specified injury. Please confirm the severity.",
    };
  }

  // Not reportable
  return {
    is_reportable: false,
    category: null,
    reason:
      "Does not meet RIDDOR reportable criteria based on information provided",
    urgency: null,
    deadline: null,
    confidence: "high",
    guidance:
      "Based on the information provided, this incident does not appear to meet RIDDOR reporting thresholds. However, it should still be recorded in the school's accident book. If the situation changes (e.g., worker is off for more than 7 days, or the injury turns out to be more serious), reassess RIDDOR status.",
  };
}

// ---------------------------------------------------------------------------
// F2508 Form Pre-Filler
// ---------------------------------------------------------------------------

export function generateF2508FormData(
  incident: IncidentData,
  detection: RIDDORDetection,
  schoolData: {
    name: string;
    address: string;
    phone: string;
    email: string;
    headteacher_name: string;
    local_authority?: string;
  },
): F2508FormData {
  const isWorker =
    incident.injured_person_type === "staff" ||
    incident.injured_person_type === "contractor";

  const categoryLabels: Record<string, string> = {
    death: "Death of any person",
    specified_injury: "Specified injury to a worker or non-worker",
    over_7_day: "Incapacitation of a worker for more than 7 consecutive days",
    non_fatal_non_worker:
      "Non-fatal accident to a non-worker (taken to hospital)",
    dangerous_occurrence: "Dangerous occurrence",
    occupational_disease: "Occupational disease",
  };

  return {
    // Part A
    reporter_name: schoolData.headteacher_name,
    reporter_role: "Headteacher",
    organization_name: schoolData.name,
    organization_address: schoolData.address,
    organization_type: "School",
    reporter_phone: schoolData.phone,
    reporter_email: schoolData.email,

    // Part B
    incident_date: incident.incident_date,
    incident_time: incident.incident_time || "",
    incident_location: [incident.location, incident.location_detail]
      .filter(Boolean)
      .join(" — "),
    incident_description: incident.description,
    how_it_happened: incident.description,

    // Injured person
    injured_person_name: incident.injured_person_name || "Not known",
    injured_person_dob: incident.injured_person_dob || "",
    injured_person_occupation:
      incident.injured_person_role ||
      incident.injured_person_year_group ||
      incident.injured_person_type ||
      "",
    injured_person_type: isWorker ? "employee" : "non-worker",
    injured_person_contact: [
      incident.injured_person_address,
      incident.injured_person_phone,
    ]
      .filter(Boolean)
      .join(", "),

    // Injury
    injury_type: incident.injury_type?.replace(/_/g, " ") || "",
    injury_description: [
      incident.injury_type?.replace(/_/g, " "),
      incident.injury_body_part ? `to ${incident.injury_body_part}` : "",
      incident.hospital_details,
    ]
      .filter(Boolean)
      .join(". "),
    hospital_attended: incident.hospital_attendance || false,
    hospital_name: incident.hospital_name || "",
    hospital_admission_date: incident.hospital_admission_date || "",

    // RIDDOR
    riddor_category: detection.category || "",
    riddor_category_label: categoryLabels[detection.category || ""] || "",

    // Witnesses
    witnesses: (incident.witnesses || [])
      .map(
        (w: any) =>
          `${w.name}${w.role ? ` (${w.role})` : ""}${w.statement ? `: ${w.statement}` : ""}`,
      )
      .join("\n"),

    // Additional
    equipment_involved: "", // Can be extracted from description by Ed
    substance_involved: "",
    days_off_work: incident.days_off_work || null,

    // Declaration
    declaration_name: schoolData.headteacher_name,
    declaration_date: new Date().toISOString().split("T")[0],
  };
}

// ---------------------------------------------------------------------------
// Deadline Calculator
// ---------------------------------------------------------------------------

export function calculateWorkingDayDeadline(
  fromDate: string,
  workingDays: number,
): string {
  const date = new Date(fromDate);
  let count = 0;
  while (count < workingDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return date.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// RIDDOR Status Summary (for Ed conversations)
// ---------------------------------------------------------------------------

export function getRIDDORSummary(detection: RIDDORDetection): string {
  if (!detection.is_reportable) {
    return `This incident does NOT appear to be RIDDOR reportable. ${detection.guidance}`;
  }

  const urgencyText = {
    immediate: "Report IMMEDIATELY by phone (HSE: 0345 300 9923)",
    next_working_day: "Report by end of next working day",
    "10_working_days": `Report within 10 working days (deadline: ${detection.deadline})`,
  };

  return [
    `**RIDDOR REPORTABLE** — ${detection.reason}`,
    `**Urgency:** ${urgencyText[detection.urgency!] || "Within 10 working days"}`,
    `**Confidence:** ${detection.confidence}`,
    "",
    detection.guidance,
    "",
    detection.confidence === "medium"
      ? "**Note:** This assessment is based on the information provided and may need confirmation. Please review the details."
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
