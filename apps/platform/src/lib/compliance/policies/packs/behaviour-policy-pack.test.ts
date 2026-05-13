import { describe, expect, it } from "vitest";
import { analysePolicyQuality } from "../policy-quality-analyser";
import {
  BEHAVIOUR_POLICY_PACK,
  buildBehaviourPolicyDraft,
  buildBehaviourPolicyDraftPreview,
} from "./behaviour-policy-pack";

describe("Behaviour Policy Pack", () => {
  it("ships a baseline template that scores 100 against the Behaviour rule pack", () => {
    const draft = buildBehaviourPolicyDraft({
      schoolName: "Rawdon St Peter's C of E Primary School",
      approvalBody: "Governing body",
      reviewCycle: "Annual",
      nextReviewDate: "1 September 2026",
    });

    const analysis = analysePolicyQuality({
      requirementId: "behaviour-policy",
      text: draft.markdown,
    });

    expect(analysis.available).toBe(true);
    expect(analysis.score).toBe(100);
    expect(analysis.rating).toBe("strong");
    expect(analysis.summary.missing).toBe(0);
  });

  it("keeps official sources attached to the policy pack", () => {
    expect(BEHAVIOUR_POLICY_PACK.sources.map((source) => source.publisher)).toEqual(
      expect.arrayContaining([
        "Department for Education",
        "GOV.UK",
        "UK Government",
      ]),
    );
    expect(BEHAVIOUR_POLICY_PACK.sources.every((source) => source.url)).toBe(true);
  });

  it("builds an improved-draft preview that explains what it is fixing", () => {
    const preview = buildBehaviourPolicyDraftPreview({
      mode: "improve_existing",
      schoolName: "Rawdon St Peter's C of E Primary School",
      existingFileName: "Behaviour_Policy_2025-26.docx",
      weakAreas: [
        "SEND, equality and reasonable adjustments",
        "Outside-school and online behaviour",
      ],
    });

    expect(preview.title).toBe("Improved Behaviour Policy draft");
    expect(preview.summary).toContain("Behaviour_Policy_2025-26.docx");
    expect(preview.summary).toContain("SEND, equality and reasonable adjustments");
    expect(preview.draft.markdown).toContain("reasonable adjustments");
  });

  it("builds a branded policy pack with cover, contents, sources and SOP starter", () => {
    const preview = buildBehaviourPolicyDraftPreview({
      mode: "improve_existing",
      schoolName: "Rawdon St Peter's C of E Primary School",
      schoolLogoUrl: "https://example.com/logo.png",
      existingFileName: "Behaviour_Policy_2025-26.docx",
    });

    expect(preview.draft.formattedHtml).toContain("schoolgle-policy-cover");
    expect(preview.draft.formattedHtml).toContain("Rawdon St Peter&#39;s C of E Primary School");
    expect(preview.draft.formattedHtml).toContain("https://example.com/logo.png");
    expect(preview.draft.formattedHtml).toContain("Contents");
    expect(preview.draft.formattedHtml).toContain("Standard operating procedures");
    expect(preview.draft.formattedHtml).toContain("Sources checked");
    expect(preview.draft.downloadFileName).toBe(
      "rawdon-st-peters-c-of-e-primary-school-behaviour-policy-draft.doc",
    );
  });
});
