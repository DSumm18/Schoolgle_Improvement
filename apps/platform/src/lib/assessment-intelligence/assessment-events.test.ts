import { describe, expect, it } from "vitest";
import {
  buildAssessmentSourceLabel,
  buildManualSnapshotEvents,
  calculateCombinedRwm,
  normaliseAssessmentLevel,
} from "./assessment-events";

describe("normaliseAssessmentLevel", () => {
  it("normalises teacher and statutory levels into canonical expected and greater-depth flags", () => {
    expect(normaliseAssessmentLevel("WTS")).toMatchObject({
      canonicalLevel: "working_towards",
      isAtExpected: false,
      isGreaterDepth: false,
    });
    expect(normaliseAssessmentLevel("EXS")).toMatchObject({
      canonicalLevel: "expected",
      isAtExpected: true,
      isGreaterDepth: false,
    });
    expect(normaliseAssessmentLevel("GDS")).toMatchObject({
      canonicalLevel: "greater_depth",
      isAtExpected: true,
      isGreaterDepth: true,
    });
    expect(normaliseAssessmentLevel("borderline exs")).toMatchObject({
      canonicalLevel: "expected",
      isAtExpected: true,
    });
  });
});

describe("buildAssessmentSourceLabel", () => {
  it("creates explicit source labels for manual, Assessment Creator and DfE layers", () => {
    expect(
      buildAssessmentSourceLabel({
        sourceKind: "manual_snapshot",
        assessmentPeriod: "Spring 1",
        academicYearStart: 2025,
        validationTier: "teacher_locked",
      }),
    ).toBe("Source: manual teacher judgement, Spring 1 2025/26, teacher locked");

    expect(
      buildAssessmentSourceLabel({
        sourceKind: "assessment_creator",
        assessmentPeriod: "Autumn 2",
        academicYearStart: 2025,
        validationTier: "teacher_reviewed_ai",
      }),
    ).toBe("Source: Assessment Creator evidence, Autumn 2 2025/26, teacher-reviewed AI");

    expect(
      buildAssessmentSourceLabel({
        sourceKind: "dfe_validated",
        assessmentPeriod: "KS2",
        academicYearStart: 2024,
        validationTier: "dfe_validated",
      }),
    ).toBe("Source: DfE validated assessment data, KS2 2024/25");
  });
});

describe("calculateCombinedRwm", () => {
  it("uses same-pupil reading, writing and maths intersection rather than averaging subjects", () => {
    const result = calculateCombinedRwm([
      { pupilHash: "a", subject: "reading", isAtExpected: true },
      { pupilHash: "a", subject: "writing", isAtExpected: true },
      { pupilHash: "a", subject: "maths", isAtExpected: true },
      { pupilHash: "b", subject: "reading", isAtExpected: true },
      { pupilHash: "b", subject: "writing", isAtExpected: false },
      { pupilHash: "b", subject: "maths", isAtExpected: true },
      { pupilHash: "c", subject: "reading", isAtExpected: true },
      { pupilHash: "c", subject: "writing", isAtExpected: true },
    ]);

    expect(result).toEqual({
      denominator: 2,
      combinedCount: 1,
      combinedPct: 50,
      excludedIncompletePupils: 1,
    });
  });
});

describe("buildManualSnapshotEvents", () => {
  it("builds source-labelled pupil events with optional comments and uncertainty", () => {
    const result = buildManualSnapshotEvents({
      organizationId: "org-1",
      schoolUrn: 148201,
      sourceBatchId: "batch-1",
      classId: "class-y5",
      className: "Year 5 Oak",
      subject: "writing",
      assessmentPeriod: "Spring 1",
      academicYearStart: 2025,
      assessmentDate: "2026-01-20",
      lockedBy: "teacher-1",
      rows: [
        {
          pupilHash: "hash-1",
          yearGroupAtAssessment: "Year 5",
          rawLevel: "EXS",
          teacherComment: "Secure when scaffolded, but needs evidence of independent explanation.",
          uncertaintyFlag: true,
        },
        {
          pupilHash: "hash-2",
          yearGroupAtAssessment: "Year 5",
          rawLevel: "GDS",
        },
      ],
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      organizationId: "org-1",
      schoolUrn: 148201,
      sourceBatchId: "batch-1",
      sourceKind: "manual_snapshot",
      validationTier: "teacher_locked",
      subject: "writing",
      rawLevel: "EXS",
      canonicalLevel: "expected",
      isAtExpected: true,
      teacherComment: "Secure when scaffolded, but needs evidence of independent explanation.",
      uncertaintyFlag: true,
      sourceLabel: "Source: manual teacher judgement, Spring 1 2025/26, teacher locked",
    });
    expect(result[1]).toMatchObject({
      pupilHash: "hash-2",
      canonicalLevel: "greater_depth",
      isGreaterDepth: true,
      evidenceConfidence: "medium",
    });
  });

  it("does not carry client-side pupil display labels into the server event payload", () => {
    const result = buildManualSnapshotEvents({
      organizationId: "org-1",
      schoolUrn: 148201,
      sourceBatchId: "batch-1",
      classId: "class-y6",
      className: "Year 6",
      subject: "reading",
      assessmentPeriod: "Autumn 1",
      academicYearStart: 2025,
      assessmentDate: "2025-10-01",
      lockedBy: "teacher-1",
      rows: [
        {
          pupilHash: "hash-only",
          pupilDisplayLabel: "A real pupil name must stay browser-side",
          yearGroupAtAssessment: "Year 6",
          rawLevel: "WTS",
        },
      ],
    });

    expect(JSON.stringify(result[0])).not.toContain("A real pupil name");
    expect(result[0].pupilHash).toBe("hash-only");
  });
});
