import { describe, expect, it } from "vitest";
import { buildManualSnapshotInsertPayload } from "./manual-snapshot";

describe("buildManualSnapshotInsertPayload", () => {
  it("validates and turns a teacher snapshot request into source batch and event inserts", () => {
    const result = buildManualSnapshotInsertPayload(
      {
        organizationId: "org-1",
        schoolUrn: 148201,
        schoolName: "Grove House Primary School",
        classId: "y6-a",
        className: "Year 6 A",
        subject: "writing",
        assessmentPeriod: "Autumn 1",
        academicYearStart: 2025,
        assessmentDate: "2025-10-20",
        rows: [
          {
            pupilHash: "hash-1",
            yearGroupAtAssessment: "Year 6",
            rawLevel: "EXS",
            teacherComment: "Secure sentence control; needs more evidence of independent cohesion.",
            uncertaintyFlag: true,
          },
        ],
      },
      {
        authOrganizationId: "org-1",
        lockedBy: "teacher-1",
      },
    );

    expect(result.batchInsert).toMatchObject({
      organization_id: "org-1",
      school_urn: 148201,
      source_kind: "manual_snapshot",
      source_label: "Source: manual teacher judgement, Autumn 1 2025/26, teacher locked",
      validation_tier: "teacher_locked",
      assessment_period: "Autumn 1",
      academic_year_start: 2025,
    });
    expect(result.batchInsert.raw_snapshot).toMatchObject({
      schoolName: "Grove House Primary School",
      classId: "y6-a",
      className: "Year 6 A",
      rowCount: 1,
    });
    expect(result.eventDrafts[0]).toMatchObject({
      organizationId: "org-1",
      schoolUrn: 148201,
      sourceKind: "manual_snapshot",
      sourceLabel: "Source: manual teacher judgement, Autumn 1 2025/26, teacher locked",
      canonicalLevel: "expected",
      evidenceConfidence: "low",
    });
  });

  it("rejects requests that would persist real pupil display labels server-side", () => {
    expect(() =>
      buildManualSnapshotInsertPayload(
        {
          organizationId: "org-1",
          schoolUrn: 148201,
          classId: "y6-a",
          className: "Year 6 A",
          subject: "maths",
          assessmentPeriod: "Autumn 1",
          academicYearStart: 2025,
          rows: [
            {
              pupilHash: "hash-1",
              pupilDisplayLabel: "Named Pupil",
              yearGroupAtAssessment: "Year 6",
              rawLevel: "EXS",
            },
          ],
        },
        {
          authOrganizationId: "org-1",
          lockedBy: "teacher-1",
        },
      ),
    ).toThrow("pupilDisplayLabel must not be sent to the server");
  });
});
