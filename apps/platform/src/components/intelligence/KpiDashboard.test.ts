import { describe, expect, it } from "vitest";
import { normalizeKpiDashboardInputs } from "./KpiDashboard";

describe("normalizeKpiDashboardInputs", () => {
  it("defaults missing DfE benchmark arrays for partial payloads", () => {
    const { laBenchmarks, schoolData } = normalizeKpiDashboardInputs(
      {
        la_name: "Bradford",
        la_code: "380",
        school_count: 0,
        ks2_combined: [{ year: 2024, expected_standard_pct: 62 }],
      } as any,
      {
        attendance: [{ year: 2025, overall_pct: 93.1, persistent_absence_pct: 22.1 }],
      },
    );

    expect(laBenchmarks.ks2_combined).toHaveLength(1);
    expect(laBenchmarks.ks2_reading).toEqual([]);
    expect(laBenchmarks.ks2_writing).toEqual([]);
    expect(laBenchmarks.ks2_maths).toEqual([]);
    expect(schoolData.attendance).toHaveLength(1);
    expect(schoolData.ks2_combined).toEqual([]);
  });
});
