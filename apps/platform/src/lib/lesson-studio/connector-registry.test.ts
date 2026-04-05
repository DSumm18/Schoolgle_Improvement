import { describe, it, expect, beforeEach } from "vitest";
import {
  registerConnector,
  getConnector,
  listConnectors,
} from "./connector-registry";
import type {
  LessonConnector,
  ConnectorFetchOptions,
  LessonInput,
} from "./connector-registry";

describe("connector-registry", () => {
  // "manual" is auto-registered on import

  it("has manual connector registered by default", () => {
    const manual = getConnector("manual");
    expect(manual).toBeDefined();
    expect(manual!.id).toBe("manual");
    expect(manual!.label).toBe("Manual Text Entry");
    expect(manual!.supportsSearch).toBe(false);
  });

  it("listConnectors returns at least the manual connector", () => {
    const list = listConnectors();
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.some((c) => c.id === "manual")).toBe(true);
  });

  it("registerConnector adds a new connector", () => {
    const stub: LessonConnector = {
      id: "test-stub",
      label: "Test Stub",
      supportsSearch: false,
      async search() {
        return [];
      },
      async fetch(): Promise<LessonInput> {
        return {
          source: "test-stub",
          sourceId: "s1",
          title: "Test",
          subject: "Maths",
          keyStage: "KS2",
          objectives: [],
          activities: [],
          resources: [],
          keywords: [],
          misconceptions: [],
          rawText: "test",
          metadata: {},
        };
      },
    };

    registerConnector(stub);
    expect(getConnector("test-stub")).toBe(stub);
  });

  it("getConnector returns undefined for unknown id", () => {
    expect(getConnector("nonexistent")).toBeUndefined();
  });

  describe("manual connector", () => {
    it("fetch returns LessonInput from raw text", async () => {
      const manual = getConnector("manual")!;
      const result = await manual.fetch({
        rawText: "Fractions Lesson\nLearn about halves and quarters",
        subject: "Mathematics",
        keyStage: "KS1",
      });

      expect(result.source).toBe("manual");
      expect(result.title).toBe("Fractions Lesson");
      expect(result.subject).toBe("Mathematics");
      expect(result.keyStage).toBe("KS1");
      expect(result.rawText).toContain("halves and quarters");
    });

    it("fetch throws if rawText is empty", async () => {
      const manual = getConnector("manual")!;
      await expect(manual.fetch({ rawText: "" })).rejects.toThrow(
        "manual connector requires rawText"
      );
    });

    it("search returns empty array", async () => {
      const manual = getConnector("manual")!;
      const results = await manual.search({});
      expect(results).toEqual([]);
    });
  });
});
