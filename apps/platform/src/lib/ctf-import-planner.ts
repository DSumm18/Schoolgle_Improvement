import { createHash } from "crypto";
import type { ParsedAssessmentRecord, ParseResult } from "@/lib/ctf-xml-parser";

export type CtfAssessmentType =
  | "foundation"
  | "phonics"
  | "ks1"
  | "ks2"
  | "assessment_manager"
  | "unknown";

export interface CtfImportPlanInput {
  fileName: string;
  parsed: ParseResult;
}

export interface CtfImportPlanFile {
  fileName: string;
  assessmentType: CtfAssessmentType;
  years: number[];
  pupilCount: number;
  recordCount: number;
  warnings: string[];
  duplicateOf: string | null;
  shouldImport: boolean;
  contentSignature: string;
}

export interface CtfImportPlan {
  files: CtfImportPlanFile[];
  summary: {
    totalFiles: number;
    importableFiles: number;
    duplicateFiles: number;
    emptyFiles: number;
  };
}

const EYFS_SUBJECTS = new Set([
  "communication_and_language",
  "physical_development",
  "personal_social_emotional",
  "literacy",
  "maths",
  "understanding_the_world",
  "expressive_arts_and_design",
  "com",
  "phy",
  "pse",
  "lit",
  "mat",
  "utw",
  "ead",
  "exp",
]);

function normaliseFileName(fileName: string): string {
  return fileName.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

export function inferCtfAssessmentType(
  fileName: string,
  parsed: ParseResult,
): CtfAssessmentType {
  if (parsed.format === "assessment_manager") return "assessment_manager";

  const name = normaliseFileName(fileName);
  if (/(^|_)fsp(_|$)|foundation|eyfs/.test(name)) return "foundation";
  if (/(^|_)pho(_|$)|phonics/.test(name)) return "phonics";
  if (/(^|_)ks1(_|$)/.test(name)) return "ks1";
  if (/(^|_)ks2(_|$)/.test(name)) return "ks2";

  const records = parsed.records;
  if (
    records.some(
      (record) =>
        record.subject === "phonics" ||
        record.source_subject_code.toUpperCase().includes("PHO"),
    )
  ) {
    return "phonics";
  }

  if (
    records.some(
      (record) =>
        record.key_stage === "EYFS" ||
        EYFS_SUBJECTS.has(record.subject) ||
        ["COM", "PHY", "PSE", "LIT", "MAT", "UTW", "EAD", "EXP"].some(
          (code) => record.source_subject_code.toUpperCase().includes(code),
        ),
    )
  ) {
    return "foundation";
  }

  if (records.some((record) => record.key_stage === "KS2")) return "ks2";
  if (records.some((record) => record.key_stage === "KS1")) return "ks1";

  return "unknown";
}

function recordSignature(record: ParsedAssessmentRecord): string {
  return [
    record.pupil_hash,
    record.assessment_year ?? "",
    record.key_stage ?? "",
    record.subject,
    record.source_subject_code,
    record.assessment_type,
    record.attainment_level ?? "",
    record.scaled_score ?? "",
    record.raw_score ?? "",
    record.assessment_period ?? "",
  ].join("|");
}

function contentSignature(parsed: ParseResult): string {
  const source = parsed.records
    .map(recordSignature)
    .sort()
    .join("\n");

  return createHash("sha256").update(source).digest("hex");
}

function assessmentYears(records: ParsedAssessmentRecord[]): number[] {
  return Array.from(
    new Set(
      records
        .map((record) => record.assessment_year)
        .filter((year): year is number => typeof year === "number"),
    ),
  ).sort((left, right) => left - right);
}

export function buildCtfImportPlan(inputs: CtfImportPlanInput[]): CtfImportPlan {
  const seen = new Map<string, string>();

  const files = inputs.map(({ fileName, parsed }) => {
    const signature = contentSignature(parsed);
    const duplicateOf = signature ? seen.get(signature) ?? null : null;
    const recordCount = parsed.records.length;

    if (!duplicateOf && signature) {
      seen.set(signature, fileName);
    }

    return {
      fileName,
      assessmentType: inferCtfAssessmentType(fileName, parsed),
      years: assessmentYears(parsed.records),
      pupilCount: parsed.pupil_count,
      recordCount,
      warnings: parsed.warnings,
      duplicateOf,
      shouldImport: recordCount > 0 && duplicateOf === null,
      contentSignature: signature,
    };
  });

  return {
    files,
    summary: {
      totalFiles: files.length,
      importableFiles: files.filter((file) => file.shouldImport).length,
      duplicateFiles: files.filter((file) => file.duplicateOf !== null).length,
      emptyFiles: files.filter((file) => file.recordCount === 0).length,
    },
  };
}
