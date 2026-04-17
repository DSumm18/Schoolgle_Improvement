/**
 * Production Pathfinder extraction helpers.
 *
 * Unlike the prototype builder in `./prototype.ts`, these helpers do NOT
 * merge Grove House seed data (operational assets, support profiles, evacuation
 * zones, muster points, ticket seeds, site context). They produce a clean
 * extraction result whose structural rooms come from a real school's own plan.
 */

import {
  normaliseBounds,
  type PathfinderExtractionResult,
  type PathfinderPoint,
  type PathfinderRoomDraft,
  type PathfinderSiteContextDraft,
} from "@/lib/pathfinder/prototype";

export interface ProductionImageDescriptor {
  src: string;
  width: number;
  height: number;
  title: string;
}

export interface BuildProductionExtractionInput {
  image: ProductionImageDescriptor;
  source: PathfinderExtractionResult["source"];
  model?: string;
  rooms: PathfinderRoomDraft[];
  warnings?: string[];
}

const EMPTY_SITE_CONTEXT: PathfinderSiteContextDraft = {
  center: { lat: 0, lon: 0 },
  zoom: 18,
  provider: "openstreetmap",
  tileTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "© OpenStreetMap contributors",
  sourceUrl: "https://www.openstreetmap.org/",
  features: [],
  warnings: [],
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function boundsToPolygon(bounds: PathfinderRoomDraft["bounds"]): PathfinderPoint[] {
  return [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ];
}

export function buildProductionExtractionResult(
  input: BuildProductionExtractionInput,
): PathfinderExtractionResult {
  const rooms = input.rooms.map((room) => {
    const bounds = normaliseBounds(room.bounds);
    return {
      ...room,
      bounds,
      polygon: room.polygon.length > 0 ? room.polygon : boundsToPolygon(bounds),
      confidence: clamp(room.confidence, 0, 1),
    };
  });

  const reviewCount = rooms.filter((room) => room.needsReview || room.confidence < 0.8).length;
  const averageConfidence =
    rooms.length === 0
      ? 0
      : rooms.reduce((sum, room) => sum + room.confidence, 0) / rooms.length;

  return {
    source: input.source,
    model: input.model,
    generatedAt: new Date().toISOString(),
    image: input.image,
    rooms,
    assets: [],
    routes: [],
    tickets: [],
    supportProfiles: [],
    evacuationZones: [],
    musterPoints: [],
    siteContext: EMPTY_SITE_CONTEXT,
    warnings: input.warnings ?? [],
    metrics: {
      roomCount: rooms.length,
      corridorCount: rooms.filter((room) => room.type === "corridor").length,
      reviewCount,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      assetCount: 0,
      doorCandidateCount: 0,
    },
  };
}
