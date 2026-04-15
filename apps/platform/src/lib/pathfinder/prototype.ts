import { ROOM_OUTLINES } from "@/components/show-me-site/grove-house-3d-data";

export const PATHFINDER_PROTOTYPE_IMAGE = {
  src: "/site-plans/grove-house-ground-floor.png",
  width: 3309,
  height: 2339,
  title: "Grove House Primary - Ground Floor",
};

export type PathfinderRoomType =
  | "classroom"
  | "office"
  | "toilet"
  | "corridor"
  | "hall"
  | "headteacher"
  | "kitchen"
  | "medical"
  | "storage"
  | "entrance"
  | "plant"
  | "other";

export interface PathfinderPoint {
  x: number;
  y: number;
}

export interface PathfinderBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PathfinderGeoPoint {
  lat: number;
  lon: number;
}

export interface PathfinderScenePoint {
  x: number;
  z: number;
}

export interface PathfinderRoomDraft {
  id: string;
  sourceId?: string;
  label: string;
  roomCode?: string;
  block?: string;
  type: PathfinderRoomType;
  polygon: PathfinderPoint[];
  bounds: PathfinderBounds;
  confidence: number;
  needsReview: boolean;
  notes?: string;
}

export interface PathfinderAssetDraft {
  id: string;
  label: string;
  type:
    | "door"
    | "qr_anchor"
    | "fire_extinguisher"
    | "fire_blanket"
    | "call_point"
    | "smoke_detector"
    | "heat_detector"
    | "sounder"
    | "defibrillator"
    | "emergency_exit"
    | "access_control"
    | "boiler"
    | "other";
  x: number;
  y: number;
  linkedRoomId?: string;
  linkedSiteFeatureId?: string;
  geoPoint?: PathfinderGeoPoint;
  locationScope?: "building" | "site";
  qrCode?: string;
  wallSide?: "north" | "east" | "south" | "west" | "ceiling" | "floor" | "external";
  status?: "mapped" | "needs_position" | "service_due" | "issue_open";
  sourceTable?: "estates_assets";
  sourceId?: string;
  serviceDue?: string;
  confidence: number;
}

export interface PathfinderRouteDraft {
  id: string;
  from: string;
  to: string;
  points: PathfinderPoint[];
  confidence: number;
}

export type PathfinderTicketRisk = "low" | "medium" | "high" | "critical";

export interface PathfinderTicketDraft {
  id: string;
  title: string;
  type: "leak" | "repair" | "compliance" | "access" | "safeguarding";
  status: "open" | "in_progress" | "blocked" | "resolved";
  risk: PathfinderTicketRisk;
  x: number;
  y: number;
  linkedRoomId?: string;
  linkedSiteFeatureId?: string;
  linkedAssetId?: string;
  sourceTable: "estates_helpdesk_tickets";
  notes: string;
}

export interface PathfinderSupportProfileDraft {
  id: string;
  label: string;
  linkedRoomCode: string;
  linkedRoomId?: string;
  sendCount: number;
  viCount: number;
  peepCount: number;
  pipCount: number;
  evacuationNote: string;
  confidence: number;
}

export interface PathfinderEvacuationZoneDraft {
  id: string;
  label: string;
  leadRole: string;
  polygon: PathfinderPoint[];
  musterPointId: string;
  notes: string;
}

export interface PathfinderMusterPointDraft {
  id: string;
  label: string;
  x: number;
  y: number;
  capacityNote: string;
}

export type PathfinderSiteFeatureType =
  | "site_boundary"
  | "building"
  | "field"
  | "playground"
  | "play_area"
  | "muga"
  | "car_park"
  | "entrance"
  | "gate"
  | "fence"
  | "road"
  | "bin_store"
  | "service_yard"
  | "risk";

export interface PathfinderSiteFeatureDraft {
  id: string;
  label: string;
  type: PathfinderSiteFeatureType;
  points: PathfinderGeoPoint[];
  scenePoints?: PathfinderScenePoint[];
  confidence: number;
  needsReview: boolean;
  notes?: string;
}

export interface PathfinderSiteContextDraft {
  center: PathfinderGeoPoint;
  zoom: number;
  provider: "openstreetmap";
  tileTemplate: string;
  attribution: string;
  sourceUrl: string;
  features: PathfinderSiteFeatureDraft[];
  warnings: string[];
}

export interface PathfinderExtractionResult {
  source:
    | "local-baseline"
    | "raster-wall-segmentation"
    | "vision-ai"
    | "vision-ai-with-fallback";
  model?: string;
  generatedAt: string;
  image: typeof PATHFINDER_PROTOTYPE_IMAGE;
  rooms: PathfinderRoomDraft[];
  assets: PathfinderAssetDraft[];
  routes: PathfinderRouteDraft[];
  tickets: PathfinderTicketDraft[];
  supportProfiles: PathfinderSupportProfileDraft[];
  evacuationZones: PathfinderEvacuationZoneDraft[];
  musterPoints: PathfinderMusterPointDraft[];
  siteContext: PathfinderSiteContextDraft;
  warnings: string[];
  metrics: {
    roomCount: number;
    corridorCount: number;
    reviewCount: number;
    averageConfidence: number;
    assetCount: number;
    doorCandidateCount: number;
  };
}

const PATHFINDER_OPERATIONAL_ASSET_SEEDS: Array<Omit<PathfinderAssetDraft, "linkedRoomId">> = [
  {
    id: "asset-fe-reception",
    label: "Fire extinguisher - reception route",
    type: "fire_extinguisher",
    x: 2075,
    y: 1625,
    qrCode: "PF-GH-FE-001",
    wallSide: "west",
    status: "mapped",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-fe-001",
    serviceDue: "2026-09-30",
    confidence: 0.58,
  },
  {
    id: "asset-call-main-entrance",
    label: "Manual call point - main entrance",
    type: "call_point",
    x: 2032,
    y: 1710,
    qrCode: "PF-GH-MCP-001",
    wallSide: "south",
    status: "mapped",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-mcp-001",
    serviceDue: "2026-07-15",
    confidence: 0.52,
  },
  {
    id: "asset-sounder-main-hall",
    label: "Fire alarm sounder - main hall",
    type: "sounder",
    x: 2135,
    y: 1168,
    qrCode: "PF-GH-SND-001",
    wallSide: "ceiling",
    status: "needs_position",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-snd-001",
    serviceDue: "2026-07-15",
    confidence: 0.42,
  },
  {
    id: "asset-smoke-corridor-48",
    label: "Smoke detector - corridor link",
    type: "smoke_detector",
    x: 2290,
    y: 1394,
    qrCode: "PF-GH-SD-001",
    wallSide: "ceiling",
    status: "mapped",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-sd-001",
    serviceDue: "2026-07-15",
    confidence: 0.5,
  },
  {
    id: "asset-blanket-kitchen",
    label: "Fire blanket - kitchen candidate",
    type: "fire_blanket",
    x: 560,
    y: 1322,
    qrCode: "PF-GH-FB-001",
    wallSide: "east",
    status: "needs_position",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-fb-001",
    serviceDue: "2026-09-30",
    confidence: 0.44,
  },
  {
    id: "asset-boiler-plant",
    label: "Boiler asset - plant room candidate",
    type: "boiler",
    x: 2664,
    y: 848,
    qrCode: "PF-GH-BLR-001",
    wallSide: "floor",
    status: "service_due",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-boiler-001",
    serviceDue: "2026-05-20",
    confidence: 0.36,
  },
  {
    id: "asset-exit-main",
    label: "Fire exit - main entrance",
    type: "emergency_exit",
    x: 2070,
    y: 1745,
    qrCode: "PF-GH-EXIT-001",
    wallSide: "external",
    status: "mapped",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-exit-001",
    confidence: 0.62,
  },
  {
    id: "asset-exit-east",
    label: "Fire exit - east car park side",
    type: "emergency_exit",
    x: 2790,
    y: 1455,
    qrCode: "PF-GH-EXIT-002",
    wallSide: "external",
    status: "mapped",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-exit-002",
    confidence: 0.54,
  },
  {
    id: "asset-exit-west",
    label: "Fire exit - west playground side",
    type: "emergency_exit",
    x: 625,
    y: 1315,
    qrCode: "PF-GH-EXIT-003",
    wallSide: "external",
    status: "mapped",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-exit-003",
    confidence: 0.46,
  },
  {
    id: "asset-paxton-car-park-gate",
    label: "Paxton access control - car park vehicle gate",
    type: "access_control",
    x: 2876,
    y: 1454,
    linkedSiteFeatureId: "car-park-vehicle-gate",
    geoPoint: { lat: 53.81650, lon: -1.74062 },
    locationScope: "site",
    qrCode: "PF-GH-PAX-001",
    wallSide: "external",
    status: "mapped",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-paxton-001",
    serviceDue: "2026-08-15",
    confidence: 0.36,
  },
  {
    id: "asset-paxton-visitor-gate",
    label: "Paxton access control - visitor pedestrian gate",
    type: "access_control",
    x: 2050,
    y: 1810,
    linkedSiteFeatureId: "visitor-pedestrian-gate",
    geoPoint: { lat: 53.81640, lon: -1.74118 },
    locationScope: "site",
    qrCode: "PF-GH-PAX-002",
    wallSide: "external",
    status: "mapped",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-paxton-002",
    serviceDue: "2026-08-15",
    confidence: 0.34,
  },
  {
    id: "asset-paxton-service-yard",
    label: "Paxton access control - rear service gate",
    type: "access_control",
    x: 2910,
    y: 1080,
    linkedSiteFeatureId: "bins-service-yard",
    geoPoint: { lat: 53.81692, lon: -1.74050 },
    locationScope: "site",
    qrCode: "PF-GH-PAX-003",
    wallSide: "external",
    status: "needs_position",
    sourceTable: "estates_assets",
    sourceId: "asset-gh-paxton-003",
    serviceDue: "2026-08-15",
    confidence: 0.28,
  },
];

const PATHFINDER_SUPPORT_PROFILE_SEEDS: Omit<PathfinderSupportProfileDraft, "linkedRoomId">[] = [
  {
    id: "support-classroom-15",
    label: "Classroom 15 support summary",
    linkedRoomCode: "RS-15",
    sendCount: 5,
    viCount: 1,
    peepCount: 1,
    pipCount: 2,
    evacuationNote: "Keep route to the main hall corridor clear and confirm adult support at transition times.",
    confidence: 0.48,
  },
  {
    id: "support-corridor-49",
    label: "Corridor transition support",
    linkedRoomCode: "RS-49",
    sendCount: 2,
    viCount: 1,
    peepCount: 1,
    pipCount: 0,
    evacuationNote: "Narrow corridor candidate. Flag for supervised movement and emergency diversion planning.",
    confidence: 0.42,
  },
  {
    id: "support-classroom-60",
    label: "Classroom 60 support summary",
    linkedRoomCode: "RS-60",
    sendCount: 4,
    viCount: 0,
    peepCount: 2,
    pipCount: 1,
    evacuationNote: "PEEP count suggests checking nearest east-side exit and refuge/support point.",
    confidence: 0.44,
  },
];

const PATHFINDER_MUSTER_POINTS: PathfinderMusterPointDraft[] = [
  {
    id: "muster-front",
    label: "Muster A - front playground",
    x: 1220,
    y: 1830,
    capacityNote: "Candidate front assembly area. Confirm with fire plan and site team.",
  },
  {
    id: "muster-east",
    label: "Muster B - car park side",
    x: 2925,
    y: 1540,
    capacityNote: "Candidate east-side assembly / evacuation handover point.",
  },
];

const PATHFINDER_EVACUATION_ZONES: PathfinderEvacuationZoneDraft[] = [
  {
    id: "zone-west",
    label: "Fire zone West",
    leadRole: "Block lead",
    polygon: [
      { x: 150, y: 920 },
      { x: 1430, y: 920 },
      { x: 1430, y: 1660 },
      { x: 150, y: 1660 },
    ],
    musterPointId: "muster-front",
    notes: "Candidate west/classroom sweep zone. Confirm responsible staff and final exit route.",
  },
  {
    id: "zone-central",
    label: "Fire zone Central",
    leadRole: "Senior duty lead",
    polygon: [
      { x: 1450, y: 760 },
      { x: 2350, y: 760 },
      { x: 2350, y: 1740 },
      { x: 1450, y: 1740 },
    ],
    musterPointId: "muster-front",
    notes: "Candidate hall/admin sweep zone. Confirm sweep order and reception responsibilities.",
  },
  {
    id: "zone-east",
    label: "Fire zone East",
    leadRole: "Site team",
    polygon: [
      { x: 2350, y: 760 },
      { x: 3120, y: 760 },
      { x: 3120, y: 1650 },
      { x: 2350, y: 1650 },
    ],
    musterPointId: "muster-east",
    notes: "Candidate east/car-park-side sweep zone. Confirm external gate and traffic risk.",
  },
];

const PATHFINDER_TICKET_SEEDS: Array<Omit<PathfinderTicketDraft, "linkedRoomId">> = [
  {
    id: "ticket-gh-leak-001",
    title: "Leak reported near toilet block",
    type: "leak",
    status: "open",
    risk: "high",
    x: 2522,
    y: 1268,
    sourceTable: "estates_helpdesk_tickets",
    notes: "Pin shows how a helpdesk issue can be placed against a mapped room and opened from the site map.",
  },
  {
    id: "ticket-gh-fire-001",
    title: "Extinguisher position needs confirmation",
    type: "compliance",
    status: "in_progress",
    risk: "medium",
    x: 2075,
    y: 1625,
    linkedAssetId: "asset-fe-reception",
    sourceTable: "estates_helpdesk_tickets",
    notes: "Linked to a fire extinguisher asset and the room/corridor location selected during QR capture.",
  },
  {
    id: "ticket-gh-access-001",
    title: "Myers Lane car park access review",
    type: "access",
    status: "open",
    risk: "medium",
    x: 2876,
    y: 1454,
    linkedSiteFeatureId: "car-park-vehicle-gate",
    linkedAssetId: "asset-paxton-car-park-gate",
    sourceTable: "estates_helpdesk_tickets",
    notes: "External access issue linked to the Paxton vehicle gate so site assets and outside tickets appear on the whole-site model.",
  },
  {
    id: "ticket-gh-water-2025-001",
    title: "Historic damp patch in corridor corner",
    type: "repair",
    status: "resolved",
    risk: "low",
    x: 2388,
    y: 1316,
    sourceTable: "estates_helpdesk_tickets",
    notes: "Closed ticket kept for hotspot analysis so repeated water damage in the same corner is visible.",
  },
  {
    id: "ticket-gh-pipe-2025-002",
    title: "Historic pipework repair above toilet lobby",
    type: "repair",
    status: "resolved",
    risk: "medium",
    x: 2488,
    y: 1250,
    sourceTable: "estates_helpdesk_tickets",
    notes: "Closed ticket kept to show repeated fabric and pipework issues near the toilet block.",
  },
];

const GROVE_HOUSE_SITE_CONTEXT: PathfinderSiteContextDraft = {
  center: { lat: 53.8170062, lon: -1.7411957 },
  zoom: 17,
  provider: "openstreetmap",
  tileTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
  sourceUrl:
    "https://www.google.com/maps/place/Grove+House+Primary/@53.8167382,-1.7436471,496m/data=!3m1!1e3!4m6!3m5!1s0x487be3e6ceba6521:0x3050c268a7937f48!8m2!3d53.8170062!4d-1.7411957!16s%2Fg%2F1thly_h3",
  features: [
    {
      id: "site-boundary-candidate",
      label: "Full perimeter fence review",
      type: "site_boundary",
      points: [
        { lat: 53.81772, lon: -1.74255 },
        { lat: 53.81768, lon: -1.74044 },
        { lat: 53.81712, lon: -1.74016 },
        { lat: 53.81648, lon: -1.74024 },
        { lat: 53.81630, lon: -1.74092 },
        { lat: 53.81634, lon: -1.74232 },
        { lat: 53.81694, lon: -1.74258 },
      ],
      confidence: 0.4,
      needsReview: true,
      notes: "Whole-site perimeter candidate from public map context and site review notes. Walk the boundary to confirm fence line, gates, and any unmanaged edges.",
    },
    {
      id: "building-footprint-candidate",
      label: "Main building footprint",
      type: "building",
      points: [
        { lat: 53.81720, lon: -1.74203 },
        { lat: 53.81728, lon: -1.74113 },
        { lat: 53.81700, lon: -1.74085 },
        { lat: 53.81666, lon: -1.74128 },
        { lat: 53.81670, lon: -1.74207 },
      ],
      confidence: 0.36,
      needsReview: true,
      notes: "Draft exterior footprint only. Align against a licensed aerial or site plan before using operationally.",
    },
    {
      id: "left-playground-zone",
      label: "Left-side playground / hardstanding",
      type: "playground",
      points: [
        { lat: 53.81742, lon: -1.74245 },
        { lat: 53.81744, lon: -1.74203 },
        { lat: 53.81696, lon: -1.74202 },
        { lat: 53.81688, lon: -1.74248 },
      ],
      confidence: 0.34,
      needsReview: true,
      notes: "Candidate playground area on the left/west side of the school. Confirm play equipment, surfacing, and assembly use.",
    },
    {
      id: "front-play-pocket",
      label: "Front small play area",
      type: "play_area",
      points: [
        { lat: 53.81666, lon: -1.74194 },
        { lat: 53.81668, lon: -1.74148 },
        { lat: 53.81646, lon: -1.74136 },
        { lat: 53.81640, lon: -1.74192 },
      ],
      confidence: 0.28,
      needsReview: true,
      notes: "Small front external area candidate near the Myers Lane side. Confirm if this is pupil play, circulation, or visitor approach.",
    },
    {
      id: "rear-play-areas",
      label: "Rear play pockets",
      type: "play_area",
      points: [
        { lat: 53.81758, lon: -1.74190 },
        { lat: 53.81758, lon: -1.74124 },
        { lat: 53.81730, lon: -1.74118 },
        { lat: 53.81730, lon: -1.74188 },
      ],
      confidence: 0.3,
      needsReview: true,
      notes: "Rear outdoor play zone candidate. Split into separate marked areas after aerial/site confirmation.",
    },
    {
      id: "muga-games-court",
      label: "MUGA / games court candidate",
      type: "muga",
      points: [
        { lat: 53.81766, lon: -1.74234 },
        { lat: 53.81766, lon: -1.74178 },
        { lat: 53.81744, lon: -1.74176 },
        { lat: 53.81744, lon: -1.74238 },
      ],
      confidence: 0.26,
      needsReview: true,
      notes: "Candidate hard games court rather than a large playing field. Confirm markings, fencing, and supervision route.",
    },
    {
      id: "car-park-review-zone",
      label: "Right-side car park",
      type: "car_park",
      points: [
        { lat: 53.81692, lon: -1.74084 },
        { lat: 53.81690, lon: -1.74024 },
        { lat: 53.81648, lon: -1.74028 },
        { lat: 53.81644, lon: -1.74086 },
      ],
      confidence: 0.32,
      needsReview: true,
      notes: "Candidate car park on the right/east side of the school. Confirm staff/visitor use, emergency access, and gate control.",
    },
    {
      id: "car-park-vehicle-gate",
      label: "Vehicle entrance from Myers Lane",
      type: "gate",
      points: [{ lat: 53.81650, lon: -1.74062 }],
      confidence: 0.3,
      needsReview: true,
      notes: "Candidate vehicle gate into the right-side car park from Myers Lane. Confirm one-way/dead-end traffic flow and visibility.",
    },
    {
      id: "visitor-pedestrian-gate",
      label: "Visitor pedestrian gate",
      type: "entrance",
      points: [{ lat: 53.81640, lon: -1.74118 }],
      confidence: 0.3,
      needsReview: true,
      notes: "Candidate pedestrian QR start point for visitor route to reception. Confirm actual gate and signed approach.",
    },
    {
      id: "bins-service-yard",
      label: "Bins / service yard",
      type: "bin_store",
      points: [
        { lat: 53.81702, lon: -1.74068 },
        { lat: 53.81700, lon: -1.74026 },
        { lat: 53.81684, lon: -1.74024 },
        { lat: 53.81682, lon: -1.74066 },
      ],
      confidence: 0.24,
      needsReview: true,
      notes: "Candidate bins/service area near the back/right car park side. Confirm waste storage, deliveries, and pupil separation.",
    },
    {
      id: "myers-lane-frontage",
      label: "Myers Lane traffic pinch point",
      type: "road",
      points: [
        { lat: 53.81632, lon: -1.74218 },
        { lat: 53.81635, lon: -1.74146 },
        { lat: 53.81642, lon: -1.74085 },
        { lat: 53.81654, lon: -1.74030 },
      ],
      confidence: 0.44,
      needsReview: true,
      notes: "Myers Lane arrival and parking pressure review. Treat as a traffic-management and safeguarding note, not a parking promise.",
    },
    {
      id: "rear-right-security-line",
      label: "Rear/right fence security line",
      type: "fence",
      points: [
        { lat: 53.81768, lon: -1.74044 },
        { lat: 53.81712, lon: -1.74016 },
        { lat: 53.81648, lon: -1.74024 },
      ],
      confidence: 0.26,
      needsReview: true,
      notes: "Security review line around the rear/right side near service and car park areas.",
    },
    {
      id: "parking-risk-note",
      label: "Parking congestion risk",
      type: "risk",
      points: [{ lat: 53.81642, lon: -1.74098 }],
      confidence: 0.36,
      needsReview: true,
      notes: "Flag for drop-off congestion and access obstruction review around Myers Lane and the car park entrance.",
    },
  ],
  warnings: [
    "External site context uses public map coordinates and draft overlays, not a surveyed boundary.",
    "Use an approved Google Maps Platform, Mapbox, Ordnance Survey, or GIS source before operational security decisions.",
  ],
};

const WORLD = {
  minX: -45,
  maxZ: 33.35,
  width: 80,
  height: 56.7,
};

function worldToPixelX(worldX: number): number {
  return ((worldX - WORLD.minX) / WORLD.width) * PATHFINDER_PROTOTYPE_IMAGE.width;
}

function worldToPixelY(worldZ: number): number {
  return ((WORLD.maxZ - worldZ) / WORLD.height) * PATHFINDER_PROTOTYPE_IMAGE.height;
}

function boundsToPolygon(bounds: PathfinderBounds): PathfinderPoint[] {
  return [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normaliseBounds(bounds: PathfinderBounds): PathfinderBounds {
  const x = clamp(bounds.x, 0, PATHFINDER_PROTOTYPE_IMAGE.width);
  const y = clamp(bounds.y, 0, PATHFINDER_PROTOTYPE_IMAGE.height);
  const maxWidth = PATHFINDER_PROTOTYPE_IMAGE.width - x;
  const maxHeight = PATHFINDER_PROTOTYPE_IMAGE.height - y;

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(clamp(bounds.width, 1, maxWidth)),
    height: Math.round(clamp(bounds.height, 1, maxHeight)),
  };
}

export function getRoomCentre(room: PathfinderRoomDraft): PathfinderPoint {
  return {
    x: Math.round(room.bounds.x + room.bounds.width / 2),
    y: Math.round(room.bounds.y + room.bounds.height / 2),
  };
}

function inferRoomType(label: string): PathfinderRoomType {
  const value = label.toLowerCase();
  if (value.includes("toilet") || value.includes("wc")) return "toilet";
  if (value.includes("hall")) return "hall";
  if (value.includes("kitchen")) return "kitchen";
  if (value.includes("head")) return "headteacher";
  if (value.includes("medical") || value.includes("first aid")) return "medical";
  if (value.includes("entrance") || value.includes("reception")) return "entrance";
  if (value.includes("store")) return "storage";
  if (value.includes("office")) return "office";
  if (value.includes("boiler") || value.includes("plant")) return "plant";
  if (value.includes("corridor")) return "corridor";
  if (value.includes("class") || value.includes("room")) return "classroom";
  return "other";
}

export function buildLocalPathfinderBaseline(): PathfinderExtractionResult {
  const rooms = ROOM_OUTLINES.map((room): PathfinderRoomDraft => {
    const left = worldToPixelX(room.x);
    const right = worldToPixelX(room.x + room.w);
    const top = worldToPixelY(room.z + room.d);
    const bottom = worldToPixelY(room.z);
    const label = room.schoolLabel || room.label;
    const bounds = normaliseBounds({
      x: Math.min(left, right),
      y: Math.min(top, bottom),
      width: Math.abs(right - left),
      height: Math.abs(bottom - top),
    });

    return {
      id: room.systemId,
      sourceId: room.systemId,
      label,
      roomCode: room.pdfNumber || undefined,
      block: room.block,
      type: inferRoomType(label),
      bounds,
      polygon: boundsToPolygon(bounds),
      confidence: room.pdfNumber ? 0.78 : 0.68,
      needsReview: true,
      notes: "Prototype baseline generated from the Grove House traced coordinate layer.",
    };
  });

  const assetSeeds: Array<Omit<PathfinderAssetDraft, "linkedRoomId">> = [
    { id: "asset-fe-main", label: "Main entrance exit", type: "emergency_exit", x: worldToPixelX(-5), y: worldToPixelY(-6), confidence: 0.72 },
    { id: "asset-fe-b1", label: "Block 1 exit", type: "emergency_exit", x: worldToPixelX(-10), y: worldToPixelY(-7), confidence: 0.7 },
    { id: "asset-fe-b2", label: "Block 2 exit", type: "emergency_exit", x: worldToPixelX(-20), y: worldToPixelY(-7), confidence: 0.7 },
    { id: "asset-ext-kitchen", label: "Kitchen extinguisher candidate", type: "fire_extinguisher", x: worldToPixelX(-30.5), y: worldToPixelY(16), confidence: 0.62 },
    { id: "asset-ext-hall", label: "Hall extinguisher candidate", type: "fire_extinguisher", x: worldToPixelX(-38), y: worldToPixelY(8), confidence: 0.62 },
    { id: "asset-defib-entry", label: "Defibrillator candidate", type: "defibrillator", x: worldToPixelX(-1), y: worldToPixelY(-8), confidence: 0.55 },
  ];

  const assets: PathfinderAssetDraft[] = assetSeeds.map((asset) => ({
    ...asset,
    x: Math.round(asset.x),
    y: Math.round(asset.y),
    linkedRoomId: findNearestRoomId(rooms, asset.x, asset.y),
  }));

  const entrance = rooms.find((room) => room.id === "ENT-01") ?? rooms[0];
  const routes = rooms
    .filter((room) => room.id !== entrance.id)
    .slice(0, 8)
    .map((room): PathfinderRouteDraft => {
      const from = getRoomCentre(entrance);
      const to = getRoomCentre(room);
      return {
        id: `route-${entrance.id}-${room.id}`,
        from: entrance.id,
        to: room.id,
        points: [
          from,
          { x: Math.round((from.x + to.x) / 2), y: Math.round((from.y + to.y) / 2) },
          to,
        ],
        confidence: 0.46,
      };
    });

  return buildExtractionResult({
    source: "local-baseline",
    rooms,
    assets,
    routes,
    warnings: [
      "This is a local prototype baseline from the existing Grove House trace, not a safety-approved plan.",
      "All rooms and assets are marked for review before saving into Estates locations.",
    ],
  });
}

export function buildExtractionResult(input: {
  source: PathfinderExtractionResult["source"];
  model?: string;
  rooms: PathfinderRoomDraft[];
  assets?: PathfinderAssetDraft[];
  routes?: PathfinderRouteDraft[];
  warnings?: string[];
}): PathfinderExtractionResult {
  const rooms = input.rooms.map((room) => ({
    ...room,
    bounds: normaliseBounds(room.bounds),
    polygon: room.polygon.length > 0 ? room.polygon : boundsToPolygon(normaliseBounds(room.bounds)),
    confidence: clamp(room.confidence, 0, 1),
  }));
  const assets = mergeOperationalAssets(input.assets ?? [], rooms);
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const tickets = PATHFINDER_TICKET_SEEDS.map((ticket) => ({
    ...ticket,
    linkedRoomId: assetById.get(ticket.linkedAssetId ?? "")?.locationScope === "site"
      ? undefined
      : findNearestRoomId(rooms, ticket.x, ticket.y),
    linkedSiteFeatureId: ticket.linkedSiteFeatureId ?? assetById.get(ticket.linkedAssetId ?? "")?.linkedSiteFeatureId,
  }));
  const supportProfiles = PATHFINDER_SUPPORT_PROFILE_SEEDS.map((profile) => ({
    ...profile,
    linkedRoomId: rooms.find((room) => room.roomCode === profile.linkedRoomCode)?.id,
  }));
  const reviewCount = rooms.filter((room) => room.needsReview || room.confidence < 0.8).length;
  const averageConfidence =
    rooms.length === 0
      ? 0
      : rooms.reduce((sum, room) => sum + room.confidence, 0) / rooms.length;

  return {
    source: input.source,
    model: input.model,
    generatedAt: new Date().toISOString(),
    image: PATHFINDER_PROTOTYPE_IMAGE,
    rooms,
    assets,
    routes: input.routes ?? [],
    tickets,
    supportProfiles,
    evacuationZones: PATHFINDER_EVACUATION_ZONES,
    musterPoints: PATHFINDER_MUSTER_POINTS,
    siteContext: GROVE_HOUSE_SITE_CONTEXT,
    warnings: input.warnings ?? [],
    metrics: {
      roomCount: rooms.length,
      corridorCount: rooms.filter((room) => room.type === "corridor").length,
      reviewCount,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      assetCount: assets.length,
      doorCandidateCount: assets.filter((asset) => asset.type === "door").length,
    },
  };
}

function mergeOperationalAssets(
  inputAssets: PathfinderAssetDraft[],
  rooms: PathfinderRoomDraft[],
): PathfinderAssetDraft[] {
  const existingIds = new Set(inputAssets.map((asset) => asset.id));
  const operationalAssets = PATHFINDER_OPERATIONAL_ASSET_SEEDS.filter((asset) => !existingIds.has(asset.id)).map((asset) => ({
    ...asset,
    locationScope: asset.locationScope ?? "building",
    linkedRoomId: asset.locationScope === "site" ? undefined : findNearestRoomId(rooms, asset.x, asset.y),
  }));

  return [
    ...inputAssets.map((asset) => ({
      ...asset,
      locationScope: asset.locationScope ?? "building",
      linkedRoomId: asset.locationScope === "site" ? undefined : asset.linkedRoomId ?? findNearestRoomId(rooms, asset.x, asset.y),
    })),
    ...operationalAssets,
  ];
}

function findNearestRoomId(
  rooms: PathfinderRoomDraft[],
  x: number,
  y: number,
): string | undefined {
  let best: { id: string; distance: number } | null = null;

  for (const room of rooms) {
    const centre = getRoomCentre(room);
    const distance = Math.hypot(centre.x - x, centre.y - y);
    if (!best || distance < best.distance) {
      best = { id: room.id, distance };
    }
  }

  return best?.id;
}
