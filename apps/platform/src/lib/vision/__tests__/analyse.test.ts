/**
 * Vision Analysis Service — Tests
 *
 * Tests the analyseImage function with mocked Gemini API calls.
 * Validates: response structure, error handling, input validation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock @google/generative-ai before importing the module under test
// ---------------------------------------------------------------------------

const mockGenerateContent = vi.fn();

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return { generateContent: mockGenerateContent };
      }
    },
  };
});

import { analyseImage, type VisionAnalysisResult } from "../analyse";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

// Minimal valid base64 (1x1 white PNG)
const VALID_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

const VALID_BASE64_WITH_PREFIX = `data:image/png;base64,${VALID_BASE64}`;

const MOCK_GEMINI_RESPONSE: VisionAnalysisResult = {
  items: [
    {
      name: "Bleach bottle",
      category: "chemical",
      quantity: 3,
      condition: "good",
      location_description: "Top shelf, left side",
      compliance_concerns: ["Stored above shoulder height"],
      confidence: 0.92,
    },
    {
      name: "Fire extinguisher",
      category: "safety",
      quantity: 1,
      condition: "fair",
      location_description: "Wall-mounted, near door",
      compliance_concerns: [],
      confidence: 0.98,
    },
    {
      name: "Plastic chair",
      category: "furniture",
      quantity: 4,
      location_description: "Centre of room, stacked",
      confidence: 0.85,
    },
  ],
  summary: "Chemical store with 3 items. 1 compliance flag found.",
  total_items: 3,
  compliance_flags: 1,
  raw_description: "A school chemical store room with shelving units.",
};

function mockGeminiSuccess(response: VisionAnalysisResult) {
  mockGenerateContent.mockResolvedValueOnce({
    response: {
      text: () => JSON.stringify(response),
    },
  });
}

function mockGeminiError(message: string) {
  mockGenerateContent.mockRejectedValueOnce(new Error(message));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("analyseImage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Set the API key for all tests
    process.env.GOOGLE_AI_API_KEY = "test-api-key-123";
  });

  afterEach(() => {
    delete process.env.GOOGLE_AI_API_KEY;
  });

  // -----------------------------------------------------------------------
  // Structure validation
  // -----------------------------------------------------------------------

  it("returns a valid VisionAnalysisResult structure", async () => {
    mockGeminiSuccess(MOCK_GEMINI_RESPONSE);

    const result = await analyseImage(VALID_BASE64, "Chemical Store");

    expect(result).toBeDefined();
    expect(result.items).toBeInstanceOf(Array);
    expect(result.items.length).toBe(3);
    expect(result.total_items).toBe(3);
    expect(result.compliance_flags).toBe(1);
    expect(typeof result.summary).toBe("string");
    expect(typeof result.raw_description).toBe("string");
  });

  it("each item has required fields with correct types", async () => {
    mockGeminiSuccess(MOCK_GEMINI_RESPONSE);

    const result = await analyseImage(VALID_BASE64);

    for (const item of result.items) {
      expect(typeof item.name).toBe("string");
      expect(typeof item.category).toBe("string");
      expect(typeof item.quantity).toBe("number");
      expect(typeof item.location_description).toBe("string");
      expect(typeof item.confidence).toBe("number");
      expect(item.confidence).toBeGreaterThanOrEqual(0);
      expect(item.confidence).toBeLessThanOrEqual(1);
    }
  });

  it("normalises unknown categories to 'other'", async () => {
    const responseWithBadCategory = {
      ...MOCK_GEMINI_RESPONSE,
      items: [
        {
          name: "Mystery object",
          category: "alien_artifact",
          quantity: 1,
          location_description: "floating",
          confidence: 0.5,
        },
      ],
    };

    mockGeminiSuccess(responseWithBadCategory as unknown as VisionAnalysisResult);

    const result = await analyseImage(VALID_BASE64);
    expect(result.items[0].category).toBe("other");
  });

  it("clamps confidence to 0-1 range", async () => {
    const responseWithBadConfidence = {
      ...MOCK_GEMINI_RESPONSE,
      items: [
        {
          name: "Chair",
          category: "furniture",
          quantity: 1,
          location_description: "corner",
          confidence: 1.5, // out of range
        },
      ],
    };

    mockGeminiSuccess(responseWithBadConfidence as unknown as VisionAnalysisResult);

    const result = await analyseImage(VALID_BASE64);
    expect(result.items[0].confidence).toBeLessThanOrEqual(1);
  });

  // -----------------------------------------------------------------------
  // Data URL prefix handling
  // -----------------------------------------------------------------------

  it("handles base64 with data URL prefix", async () => {
    mockGeminiSuccess(MOCK_GEMINI_RESPONSE);

    const result = await analyseImage(VALID_BASE64_WITH_PREFIX);

    expect(result.items.length).toBe(3);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  it("throws on empty/invalid base64", async () => {
    await expect(analyseImage("")).rejects.toThrow("Invalid image data");
    await expect(analyseImage("abc")).rejects.toThrow("Invalid image data");
  });

  it("throws when API key is not set", async () => {
    delete process.env.GOOGLE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    await expect(analyseImage(VALID_BASE64)).rejects.toThrow(
      "GOOGLE_AI_API_KEY is not configured",
    );
  });

  it("throws when API key is placeholder", async () => {
    process.env.GOOGLE_AI_API_KEY = "placeholder_david_will_replace";

    await expect(analyseImage(VALID_BASE64)).rejects.toThrow(
      "GOOGLE_AI_API_KEY is not configured",
    );
  });

  it("throws when Gemini returns no text", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => "",
      },
    });

    await expect(analyseImage(VALID_BASE64)).rejects.toThrow(
      "No response text",
    );
  });

  it("throws when Gemini returns invalid JSON", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => "This is not JSON at all",
      },
    });

    await expect(analyseImage(VALID_BASE64)).rejects.toThrow(
      "Failed to parse Gemini response",
    );
  });

  it("propagates Gemini API errors", async () => {
    mockGeminiError("Model overloaded");

    await expect(analyseImage(VALID_BASE64)).rejects.toThrow(
      "Model overloaded",
    );
  });

  // -----------------------------------------------------------------------
  // Fallback to GEMINI_API_KEY
  // -----------------------------------------------------------------------

  it("falls back to GEMINI_API_KEY when GOOGLE_AI_API_KEY is not set", async () => {
    delete process.env.GOOGLE_AI_API_KEY;
    process.env.GEMINI_API_KEY = "fallback-key-456";

    mockGeminiSuccess(MOCK_GEMINI_RESPONSE);

    const result = await analyseImage(VALID_BASE64);
    expect(result.items.length).toBe(3);
  });

  // -----------------------------------------------------------------------
  // Context-specific prompts
  // -----------------------------------------------------------------------

  it("accepts all valid context types without error", async () => {
    const contexts = [
      "Chemical Store",
      "Playground",
      "Plant Room",
      "Classroom",
      "General",
      undefined,
    ];

    for (const ctx of contexts) {
      mockGeminiSuccess(MOCK_GEMINI_RESPONSE);
      const result = await analyseImage(VALID_BASE64, ctx);
      expect(result.items.length).toBe(3);
    }
  });

  // -----------------------------------------------------------------------
  // Handles markdown-wrapped JSON
  // -----------------------------------------------------------------------

  it("strips markdown code fences from response", async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () =>
          "```json\n" + JSON.stringify(MOCK_GEMINI_RESPONSE) + "\n```",
      },
    });

    const result = await analyseImage(VALID_BASE64);
    expect(result.items.length).toBe(3);
  });
});
