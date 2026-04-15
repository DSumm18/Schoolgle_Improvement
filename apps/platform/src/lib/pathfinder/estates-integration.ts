import type { Asset, AssetType } from "@/types/estates-compliance";
import type {
  PathfinderAssetDraft,
  PathfinderExtractionResult,
  PathfinderPoint,
  PathfinderRoomDraft,
  PathfinderRoomType,
  PathfinderSiteFeatureDraft,
} from "@/lib/pathfinder/prototype";
import { getRoomCentre } from "@/lib/pathfinder/prototype";

export type PathfinderModelStatus = "draft" | "school_review" | "approved" | "published";

export interface PathfinderModelRow {
  id: string;
  organization_id: string;
  name: string;
  status: PathfinderModelStatus;
  source_document_url?: string | null;
  source_document_name?: string | null;
  extraction_result: PathfinderExtractionResult;
  metrics?: Record<string, unknown> | null;
  approved_at?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PathfinderAssetPin {
  modelId?: string;
  roomId?: string;
  siteFeatureId?: string;
  x?: number;
  y?: number;
  sceneX?: number;
  sceneZ?: number;
  wallSide?: PathfinderAssetDraft["wallSide"];
  locationScope?: PathfinderAssetDraft["locationScope"];
  confidence?: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface PathfinderLocationDetails {
  pathfinder?: PathfinderAssetPin;
  [key: string]: unknown;
}

export interface PathfinderLocationPayload {
  pathfinderId: string;
  name: string;
  locationType: "site" | "building" | "floor" | "room" | "outdoor_area" | "corridor" | "plant_room" | "storage";
  roomCode?: string | null;
  areaSqm?: number | null;
  currentUse?: string | null;
  source: "room" | "site_feature";
}

const ASSET_TYPE_TO_PATHFINDER: Partial<Record<AssetType, PathfinderAssetDraft["type"]>> = {
  fire_extinguisher: "fire_extinguisher",
  emergency_light: "emergency_exit",
  lift: "other",
  playground_equipment: "other",
  security_equipment: "access_control",
  kitchen_equipment: "other",
  av_equipment: "other",
  it_equipment: "other",
  grounds_equipment: "other",
  furniture: "other",
  equipment: "other",
  signage: "other",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function numberFrom(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function getPathfinderPin(locationDetails: Asset["location_details"]): PathfinderAssetPin | null {
  if (!isRecord(locationDetails)) return null;
  const pin = locationDetails.pathfinder;
  if (!isRecord(pin)) return null;

  return {
    modelId: stringFrom(pin.modelId),
    roomId: stringFrom(pin.roomId),
    siteFeatureId: stringFrom(pin.siteFeatureId),
    x: numberFrom(pin.x),
    y: numberFrom(pin.y),
    sceneX: numberFrom(pin.sceneX),
    sceneZ: numberFrom(pin.sceneZ),
    wallSide: stringFrom(pin.wallSide) as PathfinderAssetPin["wallSide"],
    locationScope: stringFrom(pin.locationScope) as PathfinderAssetPin["locationScope"],
    confidence: numberFrom(pin.confidence),
    updatedAt: stringFrom(pin.updatedAt),
    updatedBy: stringFrom(pin.updatedBy),
  };
}

export function mergePathfinderPin(
  locationDetails: Asset["location_details"],
  pin: PathfinderAssetPin,
): PathfinderLocationDetails {
  const existing = isRecord(locationDetails) ? locationDetails : {};
  return {
    ...existing,
    pathfinder: {
      ...(isRecord(existing.pathfinder) ? existing.pathfinder : {}),
      ...pin,
    },
  };
}

function inferPathfinderAssetType(asset: Asset): PathfinderAssetDraft["type"] {
  const haystack = `${asset.asset_type} ${asset.category ?? ""} ${asset.subcategory ?? ""} ${asset.name}`.toLowerCase();
  if (haystack.includes("extinguisher")) return "fire_extinguisher";
  if (haystack.includes("fire blanket")) return "fire_blanket";
  if (haystack.includes("call point") || haystack.includes("break glass")) return "call_point";
  if (haystack.includes("smoke")) return "smoke_detector";
  if (haystack.includes("heat detector")) return "heat_detector";
  if (haystack.includes("sounder") || haystack.includes("alarm")) return "sounder";
  if (haystack.includes("defib")) return "defibrillator";
  if (haystack.includes("exit")) return "emergency_exit";
  if (haystack.includes("paxton") || haystack.includes("gate") || haystack.includes("access control")) return "access_control";
  if (haystack.includes("boiler")) return "boiler";
  return ASSET_TYPE_TO_PATHFINDER[asset.asset_type] ?? "other";
}

function findRoomForAsset(asset: Asset, rooms: PathfinderRoomDraft[]): PathfinderRoomDraft | null {
  const pin = getPathfinderPin(asset.location_details);
  if (pin?.roomId) {
    const byId = rooms.find((room) => room.id === pin.roomId);
    if (byId) return byId;
  }

  const roomText = asset.room?.toLowerCase().trim();
  if (!roomText) return null;
  return (
    rooms.find((room) => room.roomCode?.toLowerCase() === roomText) ??
    rooms.find((room) => room.label.toLowerCase() === roomText) ??
    rooms.find((room) => `${room.roomCode ?? ""} ${room.label}`.toLowerCase().includes(roomText)) ??
    null
  );
}

function assetPoint(asset: Asset, room: PathfinderRoomDraft | null): PathfinderPoint {
  const pin = getPathfinderPin(asset.location_details);
  if (pin?.x != null && pin.y != null) return { x: pin.x, y: pin.y };
  if (room) return getRoomCentre(room);
  return { x: 120, y: 120 };
}

export function estateAssetToPathfinderAsset(asset: Asset, model?: PathfinderExtractionResult): PathfinderAssetDraft {
  const room = model ? findRoomForAsset(asset, model.rooms) : null;
  const pin = getPathfinderPin(asset.location_details);
  const point = assetPoint(asset, room);
  const locationScope = pin?.locationScope ?? (pin?.siteFeatureId ? "site" : "building");

  return {
    id: `estates-asset-${asset.id}`,
    label: asset.name,
    type: inferPathfinderAssetType(asset),
    x: point.x,
    y: point.y,
    linkedRoomId: locationScope === "site" ? undefined : pin?.roomId ?? room?.id,
    linkedSiteFeatureId: pin?.siteFeatureId,
    locationScope,
    qrCode: asset.qr_code ?? asset.code ?? undefined,
    wallSide: pin?.wallSide,
    status: pin ? "mapped" : "needs_position",
    sourceTable: "estates_assets",
    sourceId: asset.id,
    serviceDue: asset.next_inspection_due ?? undefined,
    confidence: pin?.confidence ?? (room ? 0.68 : 0.24),
  };
}

function roomLocationType(type: PathfinderRoomType): PathfinderLocationPayload["locationType"] {
  if (type === "corridor") return "corridor";
  if (type === "plant") return "plant_room";
  if (type === "storage") return "storage";
  return "room";
}

function siteFeatureLocationType(feature: PathfinderSiteFeatureDraft): PathfinderLocationPayload["locationType"] {
  if (feature.type === "building") return "building";
  if (feature.type === "site_boundary") return "site";
  return "outdoor_area";
}

export function buildLocationPayloads(model: PathfinderExtractionResult): PathfinderLocationPayload[] {
  const rooms = model.rooms
    .filter((room) => !room.needsReview)
    .map((room): PathfinderLocationPayload => ({
      pathfinderId: room.id,
      name: room.label,
      roomCode: room.roomCode ?? null,
      locationType: roomLocationType(room.type),
      currentUse: room.type,
      source: "room",
    }));

  const siteFeatures = model.siteContext.features
    .filter((feature) => !feature.needsReview)
    .filter((feature) => feature.type !== "road" && feature.type !== "fence")
    .map((feature): PathfinderLocationPayload => ({
      pathfinderId: feature.id,
      name: feature.label,
      locationType: siteFeatureLocationType(feature),
      currentUse: feature.type,
      source: "site_feature",
    }));

  return [...siteFeatures, ...rooms];
}

