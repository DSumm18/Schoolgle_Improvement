import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { oakConnector } from "./oak-connector";
import { getConnector } from "./connector-registry";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("oak-connector", () => {
  beforeEach(() => {
    vi.stubEnv("OAK_API_KEY", "test-key-123");
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is registered in the connector registry", () => {
    const connector = getConnector("oak");
    expect(connector).toBeDefined();
    expect(connector!.id).toBe("oak");
    expect(connector!.supportsSearch).toBe(true);
  });

  it("has correct label", () => {
    expect(oakConnector.label).toBe("Oak National Academy");
  });

  describe("search", () => {
    it("returns mapped search results", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          lessons: [
            {
              lessonSlug: "fractions-intro",
              lessonTitle: "Introduction to Fractions",
              subjectSlug: "maths",
              subjectTitle: "Mathematics",
              keyStageSlug: "ks2",
              keyStageTitle: "Key Stage 2",
              yearTitle: "Year 3",
              unitTitle: "Fractions",
            },
          ],
        }),
      });

      const results = await oakConnector.search({
        keyStage: "KS2",
        subject: "Mathematics",
        query: "fractions",
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        id: "fractions-intro",
        title: "Introduction to Fractions",
        subject: "Mathematics",
        keyStage: "Key Stage 2",
        yearGroup: "Year 3",
        snippet: "Unit: Fractions",
      });

      // Verify fetch was called with correct URL
      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain("/key-stages/ks2/subjects/mathematics/lessons");
      expect(callUrl).toContain("q=fractions");
    });

    it("sends Authorization header", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ lessons: [] }),
      });

      await oakConnector.search({ query: "test" });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe("Bearer test-key-123");
    });

    it("handles data wrapper format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              lessonSlug: "slug-1",
              lessonTitle: "Lesson 1",
              subjectSlug: "science",
              subjectTitle: "Science",
              keyStageSlug: "ks3",
              keyStageTitle: "Key Stage 3",
            },
          ],
        }),
      });

      const results = await oakConnector.search({ query: "cells" });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("slug-1");
    });

    it("throws on missing API key", async () => {
      vi.stubEnv("OAK_API_KEY", "");
      // Need to clear so it re-reads env
      await expect(
        oakConnector.search({ query: "test" })
      ).rejects.toThrow("OAK_API_KEY");
    });

    it("throws on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => "Forbidden",
      });

      await expect(
        oakConnector.search({ query: "test" })
      ).rejects.toThrow("Oak API 403");
    });
  });

  describe("fetch", () => {
    it("returns full LessonInput from lesson summary", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          lessonSlug: "fractions-intro",
          lessonTitle: "Introduction to Fractions",
          subjectSlug: "maths",
          subjectTitle: "Mathematics",
          keyStageSlug: "ks2",
          keyStageTitle: "Key Stage 2",
          yearTitle: "Year 3",
          unitTitle: "Fractions",
          pupilLessonOutcome:
            "I can identify and name unit fractions",
          lessonKeywords: [
            { keyword: "fraction", description: "A part of a whole" },
            { keyword: "numerator" },
          ],
          misconceptions: [
            {
              misconception: "Larger denominator means larger fraction",
              response: "The denominator shows how many equal parts",
            },
          ],
          lessonEquipmentAndResources: [{ equipment: "Fraction wall" }],
          starterQuiz: [
            {
              questionStem: "What is half of 10?",
              answers: [
                { answer: "5", correct: true },
                { answer: "2", correct: false },
              ],
            },
          ],
          exitQuiz: [
            {
              questionStem: "What fraction is shaded?",
              answers: [{ answer: "1/4", correct: true }],
            },
          ],
          videoTitle: "Understanding Fractions",
          transcriptSentences: [
            "Today we will learn about fractions.",
            "A fraction represents part of a whole.",
          ],
        }),
      });

      const result = await oakConnector.fetch({ query: "fractions-intro" });

      expect(result.source).toBe("oak");
      expect(result.sourceId).toBe("fractions-intro");
      expect(result.title).toBe("Introduction to Fractions");
      expect(result.subject).toBe("Mathematics");
      expect(result.keyStage).toBe("Key Stage 2");
      expect(result.yearGroup).toBe("Year 3");
      expect(result.objectives).toContain(
        "I can identify and name unit fractions"
      );
      expect(result.keywords).toEqual(["fraction", "numerator"]);
      expect(result.misconceptions[0]).toContain("Larger denominator");
      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].name).toBe("Fraction wall");
      expect(result.activities).toHaveLength(3); // starter, main, exit
      expect(result.rawText).toContain("Fractions");
      expect(result.metadata.licence).toBe("Open Government Licence v3.0");
    });

    it("handles data wrapper in response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            lessonSlug: "test-lesson",
            lessonTitle: "Test",
            subjectTitle: "Maths",
            keyStageTitle: "KS2",
          },
        }),
      });

      const result = await oakConnector.fetch({ query: "test-lesson" });
      expect(result.sourceId).toBe("test-lesson");
    });

    it("throws when no query provided", async () => {
      await expect(oakConnector.fetch({})).rejects.toThrow(
        "oak connector requires query"
      );
    });
  });
});
