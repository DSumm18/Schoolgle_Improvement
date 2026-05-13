import { describe, expect, it } from "vitest";
import { buildUnifiedPupilEvidenceTimeline } from "./evidence-timeline";

const demographics = {
  isFsm: true,
  isSend: true,
  isEal: false,
  gender: "F",
  source: "test profile",
};

describe("buildUnifiedPupilEvidenceTimeline", () => {
  it("joins CTF rows and teacher-locked snapshots with source labels", () => {
    const timeline = buildUnifiedPupilEvidenceTimeline({
      ctfRecords: [
        {
          pupil_hash: "hash-a",
          year_group: 2,
          subject: "writing",
          attainment_level: "EXS",
          scaled_score: null,
          academic_year_start: 2021,
          assessment_period: "KS1 statutory assessment",
        },
      ],
      teacherEvents: [
        {
          pupil_hash: "hash-a",
          source_kind: "manual_snapshot",
          source_label: "Source: manual teacher judgement, Autumn 1 2025/26, teacher locked",
          validation_tier: "teacher_locked",
          class_name: "Year 6",
          year_group_at_assessment: "Y6",
          current_year_group: "Y6",
          academic_year_start: 2025,
          assessment_period: "Autumn 1",
          assessment_date: "2025-10-10",
          subject: "writing",
          raw_level: "WTS",
          canonical_level: "working_towards",
          is_at_expected: false,
          is_greater_depth: false,
          scaled_score: null,
          teacher_comment: "Recent independent writing does not yet show consistent sentence control.",
          uncertainty_flag: true,
          moderation_status: "needs_moderation",
          evidence_confidence: "medium",
        },
      ],
      getDemographics: () => demographics,
      pseudonymFromHash: () => "Blue Robin 12",
    });

    expect(timeline.source).toContain("pupil_assessments_pseudo");
    expect(timeline.sourceCounts.ctf_import).toBe(1);
    expect(timeline.sourceCounts.manual_snapshot).toBe(1);
    expect(timeline.pupilsAnalysed).toBe(1);
    expect(timeline.priorityPupils[0].supportSignals[0]).toContain("Writing dropped from EXS");
    expect(timeline.priorityPupils[0].supportSignals.join(" ")).toContain("flagged for moderation");
    expect(timeline.aggregateSeries).toHaveLength(2);
    expect(timeline.aggregateSeries[0].sourceLabel).toContain("CTF/pseudonymised pupil assessment import");
  });

  it("does not convert DfE public data into fake pupil records", () => {
    const timeline = buildUnifiedPupilEvidenceTimeline({
      ctfRecords: [],
      teacherEvents: [],
      getDemographics: () => demographics,
      pseudonymFromHash: () => "No Pupil",
    });

    expect(timeline.pupilsAnalysed).toBe(0);
    expect(timeline.caveat).toContain("DfE public outcomes remain cohort-level context");
  });
});
