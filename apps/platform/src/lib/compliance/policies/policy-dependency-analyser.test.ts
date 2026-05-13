import { describe, expect, it } from "vitest";
import { analysePolicyDependencies } from "./policy-dependency-analyser";
import { matchPolicyFilesToRequirements } from "./policy-matcher";

describe("analysePolicyDependencies", () => {
  it("finds referenced policies and marks missing linked requirements", () => {
    const matchResult = matchPolicyFilesToRequirements({
      context: "maintained_primary",
      files: [{ id: "behaviour", name: "Behaviour Policy 2025.docx" }],
    });
    const behaviourMatch = matchResult.requirements.find(
      (match) => match.requirement.id === "behaviour-policy",
    )!;

    const result = analysePolicyDependencies({
      requirementId: behaviourMatch.requirement.id,
      text: `
        This Behaviour Policy should be read alongside the Anti-bullying Policy,
        SEND Policy, Equality Information and Objectives and Suspension and Exclusion guidance.
      `,
      allMatches: matchResult.requirements,
    });

    expect(result.linkedPolicies.length).toBeGreaterThanOrEqual(3);
    expect(result.linkedPolicies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ requirementId: "anti-bullying-policy", status: "missing" }),
        expect.objectContaining({ requirementId: "send-policy", status: "missing" }),
        expect.objectContaining({ requirementId: "equality-information-objectives", status: "missing" }),
      ]),
    );
    expect(result.summary.missing).toBeGreaterThanOrEqual(3);
    expect(result.tags).toContain("linked-policy-gaps");
  });

  it("marks linked policies as present when files have been matched", () => {
    const matchResult = matchPolicyFilesToRequirements({
      context: "maintained_primary",
      files: [
        { id: "behaviour", name: "Behaviour Policy 2025.docx" },
        { id: "send", name: "SEND Policy 2025.docx" },
      ],
    });

    const result = analysePolicyDependencies({
      requirementId: "behaviour-policy",
      text: "This policy links to the SEND Policy.",
      allMatches: matchResult.requirements,
    });

    expect(result.linkedPolicies).toContainEqual(
      expect.objectContaining({ requirementId: "send-policy", status: "present" }),
    );
    expect(result.summary.present).toBe(1);
  });
});
