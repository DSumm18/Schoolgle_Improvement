import { describe, expect, it } from "vitest";
import { MAINTAINED_PRIMARY_POLICY_REQUIREMENTS } from "../policy-catalogue";
import {
  buildStarterPolicyDraftPreview,
  getStarterPolicySources,
  listStarterPolicyPacks,
} from "./starter-policy-pack";

describe("starter policy packs", () => {
  it("covers every maintained-primary policy requirement", () => {
    expect(listStarterPolicyPacks()).toHaveLength(20);

    for (const requirement of MAINTAINED_PRIMARY_POLICY_REQUIREMENTS) {
      const preview = buildStarterPolicyDraftPreview({
        requirementId: requirement.id,
        mode: "missing_policy",
        schoolName: "Example Primary School",
      });

      expect(preview?.title).toContain(requirement.canonicalName);
      expect(preview?.draft.title).toBe(requirement.canonicalName);
      expect(preview?.draft.markdown).toContain("Source references");
      expect(preview?.draft.formattedHtml).toContain("schoolgle-policy-cover");
      expect(preview?.draft.formattedHtml).toContain("Standard operating procedures");
      expect(preview?.draft.sources.length).toBeGreaterThan(0);
      expect(preview?.draft.assumptions.join(" ")).toContain("not legal advice");
    }
  });

  it("uses real source URLs rather than the old governance-guide placeholder for every source", () => {
    const sources = MAINTAINED_PRIMARY_POLICY_REQUIREMENTS.flatMap(
      (requirement) => getStarterPolicySources(requirement),
    );

    expect(sources.length).toBeGreaterThan(20);
    expect(sources.every((source) => source.url.startsWith("https://"))).toBe(
      true,
    );
    expect(
      sources.some((source) => source.url.includes("ico.org.uk")),
    ).toBe(true);
    expect(
      sources.some((source) => source.url.includes("legislation.gov.uk")),
    ).toBe(true);
  });

  it("rejects unknown policy requirements", () => {
    expect(
      buildStarterPolicyDraftPreview({
        requirementId: "made-up-policy",
        mode: "missing_policy",
        schoolName: "Example Primary School",
      }),
    ).toBeNull();
  });
});
