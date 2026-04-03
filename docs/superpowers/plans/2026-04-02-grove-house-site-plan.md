# Grove House Interactive Site Plan — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Aurora demo site plan with an animated, interactive Grove House Primary floor plan built from their real fire prevention strategy PDF, using the PNG as a background layer with SVG room polygons overlaid.

**Architecture:** The PNG floor plan image (`/site-plans/grove-house-ground.png`, 3309x2339px) serves as the base layer in an SVG with a matching viewBox. Semi-transparent room polygons are overlaid on top, traced from the visible room boundaries. Framer Motion handles hover glow, click selection, overlay transitions, and pulse animations. The existing page structure (left panel + right detail drawer) is preserved. The data model mirrors `aurora-site-model.ts` but uses percentage-based polygon coordinates instead of grid positions.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Framer Motion, SVG, Tailwind CSS, Supabase (live ticket data)

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/lib/show-me-site/grove-house-site-model.ts` | Grove House site definition: rooms, zones, fire exits, evacuation routes, polygon coordinates |
| Modify | `src/app/(dashboard)/dashboard/show-me/site/page.tsx` | Replace Aurora imports with Grove House, add PNG background layer, add Framer Motion room animations |
| Keep   | `src/lib/show-me-site/aurora-site-model.ts` | Keep as reference — do NOT delete (other schools may use as template) |
| Added  | `public/site-plans/grove-house-ground.png` | Already copied — the PDF-derived floor plan image |

All paths relative to `apps/platform/`.

---

## Task 1: Create Grove House Site Model

**Files:**
- Create: `apps/platform/src/lib/show-me-site/grove-house-site-model.ts`

This is the core data file. It uses the same `Site`, `Building`, `Floor`, `Zone`, `Room` types from the Aurora model but with polygon-based coordinates for overlay on the PNG.

- [ ] **Step 1: Create the grove-house-site-model.ts with types and room data**

The file reuses types from `aurora-site-model.ts` but adds a `polygon` field to rooms for SVG overlay. The viewBox is `0 0 3309 2339` matching the PNG dimensions.

Key mapping from the PDF (approximate pixel coordinates traced from visible room outlines):

```typescript
/**
 * Grove House Primary School — Spatial Site Model
 *
 * Traced from the actual fire prevention strategy floor plan (PDF ref: 11/02093/2/6/0/01)
 * City of Bradford Metropolitan District Council, Building & Technical Services
 *
 * Single-storey primary school with 4 interconnected blocks:
 * - Block 1: Central wing (main entrance at south)
 * - Block 2: West wing (classrooms)
 * - Block 3: East wing (classrooms + hall)
 * - Block 4: North wing (classrooms + kitchen)
 * - Block 6: North-east extension
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

// Re-export types for convenience
export type { Site, Building, Floor, Zone, Room, RoomType, Corridor, ExternalArea, MusterPoint, FireExit, EvacuationRoute };

// ─── PNG Overlay Coordinates ───────────────────────────────
// All coordinates are in pixels matching the PNG viewBox (3309 x 2339)
// Rooms use polygon points for SVG <polygon> elements overlaid on the image

export interface RoomPolygon {
  roomId: string;
  /** SVG polygon points string: "x1,y1 x2,y2 x3,y3 ..." */
  points: string;
  /** Label position (center of room for text placement) */
  labelX: number;
  labelY: number;
}

// ─── Room Polygons (traced from PDF) ───────────────────────
// Coordinates traced from grove-house-ground.png (3309x2339)
// The building occupies roughly x:30-2150, y:100-2200 of the image
// Right side (x:2200+) is legend/notes — excluded from interactive area

export const GROVE_HOUSE_POLYGONS: RoomPolygon[] = [
  // ── Block 2 (West Wing) ──────────────────────────────
  // Large wing extending to the far left
  { roomId: "rm-b2-class1", points: "50,870 50,1020 200,1020 200,870", labelX: 125, labelY: 945 },
  { roomId: "rm-b2-class2", points: "50,1020 50,1170 200,1170 200,1020", labelX: 125, labelY: 1095 },
  { roomId: "rm-b2-class3", points: "50,1170 50,1320 200,1320 200,1170", labelX: 125, labelY: 1245 },
  { roomId: "rm-b2-class4", points: "50,1320 50,1470 200,1470 200,1320", labelX: 125, labelY: 1395 },
  { roomId: "rm-b2-toilets", points: "200,870 200,980 320,980 320,870", labelX: 260, labelY: 925 },
  { roomId: "rm-b2-store", points: "200,980 200,1080 320,1080 320,980", labelX: 260, labelY: 1030 },
  { roomId: "rm-b2-class5", points: "200,1080 200,1260 380,1260 380,1080", labelX: 290, labelY: 1170 },
  { roomId: "rm-b2-class6", points: "200,1260 200,1470 380,1470 380,1260", labelX: 290, labelY: 1365 },
  { roomId: "rm-b2-corridor", points: "50,1470 50,1520 380,1520 380,1470", labelX: 215, labelY: 1495 },

  // ── Block 1 (Central Wing — Main Entrance) ──────────
  { roomId: "rm-b1-office", points: "580,1550 580,1700 730,1700 730,1550", labelX: 655, labelY: 1625 },
  { roomId: "rm-b1-head", points: "730,1550 730,1700 880,1700 880,1550", labelX: 805, labelY: 1625 },
  { roomId: "rm-b1-reception", points: "700,1700 700,1820 870,1820 870,1700", labelX: 785, labelY: 1760 },
  { roomId: "rm-b1-class1", points: "580,1330 580,1530 730,1530 730,1330", labelX: 655, labelY: 1430 },
  { roomId: "rm-b1-class2", points: "730,1330 730,1530 880,1530 880,1330", labelX: 805, labelY: 1430 },
  { roomId: "rm-b1-toilet1", points: "880,1550 880,1680 980,1680 980,1550", labelX: 930, labelY: 1615 },
  { roomId: "rm-b1-corridor", points: "580,1530 580,1560 980,1560 980,1530", labelX: 780, labelY: 1545 },

  // ── Block 4 (North Wing) ────────────────────────────
  { roomId: "rm-b4-class1", points: "470,200 470,380 620,380 620,200", labelX: 545, labelY: 290 },
  { roomId: "rm-b4-class2", points: "620,200 620,380 770,380 770,200", labelX: 695, labelY: 290 },
  { roomId: "rm-b4-kitchen", points: "770,200 770,380 940,380 940,200", labelX: 855, labelY: 290 },
  { roomId: "rm-b4-hall", points: "470,380 470,580 770,580 770,380", labelX: 620, labelY: 480 },
  { roomId: "rm-b4-dining", points: "770,380 770,530 940,530 940,380", labelX: 855, labelY: 455 },
  { roomId: "rm-b4-corridor", points: "470,580 470,610 940,610 940,580", labelX: 705, labelY: 595 },

  // ── Block 6 (North-East Extension) ──────────────────
  { roomId: "rm-b6-class1", points: "960,200 960,370 1130,370 1130,200", labelX: 1045, labelY: 285 },
  { roomId: "rm-b6-class2", points: "1130,200 1130,370 1300,370 1300,200", labelX: 1215, labelY: 285 },
  { roomId: "rm-b6-toilet", points: "960,370 960,450 1060,450 1060,370", labelX: 1010, labelY: 410 },

  // ── Block 3 (East Wing) ─────────────────────────────
  { roomId: "rm-b3-class1", points: "1100,520 1100,700 1300,700 1300,520", labelX: 1200, labelY: 610 },
  { roomId: "rm-b3-class2", points: "1100,700 1100,880 1300,880 1300,700", labelX: 1200, labelY: 790 },
  { roomId: "rm-b3-staffroom", points: "1300,520 1300,700 1450,700 1450,520", labelX: 1375, labelY: 610 },
  { roomId: "rm-b3-send", points: "1300,700 1300,830 1450,830 1450,700", labelX: 1375, labelY: 765 },
  { roomId: "rm-b3-store", points: "1300,830 1300,940 1450,940 1450,830", labelX: 1375, labelY: 885 },
  { roomId: "rm-b3-corridor", points: "1060,480 1060,520 1450,520 1450,480", labelX: 1255, labelY: 500 },

  // ── Connecting Corridors ────────────────────────────
  { roomId: "rm-main-corridor-ns", points: "530,610 530,1330 580,1330 580,610", labelX: 555, labelY: 970 },
  { roomId: "rm-main-corridor-ew", points: "380,870 380,920 530,920 530,870", labelX: 455, labelY: 895 },
  { roomId: "rm-corridor-east", points: "940,530 940,580 1060,580 1060,530", labelX: 1000, labelY: 555 },
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
            // ── Block 2 (West Wing — KS1) ──
            {
              id: "block-2",
              name: "Block 2 — West Wing",
              type: "teaching",
              rooms: [
                { id: "rm-b2-class1", name: "Class 1 (Nursery)", type: "classroom", yearGroup: "N", capacity: 26, areaSqm: 55, gridX: 0, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-b2-west" },
                { id: "rm-b2-class2", name: "Class 2 (Reception)", type: "classroom", yearGroup: "R", capacity: 30, areaSqm: 55, gridX: 0, gridY: 3, gridW: 3, gridH: 3, nearestExitId: "exit-b2-west" },
                { id: "rm-b2-class3", name: "Class 3 (Year 1)", type: "classroom", yearGroup: "1", capacity: 30, areaSqm: 55, gridX: 0, gridY: 6, gridW: 3, gridH: 3, nearestExitId: "exit-b2-south" },
                { id: "rm-b2-class4", name: "Class 4 (Year 1)", type: "classroom", yearGroup: "1", capacity: 30, areaSqm: 55, gridX: 0, gridY: 9, gridW: 3, gridH: 3, nearestExitId: "exit-b2-south" },
                { id: "rm-b2-toilets", name: "KS1 Toilets", type: "toilet", areaSqm: 18, gridX: 3, gridY: 0, gridW: 2, gridH: 2 },
                { id: "rm-b2-store", name: "KS1 Store", type: "storage", areaSqm: 12, gridX: 3, gridY: 2, gridW: 2, gridH: 2 },
                { id: "rm-b2-class5", name: "Class 5 (Year 2)", type: "classroom", yearGroup: "2", capacity: 30, areaSqm: 60, gridX: 3, gridY: 4, gridW: 3, gridH: 3, nearestExitId: "exit-b2-south" },
                { id: "rm-b2-class6", name: "Class 6 (Year 2)", type: "classroom", yearGroup: "2", capacity: 30, areaSqm: 60, gridX: 3, gridY: 7, gridW: 3, gridH: 3, nearestExitId: "exit-b2-south" },
              ],
              corridors: [
                { id: "rm-b2-corridor", name: "Block 2 Corridor", gridX: 0, gridY: 12, gridW: 6, gridH: 1 },
              ],
            },
            // ── Block 1 (Central — Admin / Main Entrance) ──
            {
              id: "block-1",
              name: "Block 1 — Central",
              type: "admin",
              rooms: [
                { id: "rm-b1-office", name: "School Office", type: "office", capacity: 4, areaSqm: 25, gridX: 6, gridY: 10, gridW: 3, gridH: 3, nearestExitId: "exit-main" },
                { id: "rm-b1-head", name: "Head's Office", type: "head_office", capacity: 4, areaSqm: 20, gridX: 9, gridY: 10, gridW: 3, gridH: 3, nearestExitId: "exit-main" },
                { id: "rm-b1-reception", name: "Reception / Entrance", type: "reception", capacity: 6, areaSqm: 20, gridX: 8, gridY: 13, gridW: 3, gridH: 2, hasFireExit: true, nearestExitId: "exit-main" },
                { id: "rm-b1-class1", name: "Class 7 (Year 3)", type: "classroom", yearGroup: "3", capacity: 30, areaSqm: 55, gridX: 6, gridY: 6, gridW: 3, gridH: 4, nearestExitId: "exit-main" },
                { id: "rm-b1-class2", name: "Class 8 (Year 3)", type: "classroom", yearGroup: "3", capacity: 30, areaSqm: 55, gridX: 9, gridY: 6, gridW: 3, gridH: 4, nearestExitId: "exit-main" },
                { id: "rm-b1-toilet1", name: "Main Toilets", type: "toilet", areaSqm: 15, gridX: 12, gridY: 10, gridW: 2, gridH: 3 },
              ],
              corridors: [
                { id: "rm-b1-corridor", name: "Block 1 Corridor", gridX: 6, gridY: 10, gridW: 8, gridH: 1 },
              ],
            },
            // ── Block 4 (North Wing — Hall & Kitchen) ──
            {
              id: "block-4",
              name: "Block 4 — North Wing",
              type: "communal",
              rooms: [
                { id: "rm-b4-class1", name: "Class 9 (Year 4)", type: "classroom", yearGroup: "4", capacity: 30, areaSqm: 55, gridX: 6, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-b4-north" },
                { id: "rm-b4-class2", name: "Class 10 (Year 4)", type: "classroom", yearGroup: "4", capacity: 30, areaSqm: 55, gridX: 9, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-b4-north" },
                { id: "rm-b4-kitchen", name: "Kitchen", type: "kitchen", capacity: 5, areaSqm: 40, gridX: 12, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-b4-east" },
                { id: "rm-b4-hall", name: "Main Hall", type: "hall", capacity: 200, areaSqm: 180, gridX: 6, gridY: 3, gridW: 6, gridH: 3, hasFireExit: true, nearestExitId: "exit-b4-south" },
                { id: "rm-b4-dining", name: "Dining Hall", type: "dining", capacity: 60, areaSqm: 50, gridX: 12, gridY: 3, gridW: 3, gridH: 3, nearestExitId: "exit-b4-east" },
              ],
              corridors: [
                { id: "rm-b4-corridor", name: "Block 4 Corridor", gridX: 6, gridY: 6, gridW: 9, gridH: 1 },
              ],
            },
            // ── Block 6 (North-East Extension — KS2 Upper) ──
            {
              id: "block-6",
              name: "Block 6 — NE Extension",
              type: "teaching",
              rooms: [
                { id: "rm-b6-class1", name: "Class 11 (Year 5)", type: "classroom", yearGroup: "5", capacity: 30, areaSqm: 55, gridX: 15, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-b6-north" },
                { id: "rm-b6-class2", name: "Class 12 (Year 6)", type: "classroom", yearGroup: "6", capacity: 30, areaSqm: 55, gridX: 18, gridY: 0, gridW: 3, gridH: 3, nearestExitId: "exit-b6-north" },
                { id: "rm-b6-toilet", name: "Block 6 Toilets", type: "toilet", areaSqm: 10, gridX: 15, gridY: 3, gridW: 2, gridH: 1 },
              ],
              corridors: [],
            },
            // ── Block 3 (East Wing — KS2 + Staff) ──
            {
              id: "block-3",
              name: "Block 3 — East Wing",
              type: "teaching",
              rooms: [
                { id: "rm-b3-class1", name: "Class 13 (Year 5)", type: "classroom", yearGroup: "5", capacity: 30, areaSqm: 55, gridX: 16, gridY: 5, gridW: 3, gridH: 3, nearestExitId: "exit-b3-east" },
                { id: "rm-b3-class2", name: "Class 14 (Year 6)", type: "classroom", yearGroup: "6", capacity: 30, areaSqm: 55, gridX: 16, gridY: 8, gridW: 3, gridH: 3, nearestExitId: "exit-b3-east" },
                { id: "rm-b3-staffroom", name: "Staff Room", type: "staffroom", capacity: 20, areaSqm: 35, gridX: 19, gridY: 5, gridW: 3, gridH: 3, nearestExitId: "exit-b3-east" },
                { id: "rm-b3-send", name: "SEND Room", type: "send_room", capacity: 6, areaSqm: 15, gridX: 19, gridY: 8, gridW: 3, gridH: 2, nearestExitId: "exit-b3-east" },
                { id: "rm-b3-store", name: "Caretaker's Store", type: "storage", areaSqm: 15, gridX: 19, gridY: 10, gridW: 3, gridH: 2, nearestExitId: "exit-b3-east" },
              ],
              corridors: [
                { id: "rm-b3-corridor", name: "Block 3 Corridor", gridX: 15, gridY: 4, gridW: 7, gridH: 1 },
              ],
            },
            // ── Connecting Corridors ──
            {
              id: "corridors",
              name: "Main Corridors",
              type: "circulation",
              rooms: [],
              corridors: [
                { id: "rm-main-corridor-ns", name: "Main N-S Corridor", gridX: 5, gridY: 1, gridW: 1, gridH: 12 },
                { id: "rm-main-corridor-ew", name: "Main E-W Link", gridX: 5, gridY: 4, gridW: 3, gridH: 1 },
                { id: "rm-corridor-east", name: "East Link Corridor", gridX: 14, gridY: 4, gridW: 2, gridH: 1 },
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
  { id: "exit-main", name: "Main Entrance", floorId: "ground", gridX: 8, gridY: 15 },
  { id: "exit-b2-west", name: "Block 2 West Door", floorId: "ground", gridX: -1, gridY: 2 },
  { id: "exit-b2-south", name: "Block 2 South Door", floorId: "ground", gridX: 2, gridY: 13 },
  { id: "exit-b4-north", name: "Block 4 North Door", floorId: "ground", gridX: 8, gridY: -1 },
  { id: "exit-b4-east", name: "Block 4 East Door", floorId: "ground", gridX: 15, gridY: 3 },
  { id: "exit-b4-south", name: "Hall Fire Door", floorId: "ground", gridX: 6, gridY: 7 },
  { id: "exit-b6-north", name: "Block 6 North Door", floorId: "ground", gridX: 17, gridY: -1 },
  { id: "exit-b3-east", name: "Block 3 East Door", floorId: "ground", gridX: 22, gridY: 7 },
];

// ─── Evacuation Routes ──────────────────────────────────

export const GROVE_HOUSE_EVACUATION_ROUTES: EvacuationRoute[] = [
  { id: "evac-b2-class1", fromRoomId: "rm-b2-class1", exitId: "exit-b2-west", musterPointId: "muster-eyfs", steps: ["Exit classroom via external door", "Walk to EYFS muster point"], distanceMetres: 15 },
  { id: "evac-b2-class2", fromRoomId: "rm-b2-class2", exitId: "exit-b2-west", musterPointId: "muster-eyfs", steps: ["Exit classroom to corridor", "Turn left to Block 2 west door", "Walk to EYFS muster point"], distanceMetres: 20 },
  { id: "evac-b2-class5", fromRoomId: "rm-b2-class5", exitId: "exit-b2-south", musterPointId: "muster-main", steps: ["Exit to Block 2 corridor", "Out south door", "Proceed to main muster point"], distanceMetres: 30 },
  { id: "evac-b1-reception", fromRoomId: "rm-b1-reception", exitId: "exit-main", musterPointId: "muster-main", steps: ["Exit via main entrance", "Proceed to KS2 playground muster point"], distanceMetres: 40 },
  { id: "evac-b4-hall", fromRoomId: "rm-b4-hall", exitId: "exit-b4-south", musterPointId: "muster-main", steps: ["Exit hall via south fire door", "Proceed to main muster point"], distanceMetres: 25 },
  { id: "evac-b3-class1", fromRoomId: "rm-b3-class1", exitId: "exit-b3-east", musterPointId: "muster-main", steps: ["Exit to Block 3 corridor", "Turn right to east door", "Proceed to main muster point"], distanceMetres: 35 },
  { id: "evac-b6-class1", fromRoomId: "rm-b6-class1", exitId: "exit-b6-north", musterPointId: "muster-main", steps: ["Exit via Block 6 north door", "Walk around to main muster point"], distanceMetres: 45 },
  { id: "evac-b4-kitchen", fromRoomId: "rm-b4-kitchen", exitId: "exit-b4-east", musterPointId: "muster-main", steps: ["Exit kitchen via east door", "Proceed to main muster point"], distanceMetres: 30 },
];

// ─── Helper Functions ───────────────────────────────────

export function getAllRooms(): Room[] {
  return GROVE_HOUSE_SITE.buildings.flatMap((b) =>
    b.floors.flatMap((f) => f.zones.flatMap((z) => z.rooms))
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

export function getEvacuationRoute(roomId: string): EvacuationRoute | undefined {
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
  "4 interconnected blocks identified from floor plan labels (Block 1, 2, 3, 4, 6)",
  "Classroom assignments (year groups) are approximate — actual class allocation varies yearly",
  "Room sizes based on DfE Building Bulletin 103 standards and visible proportions in PDF",
  "14 classrooms assumed for a 2FE primary (Nursery through Year 6, some split classes)",
  "Fire exits placed at approximate locations visible in the PDF fire escape route markings",
  "Evacuation distances are estimates based on corridor lengths visible in the plan",
  "External areas inferred — not fully visible in the fire prevention plan",
  "Single storey confirmed from PDF title 'Ground Floor' with no upper floor references",
  "Block numbering follows the PDF labels — Block 5 does not appear in this plan",
];
```

- [ ] **Step 2: Verify the file compiles**

Run from repo root:
```bash
cd apps/platform && npx tsc --noEmit src/lib/show-me-site/grove-house-site-model.ts 2>&1 | head -20
```

Expected: No errors (or only pre-existing unrelated errors)

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/lib/show-me-site/grove-house-site-model.ts apps/platform/public/site-plans/grove-house-ground.png
git commit -m "feat(show-me-site): add Grove House Primary site model with polygon coordinates from real floor plan PDF"
```

---

## Task 2: Update page.tsx — Replace Aurora with Grove House + PNG Background

**Files:**
- Modify: `apps/platform/src/app/(dashboard)/dashboard/show-me/site/page.tsx`

This is the big change. The page currently imports from `aurora-site-model` and renders rooms as grid-based rectangles. We change it to:
1. Import from `grove-house-site-model`
2. Render the PNG as an `<image>` element inside the SVG
3. Overlay room polygons (semi-transparent) on top of the PNG
4. Add Framer Motion animations for hover glow, selection pulse, overlay transitions

- [ ] **Step 1: Replace all Aurora imports with Grove House**

In `page.tsx`, change the import block:

**Old:**
```typescript
import {
  AURORA_SITE,
  FIRE_EXITS,
  getAllRooms,
  getRoomById,
  getRoomsOnFloor,
  getEvacuationRoute,
  getFloorForRoom,
  type Room,
  type EvacuationRoute,
} from "@/lib/show-me-site/aurora-site-model";
```

**New:**
```typescript
import {
  GROVE_HOUSE_SITE,
  GROVE_HOUSE_FIRE_EXITS,
  GROVE_HOUSE_POLYGONS,
  getAllRooms,
  getRoomById,
  getRoomsOnFloor,
  getEvacuationRoute,
  getFloorForRoom,
  getPolygonForRoom,
  getZoneForRoom,
  type Room,
  type EvacuationRoute,
  type RoomPolygon,
} from "@/lib/show-me-site/grove-house-site-model";
```

- [ ] **Step 2: Replace all AURORA_SITE references with GROVE_HOUSE_SITE**

Search and replace throughout the file:
- `AURORA_SITE` → `GROVE_HOUSE_SITE`
- `FIRE_EXITS` → `GROVE_HOUSE_FIRE_EXITS`

Key locations:
- `FLOOR_OPTIONS` constant (line ~137): `AURORA_SITE.buildings[0].floors.map(...)`
- `selectedFloorObj` (line ~269): `AURORA_SITE.buildings[0].floors.find(...)`
- Header subtitle (line ~441): `AURORA_SITE.name`

- [ ] **Step 3: Remove the floor selector (single floor)**

Grove House is single-storey. Remove the floor selector buttons and hardcode `selectedFloor` to `"ground"`. Remove the `FLOOR_OPTIONS` constant. Set default state:

```typescript
const [selectedFloor] = useState("ground");
```

Remove the entire floor selector `<div>` block (the one mapping `FLOOR_OPTIONS`).

- [ ] **Step 4: Replace the SVG grid rendering with PNG + polygon overlay**

Replace the SVG rendering section (the `<svg>` block starting around line 514) with:

```tsx
{/* SVG Floor Plan with PNG Background */}
<div className="flex-1 overflow-auto p-4 bg-slate-900">
  <svg
    viewBox="0 0 2200 2000"
    className="w-full max-w-6xl mx-auto"
    style={{ minHeight: 400 }}
    preserveAspectRatio="xMidYMid meet"
  >
    {/* Dark background */}
    <rect width="2200" height="2000" fill="#0f172a" rx="12" />

    {/* PNG floor plan as base layer */}
    <image
      href="/site-plans/grove-house-ground.png"
      x="0"
      y="0"
      width="2200"
      height="1556"
      opacity={0.6}
      style={{ filter: "brightness(0.9) contrast(1.1)" }}
      preserveAspectRatio="xMidYMid meet"
    />

    {/* Room polygon overlays */}
    {floorRooms.map((room) => {
      const poly = getPolygonForRoom(room.id);
      if (!poly) return null;
      const colors = getOverlayColor(room);
      const isSelected = selectedRoomId === room.id;
      const zone = getZoneForRoom(room.id);
      return (
        <motion.g
          key={room.id}
          onClick={() => setSelectedRoomId(isSelected ? null : room.id)}
          style={{ cursor: "pointer" }}
          whileHover={{ scale: 1.01 }}
        >
          <motion.polygon
            points={poly.points}
            fill={isSelected ? "rgba(56, 189, 248, 0.5)" : colors.fill}
            stroke={isSelected ? "#38bdf8" : colors.stroke}
            strokeWidth={isSelected ? 3 : 1.5}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 0.65,
              filter: isSelected
                ? "drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))"
                : "none",
            }}
            transition={{ duration: 0.3 }}
            style={{ mixBlendMode: "screen" }}
          />
          {/* Room label */}
          <text
            x={poly.labelX}
            y={poly.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: 11,
              fontWeight: 600,
              fill: isSelected ? "#fff" : "#e2e8f0",
              pointerEvents: "none",
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            {room.className || room.name.split(" (")[0]}
          </text>
          {room.yearGroup && (
            <text
              x={poly.labelX}
              y={poly.labelY + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: 8,
                fill: "#94a3b8",
                pointerEvents: "none",
                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
              }}
            >
              {room.yearGroup === "N" ? "Nursery" : room.yearGroup === "R" ? "Reception" : `Year ${room.yearGroup}`}
            </text>
          )}
        </motion.g>
      );
    })}

    {/* Fire exit markers */}
    {GROVE_HOUSE_FIRE_EXITS.map((exit) => {
      // Map grid coords to approximate pixel positions
      const px = 50 + exit.gridX * 100;
      const py = 50 + exit.gridY * 100;
      return (
        <g key={exit.id}>
          <motion.rect
            x={px - 20}
            y={py - 8}
            width={40}
            height={16}
            fill="rgba(239, 68, 68, 0.8)"
            stroke="#dc2626"
            strokeWidth={1}
            rx={4}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
          <text
            x={px}
            y={py + 3}
            textAnchor="middle"
            style={{ fontSize: 7, fontWeight: 700, fill: "#fff", pointerEvents: "none" }}
          >
            EXIT
          </text>
        </g>
      );
    })}

    {/* Block labels */}
    {[
      { label: "BLOCK 2", x: 200, y: 850 },
      { label: "BLOCK 1", x: 750, y: 1350 },
      { label: "BLOCK 4", x: 700, y: 180 },
      { label: "BLOCK 6", x: 1150, y: 180 },
      { label: "BLOCK 3", x: 1280, y: 490 },
    ].map((b) => (
      <text
        key={b.label}
        x={b.x}
        y={b.y}
        textAnchor="middle"
        style={{
          fontSize: 14,
          fontWeight: 700,
          fill: "#38bdf8",
          letterSpacing: "0.1em",
          opacity: 0.7,
          pointerEvents: "none",
        }}
      >
        {b.label}
      </text>
    ))}
  </svg>
</div>
```

- [ ] **Step 5: Update overlay colors for dark theme**

Change `ROOM_COLORS` and `ROOM_STROKES` to use semi-transparent values that work on the dark PNG background:

```typescript
const ROOM_COLORS: Record<string, string> = {
  classroom: "rgba(34, 197, 94, 0.25)",
  hall: "rgba(251, 146, 60, 0.3)",
  office: "rgba(59, 130, 246, 0.25)",
  staffroom: "rgba(168, 85, 247, 0.25)",
  library: "rgba(6, 182, 212, 0.25)",
  send_room: "rgba(234, 179, 8, 0.3)",
  kitchen: "rgba(239, 68, 68, 0.25)",
  dining: "rgba(251, 146, 60, 0.25)",
  toilet: "rgba(148, 163, 184, 0.2)",
  storage: "rgba(148, 163, 184, 0.15)",
  boiler: "rgba(239, 68, 68, 0.3)",
  medical: "rgba(236, 72, 153, 0.25)",
  reception: "rgba(99, 102, 241, 0.3)",
  head_office: "rgba(99, 102, 241, 0.25)",
  meeting: "rgba(99, 102, 241, 0.2)",
  ict_suite: "rgba(6, 182, 212, 0.25)",
  cloakroom: "rgba(148, 163, 184, 0.15)",
};

const ROOM_STROKES: Record<string, string> = {
  classroom: "#22c55e",
  hall: "#fb923c",
  office: "#3b82f6",
  staffroom: "#a855f7",
  library: "#06b6d4",
  send_room: "#eab308",
  kitchen: "#ef4444",
  dining: "#fb923c",
  toilet: "#64748b",
  storage: "#64748b",
  boiler: "#ef4444",
  medical: "#ec4899",
  reception: "#6366f1",
  head_office: "#6366f1",
  meeting: "#6366f1",
  ict_suite: "#06b6d4",
  cloakroom: "#64748b",
};
```

- [ ] **Step 6: Add pulse animation for rooms with tickets**

In the overlay color logic, when a room has tickets, add an animated pulse. Wrap the existing `getOverlayColor` callback to return an `animate` flag:

```typescript
const getRoomAnimation = useCallback(
  (room: Room): Record<string, unknown> | undefined => {
    if (overlayMode === "tickets") {
      const count = matchTicketsToRoom(room).length;
      if (count > 0) {
        return {
          opacity: [0.4, 0.8, 0.4],
          transition: { repeat: Infinity, duration: 1.5 },
        };
      }
    }
    if (overlayMode === "compliance") {
      const domains = getComplianceDomainsForRoom(room);
      if (domains.length > 3) {
        return {
          opacity: [0.5, 0.9, 0.5],
          transition: { repeat: Infinity, duration: 2 },
        };
      }
    }
    return undefined;
  },
  [overlayMode, matchTicketsToRoom],
);
```

Then apply it to the `<motion.polygon>` element:

```tsx
animate={{
  opacity: 0.65,
  ...(getRoomAnimation(room) || {}),
  filter: isSelected ? "drop-shadow(0 0 8px rgba(56, 189, 248, 0.6))" : "none",
}}
```

- [ ] **Step 7: Update the detail drawer styling for dark theme**

Change the drawer background and text colors:
```tsx
className="flex flex-col bg-slate-900 overflow-y-auto border-l border-slate-700"
```

Update `DrawerSection` background:
```tsx
<div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
```

- [ ] **Step 8: Add zone label to detail drawer header**

When a room is selected, show which block it's in:

```tsx
const selectedZone = selectedRoom ? getZoneForRoom(selectedRoom.id) : null;
// In the header:
<p className="text-xs text-slate-400">
  {selectedZone?.name} · {ROOM_TYPE_LABELS[selectedRoom.type] || selectedRoom.type}
  {selectedRoom.capacity && ` · Capacity ${selectedRoom.capacity}`}
</p>
```

- [ ] **Step 9: Commit**

```bash
git add apps/platform/src/app/\(dashboard\)/dashboard/show-me/site/page.tsx
git commit -m "feat(show-me-site): replace Aurora with Grove House — PNG background, polygon overlays, dark theme, Framer Motion animations"
```

---

## Task 3: Refine Polygon Coordinates by Visual Inspection

**Files:**
- Modify: `apps/platform/src/lib/show-me-site/grove-house-site-model.ts` (GROVE_HOUSE_POLYGONS)

After the initial render, the polygon coordinates will need adjustment to align with the actual room outlines in the PNG. This task is about running the dev server, taking a screenshot, and iterating.

- [ ] **Step 1: Start dev server and take initial screenshot**

```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && nvm use 22
cd apps/platform && npm run dev &
# Wait for server to start, then take screenshot with Playwright
npx playwright screenshot --viewport-size=1920,1080 http://localhost:3001/dashboard/show-me/site /tmp/grove-house-site-v1.png
```

- [ ] **Step 2: Compare polygon positions to room outlines**

Open `/tmp/grove-house-site-v1.png` and compare each polygon overlay to the underlying PNG room outlines. Note which polygons need adjustment.

- [ ] **Step 3: Adjust polygon coordinates**

Update `GROVE_HOUSE_POLYGONS` in the site model file to better match the visible room outlines. Focus on:
- Room boundaries aligning with walls visible in the PNG
- Labels centered within their rooms
- No overlapping polygons
- Corridor polygons following the actual corridor paths

- [ ] **Step 4: Take another screenshot to verify**

```bash
npx playwright screenshot --viewport-size=1920,1080 http://localhost:3001/dashboard/show-me/site /tmp/grove-house-site-v2.png
```

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/lib/show-me-site/grove-house-site-model.ts
git commit -m "fix(show-me-site): refine Grove House polygon coordinates after visual inspection"
```

---

## Task 4: Build Verification

**Files:** None (verification only)

- [ ] **Step 1: Run build**

```bash
cd apps/platform && npm run build
```

Expected: Build passes (or only pre-existing errors)

- [ ] **Step 2: Take final screenshot**

```bash
npx playwright screenshot --viewport-size=1920,1080 http://localhost:3001/dashboard/show-me/site /tmp/grove-house-site-final.png
```

- [ ] **Step 3: Test overlay modes**

Take screenshots of each overlay mode:
```bash
# Default view
npx playwright screenshot --viewport-size=1920,1080 "http://localhost:3001/dashboard/show-me/site" /tmp/grove-house-normal.png
```

Manually verify:
- Rooms are clickable and detail drawer opens
- Overlay mode buttons switch correctly
- Fire exit markers pulse
- Dark theme looks professional
- No Aurora references visible anywhere

- [ ] **Step 4: Update chat.md with results**

Write progress to `~/dev/_brain/sessions/site-plan-upgrade/chat.md` with verification evidence.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(show-me-site): Grove House interactive site plan — complete with PNG overlay, animations, dark theme"
```

---

## Summary of Changes

| What | Before | After |
|------|--------|-------|
| Site data | Aurora Primary (3 floors, demo) | Grove House Primary (1 floor, real PDF) |
| Rendering | Grid-based SVG rectangles on white | PNG background + polygon overlays on dark |
| Animations | None | Framer Motion hover glow, selection pulse, exit markers |
| Theme | White/light | Dark navy (slate-900) |
| Floor selector | 4 floors | Single ground floor (removed) |
| Source | Fictional layout | Actual Bradford Council fire prevention PDF |
