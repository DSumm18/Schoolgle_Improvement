/**
 * Grove House Primary — 3D Scene Data
 *
 * Room positions, fire routes, equipment, and block colours
 * derived from Bradford Council fire prevention plan.
 *
 * Multi-block building:
 * - Blocks 1 & 2: Bottom-left (original building)
 * - Block 3: Center-right (entrance, offices)
 * - Block 4: Top-right area (KS2 + staff)
 * - Block 5 / 2017 Building: Top extension
 * - 2001 Building: Far-left extension (hall, kitchen, nursery)
 * - Main Entrance: Bottom-right
 */

export interface Room3D {
  id: string;
  name: string;
  block: string;
  type: string;
  x: number;
  z: number;
  w: number;
  d: number;
  zone: string;
  capacity?: number;
}

export interface FireExit3D {
  x: number;
  z: number;
  label: string;
  type: "main" | "fire";
}

export interface FireEquipment3D {
  x: number;
  z: number;
  equipType: string;
  name: string;
}

// ─── Block Colours (Schoolgle brand) ─────────────────────

export const BLOCK_COLORS: Record<string, { fill: number; hex: string }> = {
  "Block 1": { fill: 0x3b82f6, hex: "#3b82f6" },
  "Block 2": { fill: 0x3b82f6, hex: "#3b82f6" },
  "Block 3": { fill: 0x22c55e, hex: "#22c55e" },
  "Block 4": { fill: 0xa78bfa, hex: "#a78bfa" },
  "Block 5": { fill: 0x06b6d4, hex: "#06b6d4" },
  "2001 Building": { fill: 0xf59e0b, hex: "#f59e0b" },
  "2017 Building": { fill: 0xf97316, hex: "#f97316" },
};

// ─── Zone Assembly Points ────────────────────────────────

export const ZONE_ASSEMBLY: Record<
  string,
  { x: number; z: number; label: string }
> = {
  A: { x: -30, z: 8, label: "West Gate Assembly" },
  B: { x: -10, z: -6, label: "South Playground Assembly" },
  C: { x: 4, z: 30, label: "North Field Assembly" },
  D: { x: 14, z: 0, label: "Front Car Park Assembly" },
  E: { x: -30, z: 14, label: "Service Gate Assembly" },
};

// ─── Rooms (25 rooms from fire plan) ─────────────────────

export const ROOMS_3D: Room3D[] = [
  // Block 1 (bottom-left of main building)
  {
    id: "b1-class1",
    name: "Year 1",
    block: "Block 1",
    type: "Classroom",
    x: -8,
    z: 6,
    w: 5,
    d: 4,
    zone: "B",
    capacity: 30,
  },
  {
    id: "b1-class2",
    name: "Year 2",
    block: "Block 1",
    type: "Classroom",
    x: -8,
    z: 11,
    w: 5,
    d: 4,
    zone: "B",
    capacity: 30,
  },
  {
    id: "b1-toilets",
    name: "KS1 Toilets",
    block: "Block 1",
    type: "Facilities",
    x: -3,
    z: 8,
    w: 3,
    d: 3,
    zone: "B",
  },

  // Block 2 (adjacent to Block 1)
  {
    id: "b2-class1",
    name: "Year 3",
    block: "Block 2",
    type: "Classroom",
    x: -14,
    z: 6,
    w: 5,
    d: 4,
    zone: "B",
    capacity: 30,
  },
  {
    id: "b2-class2",
    name: "Year 4",
    block: "Block 2",
    type: "Classroom",
    x: -14,
    z: 11,
    w: 5,
    d: 4,
    zone: "B",
    capacity: 30,
  },
  {
    id: "b2-store",
    name: "Store Room",
    block: "Block 2",
    type: "Service",
    x: -11,
    z: 14,
    w: 3,
    d: 2,
    zone: "B",
  },

  // 2001 Building (far-left extension)
  {
    id: "2001-hall",
    name: "Main Hall",
    block: "2001 Building",
    type: "Assembly",
    x: -22,
    z: 8,
    w: 8,
    d: 6,
    zone: "A",
    capacity: 200,
  },
  {
    id: "2001-kitchen",
    name: "Kitchen",
    block: "2001 Building",
    type: "Service",
    x: -22,
    z: 14,
    w: 5,
    d: 3,
    zone: "E",
    capacity: 5,
  },
  {
    id: "2001-nursery",
    name: "Nursery",
    block: "2001 Building",
    type: "EYFS",
    x: -22,
    z: 2,
    w: 6,
    d: 4,
    zone: "A",
    capacity: 26,
  },

  // Block 3 (center-right, connects to entrance)
  {
    id: "b3-recep",
    name: "Reception Class",
    block: "Block 3",
    type: "EYFS",
    x: 2,
    z: 6,
    w: 5,
    d: 4,
    zone: "C",
    capacity: 30,
  },
  {
    id: "b3-office",
    name: "School Office",
    block: "Block 3",
    type: "Admin",
    x: 6,
    z: 4,
    w: 4,
    d: 3,
    zone: "D",
    capacity: 6,
  },
  {
    id: "b3-head",
    name: "Head's Office",
    block: "Block 3",
    type: "Admin",
    x: 6,
    z: 8,
    w: 4,
    d: 3,
    zone: "D",
    capacity: 4,
  },
  {
    id: "b3-entrance",
    name: "Main Entrance",
    block: "Block 3",
    type: "Entrance",
    x: 8,
    z: 1,
    w: 3,
    d: 2,
    zone: "D",
    capacity: 10,
  },
  {
    id: "b3-staffwc",
    name: "Staff WC",
    block: "Block 3",
    type: "Facilities",
    x: 3,
    z: 2,
    w: 2,
    d: 2,
    zone: "D",
  },

  // Block 4 (upper-right)
  {
    id: "b4-class1",
    name: "Year 5",
    block: "Block 4",
    type: "Classroom",
    x: 4,
    z: 14,
    w: 5,
    d: 4,
    zone: "C",
    capacity: 30,
  },
  {
    id: "b4-class2",
    name: "Year 6",
    block: "Block 4",
    type: "Classroom",
    x: 4,
    z: 19,
    w: 5,
    d: 4,
    zone: "C",
    capacity: 30,
  },
  {
    id: "b4-staff",
    name: "Staff Room",
    block: "Block 4",
    type: "Staff",
    x: 8,
    z: 12,
    w: 4,
    d: 3,
    zone: "D",
    capacity: 15,
  },
  {
    id: "b4-lib",
    name: "Library",
    block: "Block 4",
    type: "Specialist",
    x: 8,
    z: 16,
    w: 4,
    d: 4,
    zone: "C",
    capacity: 20,
  },

  // Block 5 / 2017 Building (top extension)
  {
    id: "b5-ict",
    name: "ICT Suite",
    block: "2017 Building",
    type: "Specialist",
    x: -4,
    z: 20,
    w: 5,
    d: 4,
    zone: "C",
    capacity: 20,
  },
  {
    id: "b5-sen",
    name: "SEN Room",
    block: "2017 Building",
    type: "SEN",
    x: -4,
    z: 25,
    w: 4,
    d: 3,
    zone: "C",
    capacity: 6,
  },
  {
    id: "b5-music",
    name: "Music Room",
    block: "2017 Building",
    type: "Specialist",
    x: 1,
    z: 25,
    w: 4,
    d: 3,
    zone: "C",
    capacity: 15,
  },
  {
    id: "b5-medical",
    name: "Medical Room",
    block: "Block 5",
    type: "Welfare",
    x: -8,
    z: 16,
    w: 3,
    d: 3,
    zone: "B",
    capacity: 3,
  },

  // Additional spaces
  {
    id: "caretaker",
    name: "Caretaker Store",
    block: "Block 1",
    type: "Service",
    x: -3,
    z: 12,
    w: 3,
    d: 2,
    zone: "E",
  },
  {
    id: "boiler",
    name: "Boiler Room",
    block: "2001 Building",
    type: "Plant",
    x: -27,
    z: 8,
    w: 3,
    d: 3,
    zone: "E",
  },
  {
    id: "vi-room",
    name: "VI Resource",
    block: "Block 5",
    type: "SEN",
    x: -8,
    z: 20,
    w: 4,
    d: 3,
    zone: "B",
    capacity: 6,
  },
];

// ─── Fire Exits ──────────────────────────────────────────

export const FIRE_EXITS_3D: FireExit3D[] = [
  { x: 10, z: 1, label: "Main Entrance", type: "main" },
  { x: -27, z: 5, label: "Hall Fire Exit (W)", type: "fire" },
  { x: -27, z: 12, label: "Kitchen Exit", type: "fire" },
  { x: -16, z: 14, label: "Block 2 North Exit", type: "fire" },
  { x: -16, z: 4, label: "Block 2 South Exit", type: "fire" },
  { x: -5, z: 4, label: "Block 1 South Exit", type: "fire" },
  { x: -5, z: 14, label: "Block 1 North Exit", type: "fire" },
  { x: 2, z: 4, label: "Reception South Exit", type: "fire" },
  { x: 9, z: 11, label: "Block 3 East Exit", type: "fire" },
  { x: 9, z: 20, label: "Block 4 North Exit", type: "fire" },
  { x: -2, z: 27, label: "2017 Building Exit", type: "fire" },
  { x: -22, z: -1, label: "Nursery Exit", type: "fire" },
];

// ─── Fire Route Paths (red animated lines) ───────────────

export const FIRE_ROUTES_3D: [number, number][][] = [
  // Block 1&2 south route
  [
    [-14, 6],
    [-14, 4],
    [-8, 4],
    [-5, 4],
  ],
  // Block 1&2 north route
  [
    [-14, 11],
    [-14, 14],
    [-11, 14],
    [-8, 14],
    [-5, 14],
  ],
  // Hall west exits
  [
    [-22, 8],
    [-27, 8],
    [-27, 5],
  ],
  [
    [-22, 14],
    [-27, 14],
    [-27, 12],
  ],
  // Block 3 to main entrance
  [
    [6, 4],
    [8, 4],
    [10, 1],
  ],
  // Block 3 east exit
  [
    [6, 8],
    [9, 8],
    [9, 11],
  ],
  // Block 4 north exit
  [
    [4, 19],
    [4, 22],
    [9, 22],
    [9, 20],
  ],
  // 2017 Building exit
  [
    [-4, 25],
    [-4, 27],
    [-2, 27],
  ],
  // Nursery exit
  [
    [-22, 2],
    [-22, -1],
  ],
  // Internal corridor (main spine)
  [
    [-5, 8],
    [2, 8],
    [6, 8],
  ],
  [
    [2, 8],
    [2, 14],
    [4, 14],
  ],
];

// ─── Fire Equipment ──────────────────────────────────────

export const FIRE_EQUIPMENT_3D: FireEquipment3D[] = [
  { x: -22, z: 14, equipType: "extinguisher", name: "Kitchen Extinguisher" },
  { x: -22, z: 6, equipType: "extinguisher", name: "Hall Extinguisher" },
  { x: -22, z: 10, equipType: "extinguisher", name: "Hall Extinguisher 2" },
  { x: -8, z: 4, equipType: "extinguisher", name: "Block 1 Corridor" },
  { x: -14, z: 4, equipType: "extinguisher", name: "Block 2 Corridor" },
  { x: 6, z: 4, equipType: "extinguisher", name: "Office Corridor" },
  { x: 8, z: 12, equipType: "extinguisher", name: "Staff Room" },
  { x: 4, z: 14, equipType: "extinguisher", name: "Year 5 Corridor" },
  { x: -4, z: 20, equipType: "extinguisher", name: "ICT Suite" },
  { x: -3, z: 12, equipType: "extinguisher", name: "Caretaker Store" },
  { x: -22, z: 14.5, equipType: "blanket", name: "Kitchen Fire Blanket" },
  { x: 6, z: 1, equipType: "defib", name: "Defibrillator" },
];

// ─── Compliance Mock Data ────────────────────────────────

export type ComplianceStatus = "green" | "amber" | "red";

export const COMPLIANCE_STATUS: Record<string, ComplianceStatus> = {
  "b1-class1": "green",
  "b1-class2": "green",
  "b1-toilets": "amber",
  "b2-class1": "green",
  "b2-class2": "amber",
  "b2-store": "green",
  "2001-hall": "green",
  "2001-kitchen": "red",
  "2001-nursery": "green",
  "b3-recep": "green",
  "b3-office": "green",
  "b3-head": "green",
  "b3-entrance": "green",
  "b3-staffwc": "green",
  "b4-class1": "green",
  "b4-class2": "green",
  "b4-staff": "green",
  "b4-lib": "green",
  "b5-ict": "amber",
  "b5-sen": "green",
  "b5-music": "green",
  "b5-medical": "green",
  caretaker: "red",
  boiler: "red",
  "vi-room": "green",
};

export const COMPLIANCE_COLORS: Record<ComplianceStatus, number> = {
  green: 0x22c55e,
  amber: 0xf59e0b,
  red: 0xef4444,
};

export const COMPLIANCE_NOTES: Record<string, string> = {
  "b1-toilets": "PAT testing overdue",
  "b2-class2": "Fire risk assessment due Jan 2026",
  "2001-kitchen": "Fire blanket expired — replace immediately",
  "b5-ict": "Fire risk assessment overdue since Dec 2025",
  caretaker: "COSHH audit 6 months overdue",
  boiler: "Annual inspection overdue",
};
