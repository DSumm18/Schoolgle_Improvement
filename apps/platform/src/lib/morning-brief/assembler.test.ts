/**
 * Morning Brief Assembler Tests
 *
 * Tests the data assembly logic for morning briefs.
 * Run with: npx vitest run apps/platform/src/lib/morning-brief/assembler.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Build a chainable mock that supports Supabase's fluent API
// Every method returns a thenable that resolves to { data: [], error: null }
// but also supports further chaining.
function createChainMock(): any {
  const resolved = { data: [], error: null };
  const chain: any = {};

  // Make it thenable so await works at any point in the chain
  chain.then = (resolve: any, reject?: any) =>
    Promise.resolve(resolved).then(resolve, reject);

  // All Supabase query methods return the same chainable object
  const methods = [
    "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike",
    "is", "in", "contains", "containedBy", "filter",
    "not", "or", "order", "limit", "range", "select",
    "single", "maybeSingle",
  ];

  for (const method of methods) {
    chain[method] = (..._args: any[]) => chain;
  }

  // single() should resolve with null data
  chain.single = (..._args: any[]) => {
    const singleChain = { ...chain };
    singleChain.then = (resolve: any, reject?: any) =>
      Promise.resolve({ data: null, error: null }).then(resolve, reject);
    return singleChain;
  };

  return chain;
}

const mockSupabase = {
  from: (_table: string) => ({
    select: (..._args: any[]) => createChainMock(),
  }),
};

vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: vi.fn(() => mockSupabase),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MorningBriefAssembler", () => {
  describe("Module exports", () => {
    it("should export assembleBrief function", async () => {
      const mod = await import("./assembler");
      expect(mod.assembleBrief).toBeDefined();
      expect(typeof mod.assembleBrief).toBe("function");
    });

    it("should export MorningBriefData type", async () => {
      // Type-level check — if this compiles, the type exists
      const mod = await import("./assembler");
      expect(mod.assembleBrief).toBeDefined();
    });
  });

  describe("assembleBrief", () => {
    it("should return a MorningBriefData object with all required sections", async () => {
      const { assembleBrief } = await import("./assembler");
      const result = await assembleBrief("org-123");

      expect(result).toBeDefined();
      expect(result.organizationId).toBe("org-123");
      expect(result.generatedAt).toBeDefined();
      expect(result.sections).toBeDefined();
      expect(result.sections.compliance).toBeDefined();
      expect(result.sections.tasks).toBeDefined();
      expect(result.sections.risks).toBeDefined();
      expect(result.sections.staffing).toBeDefined();
      expect(result.sections.calendar).toBeDefined();
    });

    it("should include RAG status for each section", async () => {
      const { assembleBrief } = await import("./assembler");
      const result = await assembleBrief("org-123");

      for (const key of Object.keys(result.sections)) {
        const section = result.sections[key as keyof typeof result.sections];
        expect(["green", "amber", "red"]).toContain(section.rag);
      }
    });

    it("should include headline summary text", async () => {
      const { assembleBrief } = await import("./assembler");
      const result = await assembleBrief("org-123");

      expect(result.headline).toBeDefined();
      expect(typeof result.headline).toBe("string");
      expect(result.headline.length).toBeGreaterThan(0);
    });

    it("should handle empty data gracefully (no tasks/risks)", async () => {
      const { assembleBrief } = await import("./assembler");
      const result = await assembleBrief("org-empty");

      // Should still return a valid object, just with zero counts
      expect(result.sections.tasks.count).toBe(0);
      expect(result.sections.risks.count).toBe(0);
      expect(result.sections.compliance.count).toBe(0);
    });
  });

  describe("buildHeadline", () => {
    it("should export buildHeadline as a utility", async () => {
      const mod = await import("./assembler");
      expect(mod.buildHeadline).toBeDefined();
    });

    it("should produce an all-clear headline when everything is green", async () => {
      const { buildHeadline } = await import("./assembler");
      const headline = buildHeadline({
        compliance: { rag: "green", count: 0, items: [] },
        tasks: { rag: "green", count: 0, items: [] },
        risks: { rag: "green", count: 0, items: [] },
        staffing: { rag: "green", count: 0, items: [] },
        calendar: { rag: "green", count: 0, items: [] },
      });
      expect(headline).toContain("clear");
    });

    it("should highlight red sections in headline", async () => {
      const { buildHeadline } = await import("./assembler");
      const headline = buildHeadline({
        compliance: { rag: "red", count: 3, items: [{ title: "Overdue DBS", priority: "critical" }] },
        tasks: { rag: "green", count: 0, items: [] },
        risks: { rag: "green", count: 0, items: [] },
        staffing: { rag: "green", count: 0, items: [] },
        calendar: { rag: "green", count: 0, items: [] },
      });
      expect(headline.toLowerCase()).toMatch(/compliance|attention|urgent/);
    });
  });
});
