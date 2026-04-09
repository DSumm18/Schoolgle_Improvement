/**
 * Morning Brief Assembler Tests
 *
 * Tests the data assembly logic for morning briefs.
 * Run with: npx vitest run apps/platform/src/lib/morning-brief/assembler.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Build a chainable mock that supports Supabase's fluent API
function createChainMock(): any {
  const resolved = { data: [], error: null };
  const chain: any = {};

  chain.then = (resolve: any, reject?: any) =>
    Promise.resolve(resolved).then(resolve, reject);

  const methods = [
    "eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike",
    "is", "in", "contains", "containedBy", "filter",
    "not", "or", "order", "limit", "range", "select",
    "single", "maybeSingle",
  ];

  for (const method of methods) {
    chain[method] = (..._args: any[]) => chain;
  }

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
  });

  describe("assembleBrief", () => {
    it("should return all 7 spec sections", async () => {
      const { assembleBrief } = await import("./assembler");
      const result = await assembleBrief("org-123");

      expect(result).toBeDefined();
      expect(result.organizationId).toBe("org-123");
      expect(result.generatedAt).toBeDefined();
      expect(result.sections).toBeDefined();

      // All 7 spec sections present
      expect(result.sections.safeguarding).toBeDefined();
      expect(result.sections.estates).toBeDefined();
      expect(result.sections.staffing).toBeDefined();
      expect(result.sections.governance).toBeDefined();
      expect(result.sections.finance).toBeDefined();
      expect(result.sections.teaching).toBeDefined();
      expect(result.sections.ofsted).toBeDefined();
    });

    it("should include RAG status for each section", async () => {
      const { assembleBrief } = await import("./assembler");
      const result = await assembleBrief("org-123");

      for (const key of Object.keys(result.sections)) {
        const section = result.sections[key as keyof typeof result.sections];
        expect(["green", "amber", "red"]).toContain(section.rag);
      }
    });

    it("should include summary text for each section", async () => {
      const { assembleBrief } = await import("./assembler");
      const result = await assembleBrief("org-123");

      for (const key of Object.keys(result.sections)) {
        const section = result.sections[key as keyof typeof result.sections];
        expect(typeof section.summary).toBe("string");
        expect(section.summary.length).toBeGreaterThan(0);
      }
    });

    it("should include headline summary text", async () => {
      const { assembleBrief } = await import("./assembler");
      const result = await assembleBrief("org-123");

      expect(result.headline).toBeDefined();
      expect(typeof result.headline).toBe("string");
      expect(result.headline.length).toBeGreaterThan(0);
    });

    it("should handle empty data gracefully", async () => {
      const { assembleBrief } = await import("./assembler");
      const result = await assembleBrief("org-empty");

      // Stub sections should return zero counts
      expect(result.sections.safeguarding.count).toBe(0);
      expect(result.sections.teaching.count).toBe(0);
    });
  });

  describe("buildHeadline", () => {
    it("should export buildHeadline as a utility", async () => {
      const mod = await import("./assembler");
      expect(mod.buildHeadline).toBeDefined();
    });

    it("should produce an all-clear headline when everything is green", async () => {
      const { buildHeadline } = await import("./assembler");
      const { emptySection } = await import("./types");

      const headline = buildHeadline({
        safeguarding: emptySection(),
        estates: emptySection(),
        staffing: emptySection(),
        governance: emptySection(),
        finance: emptySection(),
        teaching: emptySection(),
        ofsted: emptySection(),
      });
      expect(headline).toContain("clear");
    });

    it("should highlight red sections in headline", async () => {
      const { buildHeadline } = await import("./assembler");
      const { emptySection } = await import("./types");

      const headline = buildHeadline({
        safeguarding: emptySection(),
        estates: {
          rag: "red",
          count: 3,
          items: [{ title: "Fire alarm test overdue", priority: "critical" }],
          summary: "3 overdue compliance checks.",
        },
        staffing: emptySection(),
        governance: emptySection(),
        finance: emptySection(),
        teaching: emptySection(),
        ofsted: emptySection(),
      });
      expect(headline.toLowerCase()).toMatch(/estates|attention|urgent/);
    });
  });
});
