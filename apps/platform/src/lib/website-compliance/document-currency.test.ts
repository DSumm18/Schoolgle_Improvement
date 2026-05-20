import { afterEach, describe, expect, it, vi } from "vitest";
import { assessCurrency, extractDates } from "./phase2-assessor";
import { WEBSITE_COMPLIANCE_REQUIREMENTS } from "./requirements";

const pupilPremiumRequirement = WEBSITE_COMPLIANCE_REQUIREMENTS.find(
  (requirement) => requirement.key === "pupil_premium_strategy",
);
const peSportPremiumRequirement = WEBSITE_COMPLIANCE_REQUIREMENTS.find(
  (requirement) => requirement.key === "pe_sport_premium",
);

describe("document currency checks", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("detects stale academic-year evidence with en-dash date ranges", () => {
    expect(pupilPremiumRequirement).toBeDefined();

    const dates = extractDates("Pupil Premium Strategy 2022 – 23");

    expect(dates).toContain("2022 – 23");
    expect(assessCurrency(dates, pupilPremiumRequirement!)).toBe("outdated");
  });

  it("treats previous-year PE sport premium reports as due soon before the July deadline", () => {
    expect(peSportPremiumRequirement).toBeDefined();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T12:00:00Z"));

    const dates = extractDates("Grove 24-25 PE & Sports Grant Report");

    expect(dates).toContain("24-25");
    expect(assessCurrency(dates, peSportPremiumRequirement!)).toBe("due_soon");
  });

  it("treats previous-year PE sport premium reports as outdated after the July deadline", () => {
    expect(peSportPremiumRequirement).toBeDefined();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T12:00:00Z"));

    const dates = extractDates("Grove 24-25 PE & Sports Grant Report");

    expect(assessCurrency(dates, peSportPremiumRequirement!)).toBe("outdated");
  });
});
