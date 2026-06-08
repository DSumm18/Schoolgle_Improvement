import { describe, expect, it } from "vitest";
import { buildAssessmentSnapshotFindingDrafts } from "./assessment-signals";

describe("buildAssessmentSnapshotFindingDrafts", () => {
  it("turns a low pupil-level assessment snapshot into a source-labelled Ofsted finding", () => {
    const findings = buildAssessmentSnapshotFindingDrafts({
      organizationId: "org-1",
      snapshots: [
        {
          batchId: "batch-1",
          sourceKind: "ctf_import",
          sourceLabel: "Source: CTF import, summer 2025/26, imported external",
          assessmentPeriod: "summer",
          academicYearStart: 2025,
          subject: "reading",
          eventCount: 31,
          atExpectedPct: 52,
          needsModerationCount: 0,
          isDemo: true,
        },
      ],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      source_key: "assessment_signal:org-1:batch-1:attainment",
      source_type: "ctf_pupil_layer",
      category_id: "achievement",
      finding_type: "quality_gap",
      severity: "medium",
      action_level: "recommended_action",
      status: "identified",
      metadata: {
        isDemo: true,
        sourceKind: "ctf_import",
        sourceLayer: "pupil_level",
      },
    });
    expect(findings[0].summary).toContain("52% at expected+");
    expect(findings[0].summary).toContain("not DfE validated public outcomes");
  });

  it("turns teacher-reviewed AI moderation flags into an Assessment Creator finding", () => {
    const findings = buildAssessmentSnapshotFindingDrafts({
      organizationId: "org-1",
      snapshots: [
        {
          batchId: "batch-2",
          sourceKind: "assessment_creator",
          sourceLabel: "Source: Assessment Creator evidence, Spring 2025/26, teacher-reviewed AI",
          assessmentPeriod: "Spring",
          academicYearStart: 2025,
          subject: "writing",
          eventCount: 28,
          atExpectedPct: 74,
          needsModerationCount: 5,
          isDemo: false,
        },
      ],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      source_key: "assessment_signal:org-1:batch-2:moderation",
      source_type: "assessment_creator",
      category_id: "curriculum-teaching",
      finding_type: "quality_gap",
      severity: "medium",
    });
    expect(findings[0].recommended_task_title).toContain("Review Assessment Creator moderation flags");
  });
});
