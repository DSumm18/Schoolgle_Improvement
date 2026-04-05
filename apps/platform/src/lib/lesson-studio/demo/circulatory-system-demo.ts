// ─── Lesson Studio Demo: Year 6 Circulatory System ────────────────────────
// End-to-end demonstration of the Lesson Studio pipeline:
// 1. Extract intent from teacher input
// 2. Generate master SVG visualisation
// 3. Generate 3 accessibility variants for different pupil profiles

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { extractLessonIntent } from "../extract-intent";
import type { LessonIntent } from "../extract-intent";
import { generateVisualisation } from "../generate-visualisation";
import { generateVariant } from "../generate-variants";
import type { AccessibilityProfile } from "../generate-variants";

// ─── Teacher Input ────────────────────────────────────────────────────────

export const TEACHER_INPUT =
  "Year 6 Science - The circulatory system. Children need to identify and name the main parts of the human circulatory system and describe the functions of the heart, blood vessels and blood.";

// ─── Pupil Profiles ───────────────────────────────────────────────────────

export const PUPIL_PROFILES: Record<string, AccessibilityProfile> = {
  "visual-impairment": {
    needs: ["visual_impairment"],
    contrast: "very-high",
    font_scale: 1.5,
    simplify_labels: true,
    reduce_cognitive_load: true,
    extend_content: false,
  },
  standard: {
    needs: [],
    contrast: "normal",
    font_scale: 1.0,
    simplify_labels: false,
    reduce_cognitive_load: false,
    extend_content: false,
  },
  "greater-depth": {
    needs: [],
    contrast: "normal",
    font_scale: 1.0,
    simplify_labels: false,
    reduce_cognitive_load: false,
    extend_content: true,
  },
};

// ─── Demo Result Type ─────────────────────────────────────────────────────

export interface DemoResult {
  intent: LessonIntent;
  masterSvg: string;
  variants: Record<string, { svg: string; adaptations: string[]; summary: string }>;
}

// ─── Run Demo Pipeline ────────────────────────────────────────────────────

export async function runCirculatorySystemDemo(): Promise<DemoResult> {
  // Step 1: Extract structured intent from teacher input
  const intent = await extractLessonIntent(TEACHER_INPUT);

  // Step 2: Generate master SVG visualisation
  const visualisation = await generateVisualisation(intent);
  const masterSvg = visualisation.svg;

  // Step 3: Generate accessibility variants
  const variants: DemoResult["variants"] = {};
  for (const [name, profile] of Object.entries(PUPIL_PROFILES)) {
    const result = generateVariant(masterSvg, profile);
    variants[name] = {
      svg: result.svg,
      adaptations: result.adaptations_applied,
      summary: result.profile_summary,
    };
  }

  return { intent, masterSvg, variants };
}

// ─── Save Outputs to Disk ─────────────────────────────────────────────────

export function saveDemoOutputs(result: DemoResult, outputDir: string): void {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(
    join(outputDir, "intent.json"),
    JSON.stringify(result.intent, null, 2),
    "utf-8",
  );

  writeFileSync(join(outputDir, "master.svg"), result.masterSvg, "utf-8");

  for (const [name, variant] of Object.entries(result.variants)) {
    writeFileSync(
      join(outputDir, `variant-${name}.svg`),
      variant.svg,
      "utf-8",
    );
  }
}
