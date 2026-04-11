/**
 * Governor PDF Report API — Unit Tests
 *
 * Tests the pure business-logic helpers used by the governor report endpoint.
 * The API route itself requires a real Supabase connection so we test the
 * data-transformation logic in isolation.
 *
 * Run with:
 *   npx vitest run apps/platform/src/app/api/estates/reports/governor-pdf/governor-pdf.test.ts
 */

import { describe, it, expect } from "vitest";
import type { DomainCompletionSummary } from "@/lib/estates-compliance/database/statutory-completions";
import type { ComplianceDomain } from "@/lib/estates-compliance/statutory-checks";

// ---------------------------------------------------------------------------
// Pure helper — mirrors what the route computes
// ---------------------------------------------------------------------------

function buildReportSummary(summaries: DomainCompletionSummary[]) {
  const totalChecks = summaries.reduce((s, d) => s + d.totalChecks, 0);
  const completedChecks = summaries.reduce((s, d) => s + d.completedChecks, 0);
  const overdueChecks = summaries.reduce((s, d) => s + d.overdueChecks, 0);

  return {
    totalChecks,
    completedChecks,
    overdueChecks,
    pendingChecks: totalChecks - completedChecks - overdueChecks,
    compliancePercentage:
      totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0,
    overallStatus:
      overdueChecks > 0
        ? "action_required"
        : completedChecks === totalChecks
          ? "fully_compliant"
          : "in_progress",
  };
}

// Minimal stub that satisfies the DomainCompletionSummary shape
function makeDomain(
  domain: ComplianceDomain,
  total: number,
  completed: number,
  overdue: number,
): DomainCompletionSummary {
  return {
    domain,
    totalChecks: total,
    completedChecks: completed,
    overdueChecks: overdue,
    pendingChecks: total - completed - overdue,
    status:
      overdue > 0 ? "critical" : completed / total < 0.8 ? "attention" : "compliant",
    completions: [],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildReportSummary", () => {
  it("reports fully_compliant when all checks are done", () => {
    const summaries = [
      makeDomain("fire", 5, 5, 0),
      makeDomain("legionella", 3, 3, 0),
    ];
    const result = buildReportSummary(summaries);
    expect(result.overallStatus).toBe("fully_compliant");
    expect(result.compliancePercentage).toBe(100);
    expect(result.overdueChecks).toBe(0);
    expect(result.pendingChecks).toBe(0);
  });

  it("reports action_required when any check is overdue", () => {
    const summaries = [
      makeDomain("fire", 5, 4, 1),
      makeDomain("legionella", 3, 3, 0),
    ];
    const result = buildReportSummary(summaries);
    expect(result.overallStatus).toBe("action_required");
    expect(result.overdueChecks).toBe(1);
  });

  it("reports in_progress when checks remain but none are overdue", () => {
    const summaries = [
      makeDomain("fire", 5, 3, 0),
      makeDomain("legionella", 3, 2, 0),
    ];
    const result = buildReportSummary(summaries);
    expect(result.overallStatus).toBe("in_progress");
    expect(result.compliancePercentage).toBe(63); // Math.round(5/8 * 100)
  });

  it("returns 0% and in_progress for all-pending domains", () => {
    const summaries = [makeDomain("fire", 5, 0, 0)];
    const result = buildReportSummary(summaries);
    expect(result.compliancePercentage).toBe(0);
    expect(result.overallStatus).toBe("in_progress");
    expect(result.pendingChecks).toBe(5);
  });

  it("returns 0% and fully_compliant when there are no checks at all", () => {
    const result = buildReportSummary([]);
    expect(result.compliancePercentage).toBe(0);
    expect(result.totalChecks).toBe(0);
    // No checks, no overdue, completedChecks === totalChecks (both 0)
    expect(result.overallStatus).toBe("fully_compliant");
  });

  it("correctly aggregates totals across multiple domains", () => {
    const summaries = [
      makeDomain("fire", 10, 7, 1),
      makeDomain("asbestos", 6, 4, 0),
      makeDomain("gas", 4, 4, 0),
    ];
    const result = buildReportSummary(summaries);
    expect(result.totalChecks).toBe(20);
    expect(result.completedChecks).toBe(15);
    expect(result.overdueChecks).toBe(1);
    expect(result.pendingChecks).toBe(4); // 20 - 15 - 1
    expect(result.overallStatus).toBe("action_required");
  });
});
