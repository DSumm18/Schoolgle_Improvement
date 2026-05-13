import type { AssessmentBlend, AssessmentBlueprint, AssessmentMode, AssessmentSubject, AssessmentTerm, AssessmentYearGroup, CurriculumObjective, CurriculumSchemeRef } from "./types";

export const DEFAULT_BLEND: AssessmentBlend = {
  taughtCurriculum: 60,
  nationalExpectation: 25,
  retention: 10,
  statutoryReadiness: 5,
};

interface BuildBlueprintInput {
  organizationId: string;
  schoolId: string;
  classId: string;
  subject: AssessmentSubject;
  yearGroup: AssessmentYearGroup;
  term: AssessmentTerm;
  mode: AssessmentMode;
  curriculumScheme?: CurriculumSchemeRef;
  taughtObjectives: Array<{ id: string; label: string; strand: string; yearGroup: string }>;
  blend?: AssessmentBlend;
}

export function normaliseBlend(blend: AssessmentBlend): AssessmentBlend {
  const total = blend.taughtCurriculum + blend.nationalExpectation + blend.retention + blend.statutoryReadiness;
  if (total <= 0) return DEFAULT_BLEND;

  return {
    taughtCurriculum: Math.round((blend.taughtCurriculum / total) * 100),
    nationalExpectation: Math.round((blend.nationalExpectation / total) * 100),
    retention: Math.round((blend.retention / total) * 100),
    statutoryReadiness: Math.round((blend.statutoryReadiness / total) * 100),
  };
}

export function buildAssessmentBlueprint(input: BuildBlueprintInput): AssessmentBlueprint {
  const blend = normaliseBlend(input.blend ?? DEFAULT_BLEND);
  const curriculumScheme = input.curriculumScheme ?? {
    id: "school-curriculum-map",
    name: "School curriculum map",
    provider: "School uploaded",
    source: "school_uploaded",
    status: "active",
    coverageNote: "Objectives supplied by the school and mapped to public national curriculum expectations.",
  } satisfies CurriculumSchemeRef;
  const objectives: CurriculumObjective[] = [
    ...input.taughtObjectives.map((objective) => ({
      ...objective,
      source: "school_curriculum" as const,
    })),
    {
      id: `${input.subject}-${input.yearGroup}-national-core`,
      label: `Core ${input.subject} expectations for ${input.yearGroup}`,
      strand: "National expectations",
      source: "national_curriculum",
      yearGroup: input.yearGroup,
    },
    {
      id: `${input.subject}-${input.yearGroup}-retention`,
      label: `Prior learning retrieval for ${input.yearGroup}`,
      strand: "Retention",
      source: "prior_learning",
      yearGroup: input.yearGroup,
    },
  ];

  const isStatutory = input.mode === "statutory_readiness";
  if (isStatutory) {
    objectives.push({
      id: `${input.subject}-${input.yearGroup}-statutory`,
      label: `Statutory-style ${input.subject} readiness`,
      strand: "Statutory readiness",
      source: "statutory_readiness",
      yearGroup: input.yearGroup,
    });
  }

  return {
    id: crypto.randomUUID(),
    organizationId: input.organizationId,
    schoolId: input.schoolId,
    classId: input.classId,
    subject: input.subject,
    yearGroup: input.yearGroup,
    term: input.term,
    mode: input.mode,
    curriculumScheme,
    status: "blueprint_review",
    durationMinutes: input.mode === "quick_check" ? 10 : input.mode === "retention_check" ? 15 : 35,
    blend,
    objectives,
    pressureRating: isStatutory ? 4 : input.mode === "unit_check" ? 3 : 2,
    workloadRating: input.mode === "quick_check" ? 1 : input.mode === "retention_check" ? 2 : 3,
    warnings: isStatutory ? ["Statutory readiness is high-pressure; use sparingly."] : [],
    createdAt: new Date().toISOString(),
    approvedAt: null,
  };
}
