export interface ComplianceMeasurementResult {
  passed: boolean;
}

export function hasFailedComplianceMeasurement(
  measurements: unknown,
): boolean {
  if (!Array.isArray(measurements)) return false;
  return measurements.some(
    (measurement) =>
      typeof measurement === "object" &&
      measurement !== null &&
      "passed" in measurement &&
      measurement.passed === false,
  );
}
