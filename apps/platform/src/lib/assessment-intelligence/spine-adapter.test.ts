import { describe, expect, it } from "vitest";
import {
  buildAssessmentJourneyLayers,
  mapAssessmentCreatorProposalsToAssessmentSpine,
  mapCtfRecordsToAssessmentSpine,
  normaliseAssessmentEvidenceSources,
} from "./spine-adapter";

describe("normaliseAssessmentEvidenceSources", () => {
  it("keeps DfE, school captures and pupil-level evidence as separate source layers", () => {
    const sources = normaliseAssessmentEvidenceSources({
      dfe: {
        schoolCount: 7,
        latestAcademicYear: 2025,
        sourceLabel: "DfE validated KS2 and census",
      },
      schoolCaptures: [
        {
          id: "capture-1",
          label: "Spring prediction capture",
          assessmentPeriod: "Spring",
          academicYearStart: 2025,
          schoolCount: 7,
          cellCount: 126,
        },
      ],
      pupilLevel: [
        {
          batchId: "batch-1",
          sourceKind: "ctf_import",
          sourceLabel: "Source: CTF import, summer 2025/26, imported external",
          pupilCount: 182,
          eventCount: 912,
          isDemo: true,
        },
      ],
    });

    expect(sources.map((source) => source.layer)).toEqual([
      "dfe_rear_view",
      "school_capture",
      "pupil_level",
    ]);
    expect(sources[0]).toMatchObject({ status: "connected", sourceType: "dfe_public_data" });
    expect(sources[1]).toMatchObject({ status: "connected", sourceType: "school_assessment_capture" });
    expect(sources[2]).toMatchObject({
      status: "connected",
      sourceType: "ctf_pupil_layer",
      isDemo: true,
    });
  });
});

describe("buildAssessmentJourneyLayers", () => {
  it("returns the four customer-facing setup cards in the intended order", () => {
    const layers = buildAssessmentJourneyLayers({
      dfeConnected: true,
      captureCount: 3,
      pupilEventCount: 912,
      ofstedFindingCount: 4,
      demoMode: true,
    });

    expect(layers.map((layer) => layer.id)).toEqual([
      "dfe_rear_view",
      "school_captures",
      "pupil_level",
      "ofsted_bridge",
    ]);
    expect(layers[2].badge).toBe("912 events · demo");
    expect(layers[3].description).toContain("findings, tasks, evidence and timeline");
  });
});

describe("mapCtfRecordsToAssessmentSpine", () => {
  it("maps parsed CTF records into source-labelled batch and event inserts", () => {
    const result = mapCtfRecordsToAssessmentSpine({
      organizationId: "org-1",
      importId: "import-1",
      fileName: "rochdale-demo.xml",
      parsed: {
        format: "ctf",
        source_school_urn: "149001",
        source_school_name: "Rochdale Demo Primary School",
        pupil_count: 1,
        warnings: [],
        records: [
          {
            upn: "Z900000000001",
            pupil_hash: "hash-1",
            year_group: 6,
            subject: "reading",
            assessment_type: "TA",
            key_stage: "KS2",
            attainment_level: "EXS",
            scaled_score: null,
            raw_score: null,
            assessment_year: 2025,
            assessment_period: "summer",
            source_subject_code: "ENG/REA",
          },
        ],
      },
      isDemo: true,
      demoFixtureId: "rochdale-demo-primary",
    });

    expect(result.batchInsert).toMatchObject({
      organization_id: "org-1",
      source_kind: "ctf_import",
      source_table: "school_assessment_imports",
      source_id: "import-1",
      file_name: "rochdale-demo.xml",
      school_urn: 149001,
      assessment_period: "summer",
      academic_year_start: 2025,
      validation_tier: "imported_external",
      is_demo: true,
      demo_fixture_id: "rochdale-demo-primary",
      source_layer: "pupil_level",
    });
    expect(result.eventInserts[0]).toMatchObject({
      source_kind: "ctf_import",
      source_label: "Source: CTF import, summer 2025/26, imported external",
      validation_tier: "imported_external",
      pupil_hash: "hash-1",
      subject: "reading",
      canonical_level: "expected",
      is_at_expected: true,
    });
    expect(JSON.stringify(result)).not.toContain("Z900000000001");
  });

  it("merges duplicate CTF component records conservatively for the event spine", () => {
    const result = mapCtfRecordsToAssessmentSpine({
      organizationId: "org-1",
      importId: "import-1",
      fileName: "ctf-with-components.xml",
      parsed: {
        format: "ctf",
        source_school_urn: "149001",
        source_school_name: "Rochdale Demo Primary School",
        pupil_count: 1,
        warnings: [],
        records: [
          {
            upn: "Z900000000001",
            pupil_hash: "hash-1",
            year_group: 6,
            subject: "maths",
            assessment_type: "TA",
            key_stage: "KS2",
            attainment_level: "GDS",
            scaled_score: null,
            raw_score: null,
            assessment_year: 2025,
            assessment_period: "summer",
            source_subject_code: "MAT/NUM",
          },
          {
            upn: "Z900000000001",
            pupil_hash: "hash-1",
            year_group: 6,
            subject: "maths",
            assessment_type: "TA",
            key_stage: "KS2",
            attainment_level: "WTS",
            scaled_score: null,
            raw_score: null,
            assessment_year: 2025,
            assessment_period: "summer",
            source_subject_code: "MAT/NP",
          },
        ],
      },
      isDemo: true,
      demoFixtureId: "rochdale-demo-primary",
    });

    expect(result.eventInserts).toHaveLength(1);
    expect(result.eventInserts[0]).toMatchObject({
      subject: "maths",
      raw_level: "WTS",
      canonical_level: "working_towards",
      is_at_expected: false,
    });
    expect(result.eventInserts[0].raw_snapshot).toMatchObject({
      duplicate_source_event_count: 2,
      dedupe_rule:
        "Conservative CTF component merge for one event per pupil/subject/period/year.",
    });
  });
});

describe("mapAssessmentCreatorProposalsToAssessmentSpine", () => {
  it("turns teacher-reviewed AI proposals into one pupil-level event per pupil", () => {
    const result = mapAssessmentCreatorProposalsToAssessmentSpine({
      organizationId: "org-1",
      assessmentId: "assessment-1",
      schoolUrn: 149001,
      classId: "y6-oak",
      className: "Year 6 Oak",
      subject: "maths",
      yearGroup: "Year 6",
      assessmentPeriod: "Spring",
      academicYearStart: 2025,
      assessmentDate: "2026-02-12",
      lockedBy: "teacher-1",
      proposals: [
        {
          pupilHash: "pupil-1",
          proposedMarks: 2,
          teacherMarks: null,
          maxMarks: 2,
          teacherDecision: "accepted",
          confidence: 0.91,
        },
        {
          pupilHash: "pupil-1",
          proposedMarks: 1,
          teacherMarks: 2,
          maxMarks: 2,
          teacherDecision: "edited",
          confidence: 0.68,
        },
      ],
    });

    expect(result.batchInsert).toMatchObject({
      source_kind: "assessment_creator",
      validation_tier: "teacher_reviewed_ai",
      source_layer: "pupil_level",
      source_id: "assessment-1",
    });
    expect(result.eventInserts).toHaveLength(1);
    expect(result.eventInserts[0]).toMatchObject({
      pupil_hash: "pupil-1",
      raw_score: 4,
      max_score: 4,
      raw_level: "GDS",
      canonical_level: "greater_depth",
      is_greater_depth: true,
      uncertainty_flag: true,
      teacher_decision: "reviewed",
    });
  });
});
