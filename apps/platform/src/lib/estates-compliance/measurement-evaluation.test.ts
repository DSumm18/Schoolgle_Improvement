import { describe, expect, it } from "vitest";
import { hasFailedComplianceMeasurement } from "./measurement-evaluation";

describe("hasFailedComplianceMeasurement", () => {
  it("forces failure when any structured reading fails", () => {
    expect(hasFailedComplianceMeasurement([
      { location: "Kitchen", value: 18.2, passed: true },
      { location: "Staff WC", value: 21.1, passed: false },
    ])).toBe(true);
  });

  it("allows all passing readings", () => {
    expect(hasFailedComplianceMeasurement([
      { location: "Kitchen", value: 18.2, passed: true },
      { location: "Staff WC", value: 52.4, passed: true },
    ])).toBe(false);
  });

  it("does not trust malformed values as failures", () => {
    expect(hasFailedComplianceMeasurement(null)).toBe(false);
    expect(hasFailedComplianceMeasurement([{ passed: "false" }])).toBe(false);
  });
});
