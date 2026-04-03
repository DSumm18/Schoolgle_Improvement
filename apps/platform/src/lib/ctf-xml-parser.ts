/**
 * CTF / Assessment Manager XML Parser
 *
 * Parses Common Transfer File (CTF) XML (DfE v3) and Assessment Manager XML
 * exports from school MIS systems (Arbor, SIMS, Bromcom, etc.).
 *
 * Pseudonymisation: HMAC-SHA256(UPN.toLowerCase().trim(), organizationId)
 * — uses organizationId as a deterministic server-side salt.
 * This is separate from the client-side browser salt used in the manual
 * CSV upload flow (pupil-pseudonymiser.ts). Both produce pupil_hash values
 * stored in pupil_assessments_pseudo. The server-side salt allows consistent
 * cross-import linking without requiring browser interaction.
 *
 * CTF format: DfE Common Transfer File v3 XML
 * Assessment Manager format: Varies by vendor
 */

import { XMLParser } from "fast-xml-parser";
import { createHmac } from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AssessmentFormat = "ctf" | "assessment_manager" | "unknown";

export interface ParsedAssessmentRecord {
  upn: string;
  pupil_hash: string;
  year_group: number | null;
  subject: string;
  assessment_type: "TA" | "SS" | "RA" | "unknown";
  key_stage: string | null; // "KS1", "KS2", "EYFS", etc.
  attainment_level: string | null; // WTS, EXS, GDS
  scaled_score: number | null;
  raw_score: number | null;
  assessment_year: number | null;
  assessment_period: string | null; // "autumn", "spring", "summer"
  source_subject_code: string; // raw code from XML, e.g. "MA", "RE"
}

export interface ParseResult {
  format: AssessmentFormat;
  source_school_urn: string | null;
  source_school_name: string | null;
  records: ParsedAssessmentRecord[];
  warnings: string[];
  pupil_count: number;
}

// ─── Subject Code Normalisation ───────────────────────────────────────────────

// All keys must be lowercase (normaliseSubject lowercases the raw value first)
const SUBJECT_MAP: Record<string, string> = {
  // DfE CTF subject codes (lowercased)
  ma: "maths",
  mat: "maths",
  en: "reading",
  eng: "reading",
  re: "reading",
  wr: "writing",
  sc: "science",
  sci: "science",
  sp: "spelling",
  gp: "grammar",
  ps: "punctuation",
  mt: "maths",
  el: "reading",
  pho: "phonics",
  // EYFS areas (CTF v20+ subject codes)
  com: "communication_and_language",
  phy: "physical_development",
  pse: "personal_social_emotional",
  lit: "literacy",
  utw: "understanding_the_world",
  ead: "expressive_arts_and_design",
  // Assessment Manager free-text
  reading: "reading",
  writing: "writing",
  maths: "maths",
  mathematics: "maths",
  science: "science",
  spelling: "spelling",
  grammar: "grammar",
  punctuation: "punctuation",
  gps: "grammar",
  "spelling, punctuation and grammar": "grammar",
  spag: "grammar",
  "english reading": "reading",
  "english writing": "writing",
};

function normaliseSubject(raw: string): string {
  const key = raw.toLowerCase().trim();
  return SUBJECT_MAP[key] ?? key;
}

// ─── Attainment Level Normalisation ──────────────────────────────────────────

/**
 * Normalise various attainment codes to WTS / EXS / GDS (or raw if unknown).
 * CTF uses: WA (Working at = WTS), EXS (Expected Standard), GDS (Greater Depth)
 */
function normaliseAttainment(
  raw: string | number | null | undefined,
): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const s = String(raw).toUpperCase().trim();

  const map: Record<string, string> = {
    WTS: "WTS",
    WA: "WTS",
    BLW: "WTS",
    PKF: "WTS",
    PKE: "WTS",
    EXS: "EXS",
    EX: "EXS",
    M: "EXS",
    E: "EXS",
    P: "EXS",
    EM: "EXS",
    ELG: "EXS",
    GDS: "GDS",
    GD: "GDS",
    A: "GDS",
    H: "GDS",
    HNM: "WTS", // Has not met
  };

  return map[s] ?? s;
}

// ─── Period Normalisation ─────────────────────────────────────────────────────

function normalisePeriod(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (s.startsWith("aut") || s === "aut1" || s === "aut2") return "autumn";
  if (s.startsWith("spr") || s === "spr1" || s === "spr2") return "spring";
  if (s.startsWith("sum") || s === "sum1" || s === "sum2") return "summer";
  if (s.includes("autumn") || s.includes("fall")) return "autumn";
  if (s.includes("spring")) return "spring";
  if (s.includes("summer")) return "summer";
  return s;
}

// ─── Key Stage Detection ──────────────────────────────────────────────────────

function detectKeyStage(
  yearGroup: number | null,
  stageRaw?: string,
): string | null {
  if (stageRaw) {
    const s = stageRaw.toUpperCase().trim();
    if (s === "EYFS" || s === "EY" || s === "FS") return "EYFS";
    if (s === "KS1" || s === "1") return "KS1";
    if (s === "KS2" || s === "2") return "KS2";
    if (s === "KS3" || s === "3") return "KS3";
    if (s === "KS4" || s === "4") return "KS4";
  }
  if (yearGroup === null) return null;
  if (yearGroup <= 0) return "EYFS";
  if (yearGroup <= 2) return "KS1";
  if (yearGroup <= 6) return "KS2";
  if (yearGroup <= 9) return "KS3";
  return "KS4";
}

// ─── Pseudonymisation ─────────────────────────────────────────────────────────

/**
 * HMAC-SHA256(UPN.toLowerCase().trim(), organizationId)
 *
 * Uses organizationId as the server-side salt — always available without
 * browser interaction. Consistent across all server-side imports for this org.
 */
export function hashUPN(upn: string, organizationId: string): string {
  return createHmac("sha256", organizationId)
    .update(upn.toLowerCase().trim())
    .digest("hex");
}

// ─── CTF XML Parser ───────────────────────────────────────────────────────────

/**
 * Parse DfE Common Transfer File (CTF) XML v3.
 *
 * Root element: <CTfile version="3">
 * Contains: <Header>, <Pupils><Pupil>...</Pupil></Pupils>
 *
 * Each <Pupil> may have:
 * - <KS1>, <KS2>, <KS3> blocks with <Results><Result>
 * - <EYFS> block with <Areas><Area>
 * - <Assessments><Assessment> for termly teacher assessments
 */
function parseCTF(
  doc: Record<string, unknown>,
  organizationId: string,
): Omit<ParseResult, "format"> {
  const warnings: string[] = [];
  const records: ParsedAssessmentRecord[] = [];

  const ctfRoot = doc["CTfile"] as Record<string, unknown> | undefined;
  if (!ctfRoot) {
    return {
      source_school_urn: null,
      source_school_name: null,
      records,
      warnings: ["CTfile root element not found"],
      pupil_count: 0,
    };
  }

  // Header — handle both flat (SourceSchoolURN) and nested (SourceSchool.URN) formats
  const header = ctfRoot["Header"] as Record<string, unknown> | undefined;
  const sourceSchool = header?.["SourceSchool"] as
    | Record<string, unknown>
    | undefined;
  const source_school_urn =
    sourceSchool?.["URN"]?.toString() ??
    header?.["SourceSchoolURN"]?.toString() ??
    null;
  const source_school_name =
    sourceSchool?.["SchoolName"]?.toString() ??
    header?.["SourceSchoolName"]?.toString() ??
    null;

  // Pupils — handle both <Pupils> and <CTFpupilData> wrappers
  const pupilsWrapper = (ctfRoot["CTFpupilData"] ?? ctfRoot["Pupils"]) as
    | Record<string, unknown>
    | undefined;
  const rawPupils = pupilsWrapper?.["Pupil"];
  const pupils = Array.isArray(rawPupils)
    ? rawPupils
    : rawPupils
      ? [rawPupils]
      : [];

  let pupilCount = 0;

  for (const pupil of pupils as Record<string, unknown>[]) {
    const upn = pupil["UPN"]?.toString()?.trim();
    if (!upn) {
      warnings.push("Skipped pupil with missing UPN");
      continue;
    }
    pupilCount++;
    const pupil_hash = hashUPN(upn, organizationId);

    // Year group — may be directly on Pupil or inside BasicDetails
    const basicDetails = pupil["BasicDetails"] as
      | Record<string, unknown>
      | undefined;
    const ncYearRaw =
      pupil["NCyearActual"] ?? basicDetails?.["NCyearActual"];
    const yearGroup = ncYearRaw
      ? ncYearRaw.toString().toUpperCase() === "R"
        ? 0
        : parseInt(String(ncYearRaw))
      : null;

    // ─── CTF v20+ format: <StageAssessments><KeyStage><StageAssessment> ──
    const stageAssessments = pupil["StageAssessments"] as
      | Record<string, unknown>
      | undefined;
    if (stageAssessments) {
      const rawKeyStages = stageAssessments["KeyStage"];
      const keyStages = Array.isArray(rawKeyStages)
        ? rawKeyStages
        : rawKeyStages
          ? [rawKeyStages]
          : [];

      for (const ks of keyStages as Record<string, unknown>[]) {
        const stageCode = ks["Stage"]?.toString()?.toUpperCase() ?? "";
        const keyStage = stageCode.startsWith("EY")
          ? "EYFS"
          : stageCode === "KS1"
            ? "KS1"
            : stageCode === "KS2"
              ? "KS2"
              : stageCode === "KS3"
                ? "KS3"
                : detectKeyStage(yearGroup, stageCode);

        const rawAssessments = ks["StageAssessment"];
        const assessments = Array.isArray(rawAssessments)
          ? rawAssessments
          : rawAssessments
            ? [rawAssessments]
            : [];

        for (const sa of assessments as Record<string, unknown>[]) {
          const subjectCode = sa["Subject"]?.toString() ?? "";
          const method = sa["Method"]?.toString()?.toUpperCase() ?? "TA";
          const component = sa["Component"]?.toString() ?? "";
          const resultRaw = sa["Result"];
          const yr = sa["Year"] ? parseInt(String(sa["Year"])) : null;
          const resultQualifier =
            sa["ResultQualifier"]?.toString()?.toUpperCase() ?? "";

          // Determine subject from Subject + Component
          let subject = normaliseSubject(subjectCode);
          // For ENG subject, use component to disambiguate reading vs writing
          if (
            subjectCode.toUpperCase() === "ENG" &&
            component.toUpperCase() === "WRI"
          ) {
            subject = "writing";
          } else if (
            subjectCode.toUpperCase() === "ENG" &&
            (component.toUpperCase() === "REA" ||
              component.toUpperCase() === "RED")
          ) {
            subject = "reading";
          }

          // Determine assessment_type
          const assessmentType: "TA" | "SS" | "RA" | "unknown" =
            method === "TT" || method === "TA"
              ? "TA"
              : method === "SS"
                ? "SS"
                : method === "RA"
                  ? "RA"
                  : method === "FA"
                    ? "TA"
                    : "unknown";

          // Result could be attainment level (EXS, WTS, GDS) or numeric score
          const resultStr = resultRaw?.toString() ?? "";
          const isNumeric = /^\d+$/.test(resultStr);

          // For phonics, NM qualifier means the result is the numeric mark
          const scaledScore =
            isNumeric && resultQualifier === "NM"
              ? parseInt(resultStr)
              : null;
          const attainment = isNumeric
            ? resultQualifier === "NM"
              ? null
              : normaliseAttainment(resultStr)
            : normaliseAttainment(resultStr);

          records.push({
            upn,
            pupil_hash,
            year_group: yearGroup,
            subject,
            assessment_type: assessmentType,
            key_stage: keyStage,
            attainment_level: attainment,
            scaled_score: scaledScore,
            raw_score: isNumeric && resultQualifier !== "NM" ? null : null,
            assessment_year: yr,
            assessment_period: "summer",
            source_subject_code: `${subjectCode}/${component}`,
          });
        }
      }
    }

    // ─── Legacy CTF format: <KS1>, <KS2>, <KS3> blocks directly on Pupil ──
    for (const stage of ["KS1", "KS2", "KS3"] as const) {
      const stageData = pupil[stage] as Record<string, unknown> | undefined;
      if (!stageData) continue;

      const stageYear = stageData["Year"]
        ? parseInt(String(stageData["Year"]))
        : null;
      const resultsWrapper = stageData["Results"] as
        | Record<string, unknown>
        | undefined;
      const rawResults = resultsWrapper?.["Result"];
      const results = Array.isArray(rawResults)
        ? rawResults
        : rawResults
          ? [rawResults]
          : [];

      for (const result of results as Record<string, unknown>[]) {
        const subjectCode = result["Subject"]?.toString() ?? "";
        const method = result["Method"]?.toString()?.toUpperCase() ?? "TA";
        const scaledScoreRaw = result["ScaledScore"];

        records.push({
          upn,
          pupil_hash,
          year_group: yearGroup,
          subject: normaliseSubject(subjectCode),
          assessment_type:
            method === "SS" ? "SS" : method === "RA" ? "RA" : "TA",
          key_stage: stage,
          attainment_level: normaliseAttainment(result["Result"]?.toString()),
          scaled_score: scaledScoreRaw
            ? parseInt(String(scaledScoreRaw))
            : null,
          raw_score: null,
          assessment_year: stageYear,
          assessment_period: "summer",
          source_subject_code: subjectCode,
        });
      }
    }

    // ─── Legacy EYFS profile ──
    const eyfsData = pupil["EYFS"] as Record<string, unknown> | undefined;
    if (eyfsData) {
      const eyfsYear = eyfsData["Year"]
        ? parseInt(String(eyfsData["Year"]))
        : null;
      const areasWrapper = eyfsData["Areas"] as
        | Record<string, unknown>
        | undefined;
      const rawAreas = areasWrapper?.["Area"];
      const areas = Array.isArray(rawAreas)
        ? rawAreas
        : rawAreas
          ? [rawAreas]
          : [];

      for (const area of areas as Record<string, unknown>[]) {
        const subjectCode = area["SubjectCode"]?.toString() ?? "EYFS";
        records.push({
          upn,
          pupil_hash,
          year_group: 0,
          subject: normaliseSubject(subjectCode),
          assessment_type: "TA",
          key_stage: "EYFS",
          attainment_level: normaliseAttainment(area["Result"]?.toString()),
          scaled_score: null,
          raw_score: null,
          assessment_year: eyfsYear,
          assessment_period: "summer",
          source_subject_code: subjectCode,
        });
      }
    }

    // ─── Legacy termly assessments ──
    const assessmentsWrapper = pupil["Assessments"] as
      | Record<string, unknown>
      | undefined;
    const rawAssessments = assessmentsWrapper?.["Assessment"];
    const assessments = Array.isArray(rawAssessments)
      ? rawAssessments
      : rawAssessments
        ? [rawAssessments]
        : [];

    for (const assessment of assessments as Record<string, unknown>[]) {
      const subjectCode =
        assessment["SubjectCode"]?.toString() ??
        assessment["Subject"]?.toString() ??
        "";
      const yr = assessment["Year"]
        ? parseInt(String(assessment["Year"]))
        : null;
      const period = normalisePeriod(assessment["Period"]?.toString());
      const yg = assessment["YearGroup"]
        ? parseInt(String(assessment["YearGroup"]))
        : yearGroup;

      records.push({
        upn,
        pupil_hash,
        year_group: yg,
        subject: normaliseSubject(subjectCode),
        assessment_type: "TA",
        key_stage: detectKeyStage(yg, assessment["Stage"]?.toString()),
        attainment_level: normaliseAttainment(assessment["Result"]?.toString()),
        scaled_score: assessment["ScaledScore"]
          ? parseInt(String(assessment["ScaledScore"]))
          : null,
        raw_score: assessment["RawScore"]
          ? parseInt(String(assessment["RawScore"]))
          : null,
        assessment_year: yr,
        assessment_period: period,
        source_subject_code: subjectCode,
      });
    }
  }

  return {
    source_school_urn,
    source_school_name,
    records,
    warnings,
    pupil_count: pupilCount,
  };
}

// ─── Assessment Manager XML Parser ───────────────────────────────────────────

/**
 * Parse Assessment Manager XML (vendor-specific format).
 *
 * Root element: <AssessmentExport> | <ExportData> | <SchoolReport> | <AssessmentData>
 *
 * Structure:
 *   <School><URN>148201</URN><Name>Grove House Primary</Name></School>
 *   <Pupils>
 *     <Pupil>
 *       <UPN>A802200106001</UPN>
 *       <YearGroup>4</YearGroup>
 *       <Assessments>
 *         <Assessment>
 *           <Subject>Reading</Subject>
 *           <Period>Autumn 2025</Period>
 *           <Level>EXS</Level>
 *           <ScaledScore>105</ScaledScore>
 *         </Assessment>
 *       </Assessments>
 *     </Pupil>
 *   </Pupils>
 */
function parseAssessmentManager(
  doc: Record<string, unknown>,
  organizationId: string,
): Omit<ParseResult, "format"> {
  const warnings: string[] = [];
  const records: ParsedAssessmentRecord[] = [];

  // Find root — could be several element names depending on the vendor
  const root = (doc["AssessmentExport"] ??
    doc["ExportData"] ??
    doc["SchoolReport"] ??
    doc["AssessmentData"] ??
    Object.values(doc)[0]) as Record<string, unknown> | undefined;

  if (!root) {
    return {
      source_school_urn: null,
      source_school_name: null,
      records: [],
      warnings: ["Empty or unrecognised XML root"],
      pupil_count: 0,
    };
  }

  const school = root["School"] as Record<string, unknown> | undefined;
  const source_school_urn = school?.["URN"]?.toString() ?? null;
  const source_school_name = school?.["Name"]?.toString() ?? null;

  const pupilsWrapper = (root["Pupils"] ?? root["Students"]) as
    | Record<string, unknown>
    | undefined;
  const rawPupils =
    pupilsWrapper?.["Pupil"] ?? pupilsWrapper?.["Student"] ?? null;
  const pupils = Array.isArray(rawPupils)
    ? rawPupils
    : rawPupils
      ? [rawPupils]
      : [];

  let pupilCount = 0;

  for (const pupil of pupils as Record<string, unknown>[]) {
    const upn = (
      pupil["UPN"] ??
      pupil["Upn"] ??
      pupil["StudentId"] ??
      pupil["student_id"]
    )
      ?.toString()
      ?.trim();

    if (!upn) {
      warnings.push("Skipped pupil with missing UPN/StudentId");
      continue;
    }
    pupilCount++;
    const pupil_hash = hashUPN(upn, organizationId);
    const yearGroup = pupil["YearGroup"]
      ? parseInt(String(pupil["YearGroup"]))
      : null;

    const assessmentsWrapper = (pupil["Assessments"] ??
      pupil["Results"]) as Record<string, unknown> | undefined;
    const rawAssessments =
      assessmentsWrapper?.["Assessment"] ?? assessmentsWrapper?.["Result"];
    const assessments = Array.isArray(rawAssessments)
      ? rawAssessments
      : rawAssessments
        ? [rawAssessments]
        : [];

    for (const assessment of assessments as Record<string, unknown>[]) {
      const subjectRaw = (
        assessment["Subject"] ??
        assessment["SubjectCode"] ??
        ""
      )
        .toString()
        .trim();
      const periodRaw = (
        assessment["Period"] ??
        assessment["Term"] ??
        ""
      ).toString();
      const levelRaw =
        assessment["Level"] ??
        assessment["Result"] ??
        assessment["Attainment"] ??
        null;
      const ss = assessment["ScaledScore"]
        ? parseInt(String(assessment["ScaledScore"]))
        : null;
      const rs = assessment["RawScore"]
        ? parseInt(String(assessment["RawScore"]))
        : null;

      // Extract year from period string like "Autumn 2025" or from Year field
      let assessmentYear: number | null = null;
      const yearMatch = periodRaw.match(/20\d\d/);
      if (yearMatch) {
        assessmentYear = parseInt(yearMatch[0]);
      } else if (assessment["Year"]) {
        assessmentYear = parseInt(String(assessment["Year"]));
      }

      const yg = assessment["YearGroup"]
        ? parseInt(String(assessment["YearGroup"]))
        : yearGroup;

      records.push({
        upn,
        pupil_hash,
        year_group: yg,
        subject: normaliseSubject(subjectRaw),
        assessment_type: "TA",
        key_stage: detectKeyStage(yg, assessment["KeyStage"]?.toString()),
        attainment_level: normaliseAttainment(levelRaw?.toString()),
        scaled_score: ss,
        raw_score: rs,
        assessment_year: assessmentYear,
        assessment_period: normalisePeriod(periodRaw),
        source_subject_code: subjectRaw,
      });
    }
  }

  return {
    source_school_urn,
    source_school_name,
    records,
    warnings,
    pupil_count: pupilCount,
  };
}

// ─── Main Parse Function ──────────────────────────────────────────────────────

/**
 * Parse an assessment XML buffer (CTF or Assessment Manager format).
 * Auto-detects format from root element tag.
 *
 * @param xmlBuffer - Raw XML file content
 * @param organizationId - Used as HMAC salt for server-side pseudonymisation
 */
export function parseAssessmentXML(
  xmlBuffer: Buffer,
  organizationId: string,
): ParseResult {
  const xmlString = xmlBuffer.toString("utf-8");

  const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
    // Force array for elements that should always be arrays
    isArray: (_name, jpath) => {
      const arrayPaths = [
        // CTF v20+ (Arbor) format
        "CTFpupilData.Pupil",
        "StageAssessments.KeyStage",
        "KeyStage.StageAssessment",
        // Legacy CTF format
        "Pupils.Pupil",
        "Pupil.KS1.Results.Result",
        "Pupil.KS2.Results.Result",
        "Pupil.KS3.Results.Result",
        "Pupil.EYFS.Areas.Area",
        "Pupil.Assessments.Assessment",
        // Assessment Manager format
        "Students.Student",
        "Student.Assessments.Assessment",
      ];
      const jpathStr = typeof jpath === "string" ? jpath : "";
      return arrayPaths.some((p) => jpathStr.endsWith(p));
    },
  });

  const doc = parser.parse(xmlString) as Record<string, unknown>;
  // Skip XML declaration (fast-xml-parser may include "?xml" as a key)
  const rootKey =
    Object.keys(doc).find((k) => !k.startsWith("?")) ?? "";

  if (rootKey === "CTfile") {
    const result = parseCTF(doc, organizationId);
    return { format: "ctf", ...result };
  }

  const amRoots = [
    "AssessmentExport",
    "ExportData",
    "SchoolReport",
    "AssessmentData",
  ];
  if (amRoots.includes(rootKey)) {
    const result = parseAssessmentManager(doc, organizationId);
    return { format: "assessment_manager", ...result };
  }

  // Unknown format — try Assessment Manager as fallback
  const fallback = parseAssessmentManager(doc, organizationId);
  return {
    format: "unknown",
    ...fallback,
    warnings: [
      ...fallback.warnings,
      `Unrecognised XML root element: "${rootKey}". Attempted Assessment Manager parse.`,
    ],
  };
}
