import { describe, expect, it } from "vitest";
import {
  getFindingBadgeTone,
  getFindingStatusLabel,
  summariseFindings,
} from "./findings-ui";

describe("summariseFindings", () => {
  it("prioritises active critical/high findings and assignment counts", () => {
    const summary = summariseFindings([
      { severity: "critical", status: "identified", assigned_task_id: null },
      { severity: "high", status: "assigned", assigned_task_id: "task-1" },
      { severity: "medium", status: "verified", assigned_task_id: "task-2" },
      { severity: "low", status: "dismissed", assigned_task_id: null },
    ]);

    expect(summary).toEqual({
      total: 4,
      active: 2,
      critical: 1,
      high: 1,
      assigned: 2,
      verified: 1,
    });
  });
});

describe("finding labels", () => {
  it("returns human labels and tones for status and severity", () => {
    expect(getFindingStatusLabel("verification_required")).toBe(
      "Verification required",
    );
    expect(getFindingBadgeTone("critical")).toBe("rose");
    expect(getFindingBadgeTone("recommended_action")).toBe("amber");
  });
});
