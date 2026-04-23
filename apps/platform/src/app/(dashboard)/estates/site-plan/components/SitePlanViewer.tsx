"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { MapContainer, ImageOverlay, Polygon, Tooltip } from "react-leaflet";
import { CRS } from "leaflet";
import "leaflet/dist/leaflet.css";
import { SchoolRoom, LayerState } from "@/types/site-plan";
import RoomDetailPanel from "./RoomDetailPanel";
import LayerToggles from "./LayerToggles";

// Dynamic import to avoid SSR issues with Leaflet
const MapContainerDynamic = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const ImageOverlayDynamic = dynamic(
  () => import("react-leaflet").then((mod) => mod.ImageOverlay),
  { ssr: false }
);
const PolygonDynamic = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false }
);

// Grove House ground floor: 1787 x 1263 pixels
const IMAGE_WIDTH = 1787;
const IMAGE_HEIGHT = 1263;
const IMAGE_BOUNDS: [[number, number], [number, number]] = [
  [0, 0],
  [IMAGE_HEIGHT, IMAGE_WIDTH],
];

// Compliance status to colour
const STATUS_COLOURS: Record<string, string> = {
  compliant: "#22c55e",
  action_needed: "#f59e0b",
  overdue: "#ef4444",
  unknown: "#9ca3af",
};

// Block-level polygons (approximate - to be refined by examining actual floor plan)
// Based on the 1787x1263 image, these are rough block outlines
const BLOCK_POLYGONS: Record<string, number[][]> = {
  "Block 1": [[900, 400], [900, 900], [1300, 900], [1300, 400]], // Bottom-center main area
  "Block 2": [[900, 200], [900, 450], [1300, 450], [1300, 200]], // Above Block 1
  "Block 3": [[200, 700], [200, 1100], [600, 1100], [600, 700]], // Left-center
  "Block 4": [[200, 200], [200, 650], [550, 650], [550, 200]], // Top-left (2017 extension)
  "Block 5": [[1350, 200], [1350, 700], [1700, 700], [1700, 200]], // Right side
  "Block 6": [[400, 1100], [400, 1260], [700, 1260], [700, 1100]], // Bottom-right
};

interface SitePlanViewerProps {
  rooms: SchoolRoom[];
}

export default function SitePlanViewer({ rooms }: SitePlanViewerProps) {
  const [selectedRoom, setSelectedRoom] = useState<SchoolRoom | null>(null);
  const [activeLayers, setActiveLayers] = useState<LayerState>({
    rooms: true,
    fireEscape: false,
    fireEquipment: false,
    emergencyLighting: false,
    detectors: false,
  });

  // Merge room data with block polygons for demo
  const roomWithPolygons = useMemo(() => {
    return rooms.map((room) => ({
      ...room,
      polygon_coords: room.polygon_coords || BLOCK_POLYGONS[room.block || ""] || [],
    }));
  }, [rooms]);

  const handleLayerToggle = (layer: keyof LayerState) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  };

  return (
    <div className="relative h-full bg-gray-50">
      {/* Leaflet Map */}
      <MapContainerDynamic
        crs={CRS.Simple}
        bounds={IMAGE_BOUNDS}
        maxBounds={IMAGE_BOUNDS}
        style={{ height: "100%", width: "100%", background: "#f8f8f8" }}
        maxZoom={2}
        minZoom={-1}
        zoom={0}
        zoomControl={false}
        attributionControl={false}
      >
        <ImageOverlayDynamic
          url="/floor-plans/grove-house/ground-floor.png"
          bounds={IMAGE_BOUNDS}
          opacity={1}
        />

        {/* Room/Block polygons */}
        {activeLayers.rooms && roomWithPolygons.map((room) => {
          if (!room.polygon_coords || room.polygon_coords.length < 3) return null;
          const colour = STATUS_COLOURS[room.compliance_status] || STATUS_COLOURS.unknown;
          const isActive = selectedRoom?.id === room.id;

          return (
            <PolygonDynamic
              key={room.id}
              positions={room.polygon_coords as any}
              pathOptions={{
                color: isActive ? "#1f2937" : colour,
                fillColor: colour,
                fillOpacity: isActive ? 0.4 : 0.25,
                weight: isActive ? 3 : 2,
              }}
              eventHandlers={{
                click: () => setSelectedRoom(room),
              }}
            >
              <Tooltip sticky direction="top">
                <strong>{room.room_name}</strong>
                {room.block && <><br />Block: {room.block}</>}
                <br />{room.compliance_status.replace("_", " ")}
              </Tooltip>
            </PolygonDynamic>
          );
        })}

        {/* Fire Escape Route Layer */}
        {activeLayers.fireEscape && (
          <PolygonDynamic
            positions={[[600, 1100], [600, 400], [1300, 400], [1300, 1100], [600, 1100]] as any}
            pathOptions={{
              color: "#f97316",
              dashArray: "10, 10",
              weight: 3,
              fillOpacity: 0,
            }}
          />
        )}

        {/* Fire Equipment Markers */}
        {activeLayers.fireEquipment && (
          <>
            {/* Extinguisher at main entrance */}
            <circle
              center={[1120, 1260] as any}
              radius={15}
              pathOptions={{
                color: "#dc2626",
                fillColor: "#dc2626",
                fillOpacity: 0.8,
              }}
            />
            <Tooltip direction="top" permanent opacity={1}>
              <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                🔴 Extinguisher
              </div>
            </Tooltip>
          </>
        )}

        {/* Emergency Lighting */}
        {activeLayers.emergencyLighting && (
          <>
            <circle
              center={[500, 500] as any}
              radius={10}
              pathOptions={{
                color: "#eab308",
                fillColor: "#eab308",
                fillOpacity: 0.8,
              }}
            />
            <circle
              center={[1000, 500] as any}
              radius={10}
              pathOptions={{
                color: "#eab308",
                fillColor: "#eab308",
                fillOpacity: 0.8,
              }}
            />
          </>
        )}

        {/* Detectors */}
        {activeLayers.detectors && (
          <>
            <circle
              center={[400, 400] as any}
              radius={8}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.8,
              }}
            />
            <circle
              center={[1400, 400] as any}
              radius={8}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.8,
              }}
            />
          </>
        )}
      </MapContainerDynamic>

      {/* Layer Toggles */}
      <LayerToggles
        activeLayers={activeLayers}
        onToggle={handleLayerToggle}
      />

      {/* Room Detail Panel */}
      {selectedRoom && (
        <RoomDetailPanel
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
