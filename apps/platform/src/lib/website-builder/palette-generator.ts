// ============================================================
// Palette Generator
// ============================================================
// Takes extracted logo colours and generates 3-4 complete
// palette options. Each palette has a full shade scale,
// complementary secondary, neutral greys, and semantic colours.
// ============================================================

import type {
  ExtractedColour,
  GeneratedPalette,
  ColourShade,
  PaletteOption,
} from "./types";
import {
  rgbToHsl,
  hslToRgb,
  rgbToHex,
  hexToRgb,
  textColourOnBackground,
} from "./colour-extractor";

// ------------------------------------------------------------
// Main API
// ------------------------------------------------------------

/**
 * Generate 3-4 palette options from extracted logo colours.
 * Each option uses different combinations of the extracted
 * colours as primary/secondary.
 */
export function generatePaletteOptions(
  extractedColours: ExtractedColour[]
): PaletteOption[] {
  if (extractedColours.length === 0) {
    return [createDefaultPaletteOption()];
  }

  const options: PaletteOption[] = [];

  // Sort by saturation * area (most prominent saturated colour first)
  const ranked = [...extractedColours].sort(
    (a, b) => b.hsl.s * b.percentage - a.hsl.s * a.percentage
  );

  // Option 1: Most dominant colour as primary, second as secondary
  if (ranked.length >= 2) {
    options.push(
      createPaletteOption(
        ranked[0],
        ranked[1],
        "Brand Faithful",
        "Uses your two most prominent logo colours"
      )
    );
  } else {
    options.push(
      createPaletteOption(
        ranked[0],
        generateComplementary(ranked[0]),
        "Brand Primary",
        "Uses your main logo colour with a complementary secondary"
      )
    );
  }

  // Option 2: Most saturated colour + auto complementary
  const mostSaturated = [...extractedColours].sort(
    (a, b) => b.hsl.s - a.hsl.s
  )[0];
  if (mostSaturated.hex !== ranked[0].hex) {
    options.push(
      createPaletteOption(
        mostSaturated,
        generateComplementary(mostSaturated),
        "Bold & Vibrant",
        "Built around your most vivid logo colour"
      )
    );
  }

  // Option 3: Darkest colour as primary (sophisticated feel)
  const darkest = [...extractedColours]
    .filter((c) => c.hsl.s > 15) // skip true greys
    .sort((a, b) => a.hsl.l - b.hsl.l)[0];
  if (darkest && darkest.hex !== ranked[0].hex) {
    const lightAccent =
      extractedColours.find(
        (c) => c.hsl.l > 50 && c.hsl.s > 20 && c.hex !== darkest.hex
      ) || generateSplitComplementary(darkest);
    options.push(
      createPaletteOption(
        darkest,
        lightAccent,
        "Deep & Professional",
        "Uses your darkest brand colour for a premium feel"
      )
    );
  }

  // Option 4: Warm/cool shifted variation
  if (ranked.length >= 1) {
    const shifted = shiftHue(ranked[0], 30);
    options.push(
      createPaletteOption(
        shifted,
        ranked[0],
        "Fresh Take",
        "A subtle hue shift from your brand for a modern twist"
      )
    );
  }

  // Deduplicate by primary hex
  const seen = new Set<string>();
  return options.filter((opt) => {
    const key = opt.palette.primary[500];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ------------------------------------------------------------
// Palette construction
// ------------------------------------------------------------

function createPaletteOption(
  primary: ExtractedColour,
  secondary: ExtractedColour,
  name: string,
  description: string
): PaletteOption {
  const palette = buildPalette(primary, secondary, name, description);
  return {
    palette,
    sourceColours: { primary, secondary },
  };
}

function buildPalette(
  primary: ExtractedColour,
  secondary: ExtractedColour,
  name: string,
  description: string
): GeneratedPalette {
  const primaryShades = generateShadeScale(primary.hex);
  const secondaryShades = generateShadeScale(secondary.hex);
  const neutralShades = generateNeutralScale(primary.hex);

  // Accent: triadic from primary
  const accentHsl = {
    h: (primary.hsl.h + 120) % 360,
    s: Math.min(primary.hsl.s + 10, 90),
    l: 50,
  };
  const accentRgb = hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l);
  const accent = rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b);

  return {
    id: `palette-${name.toLowerCase().replace(/\s+/g, "-")}-${primary.hex.slice(1, 4)}`,
    name,
    description,
    primary: primaryShades,
    secondary: secondaryShades,
    accent,
    neutral: neutralShades,
    success: "#16a34a",
    warning: "#d97706",
    error: "#dc2626",
    info: "#2563eb",
    background: "#ffffff",
    backgroundAlt: neutralShades[50],
    surface: "#ffffff",
    textPrimary: neutralShades[900],
    textSecondary: neutralShades[600],
    textOnBrand: textColourOnBackground(primaryShades[500]),
  };
}

// ------------------------------------------------------------
// Shade scale generation (50–950)
// ------------------------------------------------------------

/**
 * Generate a Tailwind-style shade scale from a single hex colour.
 * The input colour becomes the 500 shade. Lighter shades go
 * toward white, darker shades go toward near-black.
 */
export function generateShadeScale(hex: string): ColourShade {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);

  // Target lightness values for each shade
  const targets: Record<keyof ColourShade, number> = {
    50: 97,
    100: 94,
    200: 86,
    300: 75,
    400: 62,
    500: l, // preserve original lightness
    600: Math.min(l - 10, 42),
    700: Math.min(l - 20, 33),
    800: Math.min(l - 30, 24),
    900: Math.min(l - 38, 17),
    950: Math.min(l - 44, 10),
  };

  const shades: Record<string, string> = {};
  for (const [shade, targetL] of Object.entries(targets)) {
    // Adjust saturation: lighter shades are slightly more saturated,
    // darker shades slightly less (perceptual correction)
    const shadeNum = parseInt(shade);
    let adjustedS = s;
    if (shadeNum < 500) {
      adjustedS = Math.min(100, s + (500 - shadeNum) / 50);
    } else if (shadeNum > 500) {
      adjustedS = Math.max(10, s - (shadeNum - 500) / 80);
    }

    const rgb = hslToRgb(h, adjustedS, targetL);
    shades[shade] = rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  return shades as unknown as ColourShade;
}

/**
 * Generate a neutral (grey) scale tinted slightly with the primary colour.
 * This makes greys feel cohesive with the brand rather than pure grey.
 */
function generateNeutralScale(primaryHex: string): ColourShade {
  const { r, g, b } = hexToRgb(primaryHex);
  const { h } = rgbToHsl(r, g, b);

  // Very low saturation, tinted with the primary hue
  const targets: Record<keyof ColourShade, { s: number; l: number }> = {
    50: { s: 8, l: 98 },
    100: { s: 7, l: 96 },
    200: { s: 6, l: 90 },
    300: { s: 5, l: 82 },
    400: { s: 4, l: 64 },
    500: { s: 3, l: 46 },
    600: { s: 4, l: 34 },
    700: { s: 5, l: 25 },
    800: { s: 6, l: 15 },
    900: { s: 8, l: 9 },
    950: { s: 10, l: 5 },
  };

  const shades: Record<string, string> = {};
  for (const [shade, { s, l }] of Object.entries(targets)) {
    const rgb = hslToRgb(h, s, l);
    shades[shade] = rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  return shades as unknown as ColourShade;
}

// ------------------------------------------------------------
// Colour harmony helpers
// ------------------------------------------------------------

function generateComplementary(colour: ExtractedColour): ExtractedColour {
  const newH = (colour.hsl.h + 180) % 360;
  const rgb = hslToRgb(newH, colour.hsl.s, colour.hsl.l);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  return {
    hex,
    rgb,
    hsl: { h: newH, s: colour.hsl.s, l: colour.hsl.l },
    percentage: 0,
    name: "Complementary",
  };
}

function generateSplitComplementary(colour: ExtractedColour): ExtractedColour {
  const newH = (colour.hsl.h + 150) % 360;
  const newL = Math.max(40, Math.min(65, 100 - colour.hsl.l));
  const rgb = hslToRgb(newH, colour.hsl.s, newL);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  return {
    hex,
    rgb,
    hsl: { h: newH, s: colour.hsl.s, l: newL },
    percentage: 0,
    name: "Split Complementary",
  };
}

function shiftHue(colour: ExtractedColour, degrees: number): ExtractedColour {
  const newH = (colour.hsl.h + degrees) % 360;
  const rgb = hslToRgb(newH, colour.hsl.s, colour.hsl.l);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  return {
    hex,
    rgb,
    hsl: { h: newH, s: colour.hsl.s, l: colour.hsl.l },
    percentage: 0,
    name: "Hue Shifted",
  };
}

// ------------------------------------------------------------
// Default fallback
// ------------------------------------------------------------

function createDefaultPaletteOption(): PaletteOption {
  const defaultPrimary: ExtractedColour = {
    hex: "#1e40af",
    rgb: { r: 30, g: 64, b: 175 },
    hsl: { h: 226, s: 71, l: 40 },
    percentage: 100,
    name: "Blue",
  };
  const defaultSecondary: ExtractedColour = {
    hex: "#0f766e",
    rgb: { r: 15, g: 118, b: 110 },
    hsl: { h: 175, s: 77, l: 26 },
    percentage: 0,
    name: "Teal",
  };
  return createPaletteOption(
    defaultPrimary,
    defaultSecondary,
    "Schoolgle Default",
    "A clean blue palette — upload your logo for personalised options"
  );
}

// ------------------------------------------------------------
// CSS variable export
// ------------------------------------------------------------

/**
 * Convert a GeneratedPalette to CSS custom properties.
 * These get injected into the website's :root or a scoped container.
 */
export function paletteToCssVariables(palette: GeneratedPalette): Record<string, string> {
  const vars: Record<string, string> = {};

  // Primary shades
  for (const [shade, hex] of Object.entries(palette.primary)) {
    vars[`--color-primary-${shade}`] = hex;
  }

  // Secondary shades
  for (const [shade, hex] of Object.entries(palette.secondary)) {
    vars[`--color-secondary-${shade}`] = hex;
  }

  // Neutral shades
  for (const [shade, hex] of Object.entries(palette.neutral)) {
    vars[`--color-neutral-${shade}`] = hex;
  }

  // Singles
  vars["--color-accent"] = palette.accent;
  vars["--color-success"] = palette.success;
  vars["--color-warning"] = palette.warning;
  vars["--color-error"] = palette.error;
  vars["--color-info"] = palette.info;
  vars["--color-background"] = palette.background;
  vars["--color-background-alt"] = palette.backgroundAlt;
  vars["--color-surface"] = palette.surface;
  vars["--color-text-primary"] = palette.textPrimary;
  vars["--color-text-secondary"] = palette.textSecondary;
  vars["--color-text-on-brand"] = palette.textOnBrand;

  return vars;
}
