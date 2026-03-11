/**
 * Vision AI Dispatcher Tests
 *
 * Tests the multi-module dispatch system that routes vision findings
 * to estates, helpdesk, asset register, COSHH, T&L, safeguarding, and H&S.
 *
 * Run with: npx vitest run apps/platform/src/lib/vision/dispatcher.test.ts
 */

import { describe, it, expect } from "vitest";
import { dispatchFindings, summariseDispatches } from "./dispatcher";
import type { VisionResult } from "./types";

function makeResult(
  items: Array<{
    category: string;
    name: string;
    condition: string;
    severity?: string;
  }>,
  issues: Array<{
    domain: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
  }> = [],
): VisionResult {
  return {
    items: items.map((item) => ({
      category: item.category,
      name: item.name,
      condition: item.condition as any,
      location: "test room",
      severity: (item.severity || "low") as any,
    })),
    compliance: {
      score: issues.length === 0 ? 100 : 50,
      issues: issues.map((issue) => ({
        domain: issue.domain,
        description: issue.description,
        severity: issue.severity,
        recommendation: "Fix it",
      })),
      passed: issues.length === 0,
    },
    summary: "",
    dispatches: [],
  };
}

describe("Vision Dispatcher", () => {
  describe("dispatchFindings", () => {
    it("should dispatch fire safety items to estates module", () => {
      const result = makeResult(
        [
          {
            category: "fire_safety",
            name: "Fire extinguisher",
            condition: "good",
          },
        ],
        [
          {
            domain: "fire_safety",
            description: "Extinguisher expired",
            severity: "high",
          },
        ],
      );

      const dispatches = dispatchFindings(result);

      expect(dispatches.length).toBeGreaterThan(0);
      const estatesDispatch = dispatches.find((d) => d.module === "estates");
      expect(estatesDispatch).toBeDefined();
      expect(estatesDispatch!.action).toBe("flag_raised");
    });

    it("should dispatch damage items to helpdesk module", () => {
      const result = makeResult(
        [{ category: "damage", name: "Broken window", condition: "poor" }],
        [
          {
            domain: "damage",
            description: "Window pane cracked",
            severity: "medium",
          },
        ],
      );

      const dispatches = dispatchFindings(result);

      const helpdeskDispatch = dispatches.find((d) => d.module === "helpdesk");
      expect(helpdeskDispatch).toBeDefined();
      expect(helpdeskDispatch!.action).toBe("ticket_created");
    });

    it("should dispatch chemical items to coshh module", () => {
      const result = makeResult(
        [
          {
            category: "chemical",
            name: "Cleaning fluid",
            condition: "present",
          },
        ],
        [
          {
            domain: "coshh",
            description: "Chemicals unlocked",
            severity: "low",
          },
        ],
      );

      const dispatches = dispatchFindings(result);

      const coshhDispatch = dispatches.find((d) => d.module === "coshh");
      expect(coshhDispatch).toBeDefined();
    });

    it("should dispatch trip hazards to h_and_s module", () => {
      const result = makeResult(
        [
          {
            category: "trip_hazard",
            name: "Trailing cable",
            condition: "poor",
          },
        ],
        [
          {
            domain: "trip_hazard",
            description: "Cable across walkway",
            severity: "medium",
          },
        ],
      );

      const dispatches = dispatchFindings(result);

      const hsDispatch = dispatches.find((d) => d.module === "h_and_s");
      expect(hsDispatch).toBeDefined();
    });

    it("should dispatch safeguarding items to safeguarding module when severity is high", () => {
      const result = makeResult(
        [
          {
            category: "safeguarding",
            name: "Hidden area",
            condition: "concern",
          },
        ],
        [
          {
            domain: "safeguarding",
            description: "Unsupervised blind spot",
            severity: "high",
          },
        ],
      );

      const dispatches = dispatchFindings(result);

      const sgDispatch = dispatches.find((d) => d.module === "safeguarding");
      expect(sgDispatch).toBeDefined();
    });

    it("should not dispatch safeguarding for low severity", () => {
      const result = makeResult(
        [{ category: "safeguarding", name: "Door", condition: "ok" }],
        [
          {
            domain: "safeguarding",
            description: "Minor sight line issue",
            severity: "low",
          },
        ],
      );

      const dispatches = dispatchFindings(result);

      const sgDispatch = dispatches.find(
        (d) => d.module === "safeguarding" && d.action === "flag_raised",
      );
      expect(sgDispatch).toBeUndefined();
    });

    it("should dispatch to multiple modules from a single scan", () => {
      const result = makeResult(
        [
          { category: "fire_exit", name: "Fire exit", condition: "blocked" },
          { category: "damage", name: "Ceiling tile", condition: "damaged" },
          { category: "trip_hazard", name: "Wet floor", condition: "hazard" },
        ],
        [
          {
            domain: "fire_exit",
            description: "Fire exit blocked",
            severity: "critical",
          },
          {
            domain: "damage",
            description: "Ceiling tile falling",
            severity: "high",
          },
          {
            domain: "wet_floor",
            description: "No wet floor sign",
            severity: "medium",
          },
        ],
      );

      const dispatches = dispatchFindings(result);

      const modules = new Set(dispatches.map((d) => d.module));
      expect(modules.size).toBeGreaterThanOrEqual(2);
    });

    it("should return no_issues dispatch for clean scan", () => {
      const result = makeResult([
        { category: "classroom_layout", name: "Desks", condition: "good" },
      ]);

      const dispatches = dispatchFindings(result);

      expect(
        dispatches.some(
          (d) => d.action === "no_issues" || d.action === "updated",
        ),
      ).toBe(true);
    });

    it("should handle empty results", () => {
      const result = makeResult([], []);
      const dispatches = dispatchFindings(result);
      expect(dispatches).toEqual([]);
    });
  });

  describe("summariseDispatches", () => {
    it("should include room name in summary", () => {
      const dispatches = [
        {
          module: "estates" as const,
          action: "no_issues",
          detail: "All clear",
        },
      ];

      const summary = summariseDispatches(dispatches, "Room 101");
      expect(summary).toContain("Room 101");
    });

    it("should describe issues when present", () => {
      const dispatches = [
        {
          module: "helpdesk" as const,
          action: "ticket_created",
          detail: "Broken window detected",
        },
      ];

      const summary = summariseDispatches(dispatches);
      expect(summary).toContain("issue");
      expect(summary).toContain("helpdesk");
    });

    it("should handle no dispatches", () => {
      const summary = summariseDispatches([]);
      expect(summary).toContain("no items detected");
    });

    it("should handle all-clear scan", () => {
      const dispatches = [
        {
          module: "estates" as const,
          action: "no_issues",
          detail: "Room scanned: 5 items, no issues",
        },
      ];

      const summary = summariseDispatches(dispatches);
      expect(summary).toContain("all clear");
    });
  });
});
