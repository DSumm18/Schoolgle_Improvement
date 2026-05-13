import { describe, expect, it } from "vitest";
import { buildGovernorFinanceReport } from "./governor-report";

const baseMonitor = {
  financial_year: "2025-26",
  school_name: "Rawdon St Peter's C of E Primary School",
  pupil_count: 420,
  as_at_date: "2026-03-12",
  months_elapsed: 6,
  months_total: 12,
  total_income: 2_098_500,
  total_budget: 1_899_900,
  total_spend: 997_700,
  total_committed: 54_000,
  remaining: 848_200,
  projected_surplus_deficit: 26_447,
  staffing_percent_of_income: 78.3,
  staffing_target: 78,
  lines: [
    {
      cfr_code: "E01",
      description: "Teaching Staff",
      group: "Staffing",
      budget: 980_000,
      actual: 498_000,
      committed: 12_000,
      variance: 7_999,
      variance_percent: 1.6,
      rag: "green",
    },
    {
      cfr_code: "E16",
      description: "Gas",
      group: "Energy",
      budget: 28_000,
      actual: 18_200,
      committed: 9_000,
      variance: 11_550,
      variance_percent: 173.7,
      rag: "red",
    },
    {
      cfr_code: "I07",
      description: "Other Grants & Training Income",
      group: "Income",
      budget: -11_500,
      actual: -4_200,
      committed: 0,
      variance: 0,
      variance_percent: 0,
      rag: "green",
    },
  ],
};

describe("buildGovernorFinanceReport", () => {
  it("builds a board-ready narrative with key sections and risks", () => {
    const report = buildGovernorFinanceReport({
      monitor: baseMonitor,
      expectedIncome: [
        {
          id: "secondment",
          description: "Staff secondment recharge (Q3)",
          amount: 12_400,
          confidence: "confirmed",
          expected_date: "2026-04-01",
          source: "Seconding school",
          cfr_code: "I07",
          offset_cfr_code: "E01",
        },
      ],
      schoolName: "Rawdon St Peter's C of E Primary School",
    });

    expect(report.title).toContain("Rawdon St Peter's");
    expect(report.executiveSummary).toContain("projected surplus");
    expect(report.sections.map((section) => section.id)).toEqual([
      "overview",
      "income",
      "expenditure",
      "true-position",
      "actions",
    ]);
    expect(report.keyVariances[0].cfr_code).toBe("E16");
    expect(report.holdingItems[0].narrative).toContain("offsets E01");
  });

  it("calls out balanced-budget action when a section is red", () => {
    const report = buildGovernorFinanceReport({
      monitor: baseMonitor,
      expectedIncome: [],
      schoolName: "Rawdon St Peter's C of E Primary School",
    });

    expect(report.recommendedActions.join(" ")).toContain("Energy");
    expect(report.recommendedActions.join(" ")).toContain("hold");
  });
});
