/**
 * Simple icon generator - creates basic PNG icons
 * Requires: canvas (built-in Node.js)
 */

const fs = require("fs");
const { createCanvas } = require("canvas");

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#667eea");
  gradient.addColorStop(1, "#764ba2");

  // Rounded rectangle
  const radius = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(size - radius, 0);
  ctx.quadraticCurveTo(size, 0, size, radius);
  ctx.lineTo(size, size - radius);
  ctx.quadraticCurveTo(size, size, size - radius, size);
  ctx.lineTo(radius, size);
  ctx.quadraticCurveTo(0, size, 0, size - radius);
  ctx.lineTo(0, radius);
  ctx.quadraticCurveTo(0, 0, radius, 0);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();

  // "E" text
  ctx.fillStyle = "white";
  ctx.font = `bold ${size * 0.6}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("E", size / 2, size * 0.55);

  // Save as PNG
  const buffer = canvas.toBuffer("image/png");
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

// Create icons
try {
  createIcon(16, "icon16.png");
  createIcon(48, "icon48.png");
  createIcon(128, "icon128.png");
  console.log("Icons created successfully!");
} catch (error) {
  console.error("Error creating icons:", error);
  console.log("\nTip: Install canvas with: npm install canvas");
}
