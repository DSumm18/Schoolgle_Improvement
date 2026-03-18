// ============================================================
// Logo Colour Extraction
// ============================================================
// Client-side colour extraction from uploaded logo images.
// Uses canvas pixel sampling + k-means clustering to find
// dominant colours, then generates palette options.
// ============================================================

import type { ExtractedColour } from "./types";

// ------------------------------------------------------------
// Core extraction: image → dominant colours
// ------------------------------------------------------------

/**
 * Extract dominant colours from a logo image.
 * Runs entirely client-side using canvas.
 *
 * @param imageSource - File, Blob, or image URL
 * @param maxColours - Maximum colours to extract (default 6)
 * @returns Array of extracted colours sorted by dominance
 */
export async function extractColoursFromLogo(
  imageSource: File | Blob | string,
  maxColours: number = 6
): Promise<ExtractedColour[]> {
  const imageData = await loadImageData(imageSource);
  const pixels = samplePixels(imageData, 10_000);
  const filtered = filterPixels(pixels);

  if (filtered.length === 0) {
    return [];
  }

  const clusters = kMeansClustering(filtered, Math.min(maxColours, 8), 20);
  const totalPixels = filtered.length;

  const colours: ExtractedColour[] = clusters
    .map((cluster) => {
      const r = Math.round(cluster.center[0]);
      const g = Math.round(cluster.center[1]);
      const b = Math.round(cluster.center[2]);
      const hsl = rgbToHsl(r, g, b);
      const hex = rgbToHex(r, g, b);
      return {
        hex,
        rgb: { r, g, b },
        hsl: { h: hsl.h, s: hsl.s, l: hsl.l },
        percentage: (cluster.count / totalPixels) * 100,
        name: getColourName(hsl.h, hsl.s, hsl.l),
      };
    })
    .filter((c) => c.percentage >= 2) // drop tiny clusters
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, maxColours);

  return colours;
}

// ------------------------------------------------------------
// Image loading → canvas pixel data
// ------------------------------------------------------------

function loadImageData(source: File | Blob | string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Scale down for performance (max 200px on longest side)
      const scale = Math.min(1, 200 / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      resolve(ctx.getImageData(0, 0, w, h));
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    if (typeof source === "string") {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

// ------------------------------------------------------------
// Pixel sampling and filtering
// ------------------------------------------------------------

type Pixel = [number, number, number]; // [R, G, B]

/** Uniformly sample pixels from image data */
function samplePixels(imageData: ImageData, maxSamples: number): Pixel[] {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  const step = Math.max(1, Math.floor(totalPixels / maxSamples));
  const pixels: Pixel[] = [];

  for (let i = 0; i < totalPixels; i += step) {
    const offset = i * 4;
    const alpha = data[offset + 3];
    // Skip transparent pixels
    if (alpha < 128) continue;
    pixels.push([data[offset], data[offset + 1], data[offset + 2]]);
  }

  return pixels;
}

/** Filter out near-white, near-black, and very low-saturation pixels */
function filterPixels(pixels: Pixel[]): Pixel[] {
  return pixels.filter(([r, g, b]) => {
    const { s, l } = rgbToHsl(r, g, b);
    // Skip near-white (l > 95%) and near-black (l < 5%)
    if (l > 95 || l < 5) return false;
    // Skip very desaturated greys (likely background)
    if (s < 5 && l > 20 && l < 80) return false;
    return true;
  });
}

// ------------------------------------------------------------
// K-Means Clustering
// ------------------------------------------------------------

interface Cluster {
  center: [number, number, number];
  pixels: Pixel[];
  count: number;
}

function kMeansClustering(
  pixels: Pixel[],
  k: number,
  maxIterations: number
): Cluster[] {
  // Initialize centers using k-means++ seeding
  const centers = kMeansPlusPlusInit(pixels, k);

  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign pixels to nearest center
    const clusters: Cluster[] = centers.map((c) => ({
      center: [...c] as [number, number, number],
      pixels: [],
      count: 0,
    }));

    for (const pixel of pixels) {
      let minDist = Infinity;
      let nearest = 0;
      for (let i = 0; i < centers.length; i++) {
        const d = colourDistance(pixel, centers[i]);
        if (d < minDist) {
          minDist = d;
          nearest = i;
        }
      }
      clusters[nearest].pixels.push(pixel);
      clusters[nearest].count++;
    }

    // Update centers
    let converged = true;
    for (let i = 0; i < clusters.length; i++) {
      if (clusters[i].count === 0) continue;
      const newCenter = meanPixel(clusters[i].pixels);
      if (colourDistance(centers[i], newCenter) > 1) {
        converged = false;
      }
      centers[i] = newCenter;
      clusters[i].center = newCenter;
    }

    if (converged) {
      return clusters.filter((c) => c.count > 0);
    }
  }

  // Return final state
  const finalClusters: Cluster[] = centers.map((c) => ({
    center: c,
    pixels: [],
    count: 0,
  }));
  for (const pixel of pixels) {
    let minDist = Infinity;
    let nearest = 0;
    for (let i = 0; i < centers.length; i++) {
      const d = colourDistance(pixel, centers[i]);
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    }
    finalClusters[nearest].count++;
  }
  return finalClusters.filter((c) => c.count > 0);
}

/** K-means++ initialization for better initial centers */
function kMeansPlusPlusInit(pixels: Pixel[], k: number): Pixel[] {
  const centers: Pixel[] = [];
  // Pick first center randomly
  centers.push(pixels[Math.floor(Math.random() * pixels.length)]);

  for (let i = 1; i < k; i++) {
    // Calculate distance from each pixel to nearest existing center
    const distances = pixels.map((p) => {
      let minDist = Infinity;
      for (const c of centers) {
        minDist = Math.min(minDist, colourDistance(p, c));
      }
      return minDist;
    });

    // Pick next center with probability proportional to distance squared
    const totalDist = distances.reduce((sum, d) => sum + d * d, 0);
    let target = Math.random() * totalDist;
    for (let j = 0; j < pixels.length; j++) {
      target -= distances[j] * distances[j];
      if (target <= 0) {
        centers.push(pixels[j]);
        break;
      }
    }

    // Fallback if we didn't pick one (floating point edge case)
    if (centers.length <= i) {
      centers.push(pixels[Math.floor(Math.random() * pixels.length)]);
    }
  }

  return centers;
}

function colourDistance(a: Pixel, b: Pixel): number {
  // Weighted Euclidean distance (human perception weights)
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

function meanPixel(pixels: Pixel[]): Pixel {
  let r = 0, g = 0, b = 0;
  for (const [pr, pg, pb] of pixels) {
    r += pr;
    g += pg;
    b += pb;
  }
  const n = pixels.length;
  return [r / n, g / n, b / n];
}

// ------------------------------------------------------------
// Colour conversion utilities
// ------------------------------------------------------------

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

// ------------------------------------------------------------
// Colour naming (approximate, for UI display)
// ------------------------------------------------------------

function getColourName(h: number, s: number, l: number): string {
  if (s < 10) {
    if (l < 15) return "Black";
    if (l < 40) return "Dark Grey";
    if (l < 60) return "Grey";
    if (l < 85) return "Light Grey";
    return "White";
  }

  if (l < 15) return "Very Dark";
  if (l > 85) return "Very Light";

  const hueNames: [number, string][] = [
    [15, "Red"],
    [35, "Orange"],
    [55, "Yellow"],
    [80, "Yellow Green"],
    [150, "Green"],
    [175, "Teal"],
    [200, "Cyan"],
    [240, "Blue"],
    [270, "Indigo"],
    [300, "Purple"],
    [330, "Pink"],
    [360, "Red"],
  ];

  let hueName = "Red";
  for (const [boundary, name] of hueNames) {
    if (h <= boundary) {
      hueName = name;
      break;
    }
  }

  if (l < 30) return `Dark ${hueName}`;
  if (l > 70) return `Light ${hueName}`;
  if (s < 40) return `Muted ${hueName}`;
  if (s > 80) return `Vivid ${hueName}`;
  return hueName;
}

// ------------------------------------------------------------
// Contrast checking (WCAG)
// ------------------------------------------------------------

/** Calculate relative luminance */
export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** WCAG contrast ratio between two colours */
export function contrastRatio(
  c1: { r: number; g: number; b: number },
  c2: { r: number; g: number; b: number }
): number {
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Determine if white or dark text should go on a given background */
export function textColourOnBackground(bgHex: string): "#ffffff" | "#1a1a1a" {
  const { r, g, b } = hexToRgb(bgHex);
  const lum = relativeLuminance(r, g, b);
  return lum > 0.179 ? "#1a1a1a" : "#ffffff";
}
