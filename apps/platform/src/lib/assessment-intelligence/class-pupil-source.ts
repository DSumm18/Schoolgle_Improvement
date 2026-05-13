import { createHash, createHmac } from "crypto";

export type AssessmentPupilSource = "lesson_studio" | "pupils_master";

export interface RawAssessmentClass {
  id: string;
  class_name: string;
  year_group: string;
  academic_year: string;
  pupil_count?: number | null;
}

export interface RawLessonStudioPupil {
  id: string;
  class_id: string | null;
  pupil_ref: string | null;
  display_name_encrypted: string | null;
  year_group: string | null;
  has_send_support?: boolean | null;
  has_ehcp?: boolean | null;
  is_pupil_premium?: boolean | null;
  is_eal?: boolean | null;
  fsm_eligible?: boolean | null;
  send_primary_need?: string | null;
  attainment_reading?: string | null;
  attainment_writing?: string | null;
  attainment_maths?: string | null;
  attainment_science?: string | null;
}

export interface RawMasterPupil {
  id: string;
  pupil_id: string;
  first_name?: string | null;
  last_name?: string | null;
  year_group: string | null;
  current_class?: string | null;
  class_name?: string | null;
  is_pupil_premium?: boolean | null;
  is_eal?: boolean | null;
  fsm_eligible?: boolean | null;
  send_status?: string | null;
  sen_status?: string | null;
  ehcp?: boolean | null;
  primary_need?: string | null;
  is_active?: boolean | null;
}

export interface AssessmentClassPupil {
  id: string;
  pupilHash: string;
  displayLabel: string;
  yearGroup: string;
  source: AssessmentPupilSource;
  fsmEligible: boolean;
  hasSendSupport: boolean;
  hasEhcp: boolean;
  isPupilPremium: boolean;
  isEal: boolean;
  primaryNeed: string | null;
  attainment: {
    reading: string | null;
    writing: string | null;
    maths: string | null;
    science: string | null;
  };
}

export interface AssessmentClassSource {
  id: string;
  className: string;
  yearGroup: string;
  academicYear: string;
  schoolUrn: number | null;
  schoolName: string | null;
  pupils: AssessmentClassPupil[];
}

export interface BuildAssessmentClassSourcesInput {
  organizationId: string;
  schoolUrn: number | null;
  schoolName: string | null;
  classes: RawAssessmentClass[];
  lessonStudioPupils: RawLessonStudioPupil[];
  masterPupils: RawMasterPupil[];
  hashSalt?: string | null;
}

export function buildAssessmentClassSources(input: BuildAssessmentClassSourcesInput): AssessmentClassSource[] {
  const masterByClass = new Map<string, RawMasterPupil[]>();
  for (const pupil of input.masterPupils) {
    if (pupil.is_active === false) continue;
    const classNames = [pupil.current_class, pupil.class_name].filter(Boolean) as string[];
    for (const className of classNames) {
      const key = normaliseClassKey(className);
      const list = masterByClass.get(key) || [];
      list.push(pupil);
      masterByClass.set(key, list);
    }
  }

  const lessonByClassId = new Map<string, RawLessonStudioPupil[]>();
  for (const pupil of input.lessonStudioPupils) {
    if (!pupil.class_id) continue;
    const list = lessonByClassId.get(pupil.class_id) || [];
    list.push(pupil);
    lessonByClassId.set(pupil.class_id, list);
  }

  return input.classes.map((classRow) => {
    const seenHashes = new Set<string>();
    const pupils: AssessmentClassPupil[] = [];

    for (const pupil of lessonByClassId.get(classRow.id) || []) {
      const stableRef = pupil.pupil_ref || pupil.id;
      const pupilHash = hashPupilRef(input.organizationId, stableRef, input.hashSalt);
      seenHashes.add(pupilHash);
      pupils.push({
        id: pupil.id,
        pupilHash,
        displayLabel: decodeLessonStudioDisplayName(pupil, stableRef),
        yearGroup: normaliseYearGroup(pupil.year_group || classRow.year_group),
        source: "lesson_studio",
        fsmEligible: pupil.fsm_eligible === true,
        hasSendSupport: pupil.has_send_support === true || pupil.has_ehcp === true,
        hasEhcp: pupil.has_ehcp === true,
        isPupilPremium: pupil.is_pupil_premium === true,
        isEal: pupil.is_eal === true,
        primaryNeed: pupil.send_primary_need || null,
        attainment: {
          reading: pupil.attainment_reading || null,
          writing: pupil.attainment_writing || null,
          maths: pupil.attainment_maths || null,
          science: pupil.attainment_science || null,
        },
      });
    }

    for (const pupil of masterByClass.get(normaliseClassKey(classRow.class_name)) || []) {
      const pupilHash = hashPupilRef(input.organizationId, pupil.pupil_id || pupil.id, input.hashSalt);
      if (seenHashes.has(pupilHash)) continue;
      seenHashes.add(pupilHash);
      pupils.push({
        id: pupil.id,
        pupilHash,
        displayLabel: [pupil.first_name, pupil.last_name].filter(Boolean).join(" ").trim() || pupil.pupil_id,
        yearGroup: normaliseYearGroup(pupil.year_group || classRow.year_group),
        source: "pupils_master",
        fsmEligible: pupil.fsm_eligible === true,
        hasSendSupport: isSendSupport(pupil),
        hasEhcp: pupil.ehcp === true || pupil.send_status === "E" || pupil.sen_status === "E",
        isPupilPremium: pupil.is_pupil_premium === true,
        isEal: pupil.is_eal === true,
        primaryNeed: pupil.primary_need || null,
        attainment: {
          reading: null,
          writing: null,
          maths: null,
          science: null,
        },
      });
    }

    pupils.sort((left, right) => left.displayLabel.localeCompare(right.displayLabel));

    return {
      id: classRow.id,
      className: classRow.class_name,
      yearGroup: normaliseYearGroup(classRow.year_group),
      academicYear: classRow.academic_year,
      schoolUrn: input.schoolUrn,
      schoolName: input.schoolName,
      pupils,
    };
  });
}

function hashPupilRef(organizationId: string, pupilRef: string, hashSalt?: string | null) {
  const value = `${organizationId}|${pupilRef}`.toLowerCase().trim();
  if (hashSalt) {
    return createHmac("sha256", hashSalt).update(value).digest("hex");
  }
  return createHash("sha256").update(value).digest("hex");
}

function normaliseClassKey(value: string) {
  return value.trim().toLowerCase();
}

function normaliseYearGroup(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (/^year\s+/i.test(trimmed)) return trimmed.replace(/^year\s+/i, "Year ");
  if (trimmed.toUpperCase() === "R") return "Reception";
  if (/^\d+$/.test(trimmed)) return `Year ${trimmed}`;
  return trimmed;
}

function isSendSupport(pupil: RawMasterPupil) {
  const status = (pupil.send_status || pupil.sen_status || "").toUpperCase();
  return status === "K" || status === "E" || pupil.ehcp === true;
}

function decodeLessonStudioDisplayName(pupil: RawLessonStudioPupil, fallback: string) {
  const displayName = pupil.display_name_encrypted?.trim();
  if (displayName?.startsWith("enc:")) return displayName.slice(4).trim() || fallback;
  return displayName || fallback;
}
