import { describe, expect, it } from "vitest";
import {
  normaliseClassName,
  normaliseGender,
  normalisePupilName,
  normaliseSendStatus,
  normaliseYearGroup,
  normaliseYearGroupLabel,
  yearGroupLabelToNumber,
} from "./pupil-data-normalise";

describe("pupil data normalisation", () => {
  it("tidies pupil names without shouting them", () => {
    expect(normalisePupilName("  ava  ")).toBe("Ava");
    expect(normalisePupilName("mc kenna")).toBe("Mc Kenna");
    expect(normalisePupilName("O'NEILL")).toBe("O'Neill");
  });

  it("tidies year groups and class names", () => {
    expect(normaliseYearGroup("year 4")).toBe("4");
    expect(normaliseYearGroup(" y4 ")).toBe("4");
    expect(normaliseYearGroupLabel(" y4 ")).toBe("Year 4");
    expect(yearGroupLabelToNumber("Reception")).toBe(0);
    expect(normaliseClassName(" 4 b ")).toBe("4B");
    expect(normaliseClassName("year 4 b")).toBe("4B");
    expect(normaliseClassName("4-b")).toBe("4B");
    expect(normaliseClassName("4:00 am")).toBe("4A");
    expect(normaliseClassName("oak class")).toBe("Oak Class");
  });

  it("tidies common demographic codes", () => {
    expect(normaliseGender(" female ")).toBe("F");
    expect(normaliseGender("boy")).toBe("M");
    expect(normaliseSendStatus(" ehcp ")).toBe("E");
    expect(normaliseSendStatus("sen support")).toBe("K");
  });
});
