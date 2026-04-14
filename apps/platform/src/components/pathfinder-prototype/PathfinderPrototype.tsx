"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Canvas } from "@react-three/fiber";
import { Edges, Html, Line, OrbitControls } from "@react-three/drei";
import type {
  PathfinderAssetDraft,
  PathfinderExtractionResult,
  PathfinderGeoPoint,
  PathfinderPoint,
  PathfinderSupportProfileDraft,
  PathfinderRouteDraft,
  PathfinderRoomDraft,
  PathfinderSiteContextDraft,
  PathfinderSiteFeatureDraft,
  PathfinderSiteFeatureType,
  PathfinderTicketDraft,
  PathfinderTicketRisk,
  PathfinderRoomType,
} from "@/lib/pathfinder/prototype";

const ROOM_COLORS: Record<PathfinderRoomType, string> = {
  classroom: "#7b8198",
  office: "#6f879c",
  toilet: "#8a929c",
  corridor: "#9a9b74",
  hall: "#6b918d",
  headteacher: "#9e7580",
  kitchen: "#94845f",
  medical: "#a67791",
  storage: "#827c91",
  entrance: "#6d95a0",
  plant: "#77716c",
  other: "#7d838c",
};

const NAVIGATION_COLOR = "#0284c7";
const NAVIGATION_FLOW_COLOR = "#f59e0b";
const START_COLOR = "#dc2626";
const DESTINATION_COLOR = "#0f766e";
const INACTIVE_ROUTE_COLOR = "#6b7280";
const SELECTED_STROKE_COLOR = "#f8fafc";

const ROOM_TYPE_OPTIONS: PathfinderRoomType[] = [
  "classroom",
  "office",
  "toilet",
  "corridor",
  "hall",
  "headteacher",
  "kitchen",
  "medical",
  "storage",
  "entrance",
  "plant",
  "other",
];

const HUB_ROOM_TYPES = new Set<PathfinderRoomType>(["entrance", "headteacher", "medical", "office", "hall"]);

const ASSET_COLORS: Record<PathfinderAssetDraft["type"], string> = {
  door: "#64748b",
  qr_anchor: START_COLOR,
  fire_extinguisher: "#d92d20",
  fire_blanket: "#b42318",
  call_point: "#be123c",
  smoke_detector: "#7c3aed",
  heat_detector: "#a16207",
  sounder: "#2563eb",
  defibrillator: "#c11574",
  emergency_exit: "#16a34a",
  boiler: "#57534e",
  other: "#475467",
};

const FILTERABLE_ASSET_TYPES: PathfinderAssetDraft["type"][] = [
  "fire_extinguisher",
  "fire_blanket",
  "call_point",
  "smoke_detector",
  "heat_detector",
  "sounder",
  "defibrillator",
  "emergency_exit",
  "boiler",
];

const TICKET_RISK_COLORS: Record<PathfinderTicketRisk, string> = {
  low: "#0f766e",
  medium: "#a16207",
  high: "#d92d20",
  critical: "#7f1d1d",
};

const SUPPORT_COLORS = {
  send: "#7c3aed",
  vi: "#0891b2",
  peep: "#dc2626",
  pip: "#a16207",
  evacuation: "#f59e0b",
};

const SITE_FEATURE_COLORS: Record<PathfinderSiteFeatureType, string> = {
  site_boundary: "#111827",
  building: "#2563eb",
  playground: "#16a34a",
  play_area: "#0d9488",
  muga: "#7c3aed",
  car_park: "#475569",
  entrance: "#0f766e",
  gate: "#dc2626",
  fence: "#be123c",
  road: "#facc15",
  bin_store: "#57534e",
  service_yard: "#a16207",
  risk: "#b42318",
};

const SITE_TILE_SIZE = 256;
const SITE_TILE_RADIUS = 1;

type SetupApprovalState = "school_review" | "ai_fix" | "approved" | "published";
type ControlDeckTab = "tickets" | "layers" | "wayfinding" | "assets" | "edit";

const SETUP_WORKFLOW_STEPS: Array<{
  id: SetupApprovalState;
  label: string;
  description: string;
}> = [
  {
    id: "school_review",
    label: "Upload and overlay",
    description: "Use the fire plan or school drawing to extract rooms, corridors, doors, exits, and asset candidates.",
  },
  {
    id: "ai_fix",
    label: "Correct with the school",
    description: "Capture feedback as plain language fixes, then adjust the overlay before the operational model is approved.",
  },
  {
    id: "approved",
    label: "Approve structure",
    description: "Lock the room and corridor structure so the clean Pathfinder model no longer depends on the source PDF.",
  },
  {
    id: "published",
    label: "Publish assets",
    description: "Push QR asset pins, tickets, fire exits, and routes into Estates and navigation workflows.",
  },
];

function polygonPoints(room: PathfinderRoomDraft): string {
  return room.polygon.map((point) => `${point.x},${point.y}`).join(" ");
}

function polygonFromBounds(bounds: PathfinderRoomDraft["bounds"]): PathfinderRoomDraft["polygon"] {
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

function toScene(room: PathfinderRoomDraft, image: PathfinderExtractionResult["image"]) {
  const sceneWidth = 70;
  const sceneDepth = 50;
  const centerX = room.bounds.x + room.bounds.width / 2;
  const centerY = room.bounds.y + room.bounds.height / 2;

  return {
    x: (centerX / image.width - 0.5) * sceneWidth,
    z: (centerY / image.height - 0.5) * sceneDepth,
    w: Math.max((room.bounds.width / image.width) * sceneWidth, 0.8),
    d: Math.max((room.bounds.height / image.height) * sceneDepth, 0.8),
  };
}

function pointToScene(point: PathfinderPoint, image: PathfinderExtractionResult["image"]) {
  return [
    (point.x / image.width - 0.5) * 70,
    0.62,
    (point.y / image.height - 0.5) * 50,
  ] as [number, number, number];
}

function isCriticalHub(room: PathfinderRoomDraft): boolean {
  const label = room.label.toLowerCase();
  return (
    HUB_ROOM_TYPES.has(room.type) ||
    label.includes("reception") ||
    label.includes("head") ||
    label.includes("medical")
  );
}

function hubLabel(room: PathfinderRoomDraft): string {
  if (room.label.toLowerCase().includes("reception") || room.type === "entrance") return "RECEPTION";
  if (room.type === "headteacher") return "HEAD";
  if (room.type === "medical") return "MEDICAL";
  if (room.type === "hall") return "HALL";
  return room.type.toUpperCase();
}

function assetIconLabel(type: PathfinderAssetDraft["type"]): string {
  switch (type) {
    case "qr_anchor":
      return "QR";
    case "door":
      return "";
    case "fire_extinguisher":
      return "FE";
    case "fire_blanket":
      return "FB";
    case "call_point":
      return "CP";
    case "smoke_detector":
      return "SD";
    case "heat_detector":
      return "HD";
    case "sounder":
      return "SN";
    case "defibrillator":
      return "AED";
    case "emergency_exit":
      return "EX";
    case "boiler":
      return "BLR";
    default:
      return "A";
  }
}

function longitudeToTileX(longitude: number, zoom: number): number {
  return ((longitude + 180) / 360) * 2 ** zoom;
}

function latitudeToTileY(latitude: number, zoom: number): number {
  const radians = (latitude * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2) * 2 ** zoom;
}

function tileUrl(template: string, zoom: number, tileX: number, tileY: number): string {
  return template
    .replace("{z}", String(zoom))
    .replace("{x}", String(tileX))
    .replace("{y}", String(tileY));
}

function getSiteMapLayout(siteContext: PathfinderSiteContextDraft) {
  const centerTileX = longitudeToTileX(siteContext.center.lon, siteContext.zoom);
  const centerTileY = latitudeToTileY(siteContext.center.lat, siteContext.zoom);
  const originTileX = Math.floor(centerTileX) - SITE_TILE_RADIUS;
  const originTileY = Math.floor(centerTileY) - SITE_TILE_RADIUS;
  const tileCount = SITE_TILE_RADIUS * 2 + 1;

  return {
    size: tileCount * SITE_TILE_SIZE,
    originTileX,
    originTileY,
    tiles: Array.from({ length: tileCount * tileCount }, (_, index) => {
      const column = index % tileCount;
      const row = Math.floor(index / tileCount);
      const tileX = originTileX + column;
      const tileY = originTileY + row;
      return {
        href: tileUrl(siteContext.tileTemplate, siteContext.zoom, tileX, tileY),
        x: column * SITE_TILE_SIZE,
        y: row * SITE_TILE_SIZE,
      };
    }),
  };
}

function sitePointToPixel(
  point: PathfinderGeoPoint,
  siteContext: PathfinderSiteContextDraft,
  layout: ReturnType<typeof getSiteMapLayout>,
): PathfinderPoint {
  return {
    x: (longitudeToTileX(point.lon, siteContext.zoom) - layout.originTileX) * SITE_TILE_SIZE,
    y: (latitudeToTileY(point.lat, siteContext.zoom) - layout.originTileY) * SITE_TILE_SIZE,
  };
}

function siteFeaturePoints(
  feature: PathfinderSiteFeatureDraft,
  siteContext: PathfinderSiteContextDraft,
  layout: ReturnType<typeof getSiteMapLayout>,
): string {
  return feature.points
    .map((point) => sitePointToPixel(point, siteContext, layout))
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}

function siteFeatureLabelPoint(
  feature: PathfinderSiteFeatureDraft,
  siteContext: PathfinderSiteContextDraft,
  layout: ReturnType<typeof getSiteMapLayout>,
): PathfinderPoint {
  const points = feature.points.map((point) => sitePointToPixel(point, siteContext, layout));
  return points.reduce(
    (sum, point) => ({ x: sum.x + point.x / points.length, y: sum.y + point.y / points.length }),
    { x: 0, y: 0 },
  );
}

function formatSiteFeatureType(type: PathfinderSiteFeatureType): string {
  return type.replaceAll("_", " ");
}

function formatAssetType(type: PathfinderAssetDraft["type"]): string {
  return type.replaceAll("_", " ");
}

function supportProfileTotal(profile: PathfinderSupportProfileDraft): number {
  return profile.sendCount + profile.viCount + profile.peepCount + profile.pipCount;
}

function RoomMesh({
  room,
  image,
  selected,
  active,
  onSelect,
}: {
  room: PathfinderRoomDraft;
  image: PathfinderExtractionResult["image"];
  selected: boolean;
  active: boolean;
  onSelect: (roomId: string) => void;
}) {
  const shape = toScene(room, image);
  const hub = isCriticalHub(room);
  const color = ROOM_COLORS[room.type] ?? ROOM_COLORS.other;
  const wallHeight = room.type === "corridor" ? 0.18 : hub ? 2.8 : 2.2;
  const opacity = selected ? 0.48 : active ? 0.36 : room.type === "corridor" ? 0.2 : 0.16;
  const wallOpacity = selected ? 0.18 : active ? 0.12 : room.type === "corridor" ? 0.04 : 0.055;
  const edgeColor = selected ? SELECTED_STROKE_COLOR : active ? NAVIGATION_COLOR : "#6b7280";

  return (
    <group position={[shape.x, 0, shape.z]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.03, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(room.id);
        }}
      >
        <planeGeometry args={[shape.w, shape.d]} />
        <meshStandardMaterial color={color} roughness={0.92} transparent opacity={opacity} />
      </mesh>
      <mesh
        position={[0, wallHeight / 2, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(room.id);
        }}
      >
        <boxGeometry args={[shape.w, wallHeight, shape.d]} />
        <meshStandardMaterial color={color} roughness={0.96} transparent opacity={wallOpacity} />
        <Edges color={edgeColor} />
      </mesh>
      {selected && (
        <Html center position={[0, wallHeight + 0.55, 0]} style={{ pointerEvents: "none" }}>
          <div className="rounded-md bg-[#161616] px-2 py-1 text-[11px] font-semibold text-[#f8fafc] shadow-lg">
            {room.roomCode ? `${room.roomCode} - ` : ""}
            {room.label}
          </div>
        </Html>
      )}
      {hub && (selected || active) && (
        <Html center position={[0, wallHeight + 0.75, 0]} style={{ pointerEvents: "none" }}>
          <div
            className="rounded-md px-2 py-1 text-[10px] font-black text-[#f8fafc] shadow-lg"
            style={{ backgroundColor: color }}
          >
            {hubLabel(room)}
          </div>
        </Html>
      )}
    </group>
  );
}

function AssetMarker3D({
  asset,
  image,
  active,
  selected,
  onSelect,
}: {
  asset: PathfinderAssetDraft;
  image: PathfinderExtractionResult["image"];
  active: boolean;
  selected: boolean;
  onSelect: (asset: PathfinderAssetDraft) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [x, , z] = pointToScene({ x: asset.x, y: asset.y }, image);
  const color = ASSET_COLORS[asset.type] ?? ASSET_COLORS.other;
  const radius = asset.type === "door" ? (active ? 0.34 : 0.18) : asset.type === "emergency_exit" ? 0.92 : 0.72;
  const y = asset.type === "door" ? 0.38 : 1.05;
  const shouldLabel = hovered || selected;

  return (
    <group position={[x, y, z]}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect(asset);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[radius, 12, 12]} />
        <meshStandardMaterial
          color={selected ? "#f8fafc" : active && asset.type === "door" ? NAVIGATION_COLOR : color}
          transparent
          opacity={asset.type === "door" && !active ? 0.35 : 0.95}
        />
      </mesh>
      {shouldLabel && asset.type !== "door" && (
        <Html center position={[0, asset.type === "emergency_exit" ? 1.05 : 0.88, 0]} style={{ pointerEvents: "none" }}>
          <div className="max-w-[150px] rounded-md bg-[#111827] px-2 py-1 text-center text-[10px] font-black text-[#f8fafc] shadow-lg">
            {asset.type === "emergency_exit" ? "FIRE EXIT" : assetIconLabel(asset.type)}
            <span className="block font-semibold">{asset.label}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function TicketMarker3D({
  ticket,
  image,
  selected,
  onSelect,
}: {
  ticket: PathfinderTicketDraft;
  image: PathfinderExtractionResult["image"];
  selected: boolean;
  onSelect: (ticket: PathfinderTicketDraft) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [x, , z] = pointToScene({ x: ticket.x, y: ticket.y }, image);
  const color = TICKET_RISK_COLORS[ticket.risk];
  const shouldLabel = hovered || selected;

  return (
    <group position={[x, 1.35, z]}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onSelect(ticket);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[selected ? 0.96 : 0.82, 18, 18]} />
        <meshStandardMaterial
          color={selected ? "#f8fafc" : color}
          emissive={color}
          emissiveIntensity={selected ? 0.55 : 0.38}
          transparent
          opacity={0.98}
        />
      </mesh>
      {shouldLabel && (
        <Html center position={[0, 0.95, 0]} style={{ pointerEvents: "none" }}>
          <div className="max-w-[150px] rounded-md bg-[#111827] px-2 py-1 text-center text-[10px] font-black text-[#f8fafc] shadow-lg">
            {ticket.risk.toUpperCase()}
            <span className="block font-semibold">{ticket.title}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function SiteContextMap({ siteContext }: { siteContext: PathfinderSiteContextDraft }) {
  const layout = useMemo(() => getSiteMapLayout(siteContext), [siteContext]);
  const polygonFeatures = siteContext.features.filter((feature) => feature.points.length > 2 && feature.type !== "fence");
  const lineFeatures = siteContext.features.filter((feature) => feature.points.length > 1 && (feature.type === "road" || feature.type === "fence"));
  const pointFeatures = siteContext.features.filter((feature) => feature.points.length === 1);

  return (
    <section className="order-3 min-w-0 border-t border-[#c8d3cf] bg-[#eef3f1] p-4 lg:order-3 lg:col-span-2">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">External site context</h2>
              <p className="text-xs text-[#5d6965]">Road access, perimeter, gates, parking, and outdoor review zones</p>
            </div>
            <a
              href={siteContext.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-[#2f7d6d] bg-[#fbfcfc] px-3 py-2 text-xs font-semibold text-[#216e60]"
            >
              Open map reference
            </a>
          </div>

          <div className="mt-3 overflow-hidden rounded-md border border-[#aab7b2] bg-[#dfe8e5]">
            <svg
              className="block aspect-[4/3] h-auto w-full"
              viewBox={`0 0 ${layout.size} ${layout.size}`}
              role="img"
              aria-label="Draft external site context map"
            >
              <rect width={layout.size} height={layout.size} fill="#dfe8e5" />
              {layout.tiles.map((tile) => (
                <image
                  key={tile.href}
                  href={tile.href}
                  x={tile.x}
                  y={tile.y}
                  width={SITE_TILE_SIZE}
                  height={SITE_TILE_SIZE}
                  preserveAspectRatio="none"
                  opacity="0.72"
                />
              ))}
              <rect width={layout.size} height={layout.size} fill="#f8fafc" opacity="0.2" />
              {polygonFeatures.map((feature) => {
                const labelPoint = siteFeatureLabelPoint(feature, siteContext, layout);
                const color = SITE_FEATURE_COLORS[feature.type];
                const featureNumber = siteContext.features.findIndex((candidate) => candidate.id === feature.id) + 1;
                const isPerimeter = feature.type === "site_boundary";
                return (
                  <g key={feature.id}>
                    <polygon
                      points={siteFeaturePoints(feature, siteContext, layout)}
                      fill={color}
                      fillOpacity={isPerimeter ? "0.04" : "0.28"}
                      stroke={color}
                      strokeWidth={isPerimeter ? "8" : "3.5"}
                      strokeDasharray={isPerimeter ? "18 9" : undefined}
                    />
                    {!isPerimeter && (
                      <>
                        <circle cx={labelPoint.x} cy={labelPoint.y} r="14" fill={color} stroke="#f8fafc" strokeWidth="4" />
                        <text
                          x={labelPoint.x}
                          y={labelPoint.y + 5}
                          textAnchor="middle"
                          fontSize="14"
                          fontWeight="900"
                          fill="#f8fafc"
                          className="pointer-events-none"
                        >
                          {featureNumber}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
              {lineFeatures.map((feature) => {
                const labelPoint = siteFeatureLabelPoint(feature, siteContext, layout);
                const color = SITE_FEATURE_COLORS[feature.type];
                const featureNumber = siteContext.features.findIndex((candidate) => candidate.id === feature.id) + 1;
                return (
                  <g key={feature.id}>
                    <polyline
                      points={siteFeaturePoints(feature, siteContext, layout)}
                      fill="none"
                      stroke={feature.type === "road" ? "#111827" : "#f8fafc"}
                      strokeWidth={feature.type === "road" ? "14" : "9"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.68"
                    />
                    <polyline
                      points={siteFeaturePoints(feature, siteContext, layout)}
                      fill="none"
                      stroke={color}
                      strokeWidth={feature.type === "road" ? "7" : "5"}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={feature.type === "fence" ? "8 8" : undefined}
                    />
                    <circle cx={labelPoint.x} cy={labelPoint.y - 14} r="14" fill={color} stroke="#f8fafc" strokeWidth="4" />
                    <text
                      x={labelPoint.x}
                      y={labelPoint.y - 9}
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="900"
                      fill="#f8fafc"
                      className="pointer-events-none"
                    >
                      {featureNumber}
                    </text>
                  </g>
                );
              })}
              {pointFeatures.map((feature) => {
                const point = sitePointToPixel(feature.points[0], siteContext, layout);
                const color = SITE_FEATURE_COLORS[feature.type];
                const featureNumber = siteContext.features.findIndex((candidate) => candidate.id === feature.id) + 1;
                return (
                  <g key={feature.id}>
                    <circle cx={point.x} cy={point.y} r="20" fill={color} stroke="#f8fafc" strokeWidth="5" />
                    <circle cx={point.x} cy={point.y} r="31" fill="none" stroke={color} strokeWidth="5" opacity="0.42" />
                    <text
                      x={point.x}
                      y={point.y + 6}
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="900"
                      fill="#f8fafc"
                      className="pointer-events-none"
                    >
                      {featureNumber}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#aab7b2] bg-[#fbfcfc] px-3 py-2 text-xs text-[#4c5854]">
              <span>
                Centre {siteContext.center.lat.toFixed(6)}, {siteContext.center.lon.toFixed(6)} · zoom {siteContext.zoom}
              </span>
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="font-semibold text-[#216e60]">
                {siteContext.attribution}
              </a>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="font-semibold">Site review layer</h3>
          <p className="mt-1 text-sm text-[#4c5854]">
            {siteContext.features.length} draft features, {siteContext.features.filter((feature) => feature.needsReview).length} needing confirmation.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#4c5854]">
            {Object.entries(SITE_FEATURE_COLORS).map(([type, color]) => (
              <span key={type} className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                {formatSiteFeatureType(type as PathfinderSiteFeatureType)}
              </span>
            ))}
          </div>
          <div className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1 text-sm">
            {siteContext.features.map((feature) => (
              <div key={feature.id} className="rounded-md border border-[#c8d3cf] bg-[#fbfcfc] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 gap-2">
                    <span
                      className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black text-[#f8fafc]"
                      style={{ backgroundColor: SITE_FEATURE_COLORS[feature.type] }}
                    >
                      {siteContext.features.findIndex((candidate) => candidate.id === feature.id) + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{feature.label}</p>
                      <p className="text-xs uppercase tracking-[0.12em] text-[#5d6965]">{formatSiteFeatureType(feature.type)}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <span className="rounded-md bg-[#eef3f1] px-2 py-1 text-xs font-semibold text-[#216e60]">
                      {metricLabel(feature.confidence)}
                    </span>
                  </div>
                </div>
                {feature.notes && <p className="mt-2 text-xs text-[#4c5854]">{feature.notes}</p>}
              </div>
            ))}
          </div>
          <ul className="mt-3 space-y-2 text-sm text-[#4c5854]">
            {siteContext.warnings.map((warning) => (
              <li key={warning} className="border-l-4 border-[#be123c] pl-3">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function SetupWorkflowPanel({
  approvalState,
  correctionPrompt,
  data,
  operationalAssets,
  selectedRoom,
  onCorrectionPromptChange,
  onQueueCorrection,
  onApprove,
  onPublish,
}: {
  approvalState: SetupApprovalState;
  correctionPrompt: string;
  data: PathfinderExtractionResult;
  operationalAssets: PathfinderAssetDraft[];
  selectedRoom: PathfinderRoomDraft | null;
  onCorrectionPromptChange: (value: string) => void;
  onQueueCorrection: () => void;
  onApprove: () => void;
  onPublish: () => void;
}) {
  const currentStepIndex = Math.max(
    0,
    SETUP_WORKFLOW_STEPS.findIndex((step) => step.id === approvalState),
  );
  const reviewSpaces = data.rooms.filter((room) => room.needsReview).length;
  const mappedAssets = operationalAssets.filter((asset) => asset.status === "mapped").length;

  return (
    <section className="border-b border-[#c8d3cf] bg-[#eef3f1] px-5 py-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Plan-to-model setup</h2>
              <p className="mt-1 max-w-3xl text-sm text-[#4c5854]">
                The uploaded plan stays as a setup reference. Once rooms, corridors, doors, exits, and asset pins are approved,
                the Pathfinder model becomes the working map for QR scans, Estates assets, tickets, and navigation.
              </p>
            </div>
            <span className="rounded-md bg-[#fbfcfc] px-2 py-1 text-xs font-semibold text-[#216e60]">
              {reviewSpaces} spaces to review
            </span>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-4">
            {SETUP_WORKFLOW_STEPS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isDone = index < currentStepIndex;
              return (
                <div
                  key={step.id}
                  className={`rounded-md border px-3 py-3 ${
                    isActive
                      ? "border-[#2f7d6d] bg-[#fbfcfc]"
                      : isDone
                        ? "border-[#94c7b6] bg-[#e6f4ef]"
                        : "border-[#c8d3cf] bg-[#f7faf9]"
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#2f7d6d]">
                    {isDone ? "Done" : `Step ${index + 1}`}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-[#141414]">{step.label}</h3>
                  <p className="mt-1 text-xs text-[#5d6965]">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="min-w-0 rounded-md border border-[#b7c8c2] bg-[#fbfcfc] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">Correction notes</h3>
              <p className="text-xs text-[#66706c]">
                Selected room: {selectedRoom ? `${selectedRoom.roomCode || selectedRoom.id} - ${selectedRoom.label}` : "none"}
              </p>
            </div>
            <span className="rounded-md bg-[#e6f4ef] px-2 py-1 text-xs font-semibold text-[#216e60]">
              {mappedAssets}/{operationalAssets.length} assets mapped
            </span>
          </div>
          <textarea
            value={correctionPrompt}
            onChange={(event) => onCorrectionPromptChange(event.target.value)}
            rows={4}
            className="mt-3 w-full rounded-md border border-[#aab7b2] bg-[#fbfcfc] px-3 py-2 text-sm text-[#141414]"
            placeholder="Example: reception is the small office by the main entrance; split the corridor near rooms 12 and 13; add a fire exit on the east side."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onQueueCorrection}
              className="rounded-md bg-[#2f7d6d] px-3 py-2 text-xs font-semibold text-[#f8fafc]"
            >
              Queue AI fix note
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="rounded-md border border-[#2f7d6d] px-3 py-2 text-xs font-semibold text-[#216e60]"
            >
              Approve structure
            </button>
            <button
              type="button"
              onClick={onPublish}
              className="rounded-md border border-[#4f635f] px-3 py-2 text-xs font-semibold text-[#4c5854]"
            >
              Publish to Estates
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PathfinderScene({
  data,
  selectedRoomId,
  activeRoomIds,
  activeRoutePoints,
  activeDoorIds,
  visibleAssets,
  visibleTickets,
  selectedAssetId,
  selectedTicketId,
  onSelectRoom,
  onSelectAsset,
  onSelectTicket,
}: {
  data: PathfinderExtractionResult;
  selectedRoomId: string | null;
  activeRoomIds: Set<string>;
  activeRoutePoints: PathfinderPoint[];
  activeDoorIds: Set<string>;
  visibleAssets: PathfinderAssetDraft[];
  visibleTickets: PathfinderTicketDraft[];
  selectedAssetId: string | null;
  selectedTicketId: string | null;
  onSelectRoom: (roomId: string) => void;
  onSelectAsset: (asset: PathfinderAssetDraft) => void;
  onSelectTicket: (ticket: PathfinderTicketDraft) => void;
}) {
  return (
    <Canvas camera={{ position: [0, 42, 36], fov: 44 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
      <color attach="background" args={["#101312"]} />
      <ambientLight intensity={0.78} />
      <directionalLight position={[25, 35, 20]} intensity={1.05} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[82, 58]} />
                        <meshStandardMaterial color="#1e2221" roughness={0.9} />
      </mesh>
      <gridHelper args={[80, 32, "#4f635f", "#303a37"]} position={[0, -0.02, 0]} />
      {data.rooms.map((room) => (
        <RoomMesh
          key={room.id}
          room={room}
          image={data.image}
          selected={selectedRoomId === room.id}
          active={activeRoomIds.has(room.id)}
          onSelect={onSelectRoom}
        />
      ))}
      {activeRoutePoints.length > 1 && (
        <Line
          points={activeRoutePoints.map((point) => pointToScene(point, data.image))}
          color={NAVIGATION_FLOW_COLOR}
          lineWidth={3}
        />
      )}
      {visibleAssets.map((asset) => (
        <AssetMarker3D
          key={asset.id}
          asset={asset}
          image={data.image}
          active={activeDoorIds.has(asset.id) || asset.type !== "door"}
          selected={selectedAssetId === asset.id}
          onSelect={onSelectAsset}
        />
      ))}
      {visibleTickets.map((ticket) => (
        <TicketMarker3D
          key={ticket.id}
          ticket={ticket}
          image={data.image}
          selected={selectedTicketId === ticket.id}
          onSelect={onSelectTicket}
        />
      ))}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, 2]}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.15}
      />
    </Canvas>
  );
}

function metricLabel(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function roomOptionLabel(room: PathfinderRoomDraft): string {
  const type = room.type === "corridor" ? "corridor" : room.type;
  return `${room.roomCode || room.id} - ${room.label} (${type})`;
}

function distanceBetweenPoints(a: PathfinderPoint, b: PathfinderPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function routeDistance(route: PathfinderRouteDraft): number {
  return route.points.reduce((sum, point, index) => {
    if (index === 0) return 0;
    return sum + distanceBetweenPoints(route.points[index - 1], point);
  }, 0);
}

function isSamePoint(a: PathfinderPoint, b: PathfinderPoint): boolean {
  return Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2;
}

function orthogonalisePath(points: PathfinderPoint[]): PathfinderPoint[] {
  if (points.length < 2) return points;
  const output: PathfinderPoint[] = [points[0]];

  for (let index = 1; index < points.length; index += 1) {
    const previous = output[output.length - 1];
    const next = points[index];
    const dx = Math.abs(next.x - previous.x);
    const dy = Math.abs(next.y - previous.y);

    if (dx > 18 && dy > 18) {
      const elbow = { x: next.x, y: previous.y };
      if (!isSamePoint(previous, elbow)) output.push(elbow);
    }
    if (!isSamePoint(output[output.length - 1], next)) output.push(next);
  }

  return output;
}

function directionMarkers(points: PathfinderPoint[]): Array<PathfinderPoint & { angle: number }> {
  return points.flatMap((point, index) => {
    const next = points[index + 1];
    if (!next) return [];
    const distance = distanceBetweenPoints(point, next);
    if (distance < 42) return [];

    return [
      {
        x: Math.round(point.x + (next.x - point.x) * 0.58),
        y: Math.round(point.y + (next.y - point.y) * 0.58),
        angle: Math.atan2(next.y - point.y, next.x - point.x) * (180 / Math.PI),
      },
    ];
  });
}

function pickDestinationRoomId(data: PathfinderExtractionResult): string | null {
  return (
    data.rooms.find((room) => room.label.toLowerCase().includes("reception"))?.id ??
    data.rooms.find((room) => room.type === "entrance")?.id ??
    data.rooms[0]?.id ??
    null
  );
}

function pickStartRoomId(data: PathfinderExtractionResult): string | null {
  const qrAnchor =
    data.assets.find((asset) => asset.id === "qr-east-entrance" && asset.linkedRoomId) ??
    data.assets.find((asset) => asset.type === "qr_anchor" && asset.linkedRoomId);
  return qrAnchor?.linkedRoomId ?? data.rooms.find((room) => room.type === "corridor")?.id ?? data.rooms[0]?.id ?? null;
}

function pickNearestEmergencyExitRoomId(data: PathfinderExtractionResult, startRoomId: string | null): string | null {
  const startRoom = data.rooms.find((room) => room.id === startRoomId) ?? data.rooms[0];
  if (!startRoom) return null;
  const startPoint = getRoomPoint(startRoom);

  return data.assets
    .filter((asset) => asset.type === "emergency_exit" && asset.linkedRoomId)
    .map((asset) => ({
      roomId: asset.linkedRoomId ?? null,
      distance: distanceBetweenPoints(startPoint, { x: asset.x, y: asset.y }),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.roomId ?? null;
}

function getRoomPoint(room: PathfinderRoomDraft): PathfinderPoint {
  return {
    x: Math.round(room.bounds.x + room.bounds.width / 2),
    y: Math.round(room.bounds.y + room.bounds.height / 2),
  };
}

function findNearestRoomForPoint(rooms: PathfinderRoomDraft[], point: PathfinderPoint): PathfinderRoomDraft | null {
  return rooms
    .map((room) => ({
      room,
      distance: distanceBetweenPoints(point, getRoomPoint(room)),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.room ?? null;
}

function findPath(
  data: PathfinderExtractionResult,
  startRoomId: string | null,
  destinationRoomId: string | null,
  blockedRoomIds: Set<string>,
): { roomIds: string[]; segments: PathfinderRouteDraft[]; points: PathfinderPoint[]; distance: number } | null {
  if (!startRoomId || !destinationRoomId) return null;
  if (startRoomId === destinationRoomId) {
    const room = data.rooms.find((candidate) => candidate.id === startRoomId);
    const point = room
      ? { x: room.bounds.x + room.bounds.width / 2, y: room.bounds.y + room.bounds.height / 2 }
      : null;
    return point ? { roomIds: [startRoomId], segments: [], points: [point], distance: 0 } : null;
  }

  const adjacency = new Map<string, Array<{ to: string; route: PathfinderRouteDraft; weight: number }>>();
  for (const route of data.routes) {
    const weight = Math.max(routeDistance(route), 1) / Math.max(route.confidence, 0.2);
    adjacency.set(route.from, [...(adjacency.get(route.from) ?? []), { to: route.to, route, weight }]);
    adjacency.set(route.to, [...(adjacency.get(route.to) ?? []), { to: route.from, route, weight }]);
  }

  const distances = new Map<string, number>([[startRoomId, 0]]);
  const previous = new Map<string, { from: string; route: PathfinderRouteDraft }>();
  const queue = new Set<string>(data.rooms.map((room) => room.id));

  while (queue.size > 0) {
    const current = [...queue].sort((a, b) => (distances.get(a) ?? Infinity) - (distances.get(b) ?? Infinity))[0];
    if (!current || (distances.get(current) ?? Infinity) === Infinity) break;
    queue.delete(current);
    if (current === destinationRoomId) break;

    for (const edge of adjacency.get(current) ?? []) {
      if (!queue.has(edge.to)) continue;
      if (blockedRoomIds.has(edge.to) && edge.to !== destinationRoomId && edge.to !== startRoomId) continue;
      const nextDistance = (distances.get(current) ?? Infinity) + edge.weight;
      if (nextDistance < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, nextDistance);
        previous.set(edge.to, { from: current, route: edge.route });
      }
    }
  }

  if (!previous.has(destinationRoomId)) return null;

  const roomIds = [destinationRoomId];
  const segments: PathfinderRouteDraft[] = [];
  let current = destinationRoomId;
  while (current !== startRoomId) {
    const step = previous.get(current);
    if (!step) return null;
    roomIds.unshift(step.from);
    segments.unshift(step.route);
    current = step.from;
  }

  const points = segments.flatMap((segment, index) => {
    const from = roomIds[index];
    const segmentPoints = segment.from === from ? segment.points : [...segment.points].reverse();
    return index === 0 ? segmentPoints : segmentPoints.slice(1);
  });

  return {
    roomIds,
    segments,
    points,
    distance: segments.reduce((sum, segment) => sum + routeDistance(segment), 0),
  };
}

export default function PathfinderPrototype() {
  const [data, setData] = useState<PathfinderExtractionResult | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [visibleAssetTypes, setVisibleAssetTypes] = useState<Set<PathfinderAssetDraft["type"]>>(
    () => new Set(FILTERABLE_ASSET_TYPES),
  );
  const [includeClosedTickets, setIncludeClosedTickets] = useState(false);
  const [blockedRoomIds, setBlockedRoomIds] = useState<Set<string>>(() => new Set());
  const [showSupportNeeds, setShowSupportNeeds] = useState(false);
  const [showEvacuationPlan, setShowEvacuationPlan] = useState(false);
  const [fireRouteMode, setFireRouteMode] = useState(false);
  const [startRoomId, setStartRoomId] = useState<string | null>(null);
  const [destinationRoomId, setDestinationRoomId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(true);
  const [status, setStatus] = useState("Ready");
  const [isLoading, setIsLoading] = useState(false);
  const [approvalState, setApprovalState] = useState<SetupApprovalState>("school_review");
  const [correctionPrompt, setCorrectionPrompt] = useState("");
  const [activeControlDeck, setActiveControlDeck] = useState<ControlDeckTab>("tickets");

  const selectedRoom = useMemo(
    () => data?.rooms.find((room) => room.id === selectedRoomId) ?? null,
    [data?.rooms, selectedRoomId],
  );
  const selectedAsset = useMemo(
    () => data?.assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [data?.assets, selectedAssetId],
  );
  const selectedTicket = useMemo(
    () => data?.tickets.find((ticket) => ticket.id === selectedTicketId) ?? null,
    [data?.tickets, selectedTicketId],
  );
  const operationalAssets = useMemo(
    () => data?.assets.filter((asset) => asset.type !== "door" && asset.type !== "qr_anchor") ?? [],
    [data?.assets],
  );
  const visibleAssets = useMemo(
    () =>
      data?.assets.filter(
        (asset) =>
          asset.type === "door" ||
          asset.type === "qr_anchor" ||
          visibleAssetTypes.has(asset.type),
      ) ?? [],
    [data?.assets, visibleAssetTypes],
  );
  const visibleTickets = useMemo(
    () => data?.tickets.filter((ticket) => includeClosedTickets || ticket.status !== "resolved") ?? [],
    [data?.tickets, includeClosedTickets],
  );
  const roomTicketCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ticket of visibleTickets) {
      if (!ticket.linkedRoomId) continue;
      counts.set(ticket.linkedRoomId, (counts.get(ticket.linkedRoomId) ?? 0) + 1);
    }
    return counts;
  }, [visibleTickets]);
  const maxRoomTicketCount = useMemo(
    () => Math.max(0, ...Array.from(roomTicketCounts.values())),
    [roomTicketCounts],
  );
  const ticketTypeSummary = useMemo(() => {
    const counts = new Map<PathfinderTicketDraft["type"], number>();
    for (const ticket of visibleTickets) counts.set(ticket.type, (counts.get(ticket.type) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [visibleTickets]);
  const supportProfilesByRoom = useMemo(() => {
    const profiles = new Map<string, PathfinderSupportProfileDraft>();
    for (const profile of data?.supportProfiles ?? []) {
      if (profile.linkedRoomId) profiles.set(profile.linkedRoomId, profile);
    }
    return profiles;
  }, [data?.supportProfiles]);
  const supportTotals = useMemo(
    () =>
      (data?.supportProfiles ?? []).reduce(
        (totals, profile) => ({
          send: totals.send + profile.sendCount,
          vi: totals.vi + profile.viCount,
          peep: totals.peep + profile.peepCount,
          pip: totals.pip + profile.pipCount,
        }),
        { send: 0, vi: 0, peep: 0, pip: 0 },
      ),
    [data?.supportProfiles],
  );
  const activeRoute = useMemo(
    () => (data && isNavigating ? findPath(data, startRoomId, destinationRoomId, blockedRoomIds) : null),
    [blockedRoomIds, data, destinationRoomId, isNavigating, startRoomId],
  );
  const activeRouteIds = useMemo(
    () => new Set(activeRoute?.segments.map((route) => route.id) ?? []),
    [activeRoute?.segments],
  );
  const activeRoomIds = useMemo(
    () => new Set(activeRoute?.roomIds ?? []),
    [activeRoute?.roomIds],
  );
  const activeNavigationPoints = useMemo(
    () => orthogonalisePath(activeRoute?.points ?? []),
    [activeRoute?.points],
  );
  const activeDirectionMarkers = useMemo(
    () => directionMarkers(activeNavigationPoints),
    [activeNavigationPoints],
  );
  const activeStartPoint = activeNavigationPoints[0] ?? null;
  const activeDestinationPoint = activeNavigationPoints[activeNavigationPoints.length - 1] ?? null;
  const activeDoorIds = useMemo(() => {
    const routePoints = activeRoute?.segments.map((segment) => segment.points[1]).filter(Boolean) ?? [];
    return new Set(
      data?.assets
        .filter((asset) =>
          asset.type === "door" &&
          routePoints.some((point) => distanceBetweenPoints(point, { x: asset.x, y: asset.y }) < 4),
        )
        .map((asset) => asset.id) ?? [],
    );
  }, [activeRoute?.segments, data?.assets]);
  const startRoom = useMemo(
    () => data?.rooms.find((room) => room.id === startRoomId) ?? null,
    [data?.rooms, startRoomId],
  );
  const destinationRoom = useMemo(
    () => data?.rooms.find((room) => room.id === destinationRoomId) ?? null,
    [data?.rooms, destinationRoomId],
  );
  const selectedAssetRoom = useMemo(
    () => data?.rooms.find((room) => room.id === selectedAsset?.linkedRoomId) ?? null,
    [data?.rooms, selectedAsset?.linkedRoomId],
  );
  const selectedTicketRoom = useMemo(
    () => data?.rooms.find((room) => room.id === selectedTicket?.linkedRoomId) ?? null,
    [data?.rooms, selectedTicket?.linkedRoomId],
  );

  const toggleAssetType = useCallback((type: PathfinderAssetDraft["type"]) => {
    setVisibleAssetTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const toggleDiversion = useCallback(() => {
    if (!data) return;
    const targetRoom =
      data.rooms.find((room) => room.roomCode === "RS-49") ??
      data.rooms.find((room) => room.type === "corridor" && room.id !== startRoomId && room.id !== destinationRoomId);
    if (!targetRoom) return;

    setBlockedRoomIds((current) => {
      const next = new Set(current);
      if (next.has(targetRoom.id)) next.delete(targetRoom.id);
      else next.add(targetRoom.id);
      return next;
    });
    setIsNavigating(true);
    setStatus(`${targetRoom.roomCode || targetRoom.id} diversion ${blockedRoomIds.has(targetRoom.id) ? "removed" : "added"} for route planning.`);
  }, [blockedRoomIds, data, destinationRoomId, startRoomId]);

  const runExtraction = useCallback(async (mode: "local" | "raster" | "vision") => {
    setIsLoading(true);
    setStatus(
      mode === "vision"
        ? "Asking the vision extractor..."
        : mode === "raster"
          ? "Segmenting walls, corridors, and door links from the PNG..."
          : "Building local baseline...",
    );
    try {
      const response = await fetch("/api/pathfinder/prototype/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!response.ok) {
        throw new Error(`Extraction failed with HTTP ${response.status}`);
      }
      const result = (await response.json()) as PathfinderExtractionResult;
      const start = pickStartRoomId(result);
      const destination = pickDestinationRoomId(result);
      setData(result);
      setStartRoomId(start);
      setDestinationRoomId(destination);
      setIsNavigating(true);
      setSelectedRoomId(start ?? destination ?? result.rooms[0]?.id ?? null);
      setSelectedAssetId(result.assets.find((asset) => asset.type === "fire_extinguisher")?.id ?? null);
      setSelectedTicketId(result.tickets[0]?.id ?? null);
      setApprovalState("school_review");
      setCorrectionPrompt("");
      setStatus(
        `${result.source} returned ${result.metrics.roomCount} spaces, ${result.metrics.corridorCount} corridors, and ${result.metrics.doorCandidateCount} door candidates at ${metricLabel(
          result.metrics.averageConfidence,
        )} average confidence.`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Extraction failed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const simulateQrScan = useCallback(() => {
    if (!data) return;
    const qrStart = pickStartRoomId(data);
    setStartRoomId(qrStart);
    setSelectedRoomId(qrStart);
    setIsNavigating(true);
  }, [data]);

  const simulateAssetQrScan = useCallback(() => {
    if (!data) return;
    const asset = data.assets.find((candidate) => candidate.type === "fire_extinguisher") ?? operationalAssets[0] ?? null;
    if (!asset) return;
    setSelectedAssetId(asset.id);
    setSelectedTicketId(null);
    setSelectedRoomId(asset.linkedRoomId ?? findNearestRoomForPoint(data.rooms, { x: asset.x, y: asset.y })?.id ?? null);
    setStatus(`${asset.qrCode ?? asset.id} linked to ${asset.label}. Adjust the pin to the exact wall position before saving.`);
  }, [data, operationalAssets]);

  const showNearestFireExit = useCallback(() => {
    if (!data) return;
    const start = startRoomId ?? pickStartRoomId(data);
    const exitRoomId = pickNearestEmergencyExitRoomId(data, start);
    if (!exitRoomId) {
      setStatus("No mapped fire exit room is available yet.");
      return;
    }
    setStartRoomId(start);
    setDestinationRoomId(exitRoomId);
    setFireRouteMode(true);
    setShowEvacuationPlan(true);
    setIsNavigating(true);
    setStatus("Emergency route to nearest mapped fire exit is active.");
  }, [data, startRoomId]);

  const selectAsset = useCallback(
    (asset: PathfinderAssetDraft) => {
      setSelectedAssetId(asset.id);
      setSelectedTicketId(null);
      setSelectedRoomId(asset.linkedRoomId ?? selectedRoomId);
      setStatus(`${asset.label} selected. Hover or tap markers for details.`);
    },
    [selectedRoomId],
  );

  const selectTicket = useCallback(
    (ticket: PathfinderTicketDraft) => {
      setSelectedTicketId(ticket.id);
      setSelectedAssetId(ticket.linkedAssetId ?? null);
      setSelectedRoomId(ticket.linkedRoomId ?? selectedRoomId);
      setStatus(`${ticket.title} selected.`);
    },
    [selectedRoomId],
  );

  const moveSelectedAsset = useCallback(
    (dx: number, dy: number) => {
      if (!selectedAssetId) return;
      setData((current) => {
        if (!current) return current;
        return {
          ...current,
          assets: current.assets.map((asset) => {
            if (asset.id !== selectedAssetId) return asset;
            const point = {
              x: Math.round(clamp(asset.x + dx, 0, current.image.width)),
              y: Math.round(clamp(asset.y + dy, 0, current.image.height)),
            };
            const linkedRoom = findNearestRoomForPoint(current.rooms, point);
            return {
              ...asset,
              ...point,
              linkedRoomId: linkedRoom?.id ?? asset.linkedRoomId,
              status: "needs_position",
              confidence: Math.min(asset.confidence, 0.72),
            };
          }),
        };
      });
    },
    [selectedAssetId],
  );

  const queueCorrectionNote = useCallback(() => {
    const note = correctionPrompt.trim();
    if (!note) {
      setStatus("Add a correction note before queueing an AI fix.");
      return;
    }

    setApprovalState("ai_fix");
    setData((current) => {
      if (!current || !selectedRoomId) return current;
      return {
        ...current,
        rooms: current.rooms.map((room) =>
          room.id === selectedRoomId
            ? {
                ...room,
                confidence: Math.min(room.confidence, 0.7),
                needsReview: true,
                notes: `AI correction requested: ${note}`,
              }
            : room,
        ),
      };
    });
    setStatus(`Correction note queued: ${note}`);
  }, [correctionPrompt, selectedRoomId]);

  const approveOperationalModel = useCallback(() => {
    setApprovalState("approved");
    setData((current) => {
      if (!current) return current;
      return {
        ...current,
        rooms: current.rooms.map((room) => ({
          ...room,
          needsReview: false,
          notes: room.notes?.includes("AI correction requested")
            ? "Approved after plan overlay correction."
            : room.notes,
        })),
        warnings: current.warnings.filter((warning) => !warning.toLowerCase().includes("review")),
        metrics: {
          ...current.metrics,
          reviewCount: 0,
        },
      };
    });
    setStatus("Building structure approved. The clean Pathfinder model can now be used without showing the source plan.");
  }, []);

  const publishToEstates = useCallback(() => {
    setApprovalState("published");
    setStatus("Approved locations and QR asset pins are ready to publish into Estates assets, tickets, and navigation.");
  }, []);

  const updateRoomDetails = useCallback(
    (roomId: string, updates: Partial<Pick<PathfinderRoomDraft, "label" | "type" | "block">>) => {
      setData((current) => {
        if (!current) return current;
        return {
          ...current,
          rooms: current.rooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  ...updates,
                  confidence: Math.min(room.confidence, 0.82),
                  needsReview: true,
                  notes: "Room details edited in the Pathfinder prototype review layer.",
                }
              : room,
          ),
        };
      });
    },
    [],
  );

  const updateSelectedRoomBounds = useCallback(
    (mutate: (bounds: PathfinderRoomDraft["bounds"]) => PathfinderRoomDraft["bounds"]) => {
      if (!selectedRoomId) return;
      setData((current) => {
        if (!current) return current;
        return {
          ...current,
          rooms: current.rooms.map((room) => {
            if (room.id !== selectedRoomId) return room;
            const nextBounds = mutate(room.bounds);
            const clampedBounds = {
              x: Math.round(clamp(nextBounds.x, 0, current.image.width - 1)),
              y: Math.round(clamp(nextBounds.y, 0, current.image.height - 1)),
              width: Math.round(clamp(nextBounds.width, 10, current.image.width - nextBounds.x)),
              height: Math.round(clamp(nextBounds.height, 10, current.image.height - nextBounds.y)),
            };
            return {
              ...room,
              bounds: clampedBounds,
              polygon: polygonFromBounds(clampedBounds),
              confidence: Math.min(room.confidence, 0.65),
              needsReview: true,
              notes: "Boundary adjusted in the Pathfinder prototype review layer.",
            };
          }),
        };
      });
    },
    [selectedRoomId],
  );

  const addMissingRoom = useCallback(() => {
    setData((current) => {
      if (!current) return current;
      const base = selectedRoom ?? current.rooms[0];
      const baseBounds = base?.bounds ?? {
        x: Math.round(current.image.width * 0.4),
        y: Math.round(current.image.height * 0.4),
        width: 180,
        height: 140,
      };
      const roomNumber = current.rooms.filter((room) => room.id.startsWith("manual-")).length + 1;
      const bounds = {
        x: Math.round(clamp(baseBounds.x + 28, 0, current.image.width - 160)),
        y: Math.round(clamp(baseBounds.y + 28, 0, current.image.height - 120)),
        width: Math.round(Math.max(120, Math.min(baseBounds.width, 260))),
        height: Math.round(Math.max(90, Math.min(baseBounds.height, 220))),
      };
      const newRoom: PathfinderRoomDraft = {
        id: `manual-${String(roomNumber).padStart(2, "0")}`,
        label: `Missing room ${roomNumber}`,
        block: base?.block,
        type: "other",
        bounds,
        polygon: polygonFromBounds(bounds),
        confidence: 0.2,
        needsReview: true,
        notes: "Added manually in prototype review mode. Rename and adjust before saving.",
      };

      setSelectedRoomId(newRoom.id);
      return {
        ...current,
        rooms: [...current.rooms, newRoom],
        metrics: {
          ...current.metrics,
          roomCount: current.rooms.length + 1,
          reviewCount: current.metrics.reviewCount + 1,
        },
      };
    });
  }, [selectedRoom]);

  useEffect(() => {
    void runExtraction("raster");
  }, [runExtraction]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6f5] text-[#141414]">
      <div className="border-b border-[#c8d3cf] bg-[#fbfcfc] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f7d6d]">
              Pathfinder Prototype
            </p>
            <h1 className="text-2xl font-bold">Grove House floor-plan extraction</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runExtraction("raster")}
              disabled={isLoading}
              className="rounded-md bg-[#2f7d6d] px-3 py-2 text-sm font-semibold text-[#f8fafc] disabled:opacity-50"
            >
              Segment walls
            </button>
            <button
              type="button"
              onClick={() => runExtraction("local")}
              disabled={isLoading}
              className="rounded-md border border-[#1f8a9d] bg-[#fbfcfc] px-3 py-2 text-sm font-semibold text-[#146474] disabled:opacity-50"
            >
              Compare old baseline
            </button>
            <button
              type="button"
              onClick={() => runExtraction("vision")}
              disabled={isLoading}
              className="rounded-md border border-[#2f7d6d] bg-[#fbfcfc] px-3 py-2 text-sm font-semibold text-[#216e60] disabled:opacity-50"
            >
              Try vision extraction
            </button>
          </div>
        </div>
        <p className="mt-2 text-sm text-[#4c5854]">{status}</p>
      </div>

      {data && (
        <>
          <SetupWorkflowPanel
            approvalState={approvalState}
            correctionPrompt={correctionPrompt}
            data={data}
            operationalAssets={operationalAssets}
            selectedRoom={selectedRoom}
            onCorrectionPromptChange={setCorrectionPrompt}
            onQueueCorrection={queueCorrectionNote}
            onApprove={approveOperationalModel}
            onPublish={publishToEstates}
          />
          <div className="grid min-h-[calc(100vh-96px)] min-w-0 grid-cols-1 lg:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)]">
          <section className="order-2 min-h-[520px] min-w-0 border-b border-[#c8d3cf] bg-[#fbfcfc] lg:order-1 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-[#d9e1de] px-4 py-3">
              <div>
                <h2 className="font-semibold">PDF reference layer</h2>
                <p className="text-xs text-[#66706c]">
                  Source plan alignment for review; the model view is the operational map
                </p>
              </div>
              <span className="rounded-md bg-[#e6f4ef] px-2 py-1 text-xs font-semibold text-[#216e60]">
                {data.metrics.reviewCount} to review, {data.metrics.corridorCount} corridors
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-[#d9e1de] px-4 py-2 text-xs text-[#4c5854]">
              <span className="font-semibold text-[#141414]">Colour key</span>
              {ROOM_TYPE_OPTIONS.map((type) => (
                <span key={type} className="inline-flex items-center gap-1">
                  <span
                    className="h-3 w-3 rounded-sm border border-[#fbfcfc]"
                    style={{ backgroundColor: ROOM_COLORS[type] }}
                  />
                  {type}
                </span>
              ))}
              <span className="inline-flex items-center gap-1">
                <span className="h-[3px] w-5 rounded-full" style={{ backgroundColor: NAVIGATION_FLOW_COLOR }} />
                route
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: START_COLOR }} />
                you are here
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: DESTINATION_COLOR }} />
                destination
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: ASSET_COLORS.fire_extinguisher }} />
                mapped asset
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: TICKET_RISK_COLORS.high }} />
                ticket
              </span>
            </div>

            <div className="overflow-auto p-4">
              <div className="relative mx-auto w-full max-w-[1050px]">
                <Image
                  src={data.image.src}
                  alt={data.image.title}
                  width={data.image.width}
                  height={data.image.height}
                  className="block w-full border border-[#aab7b2] bg-[#fbfcfc]"
                  draggable={false}
                />
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox={`0 0 ${data.image.width} ${data.image.height}`}
                  role="img"
                  aria-label="Draft Pathfinder extraction overlay"
                >
                  {data.routes.filter((route) => !activeRouteIds.has(route.id)).map((route) => (
                    <polyline
                      key={route.id}
                      points={route.points.map((point) => `${point.x},${point.y}`).join(" ")}
                      fill="none"
                      stroke={INACTIVE_ROUTE_COLOR}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.08"
                    />
                  ))}
                  {showEvacuationPlan && data.evacuationZones.map((zone) => (
                    <g key={zone.id} className="pointer-events-none">
                      <polygon
                        points={zone.polygon.map((point) => `${point.x},${point.y}`).join(" ")}
                        fill={SUPPORT_COLORS.evacuation}
                        fillOpacity="0.1"
                        stroke={SUPPORT_COLORS.evacuation}
                        strokeWidth="8"
                        strokeDasharray="18 10"
                      />
                      <text
                        x={zone.polygon.reduce((sum, point) => sum + point.x / zone.polygon.length, 0)}
                        y={zone.polygon.reduce((sum, point) => sum + point.y / zone.polygon.length, 0)}
                        textAnchor="middle"
                        fontSize="28"
                        fontWeight="900"
                        fill="#111827"
                        paintOrder="stroke"
                        stroke="#f8fafc"
                        strokeWidth="7"
                      >
                        {zone.label}
                      </text>
                    </g>
                  ))}
                  {data.rooms.map((room) => {
                    const isSelected = selectedRoomId === room.id;
                    const isActive = activeRoomIds.has(room.id);
                    const isHub = isCriticalHub(room);
                    const isBlocked = blockedRoomIds.has(room.id);
                    const ticketCount = roomTicketCounts.get(room.id) ?? 0;
                    const supportProfile = supportProfilesByRoom.get(room.id);
                    const heatOpacity = maxRoomTicketCount > 0 ? Math.min(0.52, 0.14 + ticketCount / maxRoomTicketCount * 0.38) : 0;
                    return (
                      <g key={room.id}>
                        <polygon
                          points={polygonPoints(room)}
                          fill={isBlocked ? TICKET_RISK_COLORS.high : ROOM_COLORS[room.type]}
                          fillOpacity={isBlocked ? 0.34 : isSelected ? 0.28 : isActive ? 0.18 : room.type === "corridor" ? 0.12 : 0.07}
                          stroke={isBlocked ? TICKET_RISK_COLORS.high : isSelected ? SELECTED_STROKE_COLOR : isActive ? NAVIGATION_COLOR : ROOM_COLORS[room.type]}
                          strokeWidth={isBlocked ? 12 : isSelected ? 9 : room.type === "corridor" ? 4 : 3}
                          className="cursor-pointer"
                          onClick={() => setSelectedRoomId(room.id)}
                        />
                        {ticketCount > 0 && (
                          <polygon
                            points={polygonPoints(room)}
                            fill={TICKET_RISK_COLORS.high}
                            fillOpacity={heatOpacity}
                            stroke="none"
                            className="pointer-events-none"
                          />
                        )}
                        {showSupportNeeds && supportProfile && (
                          <polygon
                            points={polygonPoints(room)}
                            fill={supportProfile.peepCount > 0 ? SUPPORT_COLORS.peep : SUPPORT_COLORS.send}
                            fillOpacity="0.28"
                            stroke={supportProfile.peepCount > 0 ? SUPPORT_COLORS.peep : SUPPORT_COLORS.send}
                            strokeWidth="9"
                            strokeDasharray="10 8"
                            className="pointer-events-none"
                          />
                        )}
                        <text
                          x={room.bounds.x + room.bounds.width / 2}
                          y={room.bounds.y + room.bounds.height / 2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="24"
                          fontWeight="700"
                          fill="#111827"
                          paintOrder="stroke"
                          stroke="#f8fafc"
                          strokeWidth="5"
                          opacity={isSelected || isActive ? "0.95" : "0.46"}
                          className="pointer-events-none"
                        >
                          {room.roomCode || room.id}
                        </text>
                        {isHub && (isSelected || isActive) && (
                          <>
                            <rect
                              x={room.bounds.x + room.bounds.width / 2 - 112}
                              y={room.bounds.y + room.bounds.height / 2 + 36}
                              width="224"
                              height="42"
                              rx="8"
                              fill={ROOM_COLORS[room.type]}
                              stroke="#f8fafc"
                              strokeWidth="5"
                            />
                            <text
                              x={room.bounds.x + room.bounds.width / 2}
                              y={room.bounds.y + room.bounds.height / 2 + 64}
                              textAnchor="middle"
                              fontSize="23"
                              fontWeight="900"
                              fill="#f8fafc"
                              className="pointer-events-none"
                            >
                              {hubLabel(room)}
                            </text>
                          </>
                        )}
                        {(ticketCount > 0 || isBlocked) && (
                          <>
                            <circle
                              cx={room.bounds.x + room.bounds.width - 26}
                              cy={room.bounds.y + 26}
                              r="24"
                              fill={isBlocked ? TICKET_RISK_COLORS.high : "#111827"}
                              stroke="#f8fafc"
                              strokeWidth="5"
                            />
                            <text
                              x={room.bounds.x + room.bounds.width - 26}
                              y={room.bounds.y + 34}
                              textAnchor="middle"
                              fontSize="20"
                              fontWeight="900"
                              fill="#f8fafc"
                              className="pointer-events-none"
                            >
                              {isBlocked ? "X" : ticketCount}
                            </text>
                          </>
                        )}
                        {showSupportNeeds && supportProfile && (
                          <>
                            <rect
                              x={room.bounds.x + 8}
                              y={room.bounds.y + 8}
                              width="152"
                              height="42"
                              rx="8"
                              fill="#111827"
                              stroke={supportProfile.peepCount > 0 ? SUPPORT_COLORS.peep : SUPPORT_COLORS.send}
                              strokeWidth="5"
                            />
                            <text
                              x={room.bounds.x + 84}
                              y={room.bounds.y + 36}
                              textAnchor="middle"
                              fontSize="20"
                              fontWeight="900"
                              fill="#f8fafc"
                              className="pointer-events-none"
                            >
                              SUP {supportProfileTotal(supportProfile)} · PEEP {supportProfile.peepCount}
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                  {visibleAssets.map((asset) => (
                    <g
                      key={asset.id}
                      className="cursor-pointer"
                      onClick={() => selectAsset(asset)}
                    >
                      <circle
                        cx={asset.x}
                        cy={asset.y}
                        r={asset.type === "door" ? (activeDoorIds.has(asset.id) ? "18" : "8") : selectedAssetId === asset.id ? "34" : "28"}
                        fill={ASSET_COLORS[asset.type]}
                        stroke={selectedAssetId === asset.id ? "#111827" : "#f8fafc"}
                        strokeWidth={asset.type === "door" ? "3" : "6"}
                        opacity={asset.type === "door" ? (activeDoorIds.has(asset.id) ? "0.95" : "0.2") : "0.95"}
                      />
                      {asset.type !== "door" && asset.status === "needs_position" && (
                        <circle cx={asset.x} cy={asset.y} r="45" fill="none" stroke={ASSET_COLORS[asset.type]} strokeWidth="6" opacity="0.35" />
                      )}
                      <text
                        x={asset.x}
                        y={asset.y + 6}
                        textAnchor="middle"
                        fontSize={asset.type === "boiler" ? "14" : "18"}
                        fontWeight="800"
                        fill="#f8fafc"
                        className="pointer-events-none"
                      >
                        {assetIconLabel(asset.type)}
                      </text>
                    </g>
                  ))}
                  {visibleTickets.map((ticket) => (
                    <g
                      key={ticket.id}
                      className="cursor-pointer"
                      onClick={() => selectTicket(ticket)}
                    >
                      <path
                        d={`M ${ticket.x} ${ticket.y - 34} C ${ticket.x + 28} ${ticket.y - 34} ${ticket.x + 36} ${ticket.y - 2} ${ticket.x} ${ticket.y + 38} C ${ticket.x - 36} ${ticket.y - 2} ${ticket.x - 28} ${ticket.y - 34} ${ticket.x} ${ticket.y - 34} Z`}
                        fill={TICKET_RISK_COLORS[ticket.risk]}
                        stroke="#f8fafc"
                        strokeWidth={selectedTicketId === ticket.id ? "8" : "5"}
                        opacity="0.96"
                      />
                      <text
                        x={ticket.x}
                        y={ticket.y + 3}
                        textAnchor="middle"
                        fontSize="18"
                        fontWeight="900"
                        fill="#f8fafc"
                        className="pointer-events-none"
                      >
                        !
                      </text>
                    </g>
                  ))}
                  {showEvacuationPlan && data.musterPoints.map((muster) => (
                    <g key={muster.id} className="pointer-events-none">
                      <circle cx={muster.x} cy={muster.y} r="44" fill={SUPPORT_COLORS.evacuation} stroke="#111827" strokeWidth="8" />
                      <text
                        x={muster.x}
                        y={muster.y + 8}
                        textAnchor="middle"
                        fontSize="22"
                        fontWeight="900"
                        fill="#111827"
                      >
                        MP
                      </text>
                      <rect x={muster.x - 118} y={muster.y + 54} width="236" height="38" rx="8" fill="#111827" stroke="#f8fafc" strokeWidth="4" />
                      <text
                        x={muster.x}
                        y={muster.y + 79}
                        textAnchor="middle"
                        fontSize="18"
                        fontWeight="900"
                        fill="#f8fafc"
                      >
                        {muster.label}
                      </text>
                    </g>
                  ))}
                  {activeNavigationPoints.length > 1 && (
                    <>
                      <polyline
                        points={activeNavigationPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                        fill="none"
                        stroke="#111827"
                        strokeWidth="24"
                        strokeLinecap="round"
                        strokeLinejoin="miter"
                        opacity="0.42"
                        className="pointer-events-none"
                      />
                      <polyline
                        points={activeNavigationPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                        fill="none"
                        stroke="#f8fafc"
                        strokeWidth="17"
                        strokeLinecap="round"
                        strokeLinejoin="miter"
                        opacity="0.96"
                        className="pointer-events-none"
                      />
                      <polyline
                        points={activeNavigationPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                        fill="none"
                        stroke={NAVIGATION_FLOW_COLOR}
                        strokeWidth="11"
                        strokeLinecap="round"
                        strokeLinejoin="miter"
                        opacity="1"
                        className="pathfinder-flow"
                      />
                    </>
                  )}
                  {activeDirectionMarkers.map((marker, index) => (
                    <polygon
                      key={`${marker.x}-${marker.y}-${index}`}
                      points="0,-15 28,0 0,15"
                      fill={NAVIGATION_FLOW_COLOR}
                      stroke="#f8fafc"
                      strokeWidth="5"
                      transform={`translate(${marker.x} ${marker.y}) rotate(${marker.angle})`}
                      className="pointer-events-none"
                    />
                  ))}
                  {activeStartPoint && (
                    <g>
                      <circle
                        cx={activeStartPoint.x}
                        cy={activeStartPoint.y}
                        r="44"
                        fill={START_COLOR}
                        stroke="#f8fafc"
                        strokeWidth="9"
                        className="pathfinder-pulse"
                      />
                      <text
                        x={activeStartPoint.x}
                        y={activeStartPoint.y + 8}
                        textAnchor="middle"
                        fontSize="22"
                        fontWeight="900"
                        fill="#f8fafc"
                        className="pointer-events-none"
                      >
                        YOU
                      </text>
                      <rect
                        x={activeStartPoint.x - 72}
                        y={activeStartPoint.y + 52}
                        width="144"
                        height="36"
                        rx="8"
                        fill="#111827"
                        stroke="#f8fafc"
                        strokeWidth="4"
                      />
                      <text
                        x={activeStartPoint.x}
                        y={activeStartPoint.y + 76}
                        textAnchor="middle"
                        fontSize="18"
                        fontWeight="900"
                        fill="#f8fafc"
                        className="pointer-events-none"
                      >
                        YOU ARE HERE
                      </text>
                    </g>
                  )}
                  {activeDestinationPoint && (
                    <g>
                      <circle
                        cx={activeDestinationPoint.x}
                        cy={activeDestinationPoint.y}
                        r="42"
                        fill={DESTINATION_COLOR}
                        stroke="#f8fafc"
                        strokeWidth="9"
                      />
                      <text
                        x={activeDestinationPoint.x}
                        y={activeDestinationPoint.y + 8}
                        textAnchor="middle"
                        fontSize="20"
                        fontWeight="900"
                        fill="#f8fafc"
                        className="pointer-events-none"
                      >
                        GO
                      </text>
                      <rect
                        x={activeDestinationPoint.x - 78}
                        y={activeDestinationPoint.y - 88}
                        width="156"
                        height="36"
                        rx="8"
                        fill="#111827"
                        stroke="#f8fafc"
                        strokeWidth="4"
                      />
                      <text
                        x={activeDestinationPoint.x}
                        y={activeDestinationPoint.y - 64}
                        textAnchor="middle"
                        fontSize="18"
                        fontWeight="900"
                        fill="#f8fafc"
                        className="pointer-events-none"
                      >
                        DESTINATION
                      </text>
                    </g>
                  )}
                  <style>{`
                    .pathfinder-flow {
                      stroke-dasharray: 18 16;
                      animation: pathfinder-dash 0.85s linear infinite;
                      filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.9));
                    }
                    .pathfinder-pulse {
                      animation: pathfinder-pulse 1.4s ease-in-out infinite;
                      transform-box: fill-box;
                      transform-origin: center;
                    }
                    @keyframes pathfinder-dash {
                      to { stroke-dashoffset: -34; }
                    }
                    @keyframes pathfinder-pulse {
                      0%, 100% { transform: scale(1); opacity: 0.94; }
                      50% { transform: scale(1.12); opacity: 1; }
                    }
                  `}</style>
                </svg>
              </div>
            </div>
          </section>

          <section className="order-1 flex min-h-[620px] min-w-0 flex-col bg-[#171717] text-[#f8fafc] lg:order-2">
            <div className="flex items-center justify-between border-b border-[#3b4642] px-4 py-3">
              <div>
                <h2 className="font-semibold">Pathfinder model</h2>
                <p className="text-xs text-[#b8c4bf]">Tap or hover assets, tickets, rooms, doors, and fire exits for detail.</p>
              </div>
              {selectedRoom && (
                <span className="rounded-md bg-[#fbfcfc] px-2 py-1 text-xs font-semibold text-[#141414]">
                  {selectedRoom.roomCode || selectedRoom.id}
                </span>
              )}
            </div>
            <div className="min-h-[560px] flex-1">
              <PathfinderScene
                data={data}
                selectedRoomId={selectedRoomId}
                activeRoomIds={activeRoomIds}
                activeRoutePoints={activeNavigationPoints}
                activeDoorIds={activeDoorIds}
                visibleAssets={visibleAssets}
                visibleTickets={visibleTickets}
                selectedAssetId={selectedAssetId}
                selectedTicketId={selectedTicketId}
                onSelectRoom={setSelectedRoomId}
                onSelectAsset={selectAsset}
                onSelectTicket={selectTicket}
              />
            </div>
            <div className="border-t border-[#3b4642] bg-[#1f1f1f] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#aeb8b4]">Control deck</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { id: "tickets", label: `Tickets (${visibleTickets.length})` },
                    { id: "layers", label: "Layers" },
                    { id: "wayfinding", label: "Wayfinding" },
                    { id: "assets", label: `Assets (${operationalAssets.length})` },
                    { id: "edit", label: "Edit room" },
                  ] as Array<{ id: ControlDeckTab; label: string }>).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveControlDeck(tab.id)}
                      className={`rounded-md px-3 py-2 text-xs font-semibold ${
                        activeControlDeck === tab.id
                          ? "bg-[#f8fafc] text-[#141414]"
                          : "border border-[#4f635f] text-[#d8dfdc]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-md border border-[#3b4642] bg-[#171717] p-3 text-sm">
                {activeControlDeck === "tickets" && (
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">Pinned tickets</h3>
                        <p className="text-xs text-[#aeb8b4]">{visibleTickets.length} helpdesk issues visible on the site map.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIncludeClosedTickets((value) => !value)}
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          includeClosedTickets ? "bg-[#f59e0b] text-[#111827]" : "border border-[#4f635f] text-[#d8dfdc]"
                        }`}
                      >
                        {includeClosedTickets ? "Showing closed" : "Hide closed"}
                      </button>
                    </div>
                    <div className="mt-3 grid max-h-[180px] gap-2 overflow-auto pr-1 sm:grid-cols-2">
                      {visibleTickets.map((ticket) => (
                        <button
                          key={ticket.id}
                          type="button"
                          onClick={() => selectTicket(ticket)}
                          className={`block w-full rounded-md border px-3 py-2 text-left ${
                            selectedTicketId === ticket.id ? "border-[#f8fafc] bg-[#303a37]" : "border-[#3b4642] bg-[#141414]"
                          }`}
                        >
                          <span className="block text-xs font-semibold" style={{ color: TICKET_RISK_COLORS[ticket.risk] }}>
                            {ticket.risk.toUpperCase()} · {ticket.status.replace("_", " ")}
                          </span>
                          <span>{ticket.title}</span>
                        </button>
                      ))}
                    </div>
                    {selectedTicket && (
                      <p className="mt-3 text-xs text-[#d8dfdc]">
                        {selectedTicket.notes} {selectedTicketRoom ? `Location: ${selectedTicketRoom.roomCode || selectedTicketRoom.id} - ${selectedTicketRoom.label}.` : ""}
                      </p>
                    )}
                  </div>
                )}

                {activeControlDeck === "layers" && (
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">Map layers and diversions</h3>
                        <p className="text-xs text-[#aeb8b4]">
                          Toggle asset types, support data, fire planning, or a temporary route closure.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={toggleDiversion}
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${
                            blockedRoomIds.size > 0 ? "bg-[#dc2626] text-[#f8fafc]" : "border border-[#4f635f] text-[#d8dfdc]"
                          }`}
                        >
                          {blockedRoomIds.size > 0 ? "Remove closure" : "Close corridor"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSupportNeeds((value) => !value)}
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${
                            showSupportNeeds ? "bg-[#7c3aed] text-[#f8fafc]" : "border border-[#4f635f] text-[#d8dfdc]"
                          }`}
                        >
                          {showSupportNeeds ? "Hide SEND / PEEP" : "Show SEND / PEEP"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowEvacuationPlan((value) => !value)}
                          className={`rounded-md px-2 py-1 text-xs font-semibold ${
                            showEvacuationPlan ? "bg-[#f59e0b] text-[#111827]" : "border border-[#4f635f] text-[#d8dfdc]"
                          }`}
                        >
                          {showEvacuationPlan ? "Hide fire plan" : "Show fire plan"}
                        </button>
                        <button
                          type="button"
                          onClick={showNearestFireExit}
                          className="rounded-md bg-[#dc2626] px-2 py-1 text-xs font-semibold text-[#f8fafc]"
                        >
                          Nearest fire exit
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex max-h-[112px] flex-wrap gap-2 overflow-auto pr-1">
                      {FILTERABLE_ASSET_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleAssetType(type)}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                            visibleAssetTypes.has(type) ? "border-[#f8fafc] bg-[#303a37] text-[#f8fafc]" : "border-[#4f635f] text-[#aeb8b4]"
                          }`}
                        >
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ASSET_COLORS[type] }} />
                          {assetIconLabel(type)} {formatAssetType(type)}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-[#d8dfdc] md:grid-cols-2">
                      <p>Ticket heatmap: {visibleTickets.length} tickets across {roomTicketCounts.size} mapped spaces.</p>
                      <p>Ticket types: {ticketTypeSummary.length > 0 ? ticketTypeSummary.map(([type, count]) => `${type}: ${count}`).join(", ") : "none visible"}.</p>
                      <p>Support: SEND {supportTotals.send}, VI {supportTotals.vi}, PEEP {supportTotals.peep}, PIP {supportTotals.pip}.</p>
                      <p>Fire plan: {data.evacuationZones.length} zones, {data.musterPoints.length} muster points{fireRouteMode ? ", emergency route active" : ""}.</p>
                    </div>
                  </div>
                )}

                {activeControlDeck === "wayfinding" && (
                  <div>
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
                      <label className="text-xs font-semibold text-[#d8dfdc]">
                        QR scan location
                        <select
                          value={startRoomId ?? ""}
                          onChange={(event) => {
                            setStartRoomId(event.target.value);
                            setSelectedRoomId(event.target.value);
                            setIsNavigating(true);
                          }}
                          className="mt-1 w-full rounded-md border border-[#4f635f] bg-[#141414] px-2 py-2 text-sm text-[#f8fafc]"
                        >
                          {data.rooms.map((room) => (
                            <option key={room.id} value={room.id}>{roomOptionLabel(room)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-[#d8dfdc]">
                        Destination
                        <select
                          value={destinationRoomId ?? ""}
                          onChange={(event) => {
                            setDestinationRoomId(event.target.value);
                            setIsNavigating(true);
                          }}
                          className="mt-1 w-full rounded-md border border-[#4f635f] bg-[#141414] px-2 py-2 text-sm text-[#f8fafc]"
                        >
                          {data.rooms.map((room) => (
                            <option key={room.id} value={room.id}>{roomOptionLabel(room)}</option>
                          ))}
                        </select>
                      </label>
                      <button type="button" onClick={simulateQrScan} className="rounded-md bg-[#0f766e] px-3 py-2 text-sm font-semibold text-[#f8fafc]">
                        Simulate QR
                      </button>
                      <button type="button" onClick={() => setIsNavigating((value) => !value)} className="rounded-md border border-[#4f635f] px-3 py-2 text-sm font-semibold text-[#d8dfdc]">
                        {isNavigating ? "Hide route" : "Show route"}
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-[#cbd5d1]">
                      {activeRoute && startRoom && destinationRoom
                        ? `${roomOptionLabel(startRoom)} to ${roomOptionLabel(destinationRoom)} via ${activeRoute.segments.length} links.`
                        : "Choose a start and destination to calculate a path through the corridor graph."}
                    </p>
                    {activeRoute && activeRoute.roomIds.length > 1 && (
                      <ol className="mt-3 grid max-h-[150px] gap-2 overflow-auto pr-1 text-sm text-[#d8dfdc] sm:grid-cols-2">
                        {activeRoute.roomIds.map((roomId, index) => {
                          const room = data.rooms.find((candidate) => candidate.id === roomId);
                          if (!room) return null;
                          const prefix = index === 0 ? "Start" : index === activeRoute.roomIds.length - 1 ? "Arrive" : `Then ${index}`;
                          return (
                            <li key={`${roomId}-${index}`} className="rounded-md border border-[#3b4642] bg-[#141414] px-3 py-2">
                              <span className="block text-xs font-semibold text-[#f59e0b]">{prefix}</span>
                              <span>{room.roomCode || room.id} - {room.label}</span>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                )}

                {activeControlDeck === "assets" && (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">Asset QR capture</h3>
                        <p className="text-xs text-[#aeb8b4]">{operationalAssets.length} estates assets mapped to rooms and corridors.</p>
                      </div>
                      <button type="button" onClick={simulateAssetQrScan} className="rounded-md bg-[#2f7d6d] px-2 py-1 text-xs font-semibold text-[#f8fafc]">
                        Scan asset QR
                      </button>
                    </div>
                    <select
                      value={selectedAssetId ?? ""}
                      onChange={(event) => {
                        const asset = data.assets.find((candidate) => candidate.id === event.target.value) ?? null;
                        if (asset) selectAsset(asset);
                        else setSelectedAssetId(null);
                      }}
                      className="mt-3 w-full rounded-md border border-[#4f635f] bg-[#141414] px-2 py-2 text-[#f8fafc]"
                    >
                      <option value="">Choose an asset</option>
                      {operationalAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>{assetIconLabel(asset.type)} - {asset.label}</option>
                      ))}
                    </select>
                    {selectedAsset && (
                      <div className="mt-3 grid gap-2 text-xs text-[#d8dfdc] md:grid-cols-[1fr_auto]">
                        <div>
                          <p className="font-semibold text-[#f8fafc]">{selectedAsset.label}</p>
                          <p>QR: {selectedAsset.qrCode ?? "not assigned"} · wall: {selectedAsset.wallSide ?? "review"} · due: {selectedAsset.serviceDue ?? "not set"}</p>
                          <p>Location: {selectedAssetRoom ? `${selectedAssetRoom.roomCode || selectedAssetRoom.id} - ${selectedAssetRoom.label}` : "needs room link"}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-2 md:w-[260px]">
                          <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => moveSelectedAsset(0, -16)}>Up</button>
                          <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => moveSelectedAsset(0, 16)}>Down</button>
                          <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => moveSelectedAsset(-16, 0)}>Left</button>
                          <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => moveSelectedAsset(16, 0)}>Right</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeControlDeck === "edit" && selectedRoom && (
                  <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{selectedRoom.label}</h3>
                    <p className="text-xs text-[#aeb8b4]">
                      Edit the room register here. Labels update in the map, route dropdowns, and 3D view immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addMissingRoom}
                    className="rounded-md border border-[#4f635f] px-2 py-1 text-xs font-semibold text-[#d8dfdc]"
                  >
                    Add room
                  </button>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[#d8dfdc] sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="text-xs font-semibold text-[#aeb8b4]">Room name</span>
                    <input
                      value={selectedRoom.label}
                      onChange={(event) => updateRoomDetails(selectedRoom.id, { label: event.target.value })}
                      className="mt-1 w-full rounded-md border border-[#4f635f] bg-[#141414] px-2 py-2 text-[#f8fafc]"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-semibold text-[#aeb8b4]">Type</span>
                    <select
                      value={selectedRoom.type}
                      onChange={(event) =>
                        updateRoomDetails(selectedRoom.id, { type: event.target.value as PathfinderRoomType })
                      }
                      className="mt-1 w-full rounded-md border border-[#4f635f] bg-[#141414] px-2 py-2 text-[#f8fafc]"
                    >
                      {ROOM_TYPE_OPTIONS.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="text-xs font-semibold text-[#aeb8b4]">Block / zone</span>
                    <input
                      value={selectedRoom.block || ""}
                      onChange={(event) => updateRoomDetails(selectedRoom.id, { block: event.target.value })}
                      className="mt-1 w-full rounded-md border border-[#4f635f] bg-[#141414] px-2 py-2 text-[#f8fafc]"
                    />
                  </label>
                  <span>Confidence: {metricLabel(selectedRoom.confidence)}</span>
                  <span>Review: {selectedRoom.needsReview ? "Required" : "Not flagged"}</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                  <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => updateSelectedRoomBounds((b) => ({ ...b, y: b.y - 8 }))}>
                    Up
                  </button>
                  <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => updateSelectedRoomBounds((b) => ({ ...b, y: b.y + 8 }))}>
                    Down
                  </button>
                  <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => updateSelectedRoomBounds((b) => ({ ...b, x: b.x - 8 }))}>
                    Left
                  </button>
                  <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => updateSelectedRoomBounds((b) => ({ ...b, x: b.x + 8 }))}>
                    Right
                  </button>
                  <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => updateSelectedRoomBounds((b) => ({ ...b, width: b.width + 12 }))}>
                    Wider
                  </button>
                  <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => updateSelectedRoomBounds((b) => ({ ...b, width: b.width - 12 }))}>
                    Narrower
                  </button>
                  <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => updateSelectedRoomBounds((b) => ({ ...b, height: b.height + 12 }))}>
                    Taller
                  </button>
                  <button className="rounded-md bg-[#303a37] px-2 py-1" onClick={() => updateSelectedRoomBounds((b) => ({ ...b, height: b.height - 12 }))}>
                    Shorter
                  </button>
                </div>
                {selectedRoom.notes && <p className="mt-2 text-xs text-[#aeb8b4]">{selectedRoom.notes}</p>}
              </div>
                )}
                {activeControlDeck === "edit" && !selectedRoom && (
                  <p className="text-sm text-[#d8dfdc]">Select a room on the model to edit it.</p>
                )}
              </div>
            </div>
          </section>

          <SiteContextMap siteContext={data.siteContext} />

          <section className="order-4 min-w-0 border-t border-[#c8d3cf] bg-[#fbfcfc] p-4 lg:order-4 lg:col-span-2">
            <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_2fr]">
              <div className="min-w-0">
                <h2 className="font-semibold">Warnings</h2>
                <ul className="mt-2 space-y-2 text-sm text-[#4c5854]">
                  {data.warnings.map((warning) => (
                    <li key={warning} className="border-l-4 border-[#c11574] pl-3">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="min-w-0">
                <h2 className="font-semibold">Editable room register</h2>
                <div className="mt-2 max-h-[320px] max-w-full overflow-auto border border-[#d9e1de]">
                  <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                    <thead className="sticky top-0 bg-[#edf2f0]">
                      <tr>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Label</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Block</th>
                        <th className="px-3 py-2">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rooms.map((room) => (
                        <tr
                          key={room.id}
                          onClick={() => setSelectedRoomId(room.id)}
                          className={`cursor-pointer border-t border-[#d9e1de] ${
                          selectedRoomId === room.id ? "bg-[#e6f4ef]" : "hover:bg-[#f4f6f5]"
                          } ${activeRoomIds.has(room.id) ? "outline outline-2 outline-[#0284c7]" : ""}`}
                        >
                          <td className="px-3 py-2 font-mono text-xs">{room.roomCode || room.id}</td>
                          <td className="px-3 py-2">
                            <input
                              value={room.label}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateRoomDetails(room.id, { label: event.target.value })}
                              className="w-full min-w-[260px] rounded-md border border-[#c8d3cf] bg-[#fbfcfc] px-2 py-1"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={room.type}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateRoomDetails(room.id, { type: event.target.value as PathfinderRoomType })}
                              className="w-full rounded-md border border-[#c8d3cf] bg-[#fbfcfc] px-2 py-1"
                            >
                              {ROOM_TYPE_OPTIONS.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={room.block || ""}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) => updateRoomDetails(room.id, { block: event.target.value })}
                              className="w-full min-w-[150px] rounded-md border border-[#c8d3cf] bg-[#fbfcfc] px-2 py-1"
                            />
                          </td>
                          <td className="px-3 py-2">{metricLabel(room.confidence)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
          </div>
        </>
      )}
    </main>
  );
}
