"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ROOM_OUTLINES,
  type RoomOutline,
} from "@/components/show-me-site/grove-house-3d-data";
import { calculateRoute, type Route } from "@/components/show-me-site/route-calculator";

// ─── Coordinate mapping (world → SVG viewbox) ──────────────
// PDF: 3309×2339 px. Ground plane at [-5, -0.05, 5], size 80×56.7
// We use a normalised SVG viewBox matching pixel space.
const PDF_W = 3309;
const PDF_H = 2339;

function toPixelX(worldX: number): number {
  return ((worldX + 45) / 80) * PDF_W;
}
function toPixelZ(worldZ: number): number {
  return ((33.35 - worldZ) / 56.7) * PDF_H;
}

function roomRect(room: RoomOutline) {
  const px = toPixelX(room.x);
  const pz = toPixelZ(room.z + room.d); // top-left in SVG (z inverted)
  const pw = (room.w / 80) * PDF_W;
  const ph = (room.d / 56.7) * PDF_H;
  return { x: px, y: pz, w: pw, h: ph };
}

function roomCentrePixel(room: RoomOutline) {
  const r = roomRect(room);
  return { cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
}

// ─── Pulsing dot component ─────────────────────────────────
function PulsingDot({
  cx,
  cy,
  color,
  label,
}: {
  cx: number;
  cy: number;
  color: string;
  label?: string;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={28} fill={color} opacity={0.2}>
        <animate
          attributeName="r"
          values="28;45;28"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.3;0.05;0.3"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={cx} cy={cy} r={14} fill={color} />
      {label && (
        <text
          x={cx}
          y={cy - 24}
          textAnchor="middle"
          fill="white"
          fontSize="28"
          fontWeight="700"
          fontFamily="Poppins, sans-serif"
        >
          {label}
        </text>
      )}
    </g>
  );
}

// ─── Animated route line ────────────────────────────────────
function AnimatedRouteLine({ route }: { route: Route }) {
  const pixelPoints = route.points.map((p) => ({
    x: toPixelX(p.x),
    y: toPixelZ(p.z),
  }));

  const pathD = pixelPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Calculate total SVG path length for dash animation
  let totalLen = 0;
  for (let i = 1; i < pixelPoints.length; i++) {
    totalLen += Math.hypot(
      pixelPoints[i].x - pixelPoints[i - 1].x,
      pixelPoints[i].y - pixelPoints[i - 1].y
    );
  }

  return (
    <g>
      {/* Glow behind */}
      <path
        d={pathD}
        fill="none"
        stroke="#F59E0B"
        strokeWidth={8}
        opacity={0.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Animated flowing dots */}
      <path
        d={pathD}
        fill="none"
        stroke="#F59E0B"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="12 18"
        strokeDashoffset={totalLen}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={totalLen}
          to={0}
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
    </g>
  );
}

// ─── Distance badge ─────────────────────────────────────────
function DistanceBadge({ route }: { route: Route }) {
  const midIdx = Math.floor(route.points.length / 2);
  const midPoint = route.points[midIdx];
  const mx = toPixelX(midPoint.x);
  const my = toPixelZ(midPoint.z);
  const mins = Math.max(1, Math.ceil(route.estimatedWalkTime / 60));
  const text = `${Math.round(route.distance)}m \u00B7 ~${mins} min walk`;

  return (
    <g>
      <rect
        x={mx - 130}
        y={my - 50}
        width={260}
        height={40}
        rx={20}
        fill="#1e293b"
        stroke="#F59E0B"
        strokeWidth={2}
        opacity={0.95}
      />
      <text
        x={mx}
        y={my - 24}
        textAnchor="middle"
        fill="#F59E0B"
        fontSize="22"
        fontWeight="600"
        fontFamily="Poppins, sans-serif"
      >
        {text}
      </text>
    </g>
  );
}

// ─── Main Wayfinding Page ───────────────────────────────────
export default function WayfindingPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [destinationId, setDestinationId] = useState<string | null>(null);

  const currentRoom = useMemo(
    () => ROOM_OUTLINES.find((r) => r.systemId === roomId),
    [roomId]
  );

  const route = useMemo(() => {
    if (!destinationId || destinationId === roomId) return null;
    return calculateRoute(roomId, destinationId);
  }, [roomId, destinationId]);

  const destinationRoom = useMemo(
    () => (destinationId ? ROOM_OUTLINES.find((r) => r.systemId === destinationId) : null),
    [destinationId]
  );

  const handleRoomClick = useCallback(
    (sysId: string) => {
      if (sysId === roomId) {
        setDestinationId(null);
      } else {
        setDestinationId(sysId);
      }
    },
    [roomId]
  );

  if (!currentRoom) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-[Poppins]">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Room not found</h1>
          <p className="text-slate-400">No room with ID &quot;{roomId}&quot; exists in this building.</p>
        </div>
      </div>
    );
  }

  const heroPx = roomCentrePixel(currentRoom);
  const destPx = destinationRoom ? roomCentrePixel(destinationRoom) : null;

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col font-[Poppins]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 shrink-0">
        <div>
          <h1 className="text-white text-sm font-semibold">
            You are here:{" "}
            <span className="text-emerald-400">
              {currentRoom.schoolLabel || currentRoom.label}
            </span>
          </h1>
          <p className="text-slate-500 text-xs">{currentRoom.block}</p>
        </div>
        {destinationId && (
          <button
            onClick={() => setDestinationId(null)}
            className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
          >
            Clear route
          </button>
        )}
      </header>

      {/* Instruction */}
      {!destinationId && (
        <div className="text-center py-2 bg-amber-500/10 text-amber-400 text-xs shrink-0">
          Tap any room to get directions
        </div>
      )}

      {/* Map */}
      <div className="flex-1 overflow-auto relative">
        <svg
          viewBox={`0 0 ${PDF_W} ${PDF_H}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* PDF floor plan background */}
          <image
            href="/site-plans/grove-house-ground-floor.png"
            x={0}
            y={0}
            width={PDF_W}
            height={PDF_H}
            opacity={0.5}
          />

          {/* Room outlines */}
          {ROOM_OUTLINES.map((room) => {
            const r = roomRect(room);
            const isHere = room.systemId === roomId;
            const isDest = room.systemId === destinationId;
            return (
              <g
                key={room.systemId}
                onClick={() => handleRoomClick(room.systemId)}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`Navigate to ${room.label}`}
              >
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.h}
                  fill={
                    isHere
                      ? "#22c55e"
                      : isDest
                        ? "#F59E0B"
                        : room.color
                  }
                  opacity={isHere ? 0.4 : isDest ? 0.4 : 0.2}
                  stroke={
                    isHere
                      ? "#22c55e"
                      : isDest
                        ? "#F59E0B"
                        : room.color
                  }
                  strokeWidth={isHere || isDest ? 3 : 1.5}
                  rx={4}
                />
                <text
                  x={r.x + r.w / 2}
                  y={r.y + r.h / 2 + 6}
                  textAnchor="middle"
                  fill="white"
                  fontSize="18"
                  fontWeight="500"
                  fontFamily="Poppins, sans-serif"
                  pointerEvents="none"
                >
                  {room.systemId}
                </text>
              </g>
            );
          })}

          {/* Animated route */}
          {route && <AnimatedRouteLine route={route} />}

          {/* Distance badge */}
          {route && route.distance > 0 && <DistanceBadge route={route} />}

          {/* You are here dot */}
          <PulsingDot
            cx={heroPx.cx}
            cy={heroPx.cy}
            color="#22c55e"
            label="You are here"
          />

          {/* Destination dot */}
          {destPx && destinationRoom && (
            <PulsingDot
              cx={destPx.cx}
              cy={destPx.cy}
              color="#F59E0B"
              label={destinationRoom.schoolLabel || destinationRoom.label}
            />
          )}
        </svg>
      </div>

      {/* Footer */}
      <footer className="text-center py-2 bg-slate-900/80 border-t border-slate-800 shrink-0">
        <span className="text-slate-600 text-[10px]">
          Powered by{" "}
          <span className="text-amber-500 font-semibold">Schoolgle</span>
        </span>
      </footer>
    </div>
  );
}
