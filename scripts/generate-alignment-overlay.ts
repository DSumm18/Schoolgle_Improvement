/**
 * Generate a visual overlay of room outlines on the PDF floor plan.
 * Outputs to /tmp/alignment-overlay.png for visual verification.
 *
 * Run: npx tsx scripts/generate-alignment-overlay.ts
 */

import sharp from "sharp";
import path from "path";

// Import room data - use dynamic import since it's TS
const dataPath = path.resolve(
  __dirname,
  "../apps/platform/src/components/show-me-site/grove-house-3d-data.ts"
);

// We can't import TS directly in this context, so inline the data
// This must match ROOM_OUTLINES from grove-house-3d-data.ts exactly
const ROOM_OUTLINES = [
  { systemId: "B1-01", label: "Block 1 - Room 1", block: "Block 1", x: -15.9, z: -2.4, w: 6.4, d: 4.3, color: "#3b82f6" },
  { systemId: "B1-02", label: "Block 1 - Room 2", block: "Block 1", x: -15.9, z: -6.9, w: 6.4, d: 4.3, color: "#3b82f6" },
  { systemId: "B2-01", label: "Block 2 - Room 1", block: "Block 2", x: -25.4, z: -2.4, w: 9.3, d: 4.3, color: "#60a5fa" },
  { systemId: "B2-02", label: "Block 2 - Room 2", block: "Block 2", x: -25.4, z: -6.9, w: 9.3, d: 4.3, color: "#60a5fa" },
  { systemId: "2001-01", label: "2001 Building - Hall", block: "2001 Building", x: -40.9, z: 8.1, w: 10.4, d: 7.8, color: "#f59e0b" },
  { systemId: "2001-02", label: "2001 Building - Room 2", block: "2001 Building", x: -40.9, z: 16.1, w: 6.5, d: 5.1, color: "#f59e0b" },
  { systemId: "2001-03", label: "2001 Building - Room 3", block: "2001 Building", x: -34.3, z: 4.2, w: 3.8, d: 3.7, color: "#f59e0b" },
  { systemId: "2001-04", label: "2001 Building - Room 4", block: "2001 Building", x: -40.9, z: 4.2, w: 6.4, d: 3.7, color: "#f59e0b" },
  { systemId: "B3-01", label: "Block 3 - Room 1", block: "Block 3", x: -10.7, z: 14.7, w: 4.8, d: 4.1, color: "#22c55e" },
  { systemId: "B3-02", label: "Block 3 - Room 2", block: "Block 3", x: -5.7, z: 14.7, w: 4.8, d: 4.1, color: "#22c55e" },
  { systemId: "B3-03", label: "Block 3 - Room 3", block: "Block 3", x: -10.7, z: 11.5, w: 9.8, d: 3.0, color: "#22c55e" },
  { systemId: "ENT-01", label: "Main Entrance", block: "Main", x: -5.0, z: -6.0, w: 3.5, d: 3.0, color: "#ef4444" },
  { systemId: "B4-01", label: "Block 4 - Room 1", block: "Block 4", x: -7.0, z: 23.2, w: 5.3, d: 4.2, color: "#a78bfa" },
  { systemId: "B4-02", label: "Block 4 - Room 2", block: "Block 4", x: -1.5, z: 23.2, w: 5.3, d: 4.2, color: "#a78bfa" },
  { systemId: "B4-03", label: "Block 4 - Room 3", block: "Block 4", x: -7.0, z: 19.4, w: 5.3, d: 3.6, color: "#a78bfa" },
  { systemId: "B4-04", label: "Block 4 - Room 4", block: "Block 4", x: -1.5, z: 19.4, w: 5.3, d: 3.6, color: "#a78bfa" },
  { systemId: "2017-01", label: "2017 Building - Room 1", block: "2017 Building", x: -10.0, z: 27.4, w: 4.8, d: 3.5, color: "#f97316" },
  { systemId: "2017-02", label: "2017 Building - Room 2", block: "2017 Building", x: -5.0, z: 27.4, w: 4.8, d: 3.5, color: "#f97316" },
  { systemId: "2017-03", label: "2017 Building - Room 3", block: "2017 Building", x: 0.0, z: 27.4, w: 4.8, d: 3.5, color: "#f97316" },
];

const IMG_W = 3309;
const IMG_H = 2339;

function toPixelX(worldX: number): number {
  return ((worldX + 45) / 80) * IMG_W;
}
function toPixelY(worldZ: number): number {
  return ((33.35 - worldZ) / 56.7) * IMG_H;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return { r: 255, g: 0, b: 0 };
  return {
    r: parseInt(m[1].substring(0, 2), 16),
    g: parseInt(m[1].substring(2, 4), 16),
    b: parseInt(m[1].substring(4, 6), 16),
  };
}

async function main() {
  const pdfPath = path.resolve(
    __dirname,
    "../apps/platform/public/site-plans/grove-house-ground-floor.png"
  );

  // Build SVG overlay
  const rects = ROOM_OUTLINES.map((room) => {
    const px = Math.round(toPixelX(room.x));
    const py = Math.round(toPixelY(room.z + room.d)); // top-left in image coords
    const pw = Math.round(toPixelX(room.x + room.w) - toPixelX(room.x));
    const ph = Math.round(toPixelY(room.z) - toPixelY(room.z + room.d));
    const { r, g, b } = hexToRgb(room.color);

    return `
      <rect x="${px}" y="${py}" width="${pw}" height="${ph}"
            fill="rgba(${r},${g},${b},0.25)" stroke="${room.color}" stroke-width="4"/>
      <text x="${px + pw / 2}" y="${py + ph / 2 + 6}"
            text-anchor="middle" font-size="18" font-weight="bold"
            fill="white" stroke="black" stroke-width="1"
            font-family="sans-serif">${room.systemId}</text>
    `;
  }).join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${IMG_W}" height="${IMG_H}">
    ${rects}
  </svg>`;

  // Composite SVG overlay on top of PDF image
  const overlay = Buffer.from(svg);
  await sharp(pdfPath)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .toFile("/tmp/alignment-overlay.png");

  console.log("Overlay saved to /tmp/alignment-overlay.png");
  console.log(`${ROOM_OUTLINES.length} rooms drawn`);

  // Print pixel positions for each room
  ROOM_OUTLINES.forEach((room) => {
    const px = Math.round(toPixelX(room.x));
    const py = Math.round(toPixelY(room.z + room.d));
    const pw = Math.round(toPixelX(room.x + room.w) - toPixelX(room.x));
    const ph = Math.round(toPixelY(room.z) - toPixelY(room.z + room.d));
    console.log(
      `  ${room.systemId.padEnd(8)} px(${px},${py}) ${pw}x${ph}  world(${room.x},${room.z}) ${room.w}x${room.d}`
    );
  });
}

main().catch(console.error);
