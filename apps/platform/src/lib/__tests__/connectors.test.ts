import { describe, it, expect } from "vitest";
import {
  ConnectorCategory,
  ConnectorStatus,
  TaskFrequency,
  ComplianceStatus,
  CONNECTOR_CATEGORIES,
  SCOPE_TYPES,
} from "../connectors/types";

describe("Staff Connectors Types", () => {
  describe("CONNECTOR_CATEGORIES", () => {
    it("should have all required categories", () => {
      const values = CONNECTOR_CATEGORIES.map((c) => c.value);
      expect(values).toContain("safeguarding");
      expect(values).toContain("send");
      expect(values).toContain("health_safety");
      expect(values).toContain("data_governance");
      expect(values).toContain("curriculum");
      expect(values).toContain("estates");
      expect(values).toContain("custom");
      expect(values).toHaveLength(7);
    });

    it("should have valid colors for each category", () => {
      CONNECTOR_CATEGORIES.forEach((cat) => {
        expect(cat.color).toMatch(/^#[0-9a-f]{6}$/);
      });
    });

    it("should have labels and icons for each category", () => {
      CONNECTOR_CATEGORIES.forEach((cat) => {
        expect(cat.label).toBeTruthy();
        expect(cat.icon).toBeTruthy();
      });
    });
  });

  describe("SCOPE_TYPES", () => {
    it("should have all scope types", () => {
      const values = SCOPE_TYPES.map((s) => s.value);
      expect(values).toContain("whole_school");
      expect(values).toContain("key_stage");
      expect(values).toContain("year_group");
      expect(values).toContain("building");
      expect(values).toContain("department");
      expect(values).toContain("custom");
      expect(values).toHaveLength(6);
    });
  });

  describe("Type safety", () => {
    it("should allow valid connector categories", () => {
      const validCategories: ConnectorCategory[] = [
        "safeguarding",
        "send",
        "health_safety",
        "data_governance",
        "curriculum",
        "estates",
        "custom",
      ];
      expect(validCategories).toHaveLength(7);
    });

    it("should allow valid connector statuses", () => {
      const validStatuses: ConnectorStatus[] = [
        "active",
        "pending_training",
        "expired_training",
        "ended",
      ];
      expect(validStatuses).toHaveLength(4);
    });

    it("should allow valid task frequencies", () => {
      const validFreqs: TaskFrequency[] = [
        "daily",
        "weekly",
        "monthly",
        "termly",
        "yearly",
        "once",
      ];
      expect(validFreqs).toHaveLength(6);
    });

    it("should allow valid compliance statuses", () => {
      const validStatuses: ComplianceStatus[] = [
        "compliant",
        "at_risk",
        "expiring_soon",
        "non_compliant",
      ];
      expect(validStatuses).toHaveLength(4);
    });
  });
});
