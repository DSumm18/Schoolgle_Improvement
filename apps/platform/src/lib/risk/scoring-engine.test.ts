/**
 * Dynamic Risk Scoring Engine Tests
 *
 * TDD: These tests define the expected behaviour of the escalation/de-escalation
 * scoring engine per Task 024 specification.
 */

import { describe, it, expect } from "vitest";
import {
  calculateRiskScore,
  getRiskLevel,
  applyEscalation,
  applyDeEscalation,
  ESCALATION_TRIGGERS,
  DE_ESCALATION_TRIGGERS,
  type EscalationEvent,
  type DeEscalationEvent,
  type RiskLevel,
} from "./scoring-engine";

// ---------------------------------------------------------------------------
// calculateRiskScore
// ---------------------------------------------------------------------------

describe("calculateRiskScore", () => {
  it("returns likelihood * impact for valid inputs", () => {
    expect(calculateRiskScore(1, 1)).toBe(1);
    expect(calculateRiskScore(5, 5)).toBe(25);
    expect(calculateRiskScore(3, 4)).toBe(12);
    expect(calculateRiskScore(2, 3)).toBe(6);
  });

  it("clamps inputs to 1-5 range", () => {
    expect(calculateRiskScore(0, 3)).toBe(3); // 0 clamped to 1
    expect(calculateRiskScore(6, 5)).toBe(25); // 6 clamped to 5
    expect(calculateRiskScore(3, 0)).toBe(3); // 0 clamped to 1
    expect(calculateRiskScore(3, 7)).toBe(15); // 7 clamped to 5
  });
});

// ---------------------------------------------------------------------------
// getRiskLevel
// ---------------------------------------------------------------------------

describe("getRiskLevel", () => {
  it("returns 'low' for scores 1-4", () => {
    expect(getRiskLevel(1)).toBe("low");
    expect(getRiskLevel(4)).toBe("low");
  });

  it("returns 'medium' for scores 5-9", () => {
    expect(getRiskLevel(5)).toBe("medium");
    expect(getRiskLevel(9)).toBe("medium");
  });

  it("returns 'high' for scores 10-16", () => {
    expect(getRiskLevel(10)).toBe("high");
    expect(getRiskLevel(16)).toBe("high");
  });

  it("returns 'critical' for scores 17-25", () => {
    expect(getRiskLevel(17)).toBe("critical");
    expect(getRiskLevel(25)).toBe("critical");
  });

  it("handles edge cases", () => {
    expect(getRiskLevel(0)).toBe("low");
    expect(getRiskLevel(30)).toBe("critical");
  });
});

// ---------------------------------------------------------------------------
// ESCALATION_TRIGGERS constants
// ---------------------------------------------------------------------------

describe("ESCALATION_TRIGGERS", () => {
  it("has correct point values per spec", () => {
    expect(ESCALATION_TRIGGERS.check_overdue_1_day).toBe(2);
    expect(ESCALATION_TRIGGERS.check_overdue_7_days).toBe(5);
    expect(ESCALATION_TRIGGERS.check_overdue_30_days).toBe(8);
    expect(ESCALATION_TRIGGERS.repeat_failure_3_in_12_months).toBe(3);
    expect(ESCALATION_TRIGGERS.contractor_visit_cancelled).toBe(2);
    expect(ESCALATION_TRIGGERS.critical_no_action_24hrs).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// DE_ESCALATION_TRIGGERS constants
// ---------------------------------------------------------------------------

describe("DE_ESCALATION_TRIGGERS", () => {
  it("has correct point values per spec", () => {
    expect(DE_ESCALATION_TRIGGERS.mitigation_confirmed_minor).toBe(2);
    expect(DE_ESCALATION_TRIGGERS.mitigation_confirmed_major).toBe(5);
    expect(DE_ESCALATION_TRIGGERS.staff_notification_confirmed).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// applyEscalation
// ---------------------------------------------------------------------------

describe("applyEscalation", () => {
  it("adds points for 1-day overdue check", () => {
    const result = applyEscalation(10, { type: "check_overdue", overdue_days: 1 });
    expect(result.new_score).toBe(12); // +2
    expect(result.change).toBe(2);
    expect(result.reason).toContain("overdue");
  });

  it("replaces lower escalation with 7-day overdue (+5 total, not +2+5)", () => {
    const result = applyEscalation(10, { type: "check_overdue", overdue_days: 7 });
    expect(result.new_score).toBe(15); // +5 (replaces +2)
    expect(result.change).toBe(5);
  });

  it("replaces lower escalation with 30-day overdue (+8 total)", () => {
    const result = applyEscalation(10, { type: "check_overdue", overdue_days: 30 });
    expect(result.new_score).toBe(18); // +8 (replaces previous)
    expect(result.change).toBe(8);
  });

  it("adds points for repeat failure (3+ in 12 months)", () => {
    const result = applyEscalation(8, {
      type: "repeat_failure",
      failure_count_12_months: 3,
    });
    expect(result.new_score).toBe(11); // +3
    expect(result.change).toBe(3);
  });

  it("does NOT add points for repeat failure below threshold", () => {
    const result = applyEscalation(8, {
      type: "repeat_failure",
      failure_count_12_months: 2,
    });
    expect(result.new_score).toBe(8);
    expect(result.change).toBe(0);
  });

  it("adds points for contractor visit cancelled", () => {
    const result = applyEscalation(12, { type: "contractor_visit_cancelled" });
    expect(result.new_score).toBe(14); // +2
    expect(result.change).toBe(2);
  });

  it("adds points for critical ticket with no action in 24hrs", () => {
    const result = applyEscalation(15, { type: "critical_no_action_24hrs" });
    expect(result.new_score).toBe(18); // +3
    expect(result.change).toBe(3);
  });

  it("caps score at 25", () => {
    const result = applyEscalation(23, { type: "check_overdue", overdue_days: 30 });
    expect(result.new_score).toBe(25); // 23+8=31, capped at 25
  });

  it("never goes below 1", () => {
    const result = applyEscalation(1, { type: "check_overdue", overdue_days: 0 });
    expect(result.new_score).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// applyDeEscalation
// ---------------------------------------------------------------------------

describe("applyDeEscalation", () => {
  it("reduces score for minor mitigation confirmed (-2)", () => {
    const result = applyDeEscalation(12, {
      type: "mitigation_confirmed",
      action_type: "minor",
    });
    expect(result.new_score).toBe(10); // -2
    expect(result.change).toBe(-2);
  });

  it("reduces score for moderate mitigation confirmed (-3)", () => {
    const result = applyDeEscalation(12, {
      type: "mitigation_confirmed",
      action_type: "moderate",
    });
    expect(result.new_score).toBe(9); // -3
    expect(result.change).toBe(-3);
  });

  it("reduces score for major mitigation confirmed (-5)", () => {
    const result = applyDeEscalation(16, {
      type: "mitigation_confirmed",
      action_type: "major",
    });
    expect(result.new_score).toBe(11); // -5
    expect(result.change).toBe(-5);
  });

  it("maintains current level for monitoring check completed on time", () => {
    const result = applyDeEscalation(12, {
      type: "monitoring_check_completed",
    });
    expect(result.new_score).toBe(12); // no change — prevents escalation
    expect(result.change).toBe(0);
    expect(result.reason).toContain("on time");
  });

  it("reduces to residual level for permanent fix verified", () => {
    const result = applyDeEscalation(18, {
      type: "permanent_fix_verified",
      residual_score: 3,
    });
    expect(result.new_score).toBe(3);
    expect(result.change).toBe(-15);
  });

  it("reduces to residual level for professional inspection confirms safety", () => {
    const result = applyDeEscalation(20, {
      type: "professional_inspection_safe",
      residual_score: 4,
    });
    expect(result.new_score).toBe(4);
    expect(result.change).toBe(-16);
  });

  it("reduces by 1 for staff notification confirmed", () => {
    const result = applyDeEscalation(14, {
      type: "staff_notification_confirmed",
    });
    expect(result.new_score).toBe(13); // -1
    expect(result.change).toBe(-1);
  });

  it("never goes below 0 (closed/archived)", () => {
    const result = applyDeEscalation(2, {
      type: "mitigation_confirmed",
      action_type: "major",
    });
    expect(result.new_score).toBe(0); // 2-5 would be -3, but floor is 0
  });

  it("uses default residual of 3 when permanent fix has no residual specified", () => {
    const result = applyDeEscalation(18, { type: "permanent_fix_verified" });
    expect(result.new_score).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Full lifecycle: broken fence example from spec
// ---------------------------------------------------------------------------

describe("broken fence lifecycle (spec example)", () => {
  it("follows the full escalation/de-escalation flow", () => {
    // Reported: Critical (25)
    const initial = calculateRiskScore(5, 5);
    expect(initial).toBe(25);
    expect(getRiskLevel(initial)).toBe("critical");

    // Site manager dispatched — no score change yet
    let score = 25;

    // Temp barrier installed — major mitigation (-5)
    let r1 = applyDeEscalation(score, {
      type: "mitigation_confirmed",
      action_type: "major",
    });
    score = r1.new_score;
    expect(score).toBe(20);

    // Temp barrier reduces further — moderate mitigation (-3)
    r1 = applyDeEscalation(score, {
      type: "mitigation_confirmed",
      action_type: "moderate",
    });
    score = r1.new_score;
    expect(score).toBe(17);

    // Staff notified (-1)
    r1 = applyDeEscalation(score, { type: "staff_notification_confirmed" });
    score = r1.new_score;
    expect(score).toBe(16);
    expect(getRiskLevel(score)).toBe("high");

    // Daily monitoring created — minor mitigation (-2)
    r1 = applyDeEscalation(score, {
      type: "mitigation_confirmed",
      action_type: "minor",
    });
    score = r1.new_score;
    expect(score).toBe(14);

    // Morning check completed on time — maintains level
    r1 = applyDeEscalation(score, { type: "monitoring_check_completed" });
    expect(r1.new_score).toBe(14);
    score = r1.new_score;

    // Afternoon check MISSED — 1 day overdue (+2)
    const esc = applyEscalation(score, {
      type: "check_overdue",
      overdue_days: 1,
    });
    score = esc.new_score;
    expect(score).toBe(16);
    expect(getRiskLevel(score)).toBe("high");

    // Contractor fixes permanently — residual 4
    r1 = applyDeEscalation(score, {
      type: "permanent_fix_verified",
      residual_score: 4,
    });
    score = r1.new_score;
    expect(score).toBe(4);
    expect(getRiskLevel(score)).toBe("low");

    // Verified = closed/archived (score → 0)
    r1 = applyDeEscalation(score, {
      type: "permanent_fix_verified",
      residual_score: 0,
    });
    score = r1.new_score;
    expect(score).toBe(0);
  });
});
