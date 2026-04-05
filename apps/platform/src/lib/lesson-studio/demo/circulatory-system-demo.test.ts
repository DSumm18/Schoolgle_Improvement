// ─── Circulatory System Demo E2E Tests ────────────────────────────────────
// Verifies the full Lesson Studio pipeline using mocked AI responses

import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync, readFileSync, rmSync, mkdirSync } from "fs";
import { join } from "path";
import type { LessonIntent } from "../extract-intent";

// ─── Fixtures ─────────────────────────────────────────────────────────────

const MOCK_INTENT: LessonIntent = {
  subject: "Science",
  year_group: "Year 6",
  topic: "The Circulatory System",
  learning_objectives: [
    "Identify and name the main parts of the human circulatory system",
    "Describe the functions of the heart, blood vessels and blood",
  ],
  key_vocabulary: [
    { word: "artery", definition: "A blood vessel that carries blood away from the heart" },
    { word: "vein", definition: "A blood vessel that carries blood back to the heart" },
    { word: "capillary", definition: "A tiny blood vessel connecting arteries to veins" },
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
  ],
};

const MOCK_SVG = `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <title>The Circulatory System</title>
  <rect width="800" height="600" fill="#f3f4f6" role="presentation"/>
  <g aria-label="Heart diagram">
    <ellipse cx="400" cy="300" rx="80" ry="100" fill="#dc2626" stroke="#1e3a5f" stroke-width="2"
      data-interaction-id="ip-1" aria-label="Click to reveal heart chambers"/>
    <text x="400" y="305" text-anchor="middle" font-size="16px" fill="#374151">Heart (pumps blood)</text>
  </g>
  <g aria-label="Blood vessels">
    <path d="M480 300 L650 200" stroke="#dc2626" stroke-width="3" fill="none"
      aria-label="Artery"/>
    <path d="M650 400 L480 300" stroke="#2563eb" stroke-width="3" fill="none"
      data-interaction-id="ip-3" aria-label="Vein"/>
  </g>
  <path d="M400 200 Q500 100 650 200" stroke="#dc2626" stroke-width="2" fill="none"
    data-interaction-id="ip-2" aria-label="Blood flow"/>
</svg>`;

// ─── Mocks ────────────────────────────────────────────────────────────────

vi.mock("@/lib/ai-openrouter", () => ({
  openrouter: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

// ─── Tests ────────────────────────────────────────────────────────────────

describe("circulatory-system-demo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function setupMocks() {
    const { openrouter } = await import("@/lib/ai-openrouter");
    const mockCreate = vi.mocked(openrouter.chat.completions.create);

    // First call: extractLessonIntent
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(MOCK_INTENT) } }],
    } as never);

    // Second call: generateVisualisation
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              svg: MOCK_SVG,
              interaction_manifest: {
                total_interactions: 3,
                interactions: MOCK_INTENT.suggested_interaction_points.map((p) => ({
                  id: p.id,
                  element_selector: `[data-interaction-id='${p.id}']`,
                  type: p.type,
                  label: p.label,
                  curriculum_code: p.curriculum_code,
                  aria_label: `Interactive: ${p.label}`,
                })),
                curriculum_codes_covered: ["Y6-SC-4a", "Y6-SC-4b"],
              },
            }),
          },
        },
      ],
    } as never);

    return mockCreate;
  }

  it("runs the full pipeline end-to-end", async () => {
    const mockCreate = await setupMocks();
    const { runCirculatorySystemDemo } = await import("./circulatory-system-demo");

    const result = await runCirculatorySystemDemo();

    // AI called twice: extract-intent + generate-visualisation
    expect(mockCreate).toHaveBeenCalledTimes(2);

    // Intent extracted correctly
    expect(result.intent.subject).toBe("Science");
    expect(result.intent.year_group).toBe("Year 6");
    expect(result.intent.topic).toBe("The Circulatory System");
    expect(result.intent.learning_objectives.length).toBeGreaterThanOrEqual(2);
    expect(result.intent.key_vocabulary.length).toBeGreaterThanOrEqual(3);

    // Master SVG generated
    expect(result.masterSvg).toContain("<svg");
    expect(result.masterSvg).toContain("aria-label");

    // All 3 variants generated
    expect(Object.keys(result.variants)).toHaveLength(3);
    expect(result.variants["visual-impairment"]).toBeDefined();
    expect(result.variants["standard"]).toBeDefined();
    expect(result.variants["greater-depth"]).toBeDefined();
  });

  it("visual-impairment variant has high contrast and simplified labels", async () => {
    await setupMocks();
    const { runCirculatorySystemDemo } = await import("./circulatory-system-demo");

    const result = await runCirculatorySystemDemo();
    const vi_variant = result.variants["visual-impairment"];

    // High contrast: original colours should be replaced
    expect(vi_variant.svg).not.toContain("#1e3a5f");
    expect(vi_variant.svg).toContain("#000000");

    // Labels simplified — parenthetical content removed
    expect(vi_variant.svg).not.toContain("(pumps blood)");

    // Adaptations recorded
    expect(vi_variant.adaptations.length).toBeGreaterThan(0);
    expect(vi_variant.adaptations.some((a) => a.includes("contrast"))).toBe(true);
    expect(vi_variant.adaptations.some((a) => a.includes("simplified"))).toBe(true);
  });

  it("standard variant preserves original SVG without modification", async () => {
    await setupMocks();
    const { runCirculatorySystemDemo } = await import("./circulatory-system-demo");

    const result = await runCirculatorySystemDemo();
    const stdVariant = result.variants["standard"];

    // No adaptations applied
    expect(stdVariant.adaptations).toHaveLength(0);
    // SVG identical to master
    expect(stdVariant.svg).toBe(result.masterSvg);
  });

  it("greater-depth variant has extended content markers", async () => {
    await setupMocks();
    const { runCirculatorySystemDemo } = await import("./circulatory-system-demo");

    const result = await runCirculatorySystemDemo();
    const gdVariant = result.variants["greater-depth"];

    // Extended content markers on interactive elements
    expect(gdVariant.svg).toContain('data-extended="true"');
    expect(gdVariant.adaptations.some((a) => a.includes("Extended content"))).toBe(true);
  });

  it("saves all output files to disk", async () => {
    await setupMocks();
    const { runCirculatorySystemDemo, saveDemoOutputs } = await import(
      "./circulatory-system-demo"
    );

    const result = await runCirculatorySystemDemo();
    const tmpDir = join(__dirname, "__test_outputs__");

    try {
      saveDemoOutputs(result, tmpDir);

      // Verify all files written
      expect(existsSync(join(tmpDir, "intent.json"))).toBe(true);
      expect(existsSync(join(tmpDir, "master.svg"))).toBe(true);
      expect(existsSync(join(tmpDir, "variant-visual-impairment.svg"))).toBe(true);
      expect(existsSync(join(tmpDir, "variant-standard.svg"))).toBe(true);
      expect(existsSync(join(tmpDir, "variant-greater-depth.svg"))).toBe(true);

      // Verify intent.json is valid JSON with expected fields
      const intentJson = JSON.parse(
        readFileSync(join(tmpDir, "intent.json"), "utf-8"),
      );
      expect(intentJson.subject).toBe("Science");
      expect(intentJson.year_group).toBe("Year 6");

      // Verify SVGs contain valid SVG markup
      const masterSvg = readFileSync(join(tmpDir, "master.svg"), "utf-8");
      expect(masterSvg).toContain("<svg");

      const viSvg = readFileSync(
        join(tmpDir, "variant-visual-impairment.svg"),
        "utf-8",
      );
      expect(viSvg).toContain("<svg");
      // High contrast applied
      expect(viSvg).not.toContain("#1e3a5f");
    } finally {
      // Clean up
      if (existsSync(tmpDir)) {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    }
  });

  it("teacher input constant matches task specification", async () => {
    const { TEACHER_INPUT } = await import("./circulatory-system-demo");

    expect(TEACHER_INPUT).toContain("Year 6 Science");
    expect(TEACHER_INPUT).toContain("circulatory system");
    expect(TEACHER_INPUT).toContain("heart, blood vessels and blood");
  });

  it("all three pupil profiles are correctly configured", async () => {
    const { PUPIL_PROFILES } = await import("./circulatory-system-demo");

    // Visual impairment profile
    const vi_profile = PUPIL_PROFILES["visual-impairment"];
    expect(vi_profile.needs).toContain("visual_impairment");
    expect(vi_profile.contrast).toBe("very-high");
    expect(vi_profile.font_scale).toBeGreaterThan(1.0);
    expect(vi_profile.simplify_labels).toBe(true);

    // Standard profile
    const std = PUPIL_PROFILES["standard"];
    expect(std.needs).toHaveLength(0);
    expect(std.contrast).toBe("normal");
    expect(std.font_scale).toBe(1.0);

    // Greater depth profile
    const gd = PUPIL_PROFILES["greater-depth"];
    expect(gd.extend_content).toBe(true);
    expect(gd.simplify_labels).toBe(false);
  });
});
