/**
 * Morning Brief TTS Tests
 *
 * Tests Fish Audio text-to-speech integration and script generation.
 * Run with: npx vitest run apps/platform/src/lib/morning-brief/tts.test.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { emptySection } from "./types";

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
    it("should convert sections into a spoken script", async () => {
      const { briefToScript } = await import("./tts");

      const script = briefToScript(
        {
          safeguarding: emptySection("Safeguarding module not yet connected."),
          estates: emptySection("All estates checks up to date."),
          staffing: emptySection("No staff absences or training issues to report."),
          governance: {
            rag: "green",
            count: 1,
            items: [{ title: "Board meeting Thursday", priority: "low" }],
            summary: "1 governance meeting this week.",
          },
          finance: emptySection("No financial alerts."),
          teaching: emptySection("Teaching data not yet connected."),
          ofsted: emptySection("No new evidence uploaded this week."),
        },
        "All clear this morning.",
      );

      expect(typeof script).toBe("string");
      expect(script.length).toBeGreaterThan(20);
      expect(script).toContain("Good morning");
    });

    it("should mention urgent items in the script", async () => {
      const { briefToScript } = await import("./tts");

      const script = briefToScript(
        {
          safeguarding: emptySection(),
          estates: {
            rag: "red",
            count: 3,
            items: [{ title: "Fire alarm overdue", priority: "critical" }],
            summary: "3 overdue compliance checks.",
          },
          staffing: emptySection(),
          governance: emptySection(),
          finance: {
            rag: "amber",
            count: 1,
            items: [{ title: "Budget risk", priority: "medium" }],
            summary: "1 financial risk flagged.",
          },
          teaching: emptySection(),
          ofsted: emptySection(),
        },
        "2 areas need attention: estates, finance.",
      );

      expect(script).toContain("Estates");
      expect(script).toContain("Fire alarm overdue");
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
