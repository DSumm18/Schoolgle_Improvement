import { describe, expect, it } from "vitest";

import {
  hasProhibitedAiClaim,
  isApprovedAiUseCase,
  isRestrictedDecisionArea,
  validateAiGovernanceCopy,
} from "./ai-governance";

describe("AI governance guardrails", () => {
  it("identifies restricted decision areas", () => {
    expect(isRestrictedDecisionArea("safeguarding")).toBe(true);
    expect(isRestrictedDecisionArea("inspection-grade")).toBe(true);
    expect(isRestrictedDecisionArea("draft-newsletter")).toBe(false);
  });

  it("identifies approved advisory AI uses", () => {
    expect(isApprovedAiUseCase("draft-editable-content")).toBe(true);
    expect(isApprovedAiUseCase("map-evidence-to-framework")).toBe(true);
    expect(isApprovedAiUseCase("decide-exclusion")).toBe(false);
  });

  it("flags prohibited AI copy claims", () => {
    const violations = validateAiGovernanceCopy(
      "Schoolgle predicts the Ofsted grade and AI certifies compliance.",
    );

    expect(violations.length).toBeGreaterThanOrEqual(2);
    expect(hasProhibitedAiClaim("AI output is advisory only.")).toBe(false);
  });
});
