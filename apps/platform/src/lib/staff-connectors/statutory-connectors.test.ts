import { describe, expect, it } from "vitest";
import {
  getAllStatutoryConnectors,
  getConnectorById,
  getConnectorsByCategory,
} from "./statutory-connectors";
import {
  analyseStaffImpact,
  checkConnectorCoverage,
  getExpiringConnectors,
} from "./connector-service";
import type { StaffConnector } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const today = new Date();

function daysFromNow(days: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

const dslType = getAllStatutoryConnectors().find((c) => c.id === "dsl")!;
const firstAiderType = getAllStatutoryConnectors().find((c) => c.id === "first-aider")!;
const fireMarshallType = getAllStatutoryConnectors().find((c) => c.id === "fire-marshal")!;

const makeConnector = (
  overrides: Partial<StaffConnector> & Pick<StaffConnector, "staff_id" | "connector_type_id" | "staff_name">,
): StaffConnector => ({
  id: `connector-${Math.random()}`,
  organization_id: "org-1",
  status: "active",
  assigned_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────────
// Registry tests
// ─────────────────────────────────────────────────────────────────────────────

describe("getAllStatutoryConnectors", () => {
  it("returns at least 15 statutory connectors", () => {
    const connectors = getAllStatutoryConnectors();
    expect(connectors.length).toBeGreaterThanOrEqual(15);
  });

  it("includes DSL, SENCO, First Aider, DPO", () => {
    const ids = getAllStatutoryConnectors().map((c) => c.id);
    expect(ids).toContain("dsl");
    expect(ids).toContain("senco");
    expect(ids).toContain("first-aider");
    expect(ids).toContain("dpo");
  });

  it("every statutory connector has a name and category", () => {
    for (const c of getAllStatutoryConnectors()) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.category).toBeTruthy();
    }
  });
});

describe("getConnectorsByCategory", () => {
  it("returns only safeguarding connectors when filtering by safeguarding", () => {
    const results = getConnectorsByCategory("safeguarding");
    expect(results.length).toBeGreaterThan(0);
    for (const c of results) {
      expect(c.category).toBe("safeguarding");
    }
  });

  it("returns DSL in safeguarding category", () => {
    const ids = getConnectorsByCategory("safeguarding").map((c) => c.id);
    expect(ids).toContain("dsl");
  });

  it("returns SENCO in send category", () => {
    const ids = getConnectorsByCategory("send").map((c) => c.id);
    expect(ids).toContain("senco");
  });
});

describe("getConnectorById", () => {
  it("returns the correct connector for a known id", () => {
    const dsl = getConnectorById("dsl");
    expect(dsl).toBeDefined();
    expect(dsl!.name).toMatch(/Designated Safeguarding Lead/);
  });

  it("returns undefined for an unknown id", () => {
    expect(getConnectorById("nonexistent-id")).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkConnectorCoverage tests
// ─────────────────────────────────────────────────────────────────────────────

describe("checkConnectorCoverage", () => {
  it("returns a CRITICAL gap when no DSL is assigned", () => {
    const gaps = checkConnectorCoverage([], [dslType], 200);
    const criticalGap = gaps.find(
      (g) => g.connectorType.id === "dsl" && g.severity === "critical",
    );
    expect(criticalGap).toBeDefined();
    expect(criticalGap!.currentHolders).toHaveLength(0);
  });

  it("returns a WARNING when first aider ratio is too low (1 for 420 pupils)", () => {
    const oneFirstAider = makeConnector({
      staff_id: "staff-1",
      connector_type_id: "first-aider",
      staff_name: "Mrs Jones",
    });

    const gaps = checkConnectorCoverage([oneFirstAider], [firstAiderType], 420);
    const ratioWarning = gaps.find(
      (g) => g.connectorType.id === "first-aider" && g.severity === "warning",
    );
    expect(ratioWarning).toBeDefined();
    // Need ceiling(420/100) = 5 first aiders, only have 1
    expect(ratioWarning!.requiredCount).toBe(5);
  });

  it("returns INFO when training expires within 60 days", () => {
    const expiringSoon = makeConnector({
      staff_id: "staff-2",
      connector_type_id: "fire-marshal",
      staff_name: "Mr Patel",
      training_expires_at: daysFromNow(30),
    });

    const gaps = checkConnectorCoverage([expiringSoon], [fireMarshallType], 200);
    const infoGap = gaps.find(
      (g) => g.connectorType.id === "fire-marshal" && g.severity === "info",
    );
    expect(infoGap).toBeDefined();
    expect(infoGap!.message).toMatch(/30 day/);
    expect(infoGap!.message).toMatch(/Mr Patel/);
  });

  it("returns no gap when training expires in more than 60 days", () => {
    const notExpiringSoon = makeConnector({
      staff_id: "staff-2",
      connector_type_id: "fire-marshal",
      staff_name: "Mr Patel",
      training_expires_at: daysFromNow(90),
    });

    const gaps = checkConnectorCoverage([notExpiringSoon], [fireMarshallType], 200);
    const infoGap = gaps.find(
      (g) => g.connectorType.id === "fire-marshal" && g.severity === "info",
    );
    expect(infoGap).toBeUndefined();
  });

  it("returns empty array when all connectors are covered", () => {
    // 5 first aiders for 420 pupils satisfies 1:100 ratio
    const firstAiders: StaffConnector[] = Array.from({ length: 5 }, (_, i) =>
      makeConnector({
        staff_id: `staff-fa-${i}`,
        connector_type_id: "first-aider",
        staff_name: `First Aider ${i + 1}`,
      }),
    );

    const gaps = checkConnectorCoverage(firstAiders, [firstAiderType], 420);
    // No gaps — no warning or critical
    const ratioIssue = gaps.find(
      (g) => g.connectorType.id === "first-aider" && g.severity !== "info",
    );
    expect(ratioIssue).toBeUndefined();
  });

  it("does not flag the DSL gap when a DSL is assigned", () => {
    const dsl = makeConnector({
      staff_id: "staff-dsl",
      connector_type_id: "dsl",
      staff_name: "Ms Smith",
    });

    const gaps = checkConnectorCoverage([dsl], [dslType], 200);
    const criticalGap = gaps.find(
      (g) => g.connectorType.id === "dsl" && g.severity === "critical",
    );
    expect(criticalGap).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// analyseStaffImpact tests
// ─────────────────────────────────────────────────────────────────────────────

describe("analyseStaffImpact", () => {
  const targetStaffId = "staff-target";

  const dslConnector = makeConnector({
    staff_id: targetStaffId,
    connector_type_id: "dsl",
    staff_name: "Mrs Jones",
  });

  const fireConnector = makeConnector({
    staff_id: targetStaffId,
    connector_type_id: "fire-marshal",
    staff_name: "Mrs Jones",
  });

  it("identifies all connectors held by the target staff member", () => {
    const impact = analyseStaffImpact(
      targetStaffId,
      [dslConnector, fireConnector],
      [dslType, fireMarshallType],
      [dslConnector, fireConnector],
    );

    expect(impact.staffName).toBe("Mrs Jones");
    expect(impact.connectors).toHaveLength(2);

    const connectorIds = impact.connectors.map((c) => c.connector.id);
    expect(connectorIds).toContain("dsl");
    expect(connectorIds).toContain("fire-marshal");
  });

  it("marks connectors as CRITICAL when no alternatives exist", () => {
    const impact = analyseStaffImpact(
      targetStaffId,
      [dslConnector],
      [dslType],
      [dslConnector], // only the target staff holds DSL
    );

    const dslImpact = impact.connectors.find((c) => c.connector.id === "dsl");
    expect(dslImpact).toBeDefined();
    expect(dslImpact!.severity).toBe("critical");
    expect(dslImpact!.alternatives).toHaveLength(0);
  });

  it("finds alternatives from other staff", () => {
    const deputyDslConnector = makeConnector({
      staff_id: "staff-deputy",
      connector_type_id: "dsl",
      staff_name: "Mr Smith",
    });

    const allConnectors = [dslConnector, deputyDslConnector];

    const impact = analyseStaffImpact(
      targetStaffId,
      [dslConnector],
      [dslType],
      allConnectors,
    );

    const dslImpact = impact.connectors.find((c) => c.connector.id === "dsl");
    expect(dslImpact!.severity).toBe("warning");
    expect(dslImpact!.alternatives).toContain("Mr Smith");
  });

  it("returns empty connectors array for staff with no connectors", () => {
    const impact = analyseStaffImpact(
      "staff-nobody",
      [],
      [dslType],
      [],
    );

    expect(impact.connectors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getExpiringConnectors tests
// ─────────────────────────────────────────────────────────────────────────────

describe("getExpiringConnectors", () => {
  it("returns connectors expiring within the specified window", () => {
    const expiring = makeConnector({
      staff_id: "staff-1",
      connector_type_id: "fire-marshal",
      staff_name: "Mr Patel",
      training_expires_at: daysFromNow(20),
    });

    const notExpiring = makeConnector({
      staff_id: "staff-2",
      connector_type_id: "dsl",
      staff_name: "Ms Ali",
      training_expires_at: daysFromNow(90),
    });

    const result = getExpiringConnectors([expiring, notExpiring], 30);
    expect(result).toHaveLength(1);
    expect(result[0].staff_name).toBe("Mr Patel");
  });

  it("includes already-expired connectors in the results", () => {
    const expired = makeConnector({
      staff_id: "staff-3",
      connector_type_id: "first-aider",
      staff_name: "Ms Brown",
      training_expires_at: daysFromNow(-10), // expired 10 days ago
    });

    const result = getExpiringConnectors([expired], 30);
    expect(result).toHaveLength(1);
  });

  it("returns empty array when no connectors expire within the window", () => {
    const fine = makeConnector({
      staff_id: "staff-4",
      connector_type_id: "dsl",
      staff_name: "Mr Green",
      training_expires_at: daysFromNow(180),
    });

    expect(getExpiringConnectors([fine], 30)).toHaveLength(0);
  });

  it("returns empty array for connectors with no training_expires_at set", () => {
    const noExpiry = makeConnector({
      staff_id: "staff-5",
      connector_type_id: "senco",
      staff_name: "Mrs Davies",
      // no training_expires_at
    });

    expect(getExpiringConnectors([noExpiry], 30)).toHaveLength(0);
  });
});
