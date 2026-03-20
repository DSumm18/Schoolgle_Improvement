/**
 * Generate Aurora Primary SVG Floor Plans
 *
 * Run: node apps/platform/scripts/generate-aurora-site-plan.mjs
 * Outputs: apps/platform/public/site-plans/aurora-*.svg
 */

import { writeFileSync, mkdirSync } from "fs";

const CELL = 50; // pixels per grid unit
const PAD = 20; // padding around plan
const GRID_W = 12;
const GRID_H_MAX = 10;

const ROOM_COLORS = {
  classroom: "#E8F5E9",
  hall: "#FFF3E0",
  office: "#E3F2FD",
  staffroom: "#F3E5F5",
  library: "#E0F7FA",
  send_room: "#FFF9C4",
  kitchen: "#FFEBEE",
  dining: "#FFF3E0",
  toilet: "#ECEFF1",
  storage: "#F5F5F5",
  boiler: "#FFCDD2",
  medical: "#FCE4EC",
  reception: "#E8EAF6",
  head_office: "#E8EAF6",
  meeting: "#E8EAF6",
  ict_suite: "#E0F7FA",
  cloakroom: "#ECEFF1",
  entrance: "#C8E6C9",
  external: "#A5D6A7",
  corridor: "#F5F5F5",
};

const ROOM_STROKE = {
  classroom: "#4CAF50",
  hall: "#FF9800",
  office: "#2196F3",
  staffroom: "#9C27B0",
  library: "#00BCD4",
  send_room: "#FBC02D",
  kitchen: "#F44336",
  dining: "#FF9800",
  toilet: "#607D8B",
  storage: "#9E9E9E",
  boiler: "#D32F2F",
  medical: "#E91E63",
  reception: "#3F51B5",
  head_office: "#3F51B5",
  meeting: "#3F51B5",
  ict_suite: "#00BCD4",
  cloakroom: "#607D8B",
  entrance: "#2E7D32",
  external: "#388E3C",
  corridor: "#BDBDBD",
};

// Floor definitions from the spatial model
const FLOORS = [
  {
    id: "basement",
    label: "Basement",
    rooms: [
      {
        id: "rm-boiler",
        name: "Boiler\nRoom",
        type: "boiler",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "rm-storage-b",
        name: "Storage",
        type: "storage",
        x: 2,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "rm-caretaker",
        name: "Caretaker",
        type: "storage",
        x: 4,
        y: 0,
        w: 2,
        h: 2,
      },
    ],
    corridors: [{ x: 0, y: 2, w: 6, h: 1 }],
    gridW: 6,
    gridH: 3,
  },
  {
    id: "ground",
    label: "Ground Floor",
    rooms: [
      {
        id: "rm-reception",
        name: "Reception",
        type: "reception",
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "rm-head",
        name: "Head's\nOffice",
        type: "head_office",
        x: 2,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "rm-admin",
        name: "School\nOffice",
        type: "office",
        x: 4,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "rm-meeting",
        name: "Meeting\nRoom",
        type: "meeting",
        x: 6,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "rm-medical",
        name: "Medical",
        type: "medical",
        x: 8,
        y: 0,
        w: 2,
        h: 2,
      },
      {
        id: "rm-send-1",
        name: "Intervention\nRoom 1",
        type: "send_room",
        x: 10,
        y: 0,
        w: 2,
        h: 2,
      },
      // EYFS & KS1
      {
        id: "rm-oak",
        name: "Oak\n(Reception)",
        type: "classroom",
        x: 0,
        y: 3,
        w: 3,
        h: 3,
      },
      {
        id: "rm-maple",
        name: "Maple\n(Reception)",
        type: "classroom",
        x: 3,
        y: 3,
        w: 3,
        h: 3,
      },
      {
        id: "rm-birch",
        name: "Birch\n(Year 1)",
        type: "classroom",
        x: 0,
        y: 6,
        w: 3,
        h: 3,
      },
      {
        id: "rm-elm",
        name: "Elm\n(Year 1)",
        type: "classroom",
        x: 3,
        y: 6,
        w: 3,
        h: 3,
      },
      {
        id: "rm-cloakroom-eyfs",
        name: "EYFS\nCloakroom",
        type: "cloakroom",
        x: 6,
        y: 3,
        w: 2,
        h: 2,
      },
      {
        id: "rm-toilet-eyfs",
        name: "EYFS\nToilets",
        type: "toilet",
        x: 6,
        y: 5,
        w: 2,
        h: 2,
      },
      // Communal
      {
        id: "rm-hall",
        name: "Main Hall",
        type: "hall",
        x: 8,
        y: 3,
        w: 4,
        h: 4,
      },
      {
        id: "rm-kitchen",
        name: "Kitchen",
        type: "kitchen",
        x: 8,
        y: 7,
        w: 2,
        h: 2,
      },
      {
        id: "rm-dining",
        name: "Dining",
        type: "dining",
        x: 10,
        y: 7,
        w: 2,
        h: 2,
      },
    ],
    corridors: [{ x: 0, y: 2, w: 12, h: 1 }],
    exits: [
      { x: 0, y: -0.5, label: "Main Entrance ↑" },
      { x: 0, y: 9.5, label: "EYFS Fire Door ↓" },
      { x: 12.5, y: 5, label: "Hall Fire Door →" },
      { x: 8, y: 9.5, label: "Kitchen Exit ↓" },
    ],
    gridW: 12,
    gridH: 9,
  },
  {
    id: "first",
    label: "First Floor",
    rooms: [
      {
        id: "rm-ash",
        name: "Ash\n(Year 2)",
        type: "classroom",
        x: 0,
        y: 0,
        w: 3,
        h: 3,
      },
      {
        id: "rm-willow",
        name: "Willow\n(Year 2)",
        type: "classroom",
        x: 3,
        y: 0,
        w: 3,
        h: 3,
      },
      {
        id: "rm-holly",
        name: "Holly\n(Year 3)",
        type: "classroom",
        x: 0,
        y: 3,
        w: 3,
        h: 3,
      },
      {
        id: "rm-rowan",
        name: "Rowan\n(Year 3)",
        type: "classroom",
        x: 3,
        y: 3,
        w: 3,
        h: 3,
      },
      {
        id: "rm-toilet-ff",
        name: "Toilets",
        type: "toilet",
        x: 5.5,
        y: 0,
        w: 1,
        h: 3,
      },
      {
        id: "rm-staff-toilet-ff",
        name: "Staff\nWC",
        type: "toilet",
        x: 5.5,
        y: 3,
        w: 1,
        h: 2,
      },
      {
        id: "rm-cedar",
        name: "Cedar\n(Year 4)",
        type: "classroom",
        x: 6.5,
        y: 0,
        w: 2.75,
        h: 3,
      },
      {
        id: "rm-pine",
        name: "Pine\n(Year 4)",
        type: "classroom",
        x: 9.25,
        y: 0,
        w: 2.75,
        h: 3,
      },
      {
        id: "rm-library",
        name: "Library",
        type: "library",
        x: 6.5,
        y: 3,
        w: 2.75,
        h: 2,
      },
      {
        id: "rm-ict",
        name: "ICT Suite",
        type: "ict_suite",
        x: 9.25,
        y: 3,
        w: 2.75,
        h: 2,
      },
      {
        id: "rm-staffroom",
        name: "Staff Room",
        type: "staffroom",
        x: 6.5,
        y: 5,
        w: 2.75,
        h: 2,
      },
      {
        id: "rm-send-2",
        name: "Intervention\nRoom 2",
        type: "send_room",
        x: 9.25,
        y: 5,
        w: 2.75,
        h: 2,
      },
    ],
    corridors: [
      { x: 0, y: 6, w: 5.5, h: 1 },
      { x: 6.5, y: 7, w: 5.5, h: 1 },
    ],
    exits: [
      { x: -0.5, y: 3, label: "← West Stairs" },
      { x: 12.5, y: 3, label: "East Stairs →" },
    ],
    gridW: 12,
    gridH: 8,
  },
  {
    id: "second",
    label: "Second Floor",
    rooms: [
      {
        id: "rm-beech",
        name: "Beech\n(Year 5)",
        type: "classroom",
        x: 0,
        y: 0,
        w: 3,
        h: 3,
      },
      {
        id: "rm-chestnut",
        name: "Chestnut\n(Year 5)",
        type: "classroom",
        x: 3,
        y: 0,
        w: 3,
        h: 3,
      },
      {
        id: "rm-hazel",
        name: "Hazel\n(Year 6)",
        type: "classroom",
        x: 6,
        y: 0,
        w: 3,
        h: 3,
      },
      {
        id: "rm-sycamore",
        name: "Sycamore\n(Year 6)",
        type: "classroom",
        x: 9,
        y: 0,
        w: 3,
        h: 3,
      },
      {
        id: "rm-ppa",
        name: "PPA Room",
        type: "office",
        x: 0,
        y: 4,
        w: 3,
        h: 2,
      },
      {
        id: "rm-resources",
        name: "Resources",
        type: "storage",
        x: 3,
        y: 4,
        w: 3,
        h: 2,
      },
      {
        id: "rm-toilet-sf",
        name: "Toilets",
        type: "toilet",
        x: 6,
        y: 4,
        w: 2,
        h: 2,
      },
    ],
    corridors: [{ x: 0, y: 3, w: 12, h: 1 }],
    exits: [
      { x: -0.5, y: 2, label: "← West Stairs" },
      { x: 12.5, y: 2, label: "East Stairs →" },
    ],
    gridW: 12,
    gridH: 6,
  },
];

function renderFloor(floor) {
  const svgW = floor.gridW * CELL + PAD * 2;
  const svgH = floor.gridH * CELL + PAD * 2 + 30; // +30 for title

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}" font-family="system-ui, -apple-system, sans-serif">
  <style>
    .room-label { font-size: 9px; font-weight: 600; text-anchor: middle; fill: #333; }
    .room-sublabel { font-size: 7px; text-anchor: middle; fill: #666; }
    .floor-title { font-size: 14px; font-weight: 700; fill: #1a1a1a; }
    .exit-label { font-size: 8px; font-weight: 600; fill: #D32F2F; }
    .corridor { fill: #EEEEEE; stroke: #BDBDBD; stroke-width: 0.5; }
  </style>
  <rect width="${svgW}" height="${svgH}" fill="white" rx="8"/>
  <text x="${PAD}" y="22" class="floor-title">${floor.label} — Aurora Primary School</text>
`;

  const oX = PAD;
  const oY = PAD + 30;

  // Draw corridors
  for (const c of floor.corridors || []) {
    svg += `  <rect x="${oX + c.x * CELL}" y="${oY + c.y * CELL}" width="${c.w * CELL}" height="${c.h * CELL}" class="corridor" rx="2"/>\n`;
  }

  // Draw rooms
  for (const room of floor.rooms) {
    const rx = oX + room.x * CELL;
    const ry = oY + room.y * CELL;
    const rw = room.w * CELL;
    const rh = room.h * CELL;
    const fill = ROOM_COLORS[room.type] || "#F5F5F5";
    const stroke = ROOM_STROKE[room.type] || "#9E9E9E";

    svg += `  <rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" rx="4" data-room-id="${room.id}"/>\n`;

    // Room name — handle multiline
    const lines = room.name.split("\n");
    const textY = ry + rh / 2 - (lines.length - 1) * 6;
    lines.forEach((line, i) => {
      svg += `  <text x="${rx + rw / 2}" y="${textY + i * 12}" class="${i === 0 ? "room-label" : "room-sublabel"}">${line}</text>\n`;
    });
  }

  // Draw fire exits
  for (const exit of floor.exits || []) {
    const ex = oX + exit.x * CELL;
    const ey = oY + exit.y * CELL;
    svg += `  <text x="${ex}" y="${ey}" class="exit-label">🚪 ${exit.label}</text>\n`;
  }

  svg += `</svg>`;
  return svg;
}

// Generate all floor plans
mkdirSync("apps/platform/public/site-plans", { recursive: true });

for (const floor of FLOORS) {
  const svg = renderFloor(floor);
  const path = `apps/platform/public/site-plans/aurora-${floor.id}.svg`;
  writeFileSync(path, svg);
  console.log(`Generated: ${path}`);
}

// Also generate a combined overview
let combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 1600" width="700" height="1600" font-family="system-ui, -apple-system, sans-serif">
<rect width="700" height="1600" fill="white"/>
<text x="20" y="30" style="font-size:18px;font-weight:700;fill:#1a1a1a">Aurora Primary School — All Floors</text>
`;

let yOffset = 50;
for (const floor of FLOORS) {
  const svgW = floor.gridW * CELL + PAD * 2;
  const svgH = floor.gridH * CELL + PAD * 2 + 30;
  combinedSvg += `<g transform="translate(10, ${yOffset})">`;
  // Re-render inline
  combinedSvg += `<rect width="${svgW}" height="${svgH}" fill="#FAFAFA" stroke="#E0E0E0" rx="8"/>`;
  combinedSvg += `<text x="${PAD}" y="22" style="font-size:13px;font-weight:700;fill:#333">${floor.label}</text>`;

  const oX = PAD;
  const oY = PAD + 30;

  for (const c of floor.corridors || []) {
    combinedSvg += `<rect x="${oX + c.x * CELL}" y="${oY + c.y * CELL}" width="${c.w * CELL}" height="${c.h * CELL}" fill="#EEE" stroke="#BBB" stroke-width="0.5" rx="2"/>`;
  }

  for (const room of floor.rooms) {
    const rx = oX + room.x * CELL;
    const ry = oY + room.y * CELL;
    const rw = room.w * CELL;
    const rh = room.h * CELL;
    const fill = ROOM_COLORS[room.type] || "#F5F5F5";
    const stroke = ROOM_STROKE[room.type] || "#9E9E9E";
    combinedSvg += `<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${fill}" stroke="${stroke}" stroke-width="1" rx="3" data-room-id="${room.id}"/>`;
    const lines = room.name.split("\n");
    const textY = ry + rh / 2 - (lines.length - 1) * 5;
    lines.forEach((line, i) => {
      combinedSvg += `<text x="${rx + rw / 2}" y="${textY + i * 10}" text-anchor="middle" style="font-size:${i === 0 ? 8 : 6}px;font-weight:${i === 0 ? 600 : 400};fill:${i === 0 ? "#333" : "#666"}">${line}</text>`;
    });
  }

  for (const exit of floor.exits || []) {
    const ex = oX + exit.x * CELL;
    const ey = oY + exit.y * CELL;
    combinedSvg += `<text x="${ex}" y="${ey}" style="font-size:7px;font-weight:600;fill:#D32F2F">🚪 ${exit.label}</text>`;
  }

  combinedSvg += `</g>`;
  yOffset += svgH + 15;
}

combinedSvg += `</svg>`;
writeFileSync(
  "apps/platform/public/site-plans/aurora-all-floors.svg",
  combinedSvg,
);
console.log("Generated: apps/platform/public/site-plans/aurora-all-floors.svg");

console.log("\nDone! Floor plans saved to apps/platform/public/site-plans/");
