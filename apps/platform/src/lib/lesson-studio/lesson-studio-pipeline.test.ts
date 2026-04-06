// ─── Lesson Studio Pipeline Tests ──────────────────────────────────────────
// Tests for extract-intent, ingest-pdf, generate-visualisation, generate-variants
// Reference lesson: Year 6 Science — The Circulatory System

import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateVariant, PRESET_PROFILES } from "./generate-variants";
import type { AccessibilityProfile } from "./generate-variants";
import type { LessonIntent } from "./extract-intent";

// ─── Test Data ─────────────────────────────────────────────────────────────

const CIRCULATORY_INTENT: LessonIntent = {
  subject: "Science",
  year_group: "Year 6",
  topic: "The Circulatory System",
  learning_objectives: [
    "Identify and name the main parts of the human circulatory system",
    "Describe the functions of the heart, blood vessels and blood",
    "Recognise the impact of diet, exercise, drugs and lifestyle on the way their bodies function",
  ],
  key_vocabulary: [
    { word: "artery", definition: "A blood vessel that carries blood away from the heart" },
    { word: "vein", definition: "A blood vessel that carries blood back to the heart" },
    { word: "capillary", definition: "A tiny blood vessel that connects arteries to veins" },
    { word: "ventricle", definition: "A lower chamber of the heart that pumps blood out" },
    { word: "atrium", definition: "An upper chamber of the heart that receives blood" },
  ],
  concept_to_visualise:
    "The human circulatory system showing the heart, lungs, arteries, veins, and capillaries",
  curriculum_codes: ["Y6-SC-4a", "Y6-SC-4b"],
  suggested_interaction_points: [
    {
      id: "ip-1",
      label: "Heart chambers",
      type: "reveal",
      curriculum_code: "Y6-SC-4a",
      description: "Click to reveal the four chambers of the heart",
    },
    {
      id: "ip-2",
      label: "Blood flow direction",
      type: "sequence",
      curriculum_code: "Y6-SC-4a",
      description: "Follow the sequence of blood flow through the body",
    },
    {
      id: "ip-3",
      label: "Artery vs Vein",
      type: "label",
      curriculum_code: "Y6-SC-4b",
      description: "Label the differences between arteries and veins",
    },
    {
      id: "ip-4",
      label: "Gas exchange",
      type: "toggle",
      curriculum_code: "Y6-SC-4a",
      description: "Toggle to show oxygen and carbon dioxide exchange in the lungs",
    },
  ],
};

const SAMPLE_SVG = `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <title>The Circulatory System</title>
  <defs>
    <style>
      .label { font-family: Poppins, sans-serif; font-size: 14px; fill: #374151; }
    </style>
  </defs>
  <rect width="800" height="600" fill="#f3f4f6" role="presentation"/>
  <g aria-label="Heart diagram">
    <ellipse cx="400" cy="300" rx="80" ry="100" fill="#dc2626" stroke="#1e3a5f" stroke-width="2"
      data-interaction-id="ip-1" aria-label="Click to reveal heart chambers"/>
    <text x="400" y="305" text-anchor="middle" class="label" font-size="16px">Heart (pumps blood around the body)</text>
  </g>
  <g aria-label="Blood vessels">
    <path d="M480 300 L650 200" stroke="#dc2626" stroke-width="3" fill="none"
      aria-label="Artery carrying blood from heart"/>
    <path d="M650 400 L480 300" stroke="#2563eb" stroke-width="3" fill="none"
      data-interaction-id="ip-3" aria-label="Vein carrying blood to heart"/>
    <circle cx="650" cy="300" r="30" fill="#f59e0b" opacity="0.3"
      data-interaction-id="ip-4" aria-label="Toggle gas exchange in lungs"/>
  </g>
  <g aria-label="Blood flow">
    <path d="M400 200 Q500 100 650 200" stroke="#dc2626" stroke-width="2" fill="none"
      data-interaction-id="ip-2" aria-label="Follow blood flow sequence"/>
  </g>
  <rect x="10" y="10" width="100" height="30" fill="#e5e7eb" role="presentation"/>
  <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
  <animateTransform attributeName="transform" type="rotate" dur="3s"/>
</svg>`;

// ─── Mock for AI-dependent modules ─────────────────────────────────────────

vi.mock("@/lib/ai-openrouter", () => ({
  openrouter: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

// ─── extract-intent.ts tests ───────────────────────────────────────────────

describe("extract-intent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts intent from formal lesson plan text", async () => {
    const { openrouter } = await import("@/lib/ai-openrouter");
    const mockCreate = vi.mocked(openrouter.chat.completions.create);
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(CIRCULATORY_INTENT) } }],
    } as never);

    const { extractLessonIntent } = await import("./extract-intent");

    const result = await extractLessonIntent(`
      Year 6 Science - The Circulatory System
      Learning Objective: Identify and name the main parts of the human circulatory system
      Key Vocabulary: artery, vein, capillary, ventricle, atrium
      Activities: Label diagram, blood flow sequence activity
    `);

    expect(result.subject).toBe("Science");
    expect(result.year_group).toBe("Year 6");
    expect(result.topic).toBe("The Circulatory System");
    expect(result.learning_objectives.length).toBeGreaterThan(0);
    expect(result.key_vocabulary.length).toBeGreaterThan(0);
    expect(result.curriculum_codes.length).toBeGreaterThan(0);
    expect(result.suggested_interaction_points.length).toBeGreaterThan(0);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it("extracts intent from brief teacher notes", async () => {
    const { openrouter } = await import("@/lib/ai-openrouter");
    const mockCreate = vi.mocked(openrouter.chat.completions.create);
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              ...CIRCULATORY_INTENT,
              topic: "Circulatory System",
            }),
          },
        },
      ],
    } as never);

    const { extractLessonIntent } = await import("./extract-intent");

    const result = await extractLessonIntent(
      "Do circulatory system. Heart, blood, lungs. Year 6 science.",
    );

    expect(result.subject).toBeDefined();
    expect(result.topic).toBeDefined();
    expect(result.concept_to_visualise).toBeDefined();
  });

  it("extracts intent from voice transcription with errors", async () => {
    const { openrouter } = await import("@/lib/ai-openrouter");
    const mockCreate = vi.mocked(openrouter.chat.completions.create);
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify(CIRCULATORY_INTENT),
          },
        },
      ],
    } as never);

    const { extractLessonIntent } = await import("./extract-intent");

    const result = await extractLessonIntent(
      "um so today were going to do the circulatory system yeah the heart and lungs and blood vessels its year six science and we need to cover how blood flows around the body and what the different parts do",
    );

    expect(result.subject).toBe("Science");
    expect(result.year_group).toBe("Year 6");
  });

  it("throws on empty input", async () => {
    const { extractLessonIntent } = await import("./extract-intent");

    await expect(extractLessonIntent("")).rejects.toThrow(
      "Cannot extract intent from empty text",
    );
  });

  it("throws on AI returning empty response", async () => {
    const { openrouter } = await import("@/lib/ai-openrouter");
    const mockCreate = vi.mocked(openrouter.chat.completions.create);
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    } as never);

    const { extractLessonIntent } = await import("./extract-intent");

    await expect(
      extractLessonIntent("Some lesson plan text"),
    ).rejects.toThrow("AI returned empty response");
  });

  it("validates interaction point types", async () => {
    const { openrouter } = await import("@/lib/ai-openrouter");
    const mockCreate = vi.mocked(openrouter.chat.completions.create);
    const intentWithBadType = {
      ...CIRCULATORY_INTENT,
      suggested_interaction_points: [
        { id: "ip-1", label: "Test", type: "invalid_type", curriculum_code: null, description: "Test" },
      ],
    };
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(intentWithBadType) } }],
    } as never);

    const { extractLessonIntent } = await import("./extract-intent");
    const result = await extractLessonIntent("Test plan");

    // Invalid type should default to "reveal"
    expect(result.suggested_interaction_points[0].type).toBe("reveal");
  });
});

// ─── ingest-pdf.ts tests ───────────────────────────────────────────────────

describe("ingest-pdf", () => {
  it("throws on empty buffer", async () => {
    const { ingestPdf } = await import("./ingest-pdf");
    await expect(ingestPdf(Buffer.alloc(0))).rejects.toThrow(
      "Cannot ingest empty PDF buffer",
    );
  });

  it("exports correct interface types", async () => {
    const mod = await import("./ingest-pdf");
    expect(typeof mod.ingestPdf).toBe("function");
  });
});

// ─── generate-visualisation.ts tests ───────────────────────────────────────

describe("generate-visualisation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates visualisation from lesson intent", async () => {
    const { openrouter } = await import("@/lib/ai-openrouter");
    const mockCreate = vi.mocked(openrouter.chat.completions.create);
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              svg: SAMPLE_SVG,
              interaction_manifest: {
                total_interactions: 4,
                interactions: CIRCULATORY_INTENT.suggested_interaction_points.map(
                  (p) => ({
                    id: p.id,
                    element_selector: `[data-interaction-id='${p.id}']`,
                    type: p.type,
                    label: p.label,
                    curriculum_code: p.curriculum_code,
                    aria_label: `Interactive: ${p.label}`,
                  }),
                ),
                curriculum_codes_covered: ["Y6-SC-4a", "Y6-SC-4b"],
              },
            }),
          },
        },
      ],
    } as never);

    const { generateVisualisation } = await import("./generate-visualisation");
    const result = await generateVisualisation(CIRCULATORY_INTENT);

    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("aria-label");
    expect(result.html).toContain("<!DOCTYPE html>");
    expect(result.html).toContain("The Circulatory System");
    expect(result.html).toContain("artery");
    expect(result.interaction_manifest.total_interactions).toBe(4);
    expect(result.interaction_manifest.curriculum_codes_covered).toContain(
      "Y6-SC-4a",
    );
  });

  it("throws on missing concept_to_visualise", async () => {
    const { generateVisualisation } = await import("./generate-visualisation");
    const badIntent = { ...CIRCULATORY_INTENT, concept_to_visualise: "" };

    await expect(generateVisualisation(badIntent)).rejects.toThrow(
      "LessonIntent with concept_to_visualise is required",
    );
  });

  it("throws when AI returns no SVG", async () => {
    const { openrouter } = await import("@/lib/ai-openrouter");
    const mockCreate = vi.mocked(openrouter.chat.completions.create);
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ svg: "not valid svg", interaction_manifest: {} }),
          },
        },
      ],
    } as never);

    const { generateVisualisation } = await import("./generate-visualisation");

    await expect(
      generateVisualisation(CIRCULATORY_INTENT),
    ).rejects.toThrow("does not contain valid SVG");
  });

  it("builds fallback manifest from intent when AI omits it", async () => {
    const { openrouter } = await import("@/lib/ai-openrouter");
    const mockCreate = vi.mocked(openrouter.chat.completions.create);
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              svg: SAMPLE_SVG,
              // No interaction_manifest
            }),
          },
        },
      ],
    } as never);

    const { generateVisualisation } = await import("./generate-visualisation");
    const result = await generateVisualisation(CIRCULATORY_INTENT);

    expect(result.interaction_manifest.total_interactions).toBe(4);
    expect(result.interaction_manifest.interactions[0].id).toBe("ip-1");
  });
});

// ─── generate-variants.ts tests ────────────────────────────────────────────

describe("generate-variants", () => {
  it("returns unmodified SVG for default profile", () => {
    const result = generateVariant(SAMPLE_SVG, PRESET_PROFILES.default);

    expect(result.svg).toContain("<svg");
    expect(result.adaptations_applied).toHaveLength(0);
  });

  it("applies high contrast colours", () => {
    const result = generateVariant(SAMPLE_SVG, PRESET_PROFILES.visual_impairment);

    // Original dark blue #1e3a5f should be replaced with black
    expect(result.svg).not.toContain("#1e3a5f");
    expect(result.svg).toContain("#000000");
    expect(result.adaptations_applied).toContain(
      "Very high contrast colours applied",
    );
  });

  it("applies dyslexia-friendly adaptations", () => {
    const result = generateVariant(SAMPLE_SVG, PRESET_PROFILES.dyslexia);

    // Background should be cream
    expect(result.svg).toContain("#fdf6e3");
    // Font should include OpenDyslexic
    expect(result.svg).toContain("OpenDyslexic");
    // Letter spacing should be added
    expect(result.svg).toContain('letter-spacing="0.5"');
    expect(result.adaptations_applied.some((a) => a.includes("Dyslexia"))).toBe(
      true,
    );
  });

  it("scales fonts correctly", () => {
    const profile: AccessibilityProfile = {
      ...PRESET_PROFILES.default,
      font_scale: 1.5,
    };
    const result = generateVariant(SAMPLE_SVG, profile);

    // Original 16px should become 24px (16 * 1.5)
    expect(result.svg).toContain('font-size="24px"');
    // Original 14px should become 21px (14 * 1.5)
    expect(result.svg).toContain('font-size="21px"');
  });

  it("simplifies labels by removing parenthetical content", () => {
    const profile: AccessibilityProfile = {
      ...PRESET_PROFILES.default,
      simplify_labels: true,
    };
    const result = generateVariant(SAMPLE_SVG, profile);

    // "Heart (pumps blood around the body)" should become "Heart"
    expect(result.svg).not.toContain("(pumps blood around the body)");
    expect(result.svg).toContain(">Heart<");
  });

  it("reduces cognitive load by dimming decorative elements", () => {
    const result = generateVariant(SAMPLE_SVG, PRESET_PROFILES.asd);

    // Decorative elements should have reduced opacity
    expect(result.svg).toContain('opacity="0.15"');
    // Interactive elements should get sequence numbers
    expect(result.svg).toContain('data-sequence="1"');
  });

  it("removes animations for ASD profile", () => {
    const result = generateVariant(SAMPLE_SVG, PRESET_PROFILES.asd);

    expect(result.svg).not.toContain("<animate ");
    expect(result.svg).not.toContain("<animateTransform ");
  });

  it("adds ADHD focus filter", () => {
    const result = generateVariant(SAMPLE_SVG, PRESET_PROFILES.adhd);

    expect(result.svg).toContain('id="adhd-focus"');
    expect(result.svg).toContain('filter="url(#adhd-focus)"');
    // Also removes animations
    expect(result.svg).not.toContain("<animate ");
  });

  it("adds hearing impairment visual feedback markers", () => {
    const profile: AccessibilityProfile = {
      needs: ["hearing_impairment"],
      contrast: "normal",
      font_scale: 1.0,
      simplify_labels: false,
      reduce_cognitive_load: false,
      extend_content: false,
    };
    const result = generateVariant(SAMPLE_SVG, profile);

    expect(result.svg).toContain('data-visual-feedback="true"');
  });

  it("adds extended content markers for deeper learners", () => {
    const result = generateVariant(SAMPLE_SVG, PRESET_PROFILES.deeper);

    expect(result.svg).toContain('data-extended="true"');
  });

  it("throws on invalid SVG input", () => {
    expect(() =>
      generateVariant("not svg", PRESET_PROFILES.default),
    ).toThrow("Valid SVG input is required");
  });

  it("applies multiple adaptations in correct order", () => {
    const profile: AccessibilityProfile = {
      needs: ["dyslexia", "adhd"],
      contrast: "high",
      font_scale: 1.3,
      simplify_labels: true,
      reduce_cognitive_load: true,
      extend_content: false,
    };
    const result = generateVariant(SAMPLE_SVG, profile);

    // High contrast applied
    expect(result.adaptations_applied).toContain("High contrast colours applied");
    // Dyslexia adaptations
    expect(result.adaptations_applied.some((a) => a.includes("Dyslexia"))).toBe(true);
    // Font scaling
    expect(result.adaptations_applied.some((a) => a.includes("1.3x"))).toBe(true);
    // Labels simplified
    expect(result.adaptations_applied.some((a) => a.includes("simplified"))).toBe(true);
    // Cognitive load reduced
    expect(result.adaptations_applied.some((a) => a.includes("Cognitive load"))).toBe(true);
    // ADHD adaptations
    expect(result.adaptations_applied.some((a) => a.includes("ADHD"))).toBe(true);
  });

  it("generates correct profile summary", () => {
    const result = generateVariant(SAMPLE_SVG, PRESET_PROFILES.dyslexia);

    expect(result.profile_summary).toContain("dyslexia");
    expect(result.profile_summary).toContain("1.2x");
    expect(result.profile_summary).toContain("normal");
  });

  it("all preset profiles are valid", () => {
    for (const [name, profile] of Object.entries(PRESET_PROFILES)) {
      const result = generateVariant(SAMPLE_SVG, profile);
      expect(result.svg).toContain("<svg");
      expect(typeof result.profile_summary).toBe("string");
      // Default profile should have no adaptations; others should have at least one
      if (name !== "default") {
        expect(result.adaptations_applied.length).toBeGreaterThan(0);
      }
    }
  });
});
