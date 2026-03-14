// ============================================================
// The 10 Style Presets
// ============================================================
// Each preset defines all 6 visual layers. Schools pick one,
// then customise colours (from logo) and fonts (live preview).
// ============================================================

import type { StylePreset } from "./types";

export const PRESETS: Record<string, StylePreset> = {
  // ----------------------------------------------------------
  // 1. Friendly — warm, welcoming, primary schools
  // ----------------------------------------------------------
  friendly: {
    id: "friendly",
    name: "Friendly",
    description: "Warm, welcoming, and approachable — the go-to for primary schools",
    bestFor: ["primary", "infant", "nursery", "community"],
    phase: "primary",
    layout: {
      navStyle: "top_bar",
      navPosition: "top",
      heroStyle: "carousel",
      heroHeight: "large",
      contentWidth: "contained",
      gridStyle: "cards",
      quickLinksStyle: "tiles",
      quickLinksCount: 6,
      footerStyle: "detailed",
    },
    shape: {
      borderRadius: 16,
      sectionDivider: "wave",
      cardStyle: "elevated",
      buttonStyle: "rounded",
      imageShape: "rounded",
    },
    colour: {
      mode: "colourful_sections",
      headerBackground: "white",
      heroOverlay: "light_gradient",
      heroOverlayOpacity: 0.2,
      sectionAlternation: "white_brand",
      footerBackground: "brand",
    },
    typography: {
      headingFont: "rounded_sans",
      bodyFont: "clean_sans",
      headingWeight: "bold",
      textScale: "standard",
      headingCase: "normal",
      lineHeight: "normal",
    },
    motion: {
      level: "moderate",
      scrollEffect: "fade_up",
      hoverStyle: "scale",
      pageTransition: "fade",
      heroAnimation: "ken_burns",
      counterAnimation: true,
    },
    imagery: {
      photoTreatment: "rounded_corners",
      photoSpacing: "standard",
      galleryStyle: "masonry",
      iconStyle: "filled",
      illustrationStyle: "none",
    },
    defaultHeroMask: "wave_bottom",
    defaultFontPairing: "nunito",
    paletteDirection: "Warm — soft blues, greens, yellows, purples",
  },

  // ----------------------------------------------------------
  // 2. Classic — trusted, established, timeless
  // ----------------------------------------------------------
  classic: {
    id: "classic",
    name: "Classic",
    description: "Trusted, established, timeless — heritage without being stuffy",
    bestFor: ["traditional", "village", "established", "grammar"],
    phase: "any",
    layout: {
      navStyle: "top_bar",
      navPosition: "top",
      heroStyle: "static_image",
      heroHeight: "medium",
      contentWidth: "contained",
      gridStyle: "cards",
      quickLinksStyle: "buttons",
      quickLinksCount: 4,
      footerStyle: "detailed",
    },
    shape: {
      borderRadius: 4,
      sectionDivider: "straight",
      cardStyle: "bordered",
      buttonStyle: "rounded",
      imageShape: "square",
    },
    colour: {
      mode: "subtle_tints",
      headerBackground: "solid_brand",
      heroOverlay: "dark_gradient",
      heroOverlayOpacity: 0.4,
      sectionAlternation: "white_grey",
      footerBackground: "dark",
    },
    typography: {
      headingFont: "serif",
      bodyFont: "clean_sans",
      headingWeight: "semibold",
      textScale: "standard",
      headingCase: "normal",
      lineHeight: "normal",
    },
    motion: {
      level: "subtle",
      scrollEffect: "fade_up",
      hoverStyle: "underline",
      pageTransition: "none",
      heroAnimation: "none",
      counterAnimation: false,
    },
    imagery: {
      photoTreatment: "natural",
      photoSpacing: "standard",
      galleryStyle: "grid",
      iconStyle: "outline",
      illustrationStyle: "none",
    },
    defaultHeroMask: "full_width",
    defaultFontPairing: "playfair",
    paletteDirection: "Traditional — navy, burgundy, forest green, cream",
  },

  // ----------------------------------------------------------
  // 3. Nature — organic, earthy, calm
  // ----------------------------------------------------------
  nature: {
    id: "nature",
    name: "Nature",
    description: "Organic, earthy, calm — for schools connected to their environment",
    bestFor: ["rural", "forest_school", "eco", "outdoor_learning"],
    phase: "primary",
    layout: {
      navStyle: "top_bar",
      navPosition: "top",
      heroStyle: "static_image",
      heroHeight: "large",
      contentWidth: "mixed",
      gridStyle: "cards",
      quickLinksStyle: "icons",
      quickLinksCount: 6,
      footerStyle: "detailed",
    },
    shape: {
      borderRadius: 12,
      sectionDivider: "organic",
      cardStyle: "flat",
      buttonStyle: "rounded",
      imageShape: "blob",
    },
    colour: {
      mode: "subtle_tints",
      headerBackground: "transparent",
      heroOverlay: "brand_colour",
      heroOverlayOpacity: 0.3,
      sectionAlternation: "white_brand",
      footerBackground: "dark",
    },
    typography: {
      headingFont: "humanist_sans",
      bodyFont: "clean_sans",
      headingWeight: "medium",
      textScale: "spacious",
      headingCase: "normal",
      lineHeight: "relaxed",
    },
    motion: {
      level: "subtle",
      scrollEffect: "parallax",
      hoverStyle: "glow",
      pageTransition: "fade",
      heroAnimation: "ken_burns",
      counterAnimation: false,
    },
    imagery: {
      photoTreatment: "masked_blob",
      photoSpacing: "generous",
      galleryStyle: "masonry",
      iconStyle: "hand_drawn",
      illustrationStyle: "organic",
    },
    defaultHeroMask: "blob_organic",
    defaultFontPairing: "lato",
    paletteDirection: "Earth tones — sage green, warm brown, sky blue, moss",
  },

  // ----------------------------------------------------------
  // 4. Bold — confident, ambitious, modern
  // ----------------------------------------------------------
  bold: {
    id: "bold",
    name: "Bold",
    description: "Confident, ambitious, modern — for schools making a statement",
    bestFor: ["academy", "ambitious", "results_focused", "secondary"],
    phase: "secondary",
    layout: {
      navStyle: "sticky_transparent",
      navPosition: "top",
      heroStyle: "static_image",
      heroHeight: "full_viewport",
      contentWidth: "full_bleed",
      gridStyle: "cards",
      quickLinksStyle: "cards",
      quickLinksCount: 6,
      footerStyle: "mega_footer",
    },
    shape: {
      borderRadius: 0,
      sectionDivider: "angle",
      cardStyle: "flat",
      buttonStyle: "square",
      imageShape: "square",
    },
    colour: {
      mode: "bold_headers",
      headerBackground: "transparent",
      heroOverlay: "dark_gradient",
      heroOverlayOpacity: 0.5,
      sectionAlternation: "colour_blocks",
      footerBackground: "dark",
    },
    typography: {
      headingFont: "geometric_sans",
      bodyFont: "clean_sans",
      headingWeight: "extrabold",
      textScale: "spacious",
      headingCase: "uppercase",
      lineHeight: "tight",
    },
    motion: {
      level: "moderate",
      scrollEffect: "slide_in",
      hoverStyle: "lift",
      pageTransition: "slide",
      heroAnimation: "parallax_scroll",
      counterAnimation: true,
    },
    imagery: {
      photoTreatment: "natural",
      photoSpacing: "tight",
      galleryStyle: "grid",
      iconStyle: "filled",
      illustrationStyle: "geometric",
    },
    defaultHeroMask: "diagonal_right",
    defaultFontPairing: "montserrat",
    paletteDirection: "Strong — deep navy, electric blue, crimson, charcoal",
  },

  // ----------------------------------------------------------
  // 5. Professional — clean, structured, corporate-adjacent
  // ----------------------------------------------------------
  professional: {
    id: "professional",
    name: "Professional",
    description: "Clean, structured, corporate-adjacent — for larger schools and trusts",
    bestFor: ["secondary", "sixth_form", "mat", "multi_site"],
    phase: "secondary",
    layout: {
      navStyle: "mega_menu",
      navPosition: "top",
      heroStyle: "video",
      heroHeight: "large",
      contentWidth: "contained",
      gridStyle: "cards",
      quickLinksStyle: "tiles",
      quickLinksCount: 8,
      footerStyle: "mega_footer",
    },
    shape: {
      borderRadius: 8,
      sectionDivider: "straight",
      cardStyle: "elevated",
      buttonStyle: "rounded",
      imageShape: "rounded",
    },
    colour: {
      mode: "monochrome",
      headerBackground: "white",
      heroOverlay: "dark_gradient",
      heroOverlayOpacity: 0.4,
      sectionAlternation: "white_grey",
      footerBackground: "dark",
    },
    typography: {
      headingFont: "geometric_sans",
      bodyFont: "system_default",
      headingWeight: "semibold",
      textScale: "standard",
      headingCase: "normal",
      lineHeight: "normal",
    },
    motion: {
      level: "subtle",
      scrollEffect: "fade_up",
      hoverStyle: "colour_shift",
      pageTransition: "fade",
      heroAnimation: "none",
      counterAnimation: true,
    },
    imagery: {
      photoTreatment: "natural",
      photoSpacing: "standard",
      galleryStyle: "lightbox",
      iconStyle: "outline",
      illustrationStyle: "none",
    },
    defaultHeroMask: "full_width",
    defaultFontPairing: "inter",
    paletteDirection: "Corporate — navy, slate grey, white, single accent",
  },

  // ----------------------------------------------------------
  // 6. Vibrant — energetic, colourful, dynamic
  // ----------------------------------------------------------
  vibrant: {
    id: "vibrant",
    name: "Vibrant",
    description: "Energetic, colourful, dynamic — for diverse, creative communities",
    bestFor: ["creative", "arts", "diverse", "primary_energetic"],
    phase: "any",
    layout: {
      navStyle: "top_bar",
      navPosition: "top",
      heroStyle: "carousel",
      heroHeight: "large",
      contentWidth: "mixed",
      gridStyle: "mosaic",
      quickLinksStyle: "cards",
      quickLinksCount: 6,
      footerStyle: "detailed",
    },
    shape: {
      borderRadius: 16,
      sectionDivider: "wave",
      cardStyle: "elevated",
      buttonStyle: "pill",
      imageShape: "rounded",
    },
    colour: {
      mode: "colourful_sections",
      headerBackground: "solid_brand",
      heroOverlay: "brand_colour",
      heroOverlayOpacity: 0.3,
      sectionAlternation: "colour_blocks",
      footerBackground: "brand",
    },
    typography: {
      headingFont: "display",
      bodyFont: "clean_sans",
      headingWeight: "bold",
      textScale: "standard",
      headingCase: "normal",
      lineHeight: "normal",
    },
    motion: {
      level: "playful",
      scrollEffect: "slide_in",
      hoverStyle: "scale",
      pageTransition: "slide",
      heroAnimation: "fade_cycle",
      counterAnimation: true,
    },
    imagery: {
      photoTreatment: "rounded_corners",
      photoSpacing: "standard",
      galleryStyle: "masonry",
      iconStyle: "duotone",
      illustrationStyle: "geometric",
    },
    defaultHeroMask: "wave_bottom",
    defaultFontPairing: "rubik",
    paletteDirection: "Multi-colour — brand primary with complementary pops",
  },

  // ----------------------------------------------------------
  // 7. Minimal — spacious, typographic, refined
  // ----------------------------------------------------------
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Spacious, typographic, refined — letting content breathe",
    bestFor: ["design_conscious", "modern_primary", "photography_focused"],
    phase: "any",
    layout: {
      navStyle: "hamburger",
      navPosition: "top",
      heroStyle: "static_image",
      heroHeight: "medium",
      contentWidth: "contained",
      gridStyle: "list",
      quickLinksStyle: "buttons",
      quickLinksCount: 4,
      footerStyle: "simple",
    },
    shape: {
      borderRadius: 0,
      sectionDivider: "none",
      cardStyle: "flat",
      buttonStyle: "square",
      imageShape: "square",
    },
    colour: {
      mode: "monochrome",
      headerBackground: "white",
      heroOverlay: "light_gradient",
      heroOverlayOpacity: 0.1,
      sectionAlternation: "all_white",
      footerBackground: "white",
    },
    typography: {
      headingFont: "humanist_sans",
      bodyFont: "readable_serif",
      headingWeight: "medium",
      textScale: "spacious",
      headingCase: "normal",
      lineHeight: "relaxed",
    },
    motion: {
      level: "none",
      scrollEffect: "none",
      hoverStyle: "underline",
      pageTransition: "fade",
      heroAnimation: "none",
      counterAnimation: false,
    },
    imagery: {
      photoTreatment: "natural",
      photoSpacing: "generous",
      galleryStyle: "grid",
      iconStyle: "outline",
      illustrationStyle: "none",
    },
    defaultHeroMask: "rounded_rectangle",
    defaultFontPairing: "raleway",
    paletteDirection: "Minimal — near-black, white, single accent colour",
  },

  // ----------------------------------------------------------
  // 8. Heritage — prestigious, elegant, authoritative
  // ----------------------------------------------------------
  heritage: {
    id: "heritage",
    name: "Heritage",
    description: "Prestigious, elegant, authoritative — tradition meets quality",
    bestFor: ["independent", "grammar", "historic", "heritage"],
    phase: "secondary",
    layout: {
      navStyle: "top_bar",
      navPosition: "top",
      heroStyle: "static_image",
      heroHeight: "full_viewport",
      contentWidth: "contained",
      gridStyle: "cards",
      quickLinksStyle: "tiles",
      quickLinksCount: 4,
      footerStyle: "mega_footer",
    },
    shape: {
      borderRadius: 4,
      sectionDivider: "straight",
      cardStyle: "bordered",
      buttonStyle: "rounded",
      imageShape: "square",
    },
    colour: {
      mode: "dark_accent",
      headerBackground: "solid_brand",
      heroOverlay: "dark_gradient",
      heroOverlayOpacity: 0.5,
      sectionAlternation: "white_grey",
      footerBackground: "dark",
    },
    typography: {
      headingFont: "serif",
      bodyFont: "readable_serif",
      headingWeight: "semibold",
      textScale: "spacious",
      headingCase: "small_caps",
      lineHeight: "relaxed",
    },
    motion: {
      level: "subtle",
      scrollEffect: "fade_up",
      hoverStyle: "colour_shift",
      pageTransition: "fade",
      heroAnimation: "none",
      counterAnimation: false,
    },
    imagery: {
      photoTreatment: "natural",
      photoSpacing: "generous",
      galleryStyle: "lightbox",
      iconStyle: "outline",
      illustrationStyle: "none",
    },
    defaultHeroMask: "full_width",
    defaultFontPairing: "garamond",
    paletteDirection: "Prestigious — navy, burgundy, gold/cream, deep green",
  },

  // ----------------------------------------------------------
  // 9. Community — inclusive, welcoming, local
  // ----------------------------------------------------------
  community: {
    id: "community",
    name: "Community",
    description: "Inclusive, welcoming, local — the heart of the neighbourhood",
    bestFor: ["faith", "church", "village", "community", "siams"],
    phase: "primary",
    layout: {
      navStyle: "top_bar",
      navPosition: "top",
      heroStyle: "collage",
      heroHeight: "medium",
      contentWidth: "contained",
      gridStyle: "cards",
      quickLinksStyle: "icons",
      quickLinksCount: 6,
      footerStyle: "detailed",
    },
    shape: {
      borderRadius: 12,
      sectionDivider: "curve",
      cardStyle: "elevated",
      buttonStyle: "rounded",
      imageShape: "circle",
    },
    colour: {
      mode: "subtle_tints",
      headerBackground: "solid_brand",
      heroOverlay: "light_gradient",
      heroOverlayOpacity: 0.2,
      sectionAlternation: "white_brand",
      footerBackground: "brand",
    },
    typography: {
      headingFont: "humanist_sans",
      bodyFont: "clean_sans",
      headingWeight: "bold",
      textScale: "standard",
      headingCase: "normal",
      lineHeight: "normal",
    },
    motion: {
      level: "moderate",
      scrollEffect: "fade_up",
      hoverStyle: "scale",
      pageTransition: "fade",
      heroAnimation: "fade_cycle",
      counterAnimation: true,
    },
    imagery: {
      photoTreatment: "circular_crop",
      photoSpacing: "standard",
      galleryStyle: "carousel",
      iconStyle: "filled",
      illustrationStyle: "none",
    },
    defaultHeroMask: "arch",
    defaultFontPairing: "open_sans",
    paletteDirection: "Warm community — deep blue, warm red, soft gold, cream",
  },

  // ----------------------------------------------------------
  // 10. Future — cutting-edge, tech-forward, innovative
  // ----------------------------------------------------------
  future: {
    id: "future",
    name: "Future",
    description: "Cutting-edge, tech-forward, innovative — for schools pushing boundaries",
    bestFor: ["stem", "utc", "innovative", "technology"],
    phase: "secondary",
    layout: {
      navStyle: "sticky_transparent",
      navPosition: "top",
      heroStyle: "video",
      heroHeight: "full_viewport",
      contentWidth: "full_bleed",
      gridStyle: "mosaic",
      quickLinksStyle: "cards",
      quickLinksCount: 6,
      footerStyle: "mega_footer",
    },
    shape: {
      borderRadius: 0,
      sectionDivider: "angle",
      cardStyle: "glass",
      buttonStyle: "pill",
      imageShape: "square",
    },
    colour: {
      mode: "dark_accent",
      headerBackground: "transparent",
      heroOverlay: "brand_colour",
      heroOverlayOpacity: 0.4,
      sectionAlternation: "colour_blocks",
      footerBackground: "dark",
    },
    typography: {
      headingFont: "geometric_sans",
      bodyFont: "clean_sans",
      headingWeight: "black",
      textScale: "spacious",
      headingCase: "uppercase",
      lineHeight: "tight",
    },
    motion: {
      level: "playful",
      scrollEffect: "reveal",
      hoverStyle: "lift",
      pageTransition: "slide",
      heroAnimation: "parallax_scroll",
      counterAnimation: true,
    },
    imagery: {
      photoTreatment: "duotone",
      photoSpacing: "tight",
      galleryStyle: "masonry",
      iconStyle: "duotone",
      illustrationStyle: "geometric",
    },
    defaultHeroMask: "slant_right",
    defaultFontPairing: "space_grotesk",
    paletteDirection: "Tech — deep purple, electric blue, neon accent, dark backgrounds",
  },
};

/** Get all presets as an ordered array */
export function getAllPresets(): StylePreset[] {
  return Object.values(PRESETS);
}

/** Get presets recommended for a school phase */
export function getPresetsForPhase(phase: "primary" | "secondary" | "all_through"): StylePreset[] {
  return Object.values(PRESETS).filter(
    (p) => p.phase === phase || p.phase === "any"
  );
}

/** Get a specific preset by ID */
export function getPreset(id: string): StylePreset | undefined {
  return PRESETS[id];
}
