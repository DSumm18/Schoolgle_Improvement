import { describe, expect, it } from "vitest";
import { analysePolicyQuality } from "./policy-quality-analyser";

describe("analysePolicyQuality", () => {
  it("scores a behaviour policy against expected content rules", () => {
    const result = analysePolicyQuality({
      requirementId: "behaviour-policy",
      text: `
        Behaviour Policy
        Pupils are expected to follow school rules and show respectful conduct.
        Staff use rewards, consequences and sanctions consistently.
        Bullying and online behaviour are addressed through the anti-bullying policy.
        The school will make reasonable adjustments for SEND and equality duties.
        Detention, removal from class, searching and reasonable force are covered.
        Suspension and permanent exclusion follow statutory guidance.
        The headteacher, governors, staff, pupils and parents all have responsibilities.
        Approved by governors. Next review September 2026.
      `,
    });

    expect(result.available).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.rating).toBe("strong");
    expect(result.summary.met).toBeGreaterThan(result.summary.missing);
  });

  it("flags missing behaviour policy content with specific actions", () => {
    const result = analysePolicyQuality({
      requirementId: "behaviour-policy",
      text: "Behaviour Policy. Children should behave well. Review September 2026.",
    });

    expect(result.available).toBe(true);
    expect(result.score).toBeLessThan(50);
    expect(result.rating).toBe("high_risk");
    expect(result.checks.some((check) => check.status === "missing")).toBe(true);
    expect(result.recommendedActions.length).toBeGreaterThan(0);
  });

  it("returns unavailable when no rule pack exists yet", () => {
    const result = analysePolicyQuality({
      requirementId: "charging-remissions",
      text: "Charging and remissions policy",
    });

    expect(result.available).toBe(false);
    expect(result.score).toBeNull();
  });
});
