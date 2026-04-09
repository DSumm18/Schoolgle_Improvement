import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  listGoogleFilesRecursive,
  listOneDriveFilesRecursive,
} from "@/lib/cloud-service";
import type { FileMetadataExtended } from "@/lib/cloud-service";

// --- Expected documents checklist by evaluation area ---

type EvaluationArea =
  | "SAFEGUARDING"
  | "INCLUSION"
  | "CURRICULUM_TEACHING"
  | "ACHIEVEMENT"
  | "ATTENDANCE_BEHAVIOUR"
  | "PERSONAL_DEVELOPMENT"
  | "LEADERSHIP";

const EXPECTED_DOCUMENTS: Record<
  EvaluationArea,
  { name: string; priority: "critical" | "important" | "recommended" }[]
> = {
  SAFEGUARDING: [
    { name: "Safeguarding Policy", priority: "critical" },
    { name: "Single Central Record", priority: "critical" },
    { name: "DSL Training", priority: "critical" },
    { name: "Online Safety Policy", priority: "important" },
    { name: "Whistleblowing Policy", priority: "important" },
    { name: "Safer Recruitment", priority: "critical" },
  ],
  INCLUSION: [
    { name: "SEND Policy", priority: "critical" },
    { name: "SEND Register", priority: "critical" },
    { name: "Pupil Premium Strategy", priority: "important" },
    { name: "Provision Map", priority: "important" },
    { name: "Accessibility Plan", priority: "important" },
  ],
  CURRICULUM_TEACHING: [
    { name: "Curriculum Overview", priority: "critical" },
    { name: "Subject Policies", priority: "important" },
    { name: "Progression Maps", priority: "important" },
    { name: "Phonics Programme", priority: "important" },
    { name: "CPD Records", priority: "recommended" },
    { name: "Monitoring Schedule", priority: "recommended" },
  ],
  ACHIEVEMENT: [
    { name: "Assessment Data", priority: "critical" },
    { name: "KS2 Results", priority: "important" },
    { name: "Phonics Results", priority: "important" },
    { name: "EYFS Outcomes", priority: "important" },
    { name: "Progress Tracking", priority: "important" },
  ],
  ATTENDANCE_BEHAVIOUR: [
    { name: "Attendance Data", priority: "critical" },
    { name: "Attendance Policy", priority: "critical" },
    { name: "Behaviour Policy", priority: "critical" },
    { name: "Exclusion Data", priority: "important" },
  ],
  PERSONAL_DEVELOPMENT: [
    { name: "PSHE Curriculum", priority: "important" },
    { name: "RSE Policy", priority: "critical" },
    { name: "British Values", priority: "important" },
    { name: "Enrichment Programme", priority: "recommended" },
  ],
  LEADERSHIP: [
    { name: "SEF", priority: "critical" },
    { name: "School Improvement Plan", priority: "critical" },
    { name: "Governor Minutes", priority: "important" },
    { name: "Governor Training", priority: "recommended" },
    { name: "Staff Wellbeing", priority: "recommended" },
  ],
};

const AREA_LABELS: Record<EvaluationArea, string> = {
  SAFEGUARDING: "Safeguarding",
  INCLUSION: "Inclusion & SEND",
  CURRICULUM_TEACHING: "Curriculum & Teaching",
  ACHIEVEMENT: "Achievement & Assessment",
  ATTENDANCE_BEHAVIOUR: "Attendance & Behaviour",
  PERSONAL_DEVELOPMENT: "Personal Development",
  LEADERSHIP: "Leadership & Management",
};

// --- Fuzzy matching ---

/**
 * Normalise a string for fuzzy comparison: lowercase, strip common
 * file-extension suffixes, replace separators with spaces, and collapse
 * whitespace.
 */
function normalise(input: string): string {
  return input
    .toLowerCase()
    .replace(/\.(pdf|docx?|xlsx?|pptx?|csv|txt|odt|ods|gdoc|gsheet)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check whether a filename is a fuzzy match for an expected document name.
 * Returns true when every word in the expected name appears somewhere in the
 * normalised filename (order-independent).
 */
function fuzzyMatch(filename: string, expectedName: string): boolean {
  const normFile = normalise(filename);
  const expectedWords = normalise(expectedName).split(" ");

  return expectedWords.every((word) => normFile.includes(word));
}

// --- Route handler ---

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const { provider, access_token, folder_id } = body as {
    organization_id: string;
    provider: "google" | "onedrive";
    access_token: string;
    folder_id: string;
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  // Validate required fields
  if (!orgId || !provider || !access_token || !folder_id) {
    return apiError(
      "Missing required fields: organization_id, provider, access_token, folder_id",
      400,
    );
  }

  if (provider !== "google" && provider !== "onedrive") {
    return apiError('Invalid provider. Must be "google" or "onedrive".', 400);
  }

  // 1. List all files recursively
  let files: FileMetadataExtended[];

  if (provider === "google") {
    files = await listGoogleFilesRecursive(access_token, folder_id);
  } else {
    files = await listOneDriveFilesRecursive(access_token, folder_id);
  }

  // 2. Match files against expected documents
  const documentsFound: {
    name: string;
    path: string;
    area: string;
    matched_to: string;
  }[] = [];
  const documentsMissing: {
    expected_name: string;
    area: string;
    priority: string;
  }[] = [];
  const coverageByArea: Record<
    string,
    { found: number; expected: number; percentage: number }
  > = {};

  const areas = Object.keys(EXPECTED_DOCUMENTS) as EvaluationArea[];

  for (const area of areas) {
    const expectedDocs = EXPECTED_DOCUMENTS[area];
    let foundCount = 0;

    for (const expectedDoc of expectedDocs) {
      // Find the first file that fuzzy-matches this expected document
      const matchedFile = files.find((file) =>
        fuzzyMatch(file.name, expectedDoc.name),
      );

      if (matchedFile) {
        foundCount++;
        documentsFound.push({
          name: matchedFile.name,
          path: matchedFile.folderPath
            ? `${matchedFile.folderPath} > ${matchedFile.name}`
            : matchedFile.name,
          area: AREA_LABELS[area],
          matched_to: expectedDoc.name,
        });
      } else {
        documentsMissing.push({
          expected_name: expectedDoc.name,
          area: AREA_LABELS[area],
          priority: expectedDoc.priority,
        });
      }
    }

    const percentage =
      expectedDocs.length > 0
        ? Math.round((foundCount / expectedDocs.length) * 100)
        : 0;

    coverageByArea[AREA_LABELS[area]] = {
      found: foundCount,
      expected: expectedDocs.length,
      percentage,
    };
  }

  // 3. Calculate overall coverage
  const totalExpected = areas.reduce(
    (sum, area) => sum + EXPECTED_DOCUMENTS[area].length,
    0,
  );
  const totalFound = documentsFound.length;
  const overallCoverage =
    totalExpected > 0 ? Math.round((totalFound / totalExpected) * 100) : 0;

  return apiSuccess({
    documents_found: documentsFound,
    documents_missing: documentsMissing,
    coverage_by_area: coverageByArea,
    overall_coverage: overallCoverage,
    total_files_scanned: files.length,
  });
});
