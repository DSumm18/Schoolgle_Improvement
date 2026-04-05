import { describe, it, expect, vi } from "vitest";
import { pdfSchemeConnector, parsePdfScheme } from "./pdf-scheme-connector";
import { getConnector } from "./connector-registry";

// Mock the parsePDF function from extractors
vi.mock("../extractors", () => ({
  parsePDF: vi.fn(),
}));

import { parsePDF } from "../extractors";
const mockParsePDF = vi.mocked(parsePDF);

describe("pdf-scheme-connector", () => {
  it("is registered in the connector registry", () => {
    const connector = getConnector("pdf-scheme");
    expect(connector).toBeDefined();
    expect(connector!.id).toBe("pdf-scheme");
    expect(connector!.supportsSearch).toBe(false);
  });

  it("has correct label", () => {
    expect(pdfSchemeConnector.label).toContain("PDF Scheme Upload");
  });

  it("search returns empty array", async () => {
    const results = await pdfSchemeConnector.search({});
    expect(results).toEqual([]);
  });

  it("fetch throws if no fileBuffer provided", async () => {
    await expect(pdfSchemeConnector.fetch({})).rejects.toThrow(
      "pdf-scheme connector requires fileBuffer"
    );
  });

  describe("parsePdfScheme", () => {
    const sampleLessonText = `
Year 3 Mathematics - Fractions Lesson Plan
--- Page 1 ---

LEARNING OBJECTIVES:
- Recognise and show equivalent fractions
- Count up and down in tenths
- Add and subtract fractions with the same denominator

RESOURCES NEEDED:
- Fraction wall worksheet
- Multilink cubes
- Interactive whiteboard slides

KEY VOCABULARY:
fraction, numerator, denominator, equivalent, tenths, whole

MISCONCEPTIONS:
- Pupils may think larger denominator means larger fraction
- Pupils may add numerators and denominators separately

STARTER:
Show pupils a fraction wall. Ask them to identify fractions they recognise.
Discuss what they notice about equivalent fractions.

MAIN TEACHING:
Introduce the concept of equivalent fractions using fraction strips.
Model finding equivalent fractions by multiplying numerator and denominator.

INDEPENDENT WORK:
Pupils use fraction walls to find and record equivalent fractions.
Greater depth: Explain why two fractions are equivalent.

PLENARY:
Share findings. What patterns did pupils notice?
Exit question: What fraction is equivalent to 2/4?
--- Page 2 ---
Working towards: Match simple equivalent fractions using a fraction wall.
Expected standard: Find and record equivalent fractions independently.
Greater depth: Explain the relationship between equivalent fractions.
`;

    it("extracts objectives from lesson text", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(
        Buffer.from("fake-pdf"),
        "year3-fractions.pdf"
      );

      expect(result.objectives.length).toBeGreaterThan(0);
      expect(
        result.objectives.some((o) => o.includes("equivalent fractions"))
      ).toBe(true);
    });

    it("extracts activities from lesson text", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(
        Buffer.from("fake-pdf"),
        "year3-fractions.pdf"
      );

      expect(result.activities.length).toBeGreaterThan(0);
      const activityTitles = result.activities.map((a) => a.title.toLowerCase());
      // Should find at least some of: starter, main teaching, independent work, plenary
      expect(
        activityTitles.some(
          (t) =>
            t.includes("starter") ||
            t.includes("main") ||
            t.includes("independent") ||
            t.includes("plenary")
        )
      ).toBe(true);
    });

    it("extracts resources from lesson text", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(
        Buffer.from("fake-pdf"),
        "year3-fractions.pdf"
      );

      expect(result.resources.length).toBeGreaterThan(0);
      expect(
        result.resources.some((r) =>
          r.name.toLowerCase().includes("fraction wall")
        )
      ).toBe(true);
    });

    it("extracts keywords from lesson text", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(
        Buffer.from("fake-pdf"),
        "year3-fractions.pdf"
      );

      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it("extracts misconceptions from lesson text", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(
        Buffer.from("fake-pdf"),
        "year3-fractions.pdf"
      );

      expect(result.misconceptions.length).toBeGreaterThan(0);
      expect(
        result.misconceptions.some((m) => m.includes("denominator"))
      ).toBe(true);
    });

    it("detects subject from content", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(Buffer.from("fake-pdf"));
      expect(result.subject).toBe("Mathematics");
    });

    it("detects key stage from year group in text", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(Buffer.from("fake-pdf"));
      expect(result.keyStage).toBe("KS2"); // Year 3 = KS2
    });

    it("detects year group from text", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(Buffer.from("fake-pdf"));
      expect(result.yearGroup).toBeDefined();
      expect(result.yearGroup!.toLowerCase()).toContain("year 3");
    });

    it("uses overrides when provided", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(
        Buffer.from("fake-pdf"),
        "lesson.pdf",
        { subject: "Science", keyStage: "KS1", yearGroup: "Year 2" }
      );

      expect(result.subject).toBe("Science");
      expect(result.keyStage).toBe("KS1");
      expect(result.yearGroup).toBe("Year 2");
    });

    it("uses filename as title", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(
        Buffer.from("fake-pdf"),
        "year3-fractions.pdf"
      );

      expect(result.title).toBe("year3 fractions");
    });

    it("sets correct source metadata", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(
        Buffer.from("fake-pdf"),
        "lesson.pdf"
      );

      expect(result.source).toBe("pdf-scheme");
      expect(result.sourceId).toBe("lesson.pdf");
      expect(result.metadata.fileName).toBe("lesson.pdf");
      expect(result.metadata.pageCount).toBe(2);
    });

    it("includes raw text for LLM processing", async () => {
      mockParsePDF.mockResolvedValueOnce(sampleLessonText);

      const result = await parsePdfScheme(Buffer.from("fake-pdf"));
      expect(result.rawText.length).toBeGreaterThan(100);
      expect(result.rawText).toContain("equivalent fractions");
    });

    it("throws on image-based PDF", async () => {
      mockParsePDF.mockResolvedValueOnce(
        "[Image-based PDF detected - Limited text extraction]"
      );

      await expect(
        parsePdfScheme(Buffer.from("fake-pdf"))
      ).rejects.toThrow("Could not extract text from PDF");
    });

    it("handles science lesson plan", async () => {
      const scienceText = `
Year 5 Science - Forces
--- Page 1 ---
LEARNING OBJECTIVES:
- Explain that unsupported objects fall towards the Earth because of gravity
- Identify the effects of air resistance, water resistance and friction

RESOURCES:
- Parachute materials (bin bags, string, plastic cups, plasticine)
- Timer
- Video clip of skydiving

KEY VOCABULARY:
gravity, air resistance, friction, force, Newton

STARTER:
Drop two objects from the same height. Which lands first? Why?

MAIN ACTIVITY:
Design and test parachutes to investigate air resistance.

PLENARY:
What did we learn about air resistance?
`;
      mockParsePDF.mockResolvedValueOnce(scienceText);

      const result = await parsePdfScheme(Buffer.from("fake-pdf"));
      expect(result.subject).toBe("Science");
      expect(result.keyStage).toBe("KS2"); // Year 5
    });
  });
});
