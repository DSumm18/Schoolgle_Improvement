import { describe, expect, it } from "vitest";
import { calculateComplianceBriefing } from "./compliance-briefing";

const baseCheck = {
  id: "gas_annual_boiler_service",
  name: "Annual boiler service",
  frequency: "annually",
  category: "statutory",
  risk_level: "high",
};

describe("calculateComplianceBriefing", () => {
  it("rates a current evidenced statutory check as stable", () => {
    const briefing = calculateComplianceBriefing({
      check: baseCheck,
      now: new Date("2026-04-26T12:00:00Z"),
      completions: [
        {
          status: "completed",
          completed_at: "2026-01-10T09:00:00Z",
          next_due: "2027-01-10",
          evidence_ids: ["ev-1"],
        },
      ],
    });

    expect(briefing.complianceStatus).toBe("compliant");
    expect(briefing.riskScore).toBe(1);
    expect(briefing.riskLabel).toBe("Stable");
    expect(briefing.confidence).toBe("high");
  });

  it("keeps green compliance separate from future risk when assets are fragile", () => {
    const briefing = calculateComplianceBriefing({
      check: baseCheck,
      now: new Date("2026-04-26T12:00:00Z"),
      completions: [
        {
          status: "completed",
          completed_at: "2026-02-01T09:00:00Z",
          next_due: "2027-02-01",
          evidence_ids: ["ev-1"],
        },
      ],
      linkedAssets: [
        {
          name: "Main boiler",
          condition: "poor",
          lifecycle_status: "end_of_life",
          recent_failure_count: 2,
        },
      ],
    });

    expect(briefing.complianceStatus).toBe("compliant");
    expect(briefing.riskScore).toBeGreaterThanOrEqual(3);
    expect(briefing.keyPoints.join(" ")).toContain("Main boiler");
  });

  it("escalates overdue statutory checks with no evidence", () => {
    const briefing = calculateComplianceBriefing({
      check: baseCheck,
      now: new Date("2026-04-26T12:00:00Z"),
      completions: [
        {
          status: "completed",
          completed_at: "2025-01-01T09:00:00Z",
          next_due: "2026-01-01",
          evidence_ids: [],
        },
      ],
    });

    expect(briefing.complianceStatus).toBe("overdue");
    expect(briefing.riskScore).toBe(5);
    expect(briefing.riskLabel).toBe("Critical");
    expect(briefing.confidence).toBe("low");
  });

  it("does not penalise checks marked not applicable", () => {
    const briefing = calculateComplianceBriefing({
      check: baseCheck,
      now: new Date("2026-04-26T12:00:00Z"),
      completions: [
        {
          status: "not_applicable",
          completion_notes: "No lift on site",
          next_due: "2099-12-31",
          evidence_ids: [],
        },
      ],
    });

    expect(briefing.complianceStatus).toBe("not_applicable");
    expect(briefing.riskScore).toBe(1);
    expect(briefing.riskLabel).toBe("Stable");
  });
});
