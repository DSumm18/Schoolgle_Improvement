import type { CurriculumSchemeRef } from "./types";

const ACCEPTED_CURRICULUM_EXTENSIONS = new Map([
  ["csv", "CSV"],
  ["xlsx", "XLSX"],
  ["xls", "XLS"],
  ["pdf", "PDF"],
  ["docx", "DOCX"],
  ["json", "JSON"],
]);

export interface CurriculumUploadSummary {
  fileCount: number;
  acceptedTypes: string[];
  nextStep: string;
}

export function createOakCurriculumSource(): CurriculumSchemeRef {
  return {
    id: "oak-public-curriculum-sample",
    name: "Oak public curriculum sample",
    provider: "Public/open curriculum source",
    source: "public_framework",
    status: "needs_mapping",
    coverageNote:
      "Upload the downloaded Oak files here for prototype mapping. Schoolgle converts them into a neutral school curriculum sequence before any assessment is generated.",
  };
}

export function buildCurriculumUploadSummary(fileNames: string[]): CurriculumUploadSummary {
  const acceptedTypes = Array.from(
    new Set(
      fileNames
        .map((fileName) => fileName.split(".").pop()?.toLowerCase() ?? "")
        .map((extension) => ACCEPTED_CURRICULUM_EXTENSIONS.get(extension))
        .filter((extension): extension is string => Boolean(extension)),
    ),
  );

  return {
    fileCount: fileNames.length,
    acceptedTypes,
    nextStep: "Map uploaded content into a neutral school curriculum sequence before generating papers.",
  };
}
