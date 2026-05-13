import { describe, expect, it } from "vitest";
import { buildOfstedInspectionIntelligenceBrief } from "./intelligence-brief";

describe("buildOfstedInspectionIntelligenceBrief", () => {
  it("labels KS2 Combined RWM+ as pupils meeting Reading, Writing and Maths together", () => {
    const brief = buildOfstedInspectionIntelligenceBrief({
      organizationName: "Example Primary",
      schoolRows: [
        {
          urn: 123456,
          name: "Example Primary",
          ks2: [
            {
              academic_year_end: 2025,
              subject: "Reading, writing and maths",
              breakdown_topic: "All pupils",
              breakdown: "Total",
              expected_standard_pct: 48,
              higher_standard_pct: 5,
              progress_measure_score: null,
            },
          ],
          census: [
            {
              academic_year_end: 2025,
              number_on_roll: 210,
              fsm_pct: 42,
              eal_pct: 18,
              sen_pct: 16,
            },
          ],
        },
      ],
      dataConnections: [{ provider: "google", folder_name: "Schoolgle" }],
      ofstedFindings: [],
      latestAnalysis: null,
    });

    const combined = brief.signals.find(
      (signal) => signal.key === "ks2-combined-rwm",
    );

    expect(combined?.label).toBe("KS2 Combined RWM+");
    expect(combined?.value).toBe("48%");
    expect(combined?.explanation).toContain(
      "pupils meeting expected+ in Reading, Writing and Maths together",
    );
    expect(combined?.explanation).not.toContain("average of Reading");
    expect(combined?.tone).toBe("red");
  });

  it("surfaces data quality warnings when connector or intelligence analysis is missing", () => {
    const brief = buildOfstedInspectionIntelligenceBrief({
      organizationName: "Example Primary",
      schoolRows: [],
      dataConnections: [],
      ofstedFindings: [
        { severity: "critical", status: "identified", title: "Missing SCR" },
        { severity: "high", status: "assigned", title: "Old policy" },
      ],
      latestAnalysis: null,
    });

    expect(brief.dataQualityWarnings).toContain(
      "No Schoolgle Connector folder is active, so document evidence may be incomplete.",
    );
    expect(brief.dataQualityWarnings).toContain(
      "No recent School Improvement intelligence analysis is available for this school.",
    );
    expect(brief.dataQualityWarnings).toContain(
      "No validated DfE school context was found for this organization scope.",
    );
    expect(brief.findingsSummary.critical).toBe(1);
    expect(brief.findingsSummary.high).toBe(1);
  });

  it("adds trust-level pattern context from multiple schools without mixing it into the school value", () => {
    const brief = buildOfstedInspectionIntelligenceBrief({
      organizationName: "Example Trust",
      schoolRows: [
        {
          urn: 1,
          name: "Low School",
          ks2: [
            {
              academic_year_end: 2025,
              subject: "Reading, writing and maths",
              breakdown_topic: "All pupils",
              breakdown: "Total",
              expected_standard_pct: 42,
              higher_standard_pct: null,
              progress_measure_score: null,
            },
          ],
          census: [],
        },
        {
          urn: 2,
          name: "Strong School",
          ks2: [
            {
              academic_year_end: 2025,
              subject: "Reading, writing and maths",
              breakdown_topic: "All pupils",
              breakdown: "Total",
              expected_standard_pct: 78,
              higher_standard_pct: null,
              progress_measure_score: null,
            },
          ],
          census: [],
        },
      ],
      dataConnections: [{ provider: "google", folder_name: "Schoolgle" }],
      ofstedFindings: [],
      latestAnalysis: {
        title: "Trust intelligence",
        executive_summary: "Writing moderation is a trust-wide theme.",
        confidence_score: 0.82,
        data_sources_used: ["DfE KS2", "trust spreadsheet"],
      },
    });

    expect(brief.trustPatterns).toEqual([
      "1 of 2 schools are below 50% KS2 Combined RWM+ in the latest validated DfE year.",
      "Trust range for latest KS2 Combined RWM+ is 42% to 78%, a 36pp spread.",
    ]);
    expect(brief.sourcesUsed).toContain("Latest School Improvement analysis");
    expect(brief.sourcesUsed).toContain("DfE KS2 validated outcomes");
  });
});
