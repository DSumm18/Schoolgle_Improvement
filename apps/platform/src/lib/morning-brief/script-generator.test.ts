/**
 * Script Generator Tests
 *
 * Tests the AI script generator with template fallback.
 * Run with: npx vitest run apps/platform/src/lib/morning-brief/script-generator.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { emptySection } from "./types";
import type { BriefSections } from "./types";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.OPENROUTER_API_KEY;
});

const testSections: BriefSections = {
  safeguarding: emptySection("Safeguarding module not yet connected."),
  estates: {
    rag: "amber",
    count: 2,
    items: [{ title: "Legionella test due", priority: "high", dueDate: "2026-04-09" }],
    summary: "2 overdue compliance checks.",
  },
  staffing: emptySection("No staff absences or training issues to report."),
  governance: emptySection("No upcoming governance meetings."),
  finance: emptySection("No financial alerts."),
  teaching: emptySection("Teaching data not yet connected."),
  ofsted: emptySection("No new evidence uploaded this week."),
};

describe("ScriptGenerator", () => {
  it("should export generateScript function", async () => {
    const mod = await import("./script-generator");
    expect(mod.generateScript).toBeDefined();
    expect(typeof mod.generateScript).toBe("function");
  });

  it("should use template fallback when no API key is set", async () => {
    const { generateScript } = await import("./script-generator");

    const script = await generateScript(
      "Grove House Primary",
      "David",
      "Wednesday 9 April 2026",
      testSections,
    );

    expect(script).toContain("Good morning David");
    expect(script).toContain("Grove House Primary");
    expect(script).toContain("Have a good day");
  });

  it("should call OpenRouter when API key is set", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: "Good morning David. Here's your Grove House Primary briefing for today. Everything looks good. Have a good day.",
          },
        }],
      }),
    });

    vi.resetModules();
    const { generateScript } = await import("./script-generator");

    const script = await generateScript(
      "Grove House Primary",
      "David",
      "Wednesday 9 April 2026",
      testSections,
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
    expect(script).toContain("Good morning David");
  });

  it("should fall back to template on API failure", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";

    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    vi.resetModules();
    const { generateScript } = await import("./script-generator");

    const script = await generateScript(
      "Grove House Primary",
      "David",
      "Wednesday 9 April 2026",
      testSections,
    );

    // Should still produce a valid script via template
    expect(script).toContain("Good morning David");
    expect(script).toContain("Have a good day");
  });

  it("should skip empty sections in template fallback", async () => {
    const { generateScript } = await import("./script-generator");

    const script = await generateScript(
      "Test School",
      "Head",
      "Monday 7 April 2026",
      {
        safeguarding: emptySection("Safeguarding module not yet connected."),
        estates: emptySection("All estates checks up to date."),
        staffing: emptySection("No staff absences or training issues to report."),
        governance: emptySection("No upcoming governance meetings."),
        finance: emptySection("No financial alerts."),
        teaching: emptySection("Teaching data not yet connected."),
        ofsted: emptySection("No new evidence uploaded this week."),
      },
    );

    // Should NOT mention modules marked "not yet connected"
    expect(script).not.toContain("Safeguarding module not yet");
    expect(script).not.toContain("Teaching data not yet");
  });
});
