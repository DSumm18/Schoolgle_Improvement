// ============================================================
// Hero Mask Definitions
// ============================================================
// 20 SVG clip-path masks that change the shape of the hero
// image on the homepage. This is the single biggest visual
// differentiator between school websites using the same preset.
//
// Each mask is a polygon or path defined in viewBox coordinates
// (0 0 100 100). CSS applies them as clip-path: url(#mask-id).
// ============================================================

import type { HeroMask, HeroMaskId } from "./types";

export const HERO_MASKS: Record<HeroMaskId, HeroMask> = {
  // ----------------------------------------------------------
  // Full-width (classic, no masking)
  // ----------------------------------------------------------
  full_width: {
    id: "full_width",
    name: "Full Width",
    description: "Classic full-width banner with text overlay",
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["carousel", "static_image", "video", "gradient"],
  },

  // ----------------------------------------------------------
  // Diagonal cuts
  // ----------------------------------------------------------
  diagonal_right: {
    id: "diagonal_right",
    name: "Diagonal Right",
    description: "Image cuts diagonally — text sits bottom-left",
    clipPath: "polygon(0 0, 100% 0, 100% 75%, 0 100%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "video", "gradient"],
  },

  diagonal_left: {
    id: "diagonal_left",
    name: "Diagonal Left",
    description: "Image cuts diagonally the other way",
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 75%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "video", "gradient"],
  },

  // ----------------------------------------------------------
  // Slants (steeper than diagonal, image fills one side)
  // ----------------------------------------------------------
  slant_right: {
    id: "slant_right",
    name: "Slant Right",
    description: "Image fills right side, steep diagonal edge — text sits left",
    clipPath: "polygon(25% 0, 100% 0, 100% 100%, 0 100%)",
    textPosition: "left",
    compatibleHeroStyles: ["static_image", "video"],
  },

  slant_left: {
    id: "slant_left",
    name: "Slant Left",
    description: "Image fills left side, steep diagonal edge — text sits right",
    clipPath: "polygon(0 0, 100% 0, 75% 100%, 0 100%)",
    textPosition: "right",
    compatibleHeroStyles: ["static_image", "video"],
  },

  // ----------------------------------------------------------
  // Waves
  // ----------------------------------------------------------
  wave_bottom: {
    id: "wave_bottom",
    name: "Wave Bottom",
    description: "Smooth wave along the bottom edge",
    clipPath:
      "polygon(0 0, 100% 0, 100% 85%, 87% 90%, 75% 88%, 62% 92%, 50% 90%, 37% 85%, 25% 88%, 12% 83%, 0 87%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["carousel", "static_image", "video", "gradient"],
  },

  // ----------------------------------------------------------
  // Curves and arches
  // ----------------------------------------------------------
  arch: {
    id: "arch",
    name: "Arch",
    description: "Rounded arch bottom — elegant and welcoming",
    clipPath: "ellipse(55% 95% at 50% 0%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "gradient"],
  },

  scoop: {
    id: "scoop",
    name: "Scoop",
    description: "Concave scoop cut from the bottom",
    clipPath: "ellipse(120% 85% at 50% 0%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "video", "gradient"],
  },

  // ----------------------------------------------------------
  // Corner reveals (image reveals content beneath in a corner)
  // ----------------------------------------------------------
  corner_reveal_br: {
    id: "corner_reveal_br",
    name: "Corner Reveal (Bottom Right)",
    description: "Bottom-right corner cut away — content peeks through",
    clipPath: "polygon(0 0, 100% 0, 100% 65%, 65% 100%, 0 100%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "video"],
  },

  corner_reveal_bl: {
    id: "corner_reveal_bl",
    name: "Corner Reveal (Bottom Left)",
    description: "Bottom-left corner cut away",
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 35% 100%, 0 65%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "video"],
  },

  // ----------------------------------------------------------
  // Stepped (staircase edge)
  // ----------------------------------------------------------
  stepped_right: {
    id: "stepped_right",
    name: "Stepped Right",
    description: "Staircase steps down to the right",
    clipPath:
      "polygon(0 0, 100% 0, 100% 60%, 75% 60%, 75% 75%, 50% 75%, 50% 90%, 25% 90%, 25% 100%, 0 100%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "gradient"],
  },

  stepped_left: {
    id: "stepped_left",
    name: "Stepped Left",
    description: "Staircase steps down to the left",
    clipPath:
      "polygon(0 0, 100% 0, 100% 100%, 75% 100%, 75% 90%, 50% 90%, 50% 75%, 25% 75%, 25% 60%, 0 60%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "gradient"],
  },

  // ----------------------------------------------------------
  // Shape crops (image contained in a shape)
  // ----------------------------------------------------------
  circle_crop: {
    id: "circle_crop",
    name: "Circle",
    description: "Image cropped into a large circle — text beside it",
    clipPath: "circle(42% at 50% 50%)",
    textPosition: "left",
    compatibleHeroStyles: ["static_image"],
  },

  rounded_rectangle: {
    id: "rounded_rectangle",
    name: "Rounded Rectangle",
    description: "Image in a large rounded rectangle with margin",
    clipPath: "inset(4% 4% 4% 4% round 24px)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "video"],
  },

  blob_organic: {
    id: "blob_organic",
    name: "Organic Blob",
    description: "Organic, amoeba-like shape — playful and unique",
    clipPath:
      "polygon(30% 0%, 70% 0%, 95% 15%, 100% 45%, 90% 75%, 70% 95%, 40% 100%, 10% 85%, 0% 55%, 5% 20%)",
    textPosition: "right",
    compatibleHeroStyles: ["static_image"],
  },

  // ----------------------------------------------------------
  // Split layouts (image takes half)
  // ----------------------------------------------------------
  half_split_left: {
    id: "half_split_left",
    name: "Split Left",
    description: "Image fills left half — text fills right half",
    clipPath: "polygon(0 0, 55% 0, 45% 100%, 0 100%)",
    textPosition: "right",
    compatibleHeroStyles: ["static_image", "video"],
  },

  half_split_right: {
    id: "half_split_right",
    name: "Split Right",
    description: "Image fills right half — text fills left half",
    clipPath: "polygon(45% 0, 100% 0, 100% 100%, 55% 100%)",
    textPosition: "left",
    compatibleHeroStyles: ["static_image", "video"],
  },

  // ----------------------------------------------------------
  // Points and peaks
  // ----------------------------------------------------------
  pointed_bottom: {
    id: "pointed_bottom",
    name: "Pointed",
    description: "V-shaped point at the bottom center",
    clipPath: "polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "gradient"],
  },

  peak: {
    id: "peak",
    name: "Peak",
    description: "Mountain peak shape — dramatic and bold",
    clipPath: "polygon(0 0, 100% 0, 100% 60%, 70% 100%, 30% 100%, 0 60%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "gradient"],
  },

  // ----------------------------------------------------------
  // Texture edge
  // ----------------------------------------------------------
  torn_paper: {
    id: "torn_paper",
    name: "Torn Paper",
    description: "Rough torn-paper edge along the bottom — organic feel",
    clipPath:
      "polygon(0 0, 100% 0, 100% 82%, 95% 85%, 90% 80%, 85% 86%, 80% 82%, 75% 88%, 70% 84%, 65% 90%, 60% 83%, 55% 87%, 50% 82%, 45% 86%, 40% 80%, 35% 85%, 30% 82%, 25% 88%, 20% 84%, 15% 87%, 10% 82%, 5% 86%, 0 83%)",
    textPosition: "overlay",
    compatibleHeroStyles: ["static_image", "gradient"],
  },
};

/**
 * Get all masks as an ordered array (for the picker UI).
 * Ordered: full width first, then by visual category.
 */
export function getAllMasks(): HeroMask[] {
  return Object.values(HERO_MASKS);
}

/**
 * Get masks compatible with a given hero style.
 */
export function getMasksForHeroStyle(heroStyle: HeroMask["compatibleHeroStyles"][number]): HeroMask[] {
  return Object.values(HERO_MASKS).filter((m) =>
    m.compatibleHeroStyles.includes(heroStyle)
  );
}

/**
 * Generate the SVG defs block containing all clip-path definitions.
 * Include this once in the page, then reference with clip-path: url(#mask-{id}).
 */
export function generateMaskSvgDefs(): string {
  const defs = Object.values(HERO_MASKS)
    .map((mask) => {
      const isCircle = mask.clipPath.startsWith("circle(");
      const isEllipse = mask.clipPath.startsWith("ellipse(");
      const isInset = mask.clipPath.startsWith("inset(");

      // For polygon-based masks, convert to SVG clipPath
      if (!isCircle && !isEllipse && !isInset) {
        // Extract points from polygon(...)
        const pointsStr = mask.clipPath
          .replace("polygon(", "")
          .replace(")", "");
        const points = pointsStr
          .split(",")
          .map((p) => {
            const [x, y] = p
              .trim()
              .split(/\s+/)
              .map((v) => parseFloat(v) / 100);
            return `${x},${y}`;
          })
          .join(" ");
        return `<clipPath id="mask-${mask.id}" clipPathUnits="objectBoundingBox"><polygon points="${points}"/></clipPath>`;
      }

      // For circle/ellipse, use CSS clip-path directly (no SVG needed)
      return "";
    })
    .filter(Boolean)
    .join("\n    ");

  return `<svg width="0" height="0" style="position:absolute">\n  <defs>\n    ${defs}\n  </defs>\n</svg>`;
}

/**
 * Get the CSS clip-path value for a given mask.
 * For polygon masks, returns url(#mask-{id}).
 * For circle/ellipse/inset, returns the CSS value directly.
 */
export function getMaskCssClipPath(maskId: HeroMaskId): string {
  const mask = HERO_MASKS[maskId];
  if (!mask) return "none";

  const { clipPath } = mask;
  if (
    clipPath.startsWith("circle(") ||
    clipPath.startsWith("ellipse(") ||
    clipPath.startsWith("inset(")
  ) {
    return clipPath;
  }

  // Polygon — use SVG reference
  return `url(#mask-${maskId})`;
}
