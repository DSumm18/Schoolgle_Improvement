/**
 * Grove House Primary School — Spatial Site Model
 *
 * Traced from the actual fire prevention strategy floor plan
 * PDF ref: 11/02093/2/6/0/01
 * City of Bradford Metropolitan District Council, Building & Technical Services
 *
 * Single-storey primary school with interconnected blocks:
 * - Block 1: Central (main entrance, offices)
 * - Block 2: South-west (KS1 classrooms)
 * - Block 3: East wing (KS2 classrooms + staff)
 * - Block 4: North (hall, kitchen, classrooms)
 * - Block 6: North-east extension (classrooms)
 * - West Wing: Far-left classrooms (EYFS / Nursery)
 *
 * Test school: Grove House Primary (URN 148201, Bradford BD2 4ED)
 */

import type {
  Site,
  Building,
  Floor,
  Zone,
  Room,
  RoomType,
  Corridor,
  ExternalArea,
  MusterPoint,
  FireExit,
  EvacuationRoute,
} from "./aurora-site-model";

export type {
  Site,
  Building,
  Floor,
  Zone,
  Room,
  RoomType,
  Corridor,
  ExternalArea,
  MusterPoint,
  FireExit,
  EvacuationRoute,
};

// ─── PNG Overlay Coordinates ───────────────────────────────
// All coordinates are in pixels matching the cropped viewBox (2200 x 2100)
// The full PNG is 3309x2339 — we crop to exclude the right-side legend

export interface RoomPolygon {
  roomId: string;
  /** SVG polygon points string: "x1,y1 x2,y2 x3,y3 ..." */
  points: string;
  /** Label position (center of room for text placement) */
  labelX: number;
  labelY: number;
}

// ─── Room Polygons (traced from PDF) ───────────────────────
// Coordinates traced from grove-house-ground.png
// ViewBox: 0 0 2200 2100 (cropped from 3309x2339, scaled proportionally)
// Scale factor: 2200/3309 = 0.6648 (x), 2100/2339 = 0.8978 (y)

export const GROVE_HOUSE_POLYGONS: RoomPolygon[] = [
  // ── West Wing (Far-left — EYFS / Nursery) ────────────
  { roomId: "rm-ww-class1", points: "40,620 180,620 180,780 40,780", labelX: 110, labelY: 700 },
  { roomId: "rm-ww-class2", points: "40,790 180,790 180,950 40,950", labelX: 110, labelY: 870 },
  { roomId: "rm-ww-class3", points: "40,960 180,960 180,1120 40,1120", labelX: 110, labelY: 1040 },
  { roomId: "rm-ww-class4", points: "40,1130 180,1130 180,1310 40,1310", labelX: 110, labelY: 1220 },
  { roomId: "rm-ww-toilets", points: "180,620 290,620 290,740 180,740", labelX: 235, labelY: 680 },
  { roomId: "rm-ww-store", points: "180,750 290,750 290,860 180,860", labelX: 235, labelY: 805 },

  // ── Block 2 (South-West — KS1) ───────────────────────
  { roomId: "rm-b2-class1", points: "200,870 350,870 350,1040 200,1040", labelX: 275, labelY: 955 },
  { roomId: "rm-b2-class2", points: "200,1050 350,1050 350,1220 200,1220", labelX: 275, labelY: 1135 },
  { roomId: "rm-b2-class3", points: "200,1230 350,1230 350,1400 200,1400", labelX: 275, labelY: 1315 },
  { roomId: "rm-b2-toilet", points: "350,870 440,870 440,980 350,980", labelX: 395, labelY: 925 },

  // ── Central Connecting Rooms ─────────────────────────
  { roomId: "rm-central-medical", points: "380,990 500,990 500,1100 380,1100", labelX: 440, labelY: 1045 },
  { roomId: "rm-central-library", points: "380,1110 500,1110 500,1250 380,1250", labelX: 440, labelY: 1180 },

  // ── Block 1 (Central — Main Entrance) ────────────────
  { roomId: "rm-b1-class1", points: "440,1330 600,1330 600,1520 440,1520", labelX: 520, labelY: 1425 },
  { roomId: "rm-b1-class2", points: "600,1330 760,1330 760,1520 600,1520", labelX: 680, labelY: 1425 },
  { roomId: "rm-b1-office", points: "440,1530 600,1530 600,1680 440,1680", labelX: 520, labelY: 1605 },
  { roomId: "rm-b1-head", points: "600,1530 760,1530 760,1680 600,1680", labelX: 680, labelY: 1605 },
  { roomId: "rm-b1-reception", points: "560,1690 760,1690 760,1810 560,1810", labelX: 660, labelY: 1750 },
  { roomId: "rm-b1-toilet", points: "760,1530 850,1530 850,1680 760,1680", labelX: 805, labelY: 1605 },

  // ── Block 4 (North — Hall, Kitchen) ──────────────────
  { roomId: "rm-b4-class1", points: "420,200 580,200 580,380 420,380", labelX: 500, labelY: 290 },
  { roomId: "rm-b4-class2", points: "580,200 740,200 740,380 580,380", labelX: 660, labelY: 290 },
  { roomId: "rm-b4-hall", points: "420,390 740,390 740,580 420,580", labelX: 580, labelY: 485 },
  { roomId: "rm-b4-kitchen", points: "750,200 920,200 920,380 750,380", labelX: 835, labelY: 290 },
  { roomId: "rm-b4-dining", points: "750,390 920,390 920,530 750,530", labelX: 835, labelY: 460 },

  // ── Block 6 (North-East Extension) ───────────────────
  { roomId: "rm-b6-class1", points: "950,180 1120,180 1120,370 950,370", labelX: 1035, labelY: 275 },
  { roomId: "rm-b6-class2", points: "1120,180 1300,180 1300,370 1120,370", labelX: 1210, labelY: 275 },
  { roomId: "rm-b6-toilet", points: "950,380 1060,380 1060,450 950,450", labelX: 1005, labelY: 415 },

  // ── Block 3 (East Wing — KS2 + Staff) ────────────────
  { roomId: "rm-b3-class1", points: "1080,510 1270,510 1270,700 1080,700", labelX: 1175, labelY: 605 },
  { roomId: "rm-b3-class2", points: "1080,710 1270,710 1270,900 1080,900", labelX: 1175, labelY: 805 },
  { roomId: "rm-b3-staffroom", points: "1280,510 1440,510 1440,700 1280,700", labelX: 1360, labelY: 605 },
  { roomId: "rm-b3-send", points: "1280,710 1440,710 1440,830 1280,830", labelX: 1360, labelY: 770 },
  { roomId: "rm-b3-caretaker", points: "1280,840 1440,840 1440,960 1280,960", labelX: 1360, labelY: 900 },

  // ── Corridors (visible in plan) ──────────────────────
  { roomId: "rm-corridor-ns", points: "370,580 420,580 420,1320 370,1320", labelX: 395, labelY: 950 },
  { roomId: "rm-corridor-ew-north", points: "420,540 950,540 950,580 420,580", labelX: 685, labelY: 560 },
  { roomId: "rm-corridor-ew-south", points: "350,1310 440,1310 440,1340 350,1340", labelX: 395, labelY: 1325 },
  { roomId: "rm-corridor-east", points: "920,460 1080,460 1080,510 920,510", labelX: 1000, labelY: 485 },
];

// ─── Site Definition ───────────────────────────────────────

export const GROVE_HOUSE_SITE: Site = {
  id: "grove-house-primary",
  name: "Grove House Primary School",
  address: "Thornbury Road, Bradford, BD3 8HB",
  buildings: [
    {
      id: "main-building",
      name: "Main Building",
      floors: [
        {
          id: "ground",
          label: "Ground Floor",
          level: 0,
          zones: [
            // ── West Wing (EYFS / Nursery) ──
            {
              id: "west-wing",
              name: "West Wing — EYFS",
              type: "teaching",
              rooms: [
                { id: "rm-ww-class1", name: "Nursery", type: "classroom", yearGroup: "N", capacity: 26, areaSqm: 55, gridX: 0, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-ww-west" },
                { id: "rm-ww-class2", name: "Reception A", type: "classroom", yearGroup: "R", capacity: 30, areaSqm: 55, gridX: 0, gridY: 3, gridW: 3, gridH: 3, nearestExitId: "exit-ww-west" },
                { id: "rm-ww-class3", name: "Reception B", type: "classroom", yearGroup: "R", capacity: 30, areaSqm: 55, gridX: 0, gridY: 6, gridW: 3, gridH: 3, nearestExitId: "exit-ww-south" },
                { id: "rm-ww-class4", name: "Year 1A", type: "classroom", yearGroup: "1", capacity: 30, areaSqm: 55, gridX: 0, gridY: 9, gridW: 3, gridH: 3, nearestExitId: "exit-ww-south" },
                { id: "rm-ww-toilets", name: "EYFS Toilets", type: "toilet", areaSqm: 15, gridX: 3, gridY: 0, gridW: 2, gridH: 2 },
                { id: "rm-ww-store", name: "EYFS Store", type: "storage", areaSqm: 12, gridX: 3, gridY: 2, gridW: 2, gridH: 2 },
              ],
              corridors: [],
            },
            // ── Block 2 (KS1) ──
            {
              id: "block-2",
              name: "Block 2 — KS1",
              type: "teaching",
              rooms: [
                { id: "rm-b2-class1", name: "Year 1B", type: "classroom", yearGroup: "1", capacity: 30, areaSqm: 55, gridX: 4, gridY: 3, gridW: 3, gridH: 3, nearestExitId: "exit-b2-south" },
                { id: "rm-b2-class2", name: "Year 2A", type: "classroom", yearGroup: "2", capacity: 30, areaSqm: 55, gridX: 4, gridY: 6, gridW: 3, gridH: 3, nearestExitId: "exit-b2-south" },
                { id: "rm-b2-class3", name: "Year 2B", type: "classroom", yearGroup: "2", capacity: 30, areaSqm: 55, gridX: 4, gridY: 9, gridW: 3, gridH: 3, nearestExitId: "exit-b2-south" },
                { id: "rm-b2-toilet", name: "KS1 Toilets", type: "toilet", areaSqm: 15, gridX: 7, gridY: 3, gridW: 2, gridH: 2 },
              ],
              corridors: [],
            },
            // ── Central Connecting Rooms ──
            {
              id: "central",
              name: "Central",
              type: "welfare",
              rooms: [
                { id: "rm-central-medical", name: "Medical Room", type: "medical", capacity: 3, areaSqm: 15, gridX: 7, gridY: 5, gridW: 2, gridH: 2, nearestExitId: "exit-main" },
                { id: "rm-central-library", name: "Library", type: "library", capacity: 20, areaSqm: 35, gridX: 7, gridY: 7, gridW: 2, gridH: 3, nearestExitId: "exit-main" },
              ],
              corridors: [
                { id: "rm-corridor-ns", name: "Main N-S Corridor", gridX: 6, gridY: 0, gridW: 1, gridH: 14 },
                { id: "rm-corridor-ew-south", name: "South Link", gridX: 6, gridY: 10, gridW: 2, gridH: 1 },
              ],
            },
            // ── Block 1 (Admin / Main Entrance) ──
            {
              id: "block-1",
              name: "Block 1 — Central",
              type: "admin",
              rooms: [
                { id: "rm-b1-class1", name: "Year 3A", type: "classroom", yearGroup: "3", capacity: 30, areaSqm: 55, gridX: 8, gridY: 10, gridW: 3, gridH: 3, nearestExitId: "exit-main" },
                { id: "rm-b1-class2", name: "Year 3B", type: "classroom", yearGroup: "3", capacity: 30, areaSqm: 55, gridX: 11, gridY: 10, gridW: 3, gridH: 3, nearestExitId: "exit-main" },
                { id: "rm-b1-office", name: "School Office", type: "office", capacity: 4, areaSqm: 25, gridX: 8, gridY: 13, gridW: 3, gridH: 3, nearestExitId: "exit-main" },
                { id: "rm-b1-head", name: "Head's Office", type: "head_office", capacity: 4, areaSqm: 20, gridX: 11, gridY: 13, gridW: 3, gridH: 3, nearestExitId: "exit-main" },
                { id: "rm-b1-reception", name: "Main Entrance", type: "reception", capacity: 6, areaSqm: 20, gridX: 10, gridY: 16, gridW: 4, gridH: 2, hasFireExit: true, nearestExitId: "exit-main" },
                { id: "rm-b1-toilet", name: "Main Toilets", type: "toilet", areaSqm: 15, gridX: 14, gridY: 13, gridW: 2, gridH: 3 },
              ],
              corridors: [
                { id: "rm-b1-corridor", name: "Block 1 Corridor", gridX: 8, gridY: 13, gridW: 7, gridH: 1 },
              ],
            },
            // ── Block 4 (North — Hall, Kitchen) ──
            {
              id: "block-4",
              name: "Block 4 — North",
              type: "communal",
              rooms: [
                { id: "rm-b4-class1", name: "Year 4A", type: "classroom", yearGroup: "4", capacity: 30, areaSqm: 55, gridX: 8, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-b4-north" },
                { id: "rm-b4-class2", name: "Year 4B", type: "classroom", yearGroup: "4", capacity: 30, areaSqm: 55, gridX: 11, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-b4-north" },
                { id: "rm-b4-hall", name: "Main Hall", type: "hall", capacity: 200, areaSqm: 180, gridX: 8, gridY: 3, gridW: 6, gridH: 3, hasFireExit: true, nearestExitId: "exit-b4-south" },
                { id: "rm-b4-kitchen", name: "Kitchen", type: "kitchen", capacity: 5, areaSqm: 40, gridX: 14, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-b4-east" },
                { id: "rm-b4-dining", name: "Dining Hall", type: "dining", capacity: 60, areaSqm: 50, gridX: 14, gridY: 3, gridW: 3, gridH: 3, nearestExitId: "exit-b4-east" },
              ],
              corridors: [
                { id: "rm-corridor-ew-north", name: "North Corridor", gridX: 8, gridY: 6, gridW: 10, gridH: 1 },
              ],
            },
            // ── Block 6 (North-East Extension) ──
            {
              id: "block-6",
              name: "Block 6 — NE Extension",
              type: "teaching",
              rooms: [
                { id: "rm-b6-class1", name: "Year 5A", type: "classroom", yearGroup: "5", capacity: 30, areaSqm: 55, gridX: 18, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-b6-north" },
                { id: "rm-b6-class2", name: "Year 5B", type: "classroom", yearGroup: "5", capacity: 30, areaSqm: 55, gridX: 21, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-b6-north" },
                { id: "rm-b6-toilet", name: "Block 6 Toilets", type: "toilet", areaSqm: 10, gridX: 18, gridY: 3, gridW: 2, gridH: 1 },
              ],
              corridors: [],
            },
            // ── Block 3 (East Wing — KS2 + Staff) ──
            {
              id: "block-3",
              name: "Block 3 — East Wing",
              type: "teaching",
              rooms: [
                { id: "rm-b3-class1", name: "Year 6A", type: "classroom", yearGroup: "6", capacity: 30, areaSqm: 55, gridX: 20, gridY: 5, gridW: 3, gridH: 3, nearestExitId: "exit-b3-east" },
                { id: "rm-b3-class2", name: "Year 6B", type: "classroom", yearGroup: "6", capacity: 30, areaSqm: 55, gridX: 20, gridY: 8, gridW: 3, gridH: 3, nearestExitId: "exit-b3-east" },
                { id: "rm-b3-staffroom", name: "Staff Room", type: "staffroom", capacity: 20, areaSqm: 35, gridX: 23, gridY: 5, gridW: 3, gridH: 3, nearestExitId: "exit-b3-east" },
                { id: "rm-b3-send", name: "SEND Room", type: "send_room", capacity: 6, areaSqm: 15, gridX: 23, gridY: 8, gridW: 3, gridH: 2, nearestExitId: "exit-b3-east" },
                { id: "rm-b3-caretaker", name: "Caretaker's Store", type: "storage", areaSqm: 15, gridX: 23, gridY: 10, gridW: 3, gridH: 2, nearestExitId: "exit-b3-east" },
              ],
              corridors: [
                { id: "rm-corridor-east", name: "East Link", gridX: 17, gridY: 4, gridW: 3, gridH: 1 },
                { id: "rm-b3-corridor", name: "Block 3 Corridor", gridX: 19, gridY: 4, gridW: 1, gridH: 8 },
              ],
            },
          ],
        },
      ],
    },
  ],
  externalAreas: [
    { id: "ext-playground-eyfs", name: "EYFS Outdoor Area", type: "playground" },
    { id: "ext-playground-ks1", name: "KS1 Playground", type: "playground" },
    { id: "ext-playground-ks2", name: "KS2 Playground", type: "playground" },
    { id: "ext-field", name: "School Field", type: "field" },
    { id: "ext-car-park", name: "Staff Car Park", type: "car_park" },
  ],
  musterPoints: [
    { id: "muster-main", name: "Main Muster Point", location: "KS2 Playground (far end)", capacity: 400 },
    { id: "muster-eyfs", name: "EYFS Muster Point", location: "EYFS Outdoor Area (by fence)", capacity: 60 },
  ],
};

// ─── Fire Exits ─────────────────────────────────────────

export const GROVE_HOUSE_FIRE_EXITS: FireExit[] = [
  { id: "exit-main", name: "Main Entrance", floorId: "ground", gridX: 11, gridY: 18 },
  { id: "exit-ww-west", name: "West Wing Door", floorId: "ground", gridX: -1, gridY: 3 },
  { id: "exit-ww-south", name: "West Wing South", floorId: "ground", gridX: 1, gridY: 13 },
  { id: "exit-b2-south", name: "Block 2 South", floorId: "ground", gridX: 5, gridY: 13 },
  { id: "exit-b4-north", name: "Block 4 North", floorId: "ground", gridX: 10, gridY: -1 },
  { id: "exit-b4-east", name: "Block 4 East", floorId: "ground", gridX: 17, gridY: 2 },
  { id: "exit-b4-south", name: "Hall South Door", floorId: "ground", gridX: 8, gridY: 7 },
  { id: "exit-b6-north", name: "Block 6 North", floorId: "ground", gridX: 20, gridY: -1 },
  { id: "exit-b3-east", name: "Block 3 East", floorId: "ground", gridX: 26, gridY: 7 },
];

// ─── Evacuation Routes ──────────────────────────────────

export const GROVE_HOUSE_EVACUATION_ROUTES: EvacuationRoute[] = [
  { id: "evac-ww-1", fromRoomId: "rm-ww-class1", exitId: "exit-ww-west", musterPointId: "muster-eyfs", steps: ["Exit classroom via external door", "Walk to EYFS muster point"], distanceMetres: 15 },
  { id: "evac-ww-2", fromRoomId: "rm-ww-class2", exitId: "exit-ww-west", musterPointId: "muster-eyfs", steps: ["Exit to corridor", "Turn left to west door", "Walk to EYFS muster point"], distanceMetres: 20 },
  { id: "evac-ww-3", fromRoomId: "rm-ww-class3", exitId: "exit-ww-south", musterPointId: "muster-eyfs", steps: ["Exit to corridor", "South to west wing exit", "Walk to EYFS muster point"], distanceMetres: 25 },
  { id: "evac-ww-4", fromRoomId: "rm-ww-class4", exitId: "exit-ww-south", musterPointId: "muster-eyfs", steps: ["Exit to corridor", "South to west wing exit", "Walk to EYFS muster point"], distanceMetres: 20 },
  { id: "evac-b2-1", fromRoomId: "rm-b2-class1", exitId: "exit-b2-south", musterPointId: "muster-main", steps: ["Exit to corridor", "South through Block 2", "Out south door", "Walk to main muster"], distanceMetres: 30 },
  { id: "evac-b2-2", fromRoomId: "rm-b2-class2", exitId: "exit-b2-south", musterPointId: "muster-main", steps: ["Exit to corridor", "South through Block 2", "Out south door", "Walk to main muster"], distanceMetres: 25 },
  { id: "evac-b2-3", fromRoomId: "rm-b2-class3", exitId: "exit-b2-south", musterPointId: "muster-main", steps: ["Exit to corridor", "Out Block 2 south door", "Walk to main muster"], distanceMetres: 20 },
  { id: "evac-b1-1", fromRoomId: "rm-b1-class1", exitId: "exit-main", musterPointId: "muster-main", steps: ["Exit to Block 1 corridor", "South to main entrance", "Walk to main muster"], distanceMetres: 35 },
  { id: "evac-b1-2", fromRoomId: "rm-b1-class2", exitId: "exit-main", musterPointId: "muster-main", steps: ["Exit to Block 1 corridor", "South to main entrance", "Walk to main muster"], distanceMetres: 30 },
  { id: "evac-b1-rec", fromRoomId: "rm-b1-reception", exitId: "exit-main", musterPointId: "muster-main", steps: ["Exit via main entrance", "Walk to main muster point"], distanceMetres: 40 },
  { id: "evac-b4-hall", fromRoomId: "rm-b4-hall", exitId: "exit-b4-south", musterPointId: "muster-main", steps: ["Exit hall via south fire door", "Walk to main muster point"], distanceMetres: 25 },
  { id: "evac-b4-1", fromRoomId: "rm-b4-class1", exitId: "exit-b4-north", musterPointId: "muster-main", steps: ["Exit via Block 4 north door", "Walk around to main muster"], distanceMetres: 35 },
  { id: "evac-b4-2", fromRoomId: "rm-b4-class2", exitId: "exit-b4-north", musterPointId: "muster-main", steps: ["Exit via Block 4 north door", "Walk around to main muster"], distanceMetres: 30 },
  { id: "evac-b4-kit", fromRoomId: "rm-b4-kitchen", exitId: "exit-b4-east", musterPointId: "muster-main", steps: ["Exit kitchen via east door", "Walk to main muster point"], distanceMetres: 30 },
  { id: "evac-b6-1", fromRoomId: "rm-b6-class1", exitId: "exit-b6-north", musterPointId: "muster-main", steps: ["Exit via Block 6 north door", "Walk around to main muster"], distanceMetres: 45 },
  { id: "evac-b6-2", fromRoomId: "rm-b6-class2", exitId: "exit-b6-north", musterPointId: "muster-main", steps: ["Exit via Block 6 north door", "Walk around to main muster"], distanceMetres: 50 },
  { id: "evac-b3-1", fromRoomId: "rm-b3-class1", exitId: "exit-b3-east", musterPointId: "muster-main", steps: ["Exit to Block 3 corridor", "East to exit", "Walk to main muster"], distanceMetres: 35 },
  { id: "evac-b3-2", fromRoomId: "rm-b3-class2", exitId: "exit-b3-east", musterPointId: "muster-main", steps: ["Exit to Block 3 corridor", "East to exit", "Walk to main muster"], distanceMetres: 30 },
];

// ─── Helper Functions ───────────────────────────────────

export function getAllRooms(): Room[] {
  return GROVE_HOUSE_SITE.buildings.flatMap((b) =>
    b.floors.flatMap((f) => f.zones.flatMap((z) => z.rooms)),
  );
}

export function getRoomById(id: string): Room | undefined {
  return getAllRooms().find((r) => r.id === id);
}

export function getRoomsOnFloor(floorId: string): Room[] {
  for (const b of GROVE_HOUSE_SITE.buildings) {
    const floor = b.floors.find((f) => f.id === floorId);
    if (floor) return floor.zones.flatMap((z) => z.rooms);
  }
  return [];
}

export function getClassrooms(): Room[] {
  return getAllRooms().filter((r) => r.type === "classroom");
}

export function getEvacuationRoute(
  roomId: string,
): EvacuationRoute | undefined {
  return GROVE_HOUSE_EVACUATION_ROUTES.find((r) => r.fromRoomId === roomId);
}

export function getFloorForRoom(roomId: string): Floor | undefined {
  for (const b of GROVE_HOUSE_SITE.buildings) {
    for (const f of b.floors) {
      for (const z of f.zones) {
        if (z.rooms.some((r) => r.id === roomId)) return f;
      }
    }
  }
  return undefined;
}

export function getPolygonForRoom(roomId: string): RoomPolygon | undefined {
  return GROVE_HOUSE_POLYGONS.find((p) => p.roomId === roomId);
}

export function getZoneForRoom(roomId: string): Zone | undefined {
  for (const b of GROVE_HOUSE_SITE.buildings) {
    for (const f of b.floors) {
      for (const z of f.zones) {
        if (z.rooms.some((r) => r.id === roomId)) return z;
      }
    }
  }
  return undefined;
}

// ─── Assumptions Log ────────────────────────────────────

export const ASSUMPTIONS = [
  "Room layout traced from Bradford Council fire prevention strategy PDF (ref: 11/02093/2/6/0/01)",
  "Blocks identified from floor plan labels: Block 1, 2, 3, 4, 6 (Block 5 not present)",
  "West wing (far-left) not labeled as a block but contains EYFS classrooms",
  "Classroom year-group assignments are approximate — actual allocation varies yearly",
  "Room sizes based on DfE Building Bulletin 103 standards and visible proportions",
  "14 classrooms for a 1FE primary (Nursery through Year 6, with some split classes)",
  "Fire exits placed at approximate locations visible in the PDF fire escape route markings",
  "Evacuation distances are estimates based on corridor lengths visible in the plan",
  "External areas inferred — not fully visible in the fire prevention plan",
  "Single storey confirmed from PDF title 'Ground Floor' with no upper floor references",
];
