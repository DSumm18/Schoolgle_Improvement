"use client";

import React, { useState, useRef } from "react";
import { ROOM_OUTLINES, type RoomOutline } from "./grove-house-3d-data";

// Coordinate mapping: world coords → pixel coords on the 3309×2339 PDF image
// pixel_x = ((world_x + 45) / 80) * imageWidth
// pixel_y = ((33.35 - world_z) / 56.7) * imageHeight
// We use percentages so the layout scales with container size.

function worldToPercent(x: number, z: number, w: number, d: number) {
  const left = ((x + 45) / 80) * 100;
  const top = ((33.35 - (z + d)) / 56.7) * 100; // z+d is the north edge (lower pixel y)
  const width = (w / 80) * 100;
  const height = (d / 56.7) * 100;
  return { left, top, width, height };
}

interface GroveHouse2DPlanProps {
  onRoomClick?: (roomId: string) => void;
  showLabels?: boolean;
  roomLabels?: Record<string, string>;
  selectedRoomId?: string | null;
}

export default function GroveHouse2DPlan({
  onRoomClick,
  showLabels = true,
  roomLabels,
  selectedRoomId,
}: GroveHouse2DPlanProps) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "auto",
        background: "#0a0f1a",
      }}
    >
      {/* PDF floor plan as background */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          aspectRatio: "3309 / 2339",
        }}
      >
        <img
          src="/site-plans/grove-house-ground-floor.png"
          alt="Grove House Primary Ground Floor Plan"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
          }}
          draggable={false}
        />

        {/* Room overlays */}
        {ROOM_OUTLINES.map((room) => {
          const pos = worldToPercent(room.x, room.z, room.w, room.d);
          const isHovered = hoveredRoom === room.systemId;
          const isSelected = selectedRoomId === room.systemId;
          const displayLabel =
            roomLabels?.[room.systemId] || room.schoolLabel || room.label;

          return (
            <div
              key={room.systemId}
              onClick={() => onRoomClick?.(room.systemId)}
              onMouseEnter={() => setHoveredRoom(room.systemId)}
              onMouseLeave={() => setHoveredRoom(null)}
              style={{
                position: "absolute",
                left: `${pos.left}%`,
                top: `${pos.top}%`,
                width: `${pos.width}%`,
                height: `${pos.height}%`,
                backgroundColor: isSelected
                  ? `${room.color}80`
                  : isHovered
                  ? `${room.color}60`
                  : `${room.color}30`,
                border: `2px solid ${
                  isSelected
                    ? room.color
                    : isHovered
                    ? `${room.color}cc`
                    : `${room.color}66`
                }`,
                borderRadius: 3,
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              {showLabels && (
                <span
                  style={{
                    color: "#fff",
                    fontSize: "clamp(6px, 0.8vw, 11px)",
                    fontWeight: 600,
                    fontFamily: "system-ui, sans-serif",
                    textAlign: "center",
                    textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                    lineHeight: 1.2,
                    padding: "1px 3px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {displayLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
