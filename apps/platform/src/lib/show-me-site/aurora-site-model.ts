/**
 * Aurora Primary School — Spatial Site Model
 *
 * Derived from actual Schoolgle data:
 * - 2FE primary (14 classes: Oak/Maple through Hazel/Sycamore)
 * - 420 pupils, 35 staff
 * - Main Building (3 floors) + Main Hall + Boiler Room (basement)
 * - Church of England, founded 1710, Leeds LS19 6PP
 *
 * Assumptions (documented below) fill gaps where no data exists.
 */

// ─── Core Spatial Types ─────────────────────────────────

export interface Site {
  id: string;
  name: string;
  address: string;
  buildings: Building[];
  externalAreas: ExternalArea[];
  musterPoints: MusterPoint[];
}

export interface Building {
  id: string;
  name: string;
  floors: Floor[];
}

export interface Floor {
  id: string;
  label: string;
  level: number; // -1 = basement, 0 = ground, 1 = first, 2 = second
  zones: Zone[];
}

export interface Zone {
  id: string;
  name: string;
  type:
    | "teaching"
    | "admin"
    | "communal"
    | "service"
    | "circulation"
    | "welfare";
  rooms: Room[];
  corridors: Corridor[];
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  /** Year group if classroom (e.g., "R", "1", "6") */
  yearGroup?: string;
  /** Class name if classroom (e.g., "Oak", "Hazel") */
  className?: string;
  /** Capacity */
  capacity?: number;
  /** Floor area in sqm (approximate) */
  areaSqm?: number;
  /** Grid position for layout rendering (col, row on floor grid) */
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
  /** Linked assets, tickets, compliance items (populated at runtime) */
  assetIds?: string[];
  ticketIds?: string[];
  complianceIds?: string[];
  /** Fire exit accessible from this room? */
  hasFireExit?: boolean;
  /** Nearest fire exit ID */
  nearestExitId?: string;
}

export type RoomType =
  | "classroom"
  | "hall"
  | "office"
  | "staffroom"
  | "library"
  | "send_room"
  | "kitchen"
  | "dining"
  | "toilet"
  | "storage"
  | "boiler"
  | "medical"
  | "reception"
  | "head_office"
  | "meeting"
  | "ict_suite"
  | "cloakroom"
  | "corridor"
  | "entrance"
  | "external";

export interface Corridor {
  id: string;
  name: string;
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
}

export interface ExternalArea {
  id: string;
  name: string;
  type: "playground" | "field" | "car_park" | "garden" | "path" | "bin_store";
}

export interface MusterPoint {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

export interface FireExit {
  id: string;
  name: string;
  floorId: string;
  gridX: number;
  gridY: number;
  leadsToDoor?: string;
}

export interface EvacuationRoute {
  id: string;
  fromRoomId: string;
  exitId: string;
  musterPointId: string;
  steps: string[];
  distanceMetres: number;
}

// ─── Aurora Primary Site Definition ─────────────────────

export const AURORA_SITE: Site = {
  id: "aurora-primary",
  name: "Aurora Primary School",
  address: "Town Street, Leeds, West Yorkshire, LS19 6PP",
  buildings: [
    {
      id: "main-building",
      name: "Main Building",
      floors: [
        // ── Basement ──
        {
          id: "basement",
          label: "Basement",
          level: -1,
          zones: [
            {
              id: "basement-service",
              name: "Service Area",
              type: "service",
              rooms: [
                {
                  id: "rm-boiler",
                  name: "Boiler Room",
                  type: "boiler",
                  areaSqm: 25,
                  gridX: 0,
                  gridY: 0,
                  gridW: 2,
                  gridH: 2,
                },
                {
                  id: "rm-storage-b",
                  name: "Storage",
                  type: "storage",
                  areaSqm: 30,
                  gridX: 2,
                  gridY: 0,
                  gridW: 2,
                  gridH: 2,
                },
                {
                  id: "rm-caretaker",
                  name: "Caretaker's Room",
                  type: "storage",
                  areaSqm: 15,
                  gridX: 4,
                  gridY: 0,
                  gridW: 2,
                  gridH: 2,
                },
              ],
              corridors: [
                {
                  id: "cor-basement",
                  name: "Basement Corridor",
                  gridX: 0,
                  gridY: 2,
                  gridW: 6,
                  gridH: 1,
                },
              ],
            },
          ],
        },

        // ── Ground Floor ──
        {
          id: "ground",
          label: "Ground Floor",
          level: 0,
          zones: [
            {
              id: "gf-admin",
              name: "Admin & Reception",
              type: "admin",
              rooms: [
                {
                  id: "rm-reception",
                  name: "Reception",
                  type: "reception",
                  capacity: 6,
                  areaSqm: 20,
                  gridX: 0,
                  gridY: 0,
                  gridW: 2,
                  gridH: 2,
                  hasFireExit: true,
                  nearestExitId: "exit-main",
                },
                {
                  id: "rm-head",
                  name: "Head's Office",
                  type: "head_office",
                  capacity: 4,
                  areaSqm: 18,
                  gridX: 2,
                  gridY: 0,
                  gridW: 2,
                  gridH: 2,
                  nearestExitId: "exit-main",
                },
                {
                  id: "rm-admin",
                  name: "School Office",
                  type: "office",
                  capacity: 4,
                  areaSqm: 25,
                  gridX: 4,
                  gridY: 0,
                  gridW: 2,
                  gridH: 2,
                  nearestExitId: "exit-main",
                },
                {
                  id: "rm-meeting",
                  name: "Meeting Room",
                  type: "meeting",
                  capacity: 10,
                  areaSqm: 20,
                  gridX: 6,
                  gridY: 0,
                  gridW: 2,
                  gridH: 2,
                  nearestExitId: "exit-main",
                },
              ],
              corridors: [
                {
                  id: "cor-gf-main",
                  name: "Main Corridor",
                  gridX: 0,
                  gridY: 2,
                  gridW: 12,
                  gridH: 1,
                },
              ],
            },
            {
              id: "gf-eyfs",
              name: "EYFS & KS1",
              type: "teaching",
              rooms: [
                {
                  id: "rm-oak",
                  name: "Oak (Reception)",
                  type: "classroom",
                  yearGroup: "R",
                  className: "Oak",
                  capacity: 30,
                  areaSqm: 60,
                  gridX: 0,
                  gridY: 3,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-eyfs",
                },
                {
                  id: "rm-maple",
                  name: "Maple (Reception)",
                  type: "classroom",
                  yearGroup: "R",
                  className: "Maple",
                  capacity: 30,
                  areaSqm: 60,
                  gridX: 3,
                  gridY: 3,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-eyfs",
                },
                {
                  id: "rm-birch",
                  name: "Birch (Year 1)",
                  type: "classroom",
                  yearGroup: "1",
                  className: "Birch",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 0,
                  gridY: 6,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-eyfs",
                },
                {
                  id: "rm-elm",
                  name: "Elm (Year 1)",
                  type: "classroom",
                  yearGroup: "1",
                  className: "Elm",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 3,
                  gridY: 6,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-eyfs",
                },
                {
                  id: "rm-cloakroom-eyfs",
                  name: "EYFS Cloakroom",
                  type: "cloakroom",
                  areaSqm: 15,
                  gridX: 6,
                  gridY: 3,
                  gridW: 2,
                  gridH: 2,
                },
                {
                  id: "rm-toilet-eyfs",
                  name: "EYFS Toilets",
                  type: "toilet",
                  areaSqm: 12,
                  gridX: 6,
                  gridY: 5,
                  gridW: 2,
                  gridH: 2,
                },
              ],
              corridors: [],
            },
            {
              id: "gf-communal",
              name: "Communal Areas",
              type: "communal",
              rooms: [
                {
                  id: "rm-hall",
                  name: "Main Hall",
                  type: "hall",
                  capacity: 200,
                  areaSqm: 180,
                  gridX: 8,
                  gridY: 3,
                  gridW: 4,
                  gridH: 4,
                  hasFireExit: true,
                  nearestExitId: "exit-hall",
                },
                {
                  id: "rm-kitchen",
                  name: "Kitchen",
                  type: "kitchen",
                  capacity: 5,
                  areaSqm: 40,
                  gridX: 8,
                  gridY: 7,
                  gridW: 2,
                  gridH: 2,
                  nearestExitId: "exit-kitchen",
                },
                {
                  id: "rm-dining",
                  name: "Dining Area",
                  type: "dining",
                  capacity: 60,
                  areaSqm: 50,
                  gridX: 10,
                  gridY: 7,
                  gridW: 2,
                  gridH: 2,
                  nearestExitId: "exit-hall",
                },
              ],
              corridors: [],
            },
            {
              id: "gf-welfare",
              name: "Welfare",
              type: "welfare",
              rooms: [
                {
                  id: "rm-medical",
                  name: "Medical Room",
                  type: "medical",
                  capacity: 3,
                  areaSqm: 12,
                  gridX: 8,
                  gridY: 0,
                  gridW: 2,
                  gridH: 2,
                  nearestExitId: "exit-main",
                },
                {
                  id: "rm-send-1",
                  name: "Intervention Room 1",
                  type: "send_room",
                  capacity: 6,
                  areaSqm: 15,
                  gridX: 10,
                  gridY: 0,
                  gridW: 2,
                  gridH: 2,
                  nearestExitId: "exit-main",
                },
              ],
              corridors: [],
            },
          ],
        },

        // ── First Floor ──
        {
          id: "first",
          label: "First Floor",
          level: 1,
          zones: [
            {
              id: "ff-ks1-upper",
              name: "KS1 Upper & KS2 Lower",
              type: "teaching",
              rooms: [
                {
                  id: "rm-ash",
                  name: "Ash (Year 2)",
                  type: "classroom",
                  yearGroup: "2",
                  className: "Ash",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 0,
                  gridY: 0,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-stairs-w",
                },
                {
                  id: "rm-willow",
                  name: "Willow (Year 2)",
                  type: "classroom",
                  yearGroup: "2",
                  className: "Willow",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 3,
                  gridY: 0,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-stairs-w",
                },
                {
                  id: "rm-holly",
                  name: "Holly (Year 3)",
                  type: "classroom",
                  yearGroup: "3",
                  className: "Holly",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 0,
                  gridY: 3,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-stairs-w",
                },
                {
                  id: "rm-rowan",
                  name: "Rowan (Year 3)",
                  type: "classroom",
                  yearGroup: "3",
                  className: "Rowan",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 3,
                  gridY: 3,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-stairs-w",
                },
              ],
              corridors: [
                {
                  id: "cor-ff-w",
                  name: "First Floor West Corridor",
                  gridX: 0,
                  gridY: 6,
                  gridW: 6,
                  gridH: 1,
                },
              ],
            },
            {
              id: "ff-ks2-lower",
              name: "KS2 & Shared Spaces",
              type: "teaching",
              rooms: [
                {
                  id: "rm-cedar",
                  name: "Cedar (Year 4)",
                  type: "classroom",
                  yearGroup: "4",
                  className: "Cedar",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 6,
                  gridY: 0,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-stairs-e",
                },
                {
                  id: "rm-pine",
                  name: "Pine (Year 4)",
                  type: "classroom",
                  yearGroup: "4",
                  className: "Pine",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 9,
                  gridY: 0,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-stairs-e",
                },
                {
                  id: "rm-library",
                  name: "Library",
                  type: "library",
                  capacity: 25,
                  areaSqm: 40,
                  gridX: 6,
                  gridY: 3,
                  gridW: 3,
                  gridH: 2,
                  nearestExitId: "exit-stairs-e",
                },
                {
                  id: "rm-ict",
                  name: "ICT Suite",
                  type: "ict_suite",
                  capacity: 30,
                  areaSqm: 50,
                  gridX: 9,
                  gridY: 3,
                  gridW: 3,
                  gridH: 2,
                  nearestExitId: "exit-stairs-e",
                },
                {
                  id: "rm-staffroom",
                  name: "Staff Room",
                  type: "staffroom",
                  capacity: 20,
                  areaSqm: 35,
                  gridX: 6,
                  gridY: 5,
                  gridW: 3,
                  gridH: 2,
                  nearestExitId: "exit-stairs-e",
                },
                {
                  id: "rm-send-2",
                  name: "Intervention Room 2",
                  type: "send_room",
                  capacity: 6,
                  areaSqm: 15,
                  gridX: 9,
                  gridY: 5,
                  gridW: 3,
                  gridH: 2,
                  nearestExitId: "exit-stairs-e",
                },
              ],
              corridors: [
                {
                  id: "cor-ff-e",
                  name: "First Floor East Corridor",
                  gridX: 6,
                  gridY: 7,
                  gridW: 6,
                  gridH: 1,
                },
              ],
            },
            {
              id: "ff-toilets",
              name: "First Floor Facilities",
              type: "welfare",
              rooms: [
                {
                  id: "rm-toilet-ff",
                  name: "KS1/KS2 Toilets",
                  type: "toilet",
                  areaSqm: 18,
                  gridX: 5,
                  gridY: 0,
                  gridW: 1,
                  gridH: 3,
                },
                {
                  id: "rm-staff-toilet-ff",
                  name: "Staff Toilet",
                  type: "toilet",
                  areaSqm: 6,
                  gridX: 5,
                  gridY: 3,
                  gridW: 1,
                  gridH: 2,
                },
              ],
              corridors: [],
            },
          ],
        },

        // ── Second Floor ──
        {
          id: "second",
          label: "Second Floor",
          level: 2,
          zones: [
            {
              id: "sf-ks2-upper",
              name: "Upper KS2",
              type: "teaching",
              rooms: [
                {
                  id: "rm-beech",
                  name: "Beech (Year 5)",
                  type: "classroom",
                  yearGroup: "5",
                  className: "Beech",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 0,
                  gridY: 0,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-stairs-w",
                },
                {
                  id: "rm-chestnut",
                  name: "Chestnut (Year 5)",
                  type: "classroom",
                  yearGroup: "5",
                  className: "Chestnut",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 3,
                  gridY: 0,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-stairs-w",
                },
                {
                  id: "rm-hazel",
                  name: "Hazel (Year 6)",
                  type: "classroom",
                  yearGroup: "6",
                  className: "Hazel",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 6,
                  gridY: 0,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-stairs-e",
                },
                {
                  id: "rm-sycamore",
                  name: "Sycamore (Year 6)",
                  type: "classroom",
                  yearGroup: "6",
                  className: "Sycamore",
                  capacity: 30,
                  areaSqm: 55,
                  gridX: 9,
                  gridY: 0,
                  gridW: 3,
                  gridH: 3,
                  nearestExitId: "exit-stairs-e",
                },
              ],
              corridors: [
                {
                  id: "cor-sf",
                  name: "Second Floor Corridor",
                  gridX: 0,
                  gridY: 3,
                  gridW: 12,
                  gridH: 1,
                },
              ],
            },
            {
              id: "sf-ppa",
              name: "PPA & Resources",
              type: "admin",
              rooms: [
                {
                  id: "rm-ppa",
                  name: "PPA Room",
                  type: "office",
                  capacity: 6,
                  areaSqm: 20,
                  gridX: 0,
                  gridY: 4,
                  gridW: 3,
                  gridH: 2,
                  nearestExitId: "exit-stairs-w",
                },
                {
                  id: "rm-resources",
                  name: "Resource Store",
                  type: "storage",
                  areaSqm: 20,
                  gridX: 3,
                  gridY: 4,
                  gridW: 3,
                  gridH: 2,
                  nearestExitId: "exit-stairs-w",
                },
                {
                  id: "rm-toilet-sf",
                  name: "Second Floor Toilets",
                  type: "toilet",
                  areaSqm: 12,
                  gridX: 6,
                  gridY: 4,
                  gridW: 2,
                  gridH: 2,
                },
              ],
              corridors: [],
            },
          ],
        },
      ],
    },
  ],
  externalAreas: [
    { id: "ext-playground-ks1", name: "KS1 Playground", type: "playground" },
    { id: "ext-playground-ks2", name: "KS2 Playground", type: "playground" },
    { id: "ext-field", name: "School Field", type: "field" },
    { id: "ext-garden", name: "Sensory Garden", type: "garden" },
    { id: "ext-car-park", name: "Staff Car Park", type: "car_park" },
    { id: "ext-bins", name: "Bin Store", type: "bin_store" },
    { id: "ext-eyfs-outdoor", name: "EYFS Outdoor Area", type: "playground" },
  ],
  musterPoints: [
    {
      id: "muster-main",
      name: "Main Muster Point",
      location: "KS2 Playground (far end)",
      capacity: 500,
    },
    {
      id: "muster-eyfs",
      name: "EYFS Muster Point",
      location: "EYFS Outdoor Area (gate side)",
      capacity: 100,
    },
  ],
};

// ─── Fire Exits ─────────────────────────────────────────

export const FIRE_EXITS: FireExit[] = [
  {
    id: "exit-main",
    name: "Main Entrance",
    floorId: "ground",
    gridX: 0,
    gridY: -1,
  },
  {
    id: "exit-eyfs",
    name: "EYFS Fire Door",
    floorId: "ground",
    gridX: 0,
    gridY: 9,
  },
  {
    id: "exit-hall",
    name: "Hall Fire Door",
    floorId: "ground",
    gridX: 12,
    gridY: 5,
  },
  {
    id: "exit-kitchen",
    name: "Kitchen Fire Door",
    floorId: "ground",
    gridX: 8,
    gridY: 9,
  },
  {
    id: "exit-stairs-w",
    name: "West Staircase",
    floorId: "first",
    gridX: -1,
    gridY: 3,
  },
  {
    id: "exit-stairs-e",
    name: "East Staircase",
    floorId: "first",
    gridX: 12,
    gridY: 3,
  },
];

// ─── Evacuation Routes ──────────────────────────────────

export const EVACUATION_ROUTES: EvacuationRoute[] = [
  // Ground floor — direct exits
  {
    id: "evac-oak",
    fromRoomId: "rm-oak",
    exitId: "exit-eyfs",
    musterPointId: "muster-eyfs",
    steps: [
      "Exit Oak via classroom door",
      "Through EYFS corridor",
      "Out EYFS fire door",
      "Proceed to EYFS muster point",
    ],
    distanceMetres: 25,
  },
  {
    id: "evac-maple",
    fromRoomId: "rm-maple",
    exitId: "exit-eyfs",
    musterPointId: "muster-eyfs",
    steps: [
      "Exit Maple via classroom door",
      "Through EYFS corridor",
      "Out EYFS fire door",
      "Proceed to EYFS muster point",
    ],
    distanceMetres: 30,
  },
  {
    id: "evac-hall",
    fromRoomId: "rm-hall",
    exitId: "exit-hall",
    musterPointId: "muster-main",
    steps: [
      "Exit hall via fire door (east side)",
      "Proceed along path to KS2 playground",
      "Report to main muster point",
    ],
    distanceMetres: 40,
  },
  {
    id: "evac-reception",
    fromRoomId: "rm-reception",
    exitId: "exit-main",
    musterPointId: "muster-main",
    steps: [
      "Exit via main entrance",
      "Proceed to KS2 playground",
      "Report to main muster point",
    ],
    distanceMetres: 50,
  },

  // First floor — via staircases
  {
    id: "evac-ash",
    fromRoomId: "rm-ash",
    exitId: "exit-stairs-w",
    musterPointId: "muster-main",
    steps: [
      "Exit Ash to corridor",
      "Turn left to west staircase",
      "Descend to ground floor",
      "Exit via ground floor corridor",
      "Proceed to main muster point",
    ],
    distanceMetres: 60,
  },
  {
    id: "evac-cedar",
    fromRoomId: "rm-cedar",
    exitId: "exit-stairs-e",
    musterPointId: "muster-main",
    steps: [
      "Exit Cedar to corridor",
      "Turn right to east staircase",
      "Descend to ground floor",
      "Exit via hall fire door",
      "Proceed to main muster point",
    ],
    distanceMetres: 55,
  },

  // Second floor — longest routes
  {
    id: "evac-hazel",
    fromRoomId: "rm-hazel",
    exitId: "exit-stairs-e",
    musterPointId: "muster-main",
    steps: [
      "Exit Hazel to corridor",
      "Turn right to east staircase",
      "Descend two flights",
      "Exit via hall fire door",
      "Proceed to main muster point",
    ],
    distanceMetres: 75,
  },
  {
    id: "evac-beech",
    fromRoomId: "rm-beech",
    exitId: "exit-stairs-w",
    musterPointId: "muster-main",
    steps: [
      "Exit Beech to corridor",
      "Turn left to west staircase",
      "Descend two flights",
      "Exit via ground floor corridor",
      "Proceed to main muster point",
    ],
    distanceMetres: 70,
  },
];

// ─── Helper Functions ───────────────────────────────────

export function getAllRooms(): Room[] {
  return AURORA_SITE.buildings.flatMap((b) =>
    b.floors.flatMap((f) => f.zones.flatMap((z) => z.rooms)),
  );
}

export function getRoomById(id: string): Room | undefined {
  return getAllRooms().find((r) => r.id === id);
}

export function getRoomsOnFloor(floorId: string): Room[] {
  for (const b of AURORA_SITE.buildings) {
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
  return EVACUATION_ROUTES.find((r) => r.fromRoomId === roomId);
}

export function getFloorForRoom(roomId: string): Floor | undefined {
  for (const b of AURORA_SITE.buildings) {
    for (const f of b.floors) {
      for (const z of f.zones) {
        if (z.rooms.some((r) => r.id === roomId)) return f;
      }
    }
  }
  return undefined;
}

// ─── Assumptions Log ────────────────────────────────────

export const ASSUMPTIONS = [
  "Building layout inferred from 2FE primary school typical layout — not from actual architectural plans",
  "3 floors (basement + ground + 2 upper) based on seeded data showing 'Main Building: BLD-001 (3 floors)'",
  "EYFS and KS1 classrooms placed on ground floor for safeguarding and outdoor access (standard practice)",
  "KS2 classrooms placed on upper floors (standard in multi-storey primaries)",
  "Room sizes based on DfE Building Bulletin 103 minimum standards for primary schools",
  "14 classrooms named from Aurora's tree-based class naming: Oak, Maple, Birch, Elm, Ash, Willow, Holly, Rowan, Cedar, Pine, Beech, Chestnut, Hazel, Sycamore",
  "Main Hall capacity 200 taken from seeded estates data",
  "Boiler Room in basement taken from seeded estates data (RM-002)",
  "Two muster points assumed — one for EYFS (separate for small children), one main for KS1/KS2",
  "6 fire exits assumed based on typical fire safety requirements for a 3-storey school",
  "Evacuation routes are representative, not architect-verified",
  "External areas inferred from typical CoE primary school layout (playground, field, sensory garden)",
  "Kitchen/dining separation based on typical school catering arrangement",
  "Staff car park assumed (standard for school of this size)",
  "Two SEND intervention rooms assumed based on 84 SEN pupils (20% of roll — higher than average, needs capacity)",
];
