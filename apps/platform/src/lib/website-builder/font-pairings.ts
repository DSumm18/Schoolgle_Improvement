// ============================================================
// Font Pairings
// ============================================================
// 10 curated Google Font pairings, one per preset.
// Schools can swap to any pairing regardless of preset.
// The font picker shows live preview on the actual page.
// ============================================================

import type { FontPairing, FontOption } from "./types";

// ------------------------------------------------------------
// Individual fonts
// ------------------------------------------------------------

const FONTS: Record<string, FontOption> = {
  // Rounded sans
  nunito: {
    id: "nunito",
    name: "Nunito",
    googleFontsFamily: "Nunito",
    category: "rounded_sans",
    weights: [400, 500, 600, 700, 800],
    fallback: "system-ui, sans-serif",
  },
  quicksand: {
    id: "quicksand",
    name: "Quicksand",
    googleFontsFamily: "Quicksand",
    category: "rounded_sans",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
  },
  nunito_sans: {
    id: "nunito_sans",
    name: "Nunito Sans",
    googleFontsFamily: "Nunito+Sans",
    category: "clean_sans",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
  },

  // Serif
  playfair: {
    id: "playfair",
    name: "Playfair Display",
    googleFontsFamily: "Playfair+Display",
    category: "serif",
    weights: [400, 500, 600, 700, 800],
    fallback: "Georgia, serif",
  },
  merriweather: {
    id: "merriweather",
    name: "Merriweather",
    googleFontsFamily: "Merriweather",
    category: "serif",
    weights: [400, 700],
    fallback: "Georgia, serif",
  },
  eb_garamond: {
    id: "eb_garamond",
    name: "EB Garamond",
    googleFontsFamily: "EB+Garamond",
    category: "serif",
    weights: [400, 500, 600, 700],
    fallback: "Georgia, serif",
  },
  cormorant: {
    id: "cormorant",
    name: "Cormorant Garamond",
    googleFontsFamily: "Cormorant+Garamond",
    category: "serif",
    weights: [400, 500, 600, 700],
    fallback: "Georgia, serif",
  },
  crimson: {
    id: "crimson",
    name: "Crimson Text",
    googleFontsFamily: "Crimson+Text",
    category: "readable_serif",
    weights: [400, 600, 700],
    fallback: "Georgia, serif",
  },
  libre_baskerville: {
    id: "libre_baskerville",
    name: "Libre Baskerville",
    googleFontsFamily: "Libre+Baskerville",
    category: "readable_serif",
    weights: [400, 700],
    fallback: "Georgia, serif",
  },

  // Geometric sans
  montserrat: {
    id: "montserrat",
    name: "Montserrat",
    googleFontsFamily: "Montserrat",
    category: "geometric_sans",
    weights: [400, 500, 600, 700, 800, 900],
    fallback: "system-ui, sans-serif",
  },
  poppins: {
    id: "poppins",
    name: "Poppins",
    googleFontsFamily: "Poppins",
    category: "geometric_sans",
    weights: [400, 500, 600, 700, 800],
    fallback: "system-ui, sans-serif",
  },
  inter: {
    id: "inter",
    name: "Inter",
    googleFontsFamily: "Inter",
    category: "geometric_sans",
    weights: [400, 500, 600, 700, 800],
    fallback: "system-ui, sans-serif",
  },
  dm_sans: {
    id: "dm_sans",
    name: "DM Sans",
    googleFontsFamily: "DM+Sans",
    category: "geometric_sans",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
  },
  space_grotesk: {
    id: "space_grotesk",
    name: "Space Grotesk",
    googleFontsFamily: "Space+Grotesk",
    category: "geometric_sans",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
  },
  syne: {
    id: "syne",
    name: "Syne",
    googleFontsFamily: "Syne",
    category: "geometric_sans",
    weights: [400, 500, 600, 700, 800],
    fallback: "system-ui, sans-serif",
  },

  // Humanist sans
  lato: {
    id: "lato",
    name: "Lato",
    googleFontsFamily: "Lato",
    category: "humanist_sans",
    weights: [400, 700],
    fallback: "system-ui, sans-serif",
  },
  source_sans: {
    id: "source_sans",
    name: "Source Sans 3",
    googleFontsFamily: "Source+Sans+3",
    category: "clean_sans",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
  },
  open_sans: {
    id: "open_sans",
    name: "Open Sans",
    googleFontsFamily: "Open+Sans",
    category: "humanist_sans",
    weights: [400, 500, 600, 700, 800],
    fallback: "system-ui, sans-serif",
  },
  cabin: {
    id: "cabin",
    name: "Cabin",
    googleFontsFamily: "Cabin",
    category: "humanist_sans",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
  },
  raleway: {
    id: "raleway",
    name: "Raleway",
    googleFontsFamily: "Raleway",
    category: "humanist_sans",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
  },
  jost: {
    id: "jost",
    name: "Jost",
    googleFontsFamily: "Jost",
    category: "humanist_sans",
    weights: [400, 500, 600, 700],
    fallback: "system-ui, sans-serif",
  },

  // Display
  rubik: {
    id: "rubik",
    name: "Rubik",
    googleFontsFamily: "Rubik",
    category: "display",
    weights: [400, 500, 600, 700, 800],
    fallback: "system-ui, sans-serif",
  },
  outfit: {
    id: "outfit",
    name: "Outfit",
    googleFontsFamily: "Outfit",
    category: "display",
    weights: [400, 500, 600, 700, 800],
    fallback: "system-ui, sans-serif",
  },

  // System default (no Google Font needed)
  system: {
    id: "system",
    name: "System Default",
    googleFontsFamily: "",
    category: "system_default",
    weights: [400, 500, 600, 700],
    fallback: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

// ------------------------------------------------------------
// Curated pairings (one per preset)
// ------------------------------------------------------------

export const FONT_PAIRINGS: Record<string, FontPairing> = {
  nunito: {
    id: "nunito",
    name: "Soft & Friendly",
    description: "Rounded, warm, and approachable for younger audiences",
    heading: FONTS.nunito,
    body: FONTS.nunito_sans,
    defaultForPresets: ["friendly"],
  },
  playfair: {
    id: "playfair",
    name: "Elegant Classic",
    description: "Refined serif headings with clean body text",
    heading: FONTS.playfair,
    body: FONTS.source_sans,
    defaultForPresets: ["classic"],
  },
  lato: {
    id: "lato",
    name: "Natural & Calm",
    description: "Humanist warmth with excellent readability",
    heading: FONTS.lato,
    body: FONTS.source_sans,
    defaultForPresets: ["nature"],
  },
  montserrat: {
    id: "montserrat",
    name: "Bold & Modern",
    description: "Strong geometric shapes that command attention",
    heading: FONTS.montserrat,
    body: FONTS.inter,
    defaultForPresets: ["bold"],
  },
  inter: {
    id: "inter",
    name: "Clean Professional",
    description: "Neutral and highly readable for information-dense sites",
    heading: FONTS.dm_sans,
    body: FONTS.system,
    defaultForPresets: ["professional"],
  },
  rubik: {
    id: "rubik",
    name: "Vibrant Display",
    description: "Playful with just enough structure for clarity",
    heading: FONTS.rubik,
    body: FONTS.rubik,
    defaultForPresets: ["vibrant"],
  },
  raleway: {
    id: "raleway",
    name: "Minimal Elegance",
    description: "Thin, airy headings with literary body text",
    heading: FONTS.raleway,
    body: FONTS.libre_baskerville,
    defaultForPresets: ["minimal"],
  },
  garamond: {
    id: "garamond",
    name: "Heritage Serif",
    description: "Classical proportions for prestige and authority",
    heading: FONTS.eb_garamond,
    body: FONTS.crimson,
    defaultForPresets: ["heritage"],
  },
  open_sans: {
    id: "open_sans",
    name: "Warm & Open",
    description: "Friendly and universally readable — works everywhere",
    heading: FONTS.open_sans,
    body: FONTS.open_sans,
    defaultForPresets: ["community"],
  },
  space_grotesk: {
    id: "space_grotesk",
    name: "Tech Forward",
    description: "Distinctive mono-inspired sans for cutting-edge schools",
    heading: FONTS.space_grotesk,
    body: FONTS.inter,
    defaultForPresets: ["future"],
  },
};

/** Get all font pairings as an array */
export function getAllFontPairings(): FontPairing[] {
  return Object.values(FONT_PAIRINGS);
}

/** Get a specific font pairing */
export function getFontPairing(id: string): FontPairing | undefined {
  return FONT_PAIRINGS[id];
}

/**
 * Generate a Google Fonts URL for a font pairing.
 * Loads only the weights needed.
 */
export function getGoogleFontsUrl(pairing: FontPairing): string {
  const families: string[] = [];

  if (pairing.heading.googleFontsFamily) {
    const weights = pairing.heading.weights.join(";");
    families.push(`family=${pairing.heading.googleFontsFamily}:wght@${weights}`);
  }

  if (
    pairing.body.googleFontsFamily &&
    pairing.body.googleFontsFamily !== pairing.heading.googleFontsFamily
  ) {
    const weights = pairing.body.weights.join(";");
    families.push(`family=${pairing.body.googleFontsFamily}:wght@${weights}`);
  }

  if (families.length === 0) return "";

  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

/**
 * Generate CSS font-family declarations for a pairing.
 */
export function getFontCssVariables(pairing: FontPairing): Record<string, string> {
  const headingStack = pairing.heading.googleFontsFamily
    ? `'${pairing.heading.name}', ${pairing.heading.fallback}`
    : pairing.heading.fallback;

  const bodyStack = pairing.body.googleFontsFamily
    ? `'${pairing.body.name}', ${pairing.body.fallback}`
    : pairing.body.fallback;

  return {
    "--font-heading": headingStack,
    "--font-body": bodyStack,
  };
}
