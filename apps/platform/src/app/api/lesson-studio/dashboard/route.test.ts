import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock helpers ────────────────────────────────────────────────

const mockPupils = [
  {
    id: "p1",
    organization_id: "org1",
    class_id: "c1",
    pupil_ref: "REF001",
    display_name_encrypted: "Alice Smith",
    year_group: "Year 5",
    has_ehcp: false,
    has_send_support: false,
    is_pupil_premium: true,
    is_eal: false,
    is_looked_after: false,
    attainment_reading: "EXS",
    attainment_writing: "WTS",
    attainment_maths: "GDS",
    attainment_science: "EXS",
  },
  {
    id: "p2",
    organization_id: "org1",
    class_id: "c1",
    pupil_ref: "REF002",
    display_name_encrypted: "Bob Jones",
    year_group: "Year 5",
    has_ehcp: true,
    has_send_support: true,
    is_pupil_premium: false,
    is_eal: true,
    is_looked_after: false,
    attainment_reading: "PKE",
    attainment_writing: "PKF",
    attainment_maths: "WTS",
    attainment_science: "WTS",
  },
  {
    id: "p3",
    organization_id: "org1",
    class_id: "c1",
    pupil_ref: "REF003",
    display_name_encrypted: "Charlie Brown",
    year_group: "Year 5",
    has_ehcp: false,
    has_send_support: false,
    is_pupil_premium: false,
    is_eal: false,
    is_looked_after: false,
    attainment_reading: "EXS",
    attainment_writing: "EXS",
    attainment_maths: "EXS",
    attainment_science: "EXS",
  },
];

const mockAssessments = [
  {
    id: "a1",
    organization_id: "org1",
    pupil_id: "p2",
    subject: "maths",
    teacher_grade: "PKE",
    ai_suggested_grade: "PKE",
    assessment_date: "2026-03-10",
  },
  {
    id: "a2",
    organization_id: "org1",
    pupil_id: "p2",
    subject: "reading",
    teacher_grade: "GDS",
    ai_suggested_grade: "EXS",
    assessment_date: "2026-04-01",
  },
];

// ── Attainment logic tests (unit tests of the algorithm) ────────

describe("Dashboard attainment logic", () => {
  const ATTAINMENT_ORDER: Record<string, number> = {
    PKF: 0,
    PKE: 1,
    WTS: 2,
    EXS: 3,
    GDS: 4,
  };

  function isBelow(grade: string | null): boolean {
    if (!grade) return false;
    return grade === "WTS" || grade === "PKE" || grade === "PKF";
  }

  function bandDistance(a: string | null, b: string | null): number {
    if (!a || !b) return 0;
    const aIdx = ATTAINMENT_ORDER[a];
    const bIdx = ATTAINMENT_ORDER[b];
    if (aIdx == null || bIdx == null) return 0;
    return Math.abs(aIdx - bIdx);
  }

  it("should identify below-expected grades correctly", () => {
    expect(isBelow("WTS")).toBe(true);
    expect(isBelow("PKE")).toBe(true);
    expect(isBelow("PKF")).toBe(true);
    expect(isBelow("EXS")).toBe(false);
    expect(isBelow("GDS")).toBe(false);
    expect(isBelow(null)).toBe(false);
  });

  it("should calculate band distance correctly", () => {
    expect(bandDistance("PKF", "GDS")).toBe(4);
    expect(bandDistance("EXS", "WTS")).toBe(1);
    expect(bandDistance("PKE", "EXS")).toBe(2);
    expect(bandDistance(null, "EXS")).toBe(0);
    expect(bandDistance("EXS", "EXS")).toBe(0);
  });

  it("should compute stats from mock pupils (maths-based)", () => {
    let atExpectedPlus = 0;
    let greaterDepth = 0;
    let belowExpected = 0;

    for (const pupil of mockPupils) {
      const mathsGrade = pupil.attainment_maths;
      if (mathsGrade === "EXS" || mathsGrade === "GDS") atExpectedPlus++;
      if (mathsGrade === "GDS") greaterDepth++;
      if (isBelow(mathsGrade)) belowExpected++;
    }

    expect(atExpectedPlus).toBe(2); // Alice (GDS) + Charlie (EXS)
    expect(greaterDepth).toBe(1); // Alice (GDS)
    expect(belowExpected).toBe(1); // Bob (WTS)
  });

  it("should flag inconsistency when census and assessment differ by 2+ bands", () => {
    // Bob: census reading = PKE, latest assessment reading = GDS
    const censusGrade = "PKE";
    const assessGrade = "GDS";
    const distance = bandDistance(censusGrade, assessGrade);

    expect(distance).toBe(3);
    expect(distance >= 2).toBe(true);
  });

  it("should detect gap alerts for below-expected pupils", () => {
    const alerts: Array<{ pupilId: string; subject: string }> = [];
    const CORE_SUBJECTS = ["reading", "writing", "maths", "science"];

    for (const pupil of mockPupils) {
      for (const subject of CORE_SUBJECTS) {
        const grade = (pupil as Record<string, unknown>)[
          `attainment_${subject}`
        ] as string | null;
        if (isBelow(grade)) {
          alerts.push({ pupilId: pupil.id, subject });
        }
      }
    }

    // Alice: writing WTS (1 alert)
    // Bob: reading PKE, writing PKF, maths WTS, science WTS (4 alerts)
    expect(alerts.length).toBe(5);
    expect(alerts.filter((a) => a.pupilId === "p2").length).toBe(4);
    expect(alerts.filter((a) => a.pupilId === "p1").length).toBe(1);
  });
});

describe("Dashboard prerequisite skill chain", () => {
  const MATHS_PREREQUISITES: Record<string, string[]> = {
    "Y6: Compare & order fractions": ["Y5: Equivalent fractions"],
    "Y5: Equivalent fractions": [
      "Y4: Recognise fraction equivalents",
      "Y4: Add fractions (same denominator)",
    ],
    "Y4: Recognise fraction equivalents": ["Y3: Count in tenths"],
  };

  it("should build a chain from root to leaf", () => {
    const allChildren = new Set(Object.values(MATHS_PREREQUISITES).flat());
    const roots = Object.keys(MATHS_PREREQUISITES).filter(
      (s) => !allChildren.has(s),
    );

    expect(roots).toContain("Y6: Compare & order fractions");

    // Walk down
    let current: string | undefined = roots[0];
    const chain: string[] = [];
    while (current) {
      chain.push(current);
      const children = MATHS_PREREQUISITES[current];
      current = children?.[0];
    }

    expect(chain.length).toBe(4);
    expect(chain[0]).toBe("Y6: Compare & order fractions");
    expect(chain[1]).toBe("Y5: Equivalent fractions");
    expect(chain[2]).toBe("Y4: Recognise fraction equivalents");
    expect(chain[3]).toBe("Y3: Count in tenths");
  });
});
