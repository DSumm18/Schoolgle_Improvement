import { describe, expect, it } from "vitest";
import { buildCohortGapLens } from "./cohort-gap-lens";

const subjects = ["reading", "writing", "maths"] as const;

function rows(
  pupilHash: string,
  levels: Record<(typeof subjects)[number], string>,
  academicYearStart = 2025,
  yearGroup = 6,
) {
  return subjects.map((subject) => ({
    pupilHash,
    subject,
    attainmentLevel: levels[subject],
    academicYearStart,
    yearGroup,
    assessmentPeriod: "summer",
  }));
}

describe("buildCohortGapLens", () => {
  it("calculates Combined RWM+ as reading, writing and maths together, not a subject average", () => {
    const lens = buildCohortGapLens({
      records: [
        ...rows("a", { reading: "EXS", writing: "EXS", maths: "EXS" }),
        ...rows("b", { reading: "EXS", writing: "WTS", maths: "EXS" }),
        ...rows("c", { reading: "EXS", writing: "EXS", maths: "EXS" }),
        ...rows("d", { reading: "WTS", writing: "EXS", maths: "EXS" }),
      ],
      getDemographics: (hash) => ({
        isFsm: hash === "a" || hash === "b",
        isSend: false,
        isEal: false,
      }),
    });

    const fsmLens = lens.comparisons.find((comparison) => comparison.key === "fsm");

    expect(fsmLens?.groupAttainment.combinedRwm).toEqual({
      atExpected: 1,
      total: 2,
      pct: 50,
      greaterDepth: 0,
      greaterDepthPct: 0,
    });
    expect(fsmLens?.comparatorAttainment.combinedRwm).toEqual({
      atExpected: 1,
      total: 2,
      pct: 50,
      greaterDepth: 0,
      greaterDepthPct: 0,
    });
  });

  it("builds EAL versus non-EAL, SEND versus non-SEND and FSM versus non-FSM comparisons", () => {
    const lens = buildCohortGapLens({
      records: [
        ...rows("eal-1", { reading: "EXS", writing: "EXS", maths: "EXS" }),
        ...rows("eal-2", { reading: "WTS", writing: "EXS", maths: "EXS" }),
        ...rows("other-1", { reading: "EXS", writing: "EXS", maths: "EXS" }),
        ...rows("other-2", { reading: "EXS", writing: "EXS", maths: "EXS" }),
      ],
      getDemographics: (hash) => ({
        isFsm: hash.endsWith("1"),
        isSend: hash === "eal-2",
        isEal: hash.startsWith("eal"),
      }),
      minimumGroupSize: 1,
    });

    expect(lens.comparisons.map((comparison) => comparison.key)).toEqual([
      "fsm",
      "send",
      "eal",
    ]);
    expect(lens.comparisons.find((comparison) => comparison.key === "eal"))
      .toMatchObject({
        groupLabel: "EAL",
        comparatorLabel: "Non-EAL",
        groupCount: 2,
        comparatorCount: 2,
        combinedGapPp: 50,
    });
  });

  it("uses the latest year with complete reading, writing and maths evidence for the gap lens", () => {
    const lens = buildCohortGapLens({
      records: [
        ...rows("a", { reading: "EXS", writing: "EXS", maths: "EXS" }, 2024),
        ...rows("b", { reading: "WTS", writing: "EXS", maths: "EXS" }, 2024),
        { pupilHash: "a", subject: "maths", attainmentLevel: "EXS", academicYearStart: 2025, yearGroup: 6 },
        { pupilHash: "b", subject: "maths", attainmentLevel: "WTS", academicYearStart: 2025, yearGroup: 6 },
      ],
      getDemographics: (hash) => ({
        isFsm: hash === "a",
        isSend: false,
        isEal: false,
      }),
      minimumGroupSize: 1,
    });

    expect(lens.latestYear).toBe(2024);
    expect(lens.yearGroupLabel).toBe("Year 6");
    expect(lens.caveat).toContain("latest complete Reading, Writing and Maths");
  });

  it("uses one coherent year group and does not mix EYFS maths into RWM subject bars", () => {
    const lens = buildCohortGapLens({
      records: [
        ...rows("y2-a", { reading: "EXS", writing: "EXS", maths: "EXS" }, 2025, 2),
        ...rows("y2-b", { reading: "WTS", writing: "EXS", maths: "WTS" }, 2025, 2),
        { pupilHash: "eyfs-a", subject: "maths", attainmentLevel: "2", academicYearStart: 2025, yearGroup: 0, assessmentPeriod: "summer" },
        { pupilHash: "eyfs-b", subject: "maths", attainmentLevel: "2", academicYearStart: 2025, yearGroup: 0, assessmentPeriod: "summer" },
      ],
      getDemographics: (hash) => ({
        isFsm: hash === "y2-a",
        isSend: false,
        isEal: false,
      }),
      minimumGroupSize: 1,
    });

    const fsmLens = lens.comparisons.find((comparison) => comparison.key === "fsm");

    expect(lens.yearGroupLabel).toBe("Year 2");
    expect(lens.assessedPupilCount).toBe(2);
    expect(fsmLens?.groupAttainment.maths.total).toBe(1);
    expect(fsmLens?.comparatorAttainment.maths.total).toBe(1);
  });
});
