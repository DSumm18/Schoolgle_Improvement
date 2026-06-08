import { describe, expect, it } from "vitest";
import { createHmac } from "crypto";
import { buildAssessmentClassSources } from "./class-pupil-source";

describe("buildAssessmentClassSources", () => {
  it("joins ls_classes with pupils imported through Settings Data Upload", () => {
    const result = buildAssessmentClassSources({
      organizationId: "org-1",
      schoolUrn: 148201,
      schoolName: "Grove House Primary School",
      classes: [
        {
          id: "class-1",
          class_name: "6A",
          year_group: "Year 6",
          academic_year: "2025-26",
          pupil_count: 0,
        },
      ],
      lessonStudioPupils: [],
      masterPupils: [
        {
          id: "pupil-db-1",
          pupil_id: "schoolgle-pupil-1",
          pupil_ref: "A802200106001",
          first_name: "Ada",
          last_name: "Lovelace",
          year_group: "6",
          current_class: "6A",
          class_name: "6A",
          is_pupil_premium: true,
          is_eal: false,
          fsm_eligible: true,
          send_status: "K",
          ehcp: false,
          primary_need: "SLCN",
        },
      ],
    });

    expect(result[0]).toMatchObject({
      id: "class-1",
      className: "6A",
      schoolUrn: 148201,
      pupils: [
        {
          displayLabel: "Ada Lovelace",
          pupilHash: expect.any(String),
          yearGroup: "Year 6",
          source: "pupils_master",
          fsmEligible: true,
          hasSendSupport: true,
          primaryNeed: "SLCN",
        },
      ],
    });
    expect(result[0].pupils[0].pupilHash).not.toContain("UPN001");
    expect(result[0].pupils[0].pupilHash).toBe(
      createHmac("sha256", "org-1").update("a802200106001").digest("hex"),
    );
    expect(JSON.stringify(result)).toContain("Ada Lovelace");
  });

  it("deduplicates the same pupil if present in both ls_pupils and pupils master", () => {
    const result = buildAssessmentClassSources({
      organizationId: "org-1",
      schoolUrn: 148201,
      schoolName: "Grove House Primary School",
      classes: [
        {
          id: "class-1",
          class_name: "6A",
          year_group: "Year 6",
          academic_year: "2025-26",
          pupil_count: 0,
        },
      ],
      lessonStudioPupils: [
        {
          id: "ls-pupil-1",
          class_id: "class-1",
          pupil_ref: "UPN001",
          display_name_encrypted: "Ada Lovelace",
          year_group: "Year 6",
          has_send_support: true,
          has_ehcp: false,
          is_pupil_premium: true,
          is_eal: false,
          fsm_eligible: true,
          send_primary_need: "SLCN",
        },
      ],
      masterPupils: [
        {
          id: "pupil-db-1",
          pupil_id: "schoolgle-pupil-1",
          pupil_ref: "UPN001",
          first_name: "Ada",
          last_name: "Lovelace",
          year_group: "6",
          current_class: "6A",
          class_name: "6A",
          is_pupil_premium: true,
          is_eal: false,
          fsm_eligible: true,
          send_status: "K",
          ehcp: false,
          primary_need: "SLCN",
        },
      ],
    });

    expect(result[0].pupils).toHaveLength(1);
    expect(result[0].pupils[0].source).toBe("lesson_studio");
  });

  it("uses Lesson Studio display names without exposing the storage prefix", () => {
    const result = buildAssessmentClassSources({
      organizationId: "org-1",
      schoolUrn: 148201,
      schoolName: "Grove House Primary School",
      classes: [
        {
          id: "class-1",
          class_name: "6A",
          year_group: "Year 6",
          academic_year: "2025-26",
          pupil_count: 0,
        },
      ],
      lessonStudioPupils: [
        {
          id: "ls-pupil-1",
          class_id: "class-1",
          pupil_ref: "UPN001",
          display_name_encrypted: "enc:Ada L.",
          year_group: "Year 6",
        },
      ],
      masterPupils: [],
    });

    expect(result[0].pupils[0].displayLabel).toBe("Ada L.");
  });
});
