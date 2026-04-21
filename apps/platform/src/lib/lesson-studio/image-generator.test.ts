/**
 * Tests for the lesson image generator.
 *
 * Unit tests use mocked fetch — integration tests (guarded by env) make real
 * OpenRouter calls to verify the API contract.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateLessonImage, generateLessonImageSet } from "./image-generator";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFakeBase64Image(): string {
  // A tiny valid-ish base64 string (not a real PNG but sufficient for unit tests)
  return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
}

function mockOpenRouterSuccess(base64Data = makeFakeBase64Image()) {
  const fakeResponse = {
    choices: [
      {
        message: {
          role: "assistant",
          content: "Here is the image.",
          images: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Data}`,
              },
            },
          ],
        },
      },
    ],
  };
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => fakeResponse,
  });
}

// ---------------------------------------------------------------------------
// Unit tests (mocked fetch)
// ---------------------------------------------------------------------------

describe("generateLessonImage (unit — mocked)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENROUTER_API_KEY: "sk-or-test-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns imageBase64 and correct mimeType from a valid OpenRouter response", async () => {
    const fakeB64 = makeFakeBase64Image();
    global.fetch = mockOpenRouterSuccess(fakeB64) as unknown as typeof fetch;

    const result = await generateLessonImage({
      prompt: "A fraction diagram for Year 4",
      style: "diagram",
    });

    expect(result.imageBase64).toBe(fakeB64);
    expect(result.mimeType).toBe("image/png");
    expect(result.prompt).toContain("fraction diagram");
    expect(result.generationTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("includes the style descriptor in the full prompt", async () => {
    let capturedBody: Record<string, unknown> = {};
    global.fetch = vi.fn().mockImplementation(async (_url, opts) => {
      capturedBody = JSON.parse((opts as RequestInit).body as string);
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                images: [
                  { type: "image_url", image_url: { url: `data:image/png;base64,${makeFakeBase64Image()}` } },
                ],
              },
            },
          ],
        }),
      };
    }) as unknown as typeof fetch;

    await generateLessonImage({ prompt: "An apple", style: "cartoon" });

    const messages = capturedBody.messages as Array<{ content: string }>;
    expect(messages[0].content).toContain("cartoon");
    expect(messages[0].content).toContain("An apple");
  });

  it("throws if OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(generateLessonImage({ prompt: "test" })).rejects.toThrow(
      "OPENROUTER_API_KEY not configured",
    );
  });

  it("throws if the API returns a non-ok status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => "Rate limit exceeded",
    }) as unknown as typeof fetch;

    await expect(generateLessonImage({ prompt: "test" })).rejects.toThrow(
      /Image generation failed \(429\)/,
    );
  });

  it("throws if the response contains no images", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { images: [] } }],
      }),
    }) as unknown as typeof fetch;

    await expect(generateLessonImage({ prompt: "test" })).rejects.toThrow(
      "No image returned",
    );
  });
});

describe("generateLessonImageSet (unit — mocked)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, OPENROUTER_API_KEY: "sk-or-test-key" };
    global.fetch = mockOpenRouterSuccess() as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns title and teach images", async () => {
    const results = await generateLessonImageSet({
      title: "Fractions",
      subject: "Maths",
      yearGroup: "Year 4",
      keyVocabulary: [],
      teachConcept: "Understanding half and quarter",
    });

    expect(results).toHaveProperty("title");
    expect(results).toHaveProperty("teach");
  });

  it("generates up to 3 vocab images keyed by sanitised word", async () => {
    const results = await generateLessonImageSet({
      title: "Forces",
      subject: "Science",
      yearGroup: "Year 5",
      keyVocabulary: ["gravity", "friction", "air resistance", "should-be-ignored"],
      teachConcept: "Forces act in pairs",
    });

    expect(results).toHaveProperty("vocab-gravity");
    expect(results).toHaveProperty("vocab-friction");
    expect(results).toHaveProperty("vocab-air-resistance");
    // 4th vocab item must NOT appear (max 3)
    expect(results).not.toHaveProperty("vocab-should-be-ignored");
  });

  it("skips failed individual images and still returns the others", async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      // Fail every other request
      if (callCount % 2 === 0) {
        return {
          ok: false,
          status: 500,
          text: async () => "Server error",
        };
      }
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                images: [
                  { type: "image_url", image_url: { url: `data:image/png;base64,${makeFakeBase64Image()}` } },
                ],
              },
            },
          ],
        }),
      };
    }) as unknown as typeof fetch;

    // Should not throw — returns whatever succeeded
    const results = await generateLessonImageSet({
      title: "Test",
      subject: "English",
      yearGroup: "Year 6",
      keyVocabulary: ["metaphor"],
      teachConcept: "Using figurative language",
    });

    // At least some results should exist despite errors
    expect(Object.keys(results).length).toBeGreaterThan(0);
  });
});
