import { describe, it, expect } from "vitest";
import {
  getDefaultSchoolDay,
  getPeriodsForKeyStage,
  getLunchSlot,
  getKeyStageForYearGroup,
} from "./timetable-config";

describe("timetable-config", () => {
  it("default school day has 5 teaching periods, starts 08:45, ends 15:15", () => {
    const config = getDefaultSchoolDay();
    expect(config.schoolStart).toBe("08:45");
    expect(config.schoolEnd).toBe("15:15");
    const teachingPeriods = config.periods.filter((p) => p.type === "teaching");
    expect(teachingPeriods).toHaveLength(5);
  });

  it("KS2 gets all 5 periods", () => {
    const config = getDefaultSchoolDay();
    const periods = getPeriodsForKeyStage(config, "KS2");
    expect(periods).toHaveLength(5);
  });

  it("EYFS gets 3 flexible blocks with 'Morning' in first label", () => {
    const config = getDefaultSchoolDay();
    const periods = getPeriodsForKeyStage(config, "EYFS");
    expect(periods).toHaveLength(3);
    expect(periods[0].label).toContain("Morning");
  });

  it("Year 1 lunch is 12:00-12:30", () => {
    const config = getDefaultSchoolDay();
    const slot = getLunchSlot(config, "Year 1");
    expect(slot.start).toBe("12:00");
    expect(slot.end).toBe("12:30");
  });

  it("Year 5 lunch is 12:30-13:00", () => {
    const config = getDefaultSchoolDay();
    const slot = getLunchSlot(config, "Year 5");
    expect(slot.start).toBe("12:30");
    expect(slot.end).toBe("13:00");
  });

  it("config includes at least 1 break (Morning Break)", () => {
    const config = getDefaultSchoolDay();
    const breaks = config.breaks;
    expect(breaks.length).toBeGreaterThanOrEqual(1);
    const morningBreak = breaks.find((b) => b.label.toLowerCase().includes("morning"));
    expect(morningBreak).toBeDefined();
  });
});
