import { describe, expect, it } from "vitest";

import { buildSchoolKpiDataFromDfETrends } from "./kpi-dashboard-data";
import type { DfETrendData } from "./school-intelligence-engine";

describe("buildSchoolKpiDataFromDfETrends", () => {
  it("maps DfE trend rows into dashboard KPI data including attendance", () => {
    const trends: DfETrendData = {
      attendance: [
        {
          year: 2024,
          overall_pct: 94.7,
          persistent_absence_pct: 11.3,
          illness_pct: 3.1,
          excluded_pct: 0.2,
        },
      ],
      census: [],
      ks2: [
        {
          year: 2024,
          subject: "Reading, writing and maths",
          breakdown: "Total",
          expected_standard_pct: 65,
          higher_standard_pct: 8,
          progress_measure_score: 0,
          progress_description: "",
        },
        {
          year: 2024,
          subject: "Reading",
          breakdown: "Total",
          expected_standard_pct: 72,
          higher_standard_pct: 18,
          progress_measure_score: 1.24,
          progress_description: "",
        },
        {
          year: 2024,
          subject: "Mathematics",
          breakdown: "Total",
          expected_standard_pct: 70,
          higher_standard_pct: 20,
          progress_measure_score: -0.42,
          progress_description: "",
        },
      ],
      workforce: [],
      exclusions: [],
    };

    expect(buildSchoolKpiDataFromDfETrends(trends)).toEqual({
      ks2_combined: [{ year: 2024, expected_standard_pct: 65 }],
      ks2_reading: [{ year: 2024, expected_standard_pct: 72, progress_score: 1.2 }],
      ks2_maths: [{ year: 2024, expected_standard_pct: 70, progress_score: -0.4 }],
      attendance: [{ year: 2024, overall_pct: 94.7, persistent_absence_pct: 11.3 }],
      persistent_absence: [{ year: 2024, pct: 11.3 }],
    });
  });

  it("accepts Maths as the DfE subject label for mathematics", () => {
    const trends: DfETrendData = {
      attendance: [],
      census: [],
      ks2: [
        {
          year: 2024,
          subject: "Maths",
          breakdown: "Total",
          expected_standard_pct: 71,
          higher_standard_pct: 21,
          progress_measure_score: 0.37,
          progress_description: "",
        },
      ],
      workforce: [],
      exclusions: [],
    };

    expect(buildSchoolKpiDataFromDfETrends(trends).ks2_maths).toEqual([
      { year: 2024, expected_standard_pct: 71, progress_score: 0.4 },
    ]);
  });

  it("keeps suppressed progress as null rather than inventing zero scores", () => {
    const trends: DfETrendData = {
      attendance: [],
      census: [],
      ks2: [
        {
          year: 2024,
          subject: "Reading",
          breakdown: "Total",
          expected_standard_pct: 87,
          higher_standard_pct: 34,
          progress_measure_score: null,
          progress_description: "",
        },
      ],
      workforce: [],
      exclusions: [],
    };

    expect(buildSchoolKpiDataFromDfETrends(trends).ks2_reading).toEqual([
      { year: 2024, expected_standard_pct: 87, progress_score: null },
    ]);
  });
});
