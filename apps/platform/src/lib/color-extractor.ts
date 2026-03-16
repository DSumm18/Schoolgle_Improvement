/**
 * Client-side utility to extract dominant colors from an uploaded image (e.g. school logo).
 * Uses canvas pixel sampling and k-means clustering. No external dependencies.
 */

export interface ExtractedColor {
  hex: string;
  percentage: number;
}

export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace(/^#/, "");
  if (cleaned.length !== 6 && cleaned.length !== 3) return null;

  const full =
    cleaned.length === 3
      ? cleaned[0] +
        cleaned[0] +
        cleaned[1] +
        cleaned[1] +
        cleaned[2] +
        cleaned[2]
      : cleaned;

  const num = parseInt(full, 16);
  if (isNaN(num)) return null;

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(c)));
    return clamped.toString(16).padStart(2, "0");
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Returns "#000000" or "#ffffff" depending on which has better contrast
 * against the given background hex color (WCAG relative luminance).
 */
export function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";

  // Relative luminance per WCAG 2.0
  const luminance = (channel: number) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const L =
    0.2126 * luminance(rgb.r) +
    0.7152 * luminance(rgb.g) +
    0.0722 * luminance(rgb.b);
  return L > 0.179 ? "#000000" : "#ffffff";
}

// ---- Internal types ----

interface RGBPixel {
  r: number;
  g: number;
  b: number;
}

interface Centroid extends RGBPixel {
  count: number;
}

// ---- Helpers ----

function colorDistance(a: RGBPixel, b: RGBPixel): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

function isTooLight(p: RGBPixel, threshold = 230): boolean {
  return p.r > threshold && p.g > threshold && p.b > threshold;
}

function isTooDark(p: RGBPixel, threshold = 25): boolean {
  return p.r < threshold && p.g < threshold && p.b < threshold;
}

function isNearGray(p: RGBPixel, tolerance = 15): boolean {
  const avg = (p.r + p.g + p.b) / 3;
  return (
    Math.abs(p.r - avg) < tolerance &&
    Math.abs(p.g - avg) < tolerance &&
    Math.abs(p.b - avg) < tolerance
  );
}

/**
 * Simple k-means clustering on RGB pixels.
 */
function kMeans(pixels: RGBPixel[], k: number, maxIterations = 20): Centroid[] {
  if (pixels.length === 0) return [];

  // Initialize centroids by picking evenly-spaced pixels from the array
  const step = Math.max(1, Math.floor(pixels.length / k));
  const centroids: Centroid[] = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.min(i * step, pixels.length - 1);
    centroids.push({
      r: pixels[idx].r,
      g: pixels[idx].g,
      b: pixels[idx].b,
      count: 0,
    });
  }

  const assignments = new Uint16Array(pixels.length);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // Assign each pixel to nearest centroid
    for (let i = 0; i < pixels.length; i++) {
      let minDist = Infinity;
      let nearest = 0;
      for (let c = 0; c < centroids.length; c++) {
        const d = colorDistance(pixels[i], centroids[c]);
        if (d < minDist) {
          minDist = d;
          nearest = c;
        }
      }
      if (assignments[i] !== nearest) {
        assignments[i] = nearest;
        changed = true;
      }
    }

    if (!changed) break;

    // Recompute centroids
    const sums = centroids.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));

    for (let i = 0; i < pixels.length; i++) {
      const c = assignments[i];
      sums[c].r += pixels[i].r;
      sums[c].g += pixels[i].g;
      sums[c].b += pixels[i].b;
      sums[c].count++;
    }

    for (let c = 0; c < centroids.length; c++) {
      if (sums[c].count > 0) {
        centroids[c].r = sums[c].r / sums[c].count;
        centroids[c].g = sums[c].g / sums[c].count;
        centroids[c].b = sums[c].b / sums[c].count;
        centroids[c].count = sums[c].count;
      }
    }
  }

  // Final count pass
  for (const c of centroids) c.count = 0;
  for (let i = 0; i < pixels.length; i++) {
    centroids[assignments[i]].count++;
  }

  return centroids;
}

/**
 * Loads an image from a URL (or data URI) into a canvas and returns pixel data.
 */
function loadImagePixels(
  src: string,
  maxDimension = 150,
): Promise<{ pixels: RGBPixel[]; totalSampled: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Scale down for performance
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDimension || h > maxDimension) {
        const scale = maxDimension / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas 2d context"));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      const pixels: RGBPixel[] = [];
      // Sample every pixel (image is already small)
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        // Skip fully transparent pixels
        if (a < 128) continue;

        const pixel: RGBPixel = { r: data[i], g: data[i + 1], b: data[i + 2] };

        // Pre-filter extreme colors to focus clustering on interesting ones
        if (isTooLight(pixel) || isTooDark(pixel)) continue;

        pixels.push(pixel);
      }

      resolve({ pixels, totalSampled: data.length / 4 });
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

/**
 * Extract dominant colors from an image.
 *
 * @param src - Image URL, data URI, or object URL
 * @returns Array of dominant colors sorted by prominence, filtered to meaningful brand colors
 */
export async function extractColorsFromImage(
  src: string,
): Promise<ExtractedColor[]> {
  const { pixels, totalSampled } = await loadImagePixels(src);

  if (pixels.length < 10) {
    return [];
  }

  // Cluster into 8 groups (we will filter down to 5-6)
  const numClusters = Math.min(8, Math.max(3, Math.floor(pixels.length / 50)));
  const centroids = kMeans(pixels, numClusters);

  // Convert to results
  const results: ExtractedColor[] = centroids
    .filter((c) => c.count > 0)
    .filter((c) => {
      // Remove near-gray clusters (not useful as brand colors)
      const rounded: RGBPixel = {
        r: Math.round(c.r),
        g: Math.round(c.g),
        b: Math.round(c.b),
      };
      return (
        !isNearGray(rounded, 20) &&
        !isTooLight(rounded, 220) &&
        !isTooDark(rounded, 30)
      );
    })
    .map((c) => ({
      hex: rgbToHex(c.r, c.g, c.b),
      percentage: Math.round((c.count / totalSampled) * 1000) / 10,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 6);

  // Deduplicate very similar colors (within distance 900 ≈ ~30 per channel)
  const deduped: ExtractedColor[] = [];
  for (const color of results) {
    const rgb = hexToRgb(color.hex)!;
    const tooClose = deduped.some((existing) => {
      const eRgb = hexToRgb(existing.hex)!;
      return colorDistance(rgb, eRgb) < 900;
    });
    if (!tooClose) {
      deduped.push(color);
    }
  }

  return deduped;
}
