/**
 * Morning Brief TTS Tests
 *
 * Tests Fish Audio text-to-speech integration for morning briefs.
 * Run with: npx vitest run apps/platform/src/lib/morning-brief/tts.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Morning Brief TTS", () => {
  describe("Module exports", () => {
    it("should export generateBriefAudio function", async () => {
      const mod = await import("./tts");
      expect(mod.generateBriefAudio).toBeDefined();
      expect(typeof mod.generateBriefAudio).toBe("function");
    });

    it("should export briefToScript function", async () => {
      const mod = await import("./tts");
      expect(mod.briefToScript).toBeDefined();
      expect(typeof mod.briefToScript).toBe("function");
    });
  });

  describe("briefToScript", () => {
    it("should convert a brief data object into a spoken script", async () => {
      const { briefToScript } = await import("./tts");

      const script = briefToScript({
        organizationId: "org-1",
        generatedAt: "2026-04-08T06:00:00Z",
        headline: "All clear this morning.",
        sections: {
          compliance: { rag: "green", count: 0, items: [] },
          tasks: { rag: "green", count: 2, items: [{ title: "Review budget", priority: "medium" }] },
          risks: { rag: "green", count: 0, items: [] },
          staffing: { rag: "green", count: 0, items: [] },
          calendar: { rag: "green", count: 1, items: [{ title: "Staff meeting at 9am", priority: "low" }] },
        },
      });

      expect(typeof script).toBe("string");
      expect(script.length).toBeGreaterThan(20);
      expect(script).toContain("Good morning");
      expect(script).toContain("clear");
    });

    it("should mention urgent items in the script", async () => {
      const { briefToScript } = await import("./tts");

      const script = briefToScript({
        organizationId: "org-1",
        generatedAt: "2026-04-08T06:00:00Z",
        headline: "3 compliance items need attention.",
        sections: {
          compliance: {
            rag: "red",
            count: 3,
            items: [{ title: "DBS check overdue", priority: "critical" }],
          },
          tasks: { rag: "green", count: 0, items: [] },
          risks: { rag: "amber", count: 1, items: [{ title: "Budget risk", priority: "medium" }] },
          staffing: { rag: "green", count: 0, items: [] },
          calendar: { rag: "green", count: 0, items: [] },
        },
      });

      expect(script).toContain("compliance");
      expect(script).toContain("DBS check overdue");
    });
  });

  describe("generateBriefAudio", () => {
    it("should return null when FISH_AUDIO_API_KEY is not set", async () => {
      delete process.env.FISH_AUDIO_API_KEY;
      const { generateBriefAudio } = await import("./tts");

      const result = await generateBriefAudio("Hello world");
      expect(result).toBeNull();
    });

    it("should call Fish Audio API with correct parameters when key is set", async () => {
      process.env.FISH_AUDIO_API_KEY = "test-key-123";

      const audioBuffer = new ArrayBuffer(100);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(audioBuffer),
      });

      // Re-import to pick up env change
      vi.resetModules();
      const { generateBriefAudio } = await import("./tts");
      const result = await generateBriefAudio("Good morning, here is your brief.");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.fish.audio/v1/tts",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-key-123",
          }),
        }),
      );

      expect(result).toBeDefined();
    });

    it("should return null on API failure without throwing", async () => {
      process.env.FISH_AUDIO_API_KEY = "test-key-123";

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      vi.resetModules();
      const { generateBriefAudio } = await import("./tts");
      const result = await generateBriefAudio("Test text");

      expect(result).toBeNull();
    });
  });
});
