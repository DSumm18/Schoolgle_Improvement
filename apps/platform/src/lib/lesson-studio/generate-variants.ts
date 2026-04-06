// ─── Lesson Studio: Accessibility Variant Generation ──────────────────────
// Takes a master SVG + pupil accessibility profile and produces an adapted
// variant with contrast, colour, label, cognitive load, and content adjustments.
// Purely deterministic transforms — no AI call needed.

import type { AccessibilityNeed } from "@/types/lesson-studio";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface AccessibilityProfile {
  needs: AccessibilityNeed[];
  contrast: "normal" | "high" | "very-high";
  font_scale: number; // 1.0 = default, 1.5 = 50% larger
  simplify_labels: boolean;
  reduce_cognitive_load: boolean;
  extend_content: boolean;
}

export interface VariantResult {
  svg: string;
  adaptations_applied: string[];
  profile_summary: string;
}

// ─── Colour Maps ───────────────────────────────────────────────────────────

const HIGH_CONTRAST_MAP: Record<string, string> = {
  "#1e3a5f": "#000000",
  "#374151": "#000000",
  "#6b7280": "#1a1a1a",
  "#f3f4f6": "#ffffff",
  "#f59e0b": "#ff8c00",
  "#dc2626": "#cc0000",
  "#2563eb": "#0000cc",
  "#e5e7eb": "#cccccc",
  "#f9fafb": "#ffffff",
};

const VERY_HIGH_CONTRAST_MAP: Record<string, string> = {
  "#1e3a5f": "#000000",
  "#374151": "#000000",
  "#6b7280": "#000000",
  "#f3f4f6": "#ffffff",
  "#f59e0b": "#ff6600",
  "#dc2626": "#ff0000",
  "#2563eb": "#0000ff",
  "#e5e7eb": "#ffffff",
  "#f9fafb": "#ffffff",
};

// Dyslexia-friendly colour overrides (cream background, darker text)
const DYSLEXIA_COLOUR_MAP: Record<string, string> = {
  "#f3f4f6": "#fdf6e3", // cream background
  "#f9fafb": "#fdf6e3",
  "#ffffff": "#fdf6e3",
  "#374151": "#2d2006", // warm dark brown
};

// ─── Main Function ─────────────────────────────────────────────────────────

export function generateVariant(
  masterSvg: string,
  profile: AccessibilityProfile,
): VariantResult {
  if (!masterSvg || !masterSvg.includes("<svg")) {
    throw new Error("Valid SVG input is required for variant generation");
  }

  let svg = masterSvg;
  const adaptations: string[] = [];

  // 1. Contrast adjustments
  if (profile.contrast === "high") {
    svg = applyColourMap(svg, HIGH_CONTRAST_MAP);
    adaptations.push("High contrast colours applied");
  } else if (profile.contrast === "very-high") {
    svg = applyColourMap(svg, VERY_HIGH_CONTRAST_MAP);
    adaptations.push("Very high contrast colours applied");
  }

  // 2. Dyslexia-specific adjustments
  if (profile.needs.includes("dyslexia")) {
    svg = applyDyslexiaAdaptations(svg);
    adaptations.push("Dyslexia-friendly adaptations: cream background, OpenDyslexic font hints");
  }

  // 3. Visual impairment adjustments
  if (profile.needs.includes("visual_impairment")) {
    svg = applyVisualImpairmentAdaptations(svg, profile.font_scale);
    adaptations.push(
      `Visual impairment adaptations: ${profile.font_scale}x font scale, thicker strokes`,
    );
  }

  // 4. Font scaling (applies to all profiles)
  if (profile.font_scale !== 1.0) {
    svg = applyFontScale(svg, profile.font_scale);
    adaptations.push(`Font scaled to ${profile.font_scale}x`);
  }

  // 5. Simplify labels
  if (profile.simplify_labels) {
    svg = simplifyLabels(svg);
    adaptations.push("Labels simplified for readability");
  }

  // 6. Reduce cognitive load
  if (profile.reduce_cognitive_load) {
    svg = reduceCognitiveLoad(svg);
    adaptations.push(
      "Cognitive load reduced: decorative elements hidden, interactions sequenced",
    );
  }

  // 7. ASD-specific: reduce visual noise, add structure
  if (profile.needs.includes("asd")) {
    svg = applyAsdAdaptations(svg);
    adaptations.push("ASD adaptations: reduced visual noise, clearer structure");
  }

  // 8. ADHD-specific: highlight key elements, simplify
  if (profile.needs.includes("adhd")) {
    svg = applyAdhdAdaptations(svg);
    adaptations.push("ADHD adaptations: key elements highlighted, reduced distractions");
  }

  // 9. Hearing impairment: ensure all audio cues have visual alternatives
  if (profile.needs.includes("hearing_impairment")) {
    svg = applyHearingAdaptations(svg);
    adaptations.push("Hearing impairment: visual indicators added for all interactions");
  }

  // 10. Extended content (for GDS pupils or those needing more detail)
  if (profile.extend_content) {
    svg = addExtendedContentMarkers(svg);
    adaptations.push("Extended content markers added for deeper learning");
  }

  // Build summary
  const needsStr =
    profile.needs.length > 0 ? profile.needs.join(", ") : "none";
  const profileSummary = `Accessibility: ${needsStr} | Contrast: ${profile.contrast} | Font: ${profile.font_scale}x | Simplified: ${profile.simplify_labels} | Reduced load: ${profile.reduce_cognitive_load}`;

  return {
    svg,
    adaptations_applied: adaptations,
    profile_summary: profileSummary,
  };
}

// ─── Adaptation Functions ──────────────────────────────────────────────────

function applyColourMap(svg: string, map: Record<string, string>): string {
  let result = svg;
  for (const [from, to] of Object.entries(map)) {
    // Replace in fill, stroke, and style attributes (case-insensitive hex)
    const regex = new RegExp(escapeRegex(from), "gi");
    result = result.replace(regex, to);
  }
  return result;
}

function applyDyslexiaAdaptations(svg: string): string {
  let result = applyColourMap(svg, DYSLEXIA_COLOUR_MAP);

  // Add font-family hint for dyslexia-friendly fonts
  result = result.replace(
    /font-family\s*[:=]\s*['"]?([^'";]+)['"]?/g,
    "font-family='OpenDyslexic, Comic Sans MS, Arial, sans-serif'",
  );

  // Increase letter-spacing for readability
  result = result.replace(
    /<text\b/g,
    '<text letter-spacing="0.5"',
  );

  return result;
}

function applyVisualImpairmentAdaptations(
  svg: string,
  fontScale: number,
): string {
  let result = svg;

  // Increase stroke widths
  result = result.replace(
    /stroke-width\s*[:=]\s*['"]?(\d+(?:\.\d+)?)['"]?/g,
    (_match, width) => {
      const newWidth = Math.max(parseFloat(width) * 1.5, 2);
      return `stroke-width="${newWidth}"`;
    },
  );

  // Ensure minimum font size
  const minSize = 14 * fontScale;
  result = result.replace(
    /font-size\s*[:=]\s*['"]?(\d+(?:\.\d+)?)(px|pt|em)?['"]?/g,
    (_match, size, unit) => {
      const currentSize = parseFloat(size);
      const newSize = Math.max(currentSize, minSize);
      return `font-size="${newSize}${unit || "px"}"`;
    },
  );

  return result;
}

function applyFontScale(svg: string, scale: number): string {
  return svg.replace(
    /font-size\s*[:=]\s*['"]?(\d+(?:\.\d+)?)(px|pt|em)?['"]?/g,
    (_match, size, unit) => {
      const newSize = Math.round(parseFloat(size) * scale * 10) / 10;
      return `font-size="${newSize}${unit || "px"}"`;
    },
  );
}

function simplifyLabels(svg: string): string {
  let result = svg;

  // Remove parenthetical explanations from text content
  // e.g., "Artery (carries blood away from heart)" → "Artery"
  result = result.replace(
    />([^<]+)\s*\([^)]+\)\s*</g,
    (_, text) => `>${text.trim()}<`,
  );

  // Shorten long aria-labels
  result = result.replace(
    /aria-label="([^"]{60,})"/g,
    (_match, label) => {
      const shortened = (label as string).split(/[.!?]/)[0].trim();
      return `aria-label="${shortened}"`;
    },
  );

  return result;
}

function reduceCognitiveLoad(svg: string): string {
  let result = svg;

  // Hide decorative elements (elements with role="presentation" or aria-hidden)
  result = result.replace(
    /(<(?:rect|circle|ellipse|path|line|polygon)\b[^>]*role="presentation"[^>]*)\/?>/g,
    '$1 opacity="0.15"/>',
  );

  // Reduce opacity of non-interactive background elements
  result = result.replace(
    /(<(?:rect|circle|ellipse)\b(?![^>]*data-interaction-id)[^>]*fill="(?:#f3f4f6|#e5e7eb|#f9fafb)"[^>]*)\/?>/g,
    '$1 opacity="0.3"/>',
  );

  // Add sequential numbering hints to interactive elements
  let interactionIndex = 0;
  result = result.replace(
    /data-interaction-id="([^"]+)"/g,
    (match) => {
      interactionIndex++;
      return `${match} data-sequence="${interactionIndex}"`;
    },
  );

  return result;
}

function applyAsdAdaptations(svg: string): string {
  let result = svg;

  // Remove animations/transitions that could cause distraction
  result = result.replace(/<animate\b[^>]*\/>/g, "");
  result = result.replace(/<animateTransform\b[^>]*\/>/g, "");
  result = result.replace(/<set\b[^>]*\/>/g, "");

  // Add clear borders to interactive elements
  result = result.replace(
    /(data-interaction-id="[^"]+")(\s*)/g,
    '$1 stroke="#374151" stroke-width="2"$2',
  );

  return result;
}

function applyAdhdAdaptations(svg: string): string {
  let result = svg;

  // Remove animations
  result = result.replace(/<animate\b[^>]*\/>/g, "");
  result = result.replace(/<animateTransform\b[^>]*\/>/g, "");

  // Add a visual highlight ring to interactive elements
  result = result.replace(
    /(data-interaction-id="[^"]+")(\s*)/g,
    '$1 filter="url(#adhd-focus)"$2',
  );

  // Add the focus filter definition if not present
  if (!result.includes('id="adhd-focus"')) {
    result = result.replace(
      /(<svg[^>]*>)/,
      `$1
  <defs>
    <filter id="adhd-focus" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#f59e0b" flood-opacity="0.6"/>
    </filter>
  </defs>`,
    );
  }

  return result;
}

function applyHearingAdaptations(svg: string): string {
  // Add visual pulse indicator class to interactive elements
  return svg.replace(
    /(data-interaction-id="[^"]+")(\s*)/g,
    '$1 data-visual-feedback="true"$2',
  );
}

function addExtendedContentMarkers(svg: string): string {
  // Mark interactive elements for extended content delivery
  return svg.replace(
    /(data-interaction-id="[^"]+")(\s*)/g,
    '$1 data-extended="true"$2',
  );
}

// ─── Utility ───────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Preset Profiles ───────────────────────────────────────────────────────

export const PRESET_PROFILES: Record<string, AccessibilityProfile> = {
  default: {
    needs: [],
    contrast: "normal",
    font_scale: 1.0,
    simplify_labels: false,
    reduce_cognitive_load: false,
    extend_content: false,
  },
  dyslexia: {
    needs: ["dyslexia"],
    contrast: "normal",
    font_scale: 1.2,
    simplify_labels: false,
    reduce_cognitive_load: false,
    extend_content: false,
  },
  visual_impairment: {
    needs: ["visual_impairment"],
    contrast: "very-high",
    font_scale: 1.5,
    simplify_labels: false,
    reduce_cognitive_load: false,
    extend_content: false,
  },
  asd: {
    needs: ["asd"],
    contrast: "normal",
    font_scale: 1.1,
    simplify_labels: true,
    reduce_cognitive_load: true,
    extend_content: false,
  },
  adhd: {
    needs: ["adhd"],
    contrast: "normal",
    font_scale: 1.0,
    simplify_labels: true,
    reduce_cognitive_load: true,
    extend_content: false,
  },
  scaffold: {
    needs: [],
    contrast: "normal",
    font_scale: 1.2,
    simplify_labels: true,
    reduce_cognitive_load: true,
    extend_content: false,
  },
  deeper: {
    needs: [],
    contrast: "normal",
    font_scale: 1.0,
    simplify_labels: false,
    reduce_cognitive_load: false,
    extend_content: true,
  },
};
