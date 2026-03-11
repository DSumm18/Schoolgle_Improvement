"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Map,
  Layers,
  X,
  Package,
  AlertTriangle,
  Flame,
  Accessibility,
  Zap,
  UserPlus,
  HardHat,
  CalendarDays,
  ClipboardCheck,
  ZoomIn,
  ZoomOut,
  Maximize,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface FloorPlanRoom {
  id: string;
  name: string;
  type: string;
  polygon_points: string; // SVG polygon points string e.g. "0,0 100,0 100,80 0,80"
  fill_color: string;
  area_sqm?: number;
  assets_count?: number;
  issues_count?: number;
  fire_exit?: boolean;
  fire_route?: boolean;
  accessible?: boolean;
  temperature?: number;
  booking_status?: "available" | "booked" | "partial";
  daily_check_order?: number;
  daily_check_done?: boolean;
}

export interface FloorPlanData {
  id: string;
  title: string;
  width: number;
  height: number;
  rooms: FloorPlanRoom[];
}

type OverlayId =
  | "assets"
  | "issues"
  | "fire"
  | "accessibility"
  | "energy"
  | "new-starter"
  | "contractor"
  | "booking"
  | "daily-checks";

interface Overlay {
  id: OverlayId;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
}

const OVERLAYS: Overlay[] = [
  {
    id: "assets",
    label: "Assets & Compliance",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    icon: <Package className="w-3.5 h-3.5" />,
    description: "Asset locations, service status, compliance certificates",
  },
  {
    id: "issues",
    label: "Issues & Tasks",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    description: "Open helpdesk tickets, maintenance tasks, urgency levels",
  },
  {
    id: "fire",
    label: "Fire Safety",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    icon: <Flame className="w-3.5 h-3.5" />,
    description: "Exits, routes, extinguishers, alarm points, assembly areas",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    icon: <Accessibility className="w-3.5 h-3.5" />,
    description: "Accessible routes, ramps, lifts, hearing loops, SEND rooms",
  },
  {
    id: "energy",
    label: "Energy",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-300",
    icon: <Zap className="w-3.5 h-3.5" />,
    description: "Temperature zones, heating schedules, energy consumption",
  },
  {
    id: "new-starter",
    label: "New Starter",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    icon: <UserPlus className="w-3.5 h-3.5" />,
    description: "Induction tour route, key locations, emergency info",
  },
  {
    id: "contractor",
    label: "Contractor",
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
    icon: <HardHat className="w-3.5 h-3.5" />,
    description: "Service route, hazard alerts, assets to inspect",
  },
  {
    id: "booking",
    label: "Room Booking",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-300",
    icon: <CalendarDays className="w-3.5 h-3.5" />,
    description: "Availability, current bookings, utilisation heatmap",
  },
  {
    id: "daily-checks",
    label: "Daily Checks",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-300",
    icon: <ClipboardCheck className="w-3.5 h-3.5" />,
    description: "Caretaker route, check order, tap-to-complete status",
  },
];

// ─── Overlay colour logic ──────────────────────────────────────────────────

function getRoomOverlayFill(
  room: FloorPlanRoom,
  overlay: OverlayId | null,
): string {
  if (!overlay) return room.fill_color;

  switch (overlay) {
    case "assets":
      if ((room.assets_count ?? 0) > 3) return "#bbf7d0"; // green-200
      if ((room.assets_count ?? 0) > 0) return "#dcfce7"; // green-100
      return "#f0fdf4"; // green-50
    case "issues":
      if ((room.issues_count ?? 0) > 2) return "#fed7aa"; // orange-200
      if ((room.issues_count ?? 0) > 0) return "#ffedd5"; // orange-100
      return "#fff7ed"; // orange-50
    case "fire":
      if (room.fire_exit) return "#fecaca"; // red-200
      if (room.fire_route) return "#fed7aa"; // orange-200
      return "#fef2f2"; // red-50
    case "accessibility":
      if (room.accessible) return "#bfdbfe"; // blue-200
      return "#eff6ff"; // blue-50
    case "energy":
      if ((room.temperature ?? 20) > 23) return "#fecaca"; // too hot
      if ((room.temperature ?? 20) < 17) return "#bfdbfe"; // too cold
      return "#fef9c3"; // yellow-100
    case "new-starter":
      if (
        ["office", "reception", "hall", "kitchen"].includes(
          room.type.toLowerCase(),
        )
      )
        return "#e9d5ff"; // purple-200
      return "#faf5ff"; // purple-50
    case "contractor":
      if ((room.assets_count ?? 0) > 2) return "#d1d5db"; // gray-300
      return "#f9fafb"; // gray-50
    case "booking":
      if (room.booking_status === "booked") return "#a5f3fc"; // cyan-200
      if (room.booking_status === "partial") return "#cffafe"; // cyan-100
      return "#ecfeff"; // cyan-50
    case "daily-checks":
      if (room.daily_check_done) return "#99f6e4"; // teal-200
      if (room.daily_check_order) return "#ccfbf1"; // teal-100
      return "#f0fdfa"; // teal-50
    default:
      return room.fill_color;
  }
}

function getRoomOverlayStroke(
  room: FloorPlanRoom,
  overlay: OverlayId | null,
): string {
  if (!overlay) return "#64748b";
  switch (overlay) {
    case "fire":
      if (room.fire_exit) return "#dc2626";
      if (room.fire_route) return "#ea580c";
      return "#94a3b8";
    case "issues":
      if ((room.issues_count ?? 0) > 2) return "#ea580c";
      if ((room.issues_count ?? 0) > 0) return "#f97316";
      return "#94a3b8";
    case "daily-checks":
      if (room.daily_check_done) return "#0d9488";
      if (room.daily_check_order) return "#14b8a6";
      return "#94a3b8";
    default:
      return "#64748b";
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

interface FloorPlanViewerProps {
  data: FloorPlanData;
  className?: string;
}

export default function FloorPlanViewer({
  data,
  className = "",
}: FloorPlanViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Transform state
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [translateStart, setTranslateStart] = useState({ x: 0, y: 0 });

  // Pinch zoom state
  const [pinchDistance, setPinchDistance] = useState<number | null>(null);
  const [pinchScale, setPinchScale] = useState(1);

  // UI state
  const [activeOverlay, setActiveOverlay] = useState<OverlayId | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<FloorPlanRoom | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);

  // Fit the plan to container on mount
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = (rect.width - 40) / data.width;
      const scaleY = (rect.height - 40) / data.height;
      const fitScale = Math.min(scaleX, scaleY, 1.5);
      setScale(fitScale);
      setTranslate({
        x: (rect.width - data.width * fitScale) / 2,
        y: (rect.height - data.height * fitScale) / 2,
      });
    }
  }, [data.width, data.height]);

  // ─── Pan handlers ──────────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return; // handled by touch events
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setTranslateStart(translate);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [translate],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setTranslate({
        x: translateStart.x + (e.clientX - dragStart.x),
        y: translateStart.y + (e.clientY - dragStart.y),
      });
    },
    [isDragging, dragStart, translateStart],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ─── Zoom (scroll) ────────────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale * delta, 0.2), 5);

      // Zoom toward mouse position
      setTranslate({
        x: mouseX - ((mouseX - translate.x) / scale) * newScale,
        y: mouseY - ((mouseY - translate.y) / scale) * newScale,
      });
      setScale(newScale);
    },
    [scale, translate],
  );

  // ─── Touch (pinch zoom) ───────────────────────────────────────────────

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        setPinchDistance(getTouchDistance(e.touches));
        setPinchScale(scale);
      } else if (e.touches.length === 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        });
        setTranslateStart(translate);
      }
    },
    [scale, translate],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && pinchDistance !== null) {
        e.preventDefault();
        const newDist = getTouchDistance(e.touches);
        const newScale = Math.min(
          Math.max(pinchScale * (newDist / pinchDistance), 0.2),
          5,
        );
        setScale(newScale);
      } else if (e.touches.length === 1 && isDragging) {
        setTranslate({
          x: translateStart.x + (e.touches[0].clientX - dragStart.x),
          y: translateStart.y + (e.touches[0].clientY - dragStart.y),
        });
      }
    },
    [isDragging, dragStart, translateStart, pinchDistance, pinchScale],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setPinchDistance(null);
  }, []);

  // ─── Zoom controls ────────────────────────────────────────────────────

  const zoomIn = () => setScale((s) => Math.min(s * 1.25, 5));
  const zoomOut = () => setScale((s) => Math.max(s * 0.8, 0.2));
  const fitToView = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = (rect.width - 40) / data.width;
      const scaleY = (rect.height - 40) / data.height;
      const fitScale = Math.min(scaleX, scaleY, 1.5);
      setScale(fitScale);
      setTranslate({
        x: (rect.width - data.width * fitScale) / 2,
        y: (rect.height - data.height * fitScale) / 2,
      });
    }
  };

  // ─── Room label positioning ────────────────────────────────────────────

  const getRoomCenter = (points: string) => {
    const coords = points
      .trim()
      .split(/\s+/)
      .map((p) => {
        const [x, y] = p.split(",").map(Number);
        return { x, y };
      });
    const cx = coords.reduce((s, c) => s + c.x, 0) / coords.length;
    const cy = coords.reduce((s, c) => s + c.y, 0) / coords.length;
    return { cx, cy };
  };

  // ─── Active overlay info ───────────────────────────────────────────────

  const activeOverlayInfo = OVERLAYS.find((o) => o.id === activeOverlay);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Overlay toggle bar */}
      <div className="flex flex-wrap gap-1.5 p-3 bg-white border-b border-slate-200 overflow-x-auto">
        {OVERLAYS.map((overlay) => {
          const isActive = activeOverlay === overlay.id;
          return (
            <button
              key={overlay.id}
              onClick={() => setActiveOverlay(isActive ? null : overlay.id)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                border transition-all duration-150
                ${
                  isActive
                    ? `${overlay.bgColor} ${overlay.color} ${overlay.borderColor} ring-2 ring-offset-1 ring-current/20`
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }
              `}
              title={overlay.description}
            >
              {overlay.icon}
              {overlay.label}
            </button>
          );
        })}
      </div>

      {/* Active overlay description */}
      {activeOverlayInfo && (
        <div
          className={`px-4 py-2 text-xs ${activeOverlayInfo.bgColor} ${activeOverlayInfo.color} border-b ${activeOverlayInfo.borderColor} flex items-center gap-2`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="font-medium">{activeOverlayInfo.label}:</span>
          <span className="opacity-80">{activeOverlayInfo.description}</span>
        </div>
      )}

      {/* SVG viewport */}
      <div className="relative flex-1 overflow-hidden bg-slate-100">
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "none" }}
        >
          <svg ref={svgRef} width="100%" height="100%" className="select-none">
            {/* Grid pattern */}
            <defs>
              <pattern
                id="grid"
                width={20 * scale}
                height={20 * scale}
                patternUnits="userSpaceOnUse"
                x={translate.x % (20 * scale)}
                y={translate.y % (20 * scale)}
              >
                <path
                  d={`M ${20 * scale} 0 L 0 0 0 ${20 * scale}`}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* Transformed group */}
            <g
              transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}
            >
              {/* Building outline */}
              <rect
                x={-4}
                y={-4}
                width={data.width + 8}
                height={data.height + 8}
                fill="none"
                stroke="#94a3b8"
                strokeWidth={2 / scale}
                strokeDasharray={`${6 / scale} ${4 / scale}`}
                rx={4 / scale}
              />

              {/* Room polygons */}
              {data.rooms.map((room) => {
                const fill = getRoomOverlayFill(room, activeOverlay);
                const stroke = getRoomOverlayStroke(room, activeOverlay);
                const isSelected = selectedRoom?.id === room.id;
                const isHovered = hoveredRoom === room.id;
                const center = getRoomCenter(room.polygon_points);

                return (
                  <g key={room.id}>
                    <polygon
                      points={room.polygon_points}
                      fill={fill}
                      stroke={isSelected ? "#2563eb" : stroke}
                      strokeWidth={
                        (isSelected ? 3 : isHovered ? 2 : 1.2) / scale
                      }
                      className="transition-colors duration-150"
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRoom(
                          selectedRoom?.id === room.id ? null : room,
                        );
                      }}
                      onMouseEnter={() => setHoveredRoom(room.id)}
                      onMouseLeave={() => setHoveredRoom(null)}
                    />
                    {/* Room label */}
                    <text
                      x={center.cx}
                      y={center.cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={11 / scale}
                      fontWeight={500}
                      fill="#334155"
                      className="pointer-events-none select-none"
                    >
                      {room.name}
                    </text>
                    {/* Room type subtitle */}
                    <text
                      x={center.cx}
                      y={center.cy + 14 / scale}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={8 / scale}
                      fill="#94a3b8"
                      className="pointer-events-none select-none"
                    >
                      {room.type}
                    </text>

                    {/* Overlay badges */}
                    {activeOverlay === "fire" && room.fire_exit && (
                      <text
                        x={center.cx}
                        y={center.cy - 16 / scale}
                        textAnchor="middle"
                        fontSize={10 / scale}
                        className="pointer-events-none"
                      >
                        FIRE EXIT
                      </text>
                    )}
                    {activeOverlay === "daily-checks" &&
                      room.daily_check_order && (
                        <circle
                          cx={center.cx + 28 / scale}
                          cy={center.cy - 16 / scale}
                          r={10 / scale}
                          fill={room.daily_check_done ? "#0d9488" : "#f59e0b"}
                          stroke="white"
                          strokeWidth={1.5 / scale}
                        />
                      )}
                    {activeOverlay === "daily-checks" &&
                      room.daily_check_order && (
                        <text
                          x={center.cx + 28 / scale}
                          y={center.cy - 16 / scale}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={8 / scale}
                          fill="white"
                          fontWeight={700}
                          className="pointer-events-none"
                        >
                          {room.daily_check_order}
                        </text>
                      )}
                    {activeOverlay === "issues" &&
                      (room.issues_count ?? 0) > 0 && (
                        <>
                          <circle
                            cx={center.cx + 30 / scale}
                            cy={center.cy - 14 / scale}
                            r={9 / scale}
                            fill="#f97316"
                            stroke="white"
                            strokeWidth={1.5 / scale}
                          />
                          <text
                            x={center.cx + 30 / scale}
                            y={center.cy - 14 / scale}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={8 / scale}
                            fill="white"
                            fontWeight={700}
                            className="pointer-events-none"
                          >
                            {room.issues_count}
                          </text>
                        </>
                      )}
                    {activeOverlay === "energy" &&
                      room.temperature !== undefined && (
                        <text
                          x={center.cx}
                          y={center.cy - 16 / scale}
                          textAnchor="middle"
                          fontSize={9 / scale}
                          fontWeight={600}
                          fill={
                            room.temperature > 23
                              ? "#dc2626"
                              : room.temperature < 17
                                ? "#2563eb"
                                : "#65a30d"
                          }
                          className="pointer-events-none"
                        >
                          {room.temperature}&deg;C
                        </text>
                      )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1 bg-white rounded-lg shadow-md border border-slate-200">
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-slate-50 rounded-t-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-slate-600" />
          </button>
          <div className="text-center text-[10px] text-slate-500 py-0.5 border-y border-slate-100">
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-slate-50 transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={fitToView}
            className="p-2 hover:bg-slate-50 rounded-b-lg transition-colors border-t border-slate-100"
            title="Fit to view"
          >
            <Maximize className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Scale indicator */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded px-2 py-1 text-[10px] text-slate-500">
          <Map className="w-3 h-3" />
          <span>Scroll to zoom, drag to pan</span>
        </div>
      </div>

      {/* Room detail panel */}
      {selectedRoom && (
        <div className="border-t border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {selectedRoom.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">
                {selectedRoom.type}
              </p>
            </div>
            <button
              onClick={() => setSelectedRoom(null)}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {selectedRoom.area_sqm !== undefined && (
              <div className="bg-slate-50 rounded-lg p-2.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Area
                </p>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  {selectedRoom.area_sqm} m&sup2;
                </p>
              </div>
            )}
            <div className="bg-green-50 rounded-lg p-2.5">
              <p className="text-[10px] text-green-600 uppercase tracking-wider">
                Assets
              </p>
              <p className="text-sm font-semibold text-green-700 mt-0.5">
                {selectedRoom.assets_count ?? 0}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2.5">
              <p className="text-[10px] text-orange-600 uppercase tracking-wider">
                Issues
              </p>
              <p className="text-sm font-semibold text-orange-700 mt-0.5">
                {selectedRoom.issues_count ?? 0}
              </p>
            </div>
            {selectedRoom.temperature !== undefined && (
              <div className="bg-yellow-50 rounded-lg p-2.5">
                <p className="text-[10px] text-yellow-600 uppercase tracking-wider">
                  Temperature
                </p>
                <p className="text-sm font-semibold text-yellow-700 mt-0.5">
                  {selectedRoom.temperature}&deg;C
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {selectedRoom.fire_exit && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-medium rounded-full border border-red-200">
                <Flame className="w-3 h-3" /> Fire Exit
              </span>
            )}
            {selectedRoom.accessible && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full border border-blue-200">
                <Accessibility className="w-3 h-3" /> Accessible
              </span>
            )}
            {selectedRoom.daily_check_order && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-medium rounded-full border border-teal-200">
                <ClipboardCheck className="w-3 h-3" /> Check #
                {selectedRoom.daily_check_order}
                {selectedRoom.daily_check_done ? " (Done)" : ""}
              </span>
            )}
            {selectedRoom.booking_status && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[10px] font-medium rounded-full border border-cyan-200">
                <CalendarDays className="w-3 h-3" />{" "}
                {selectedRoom.booking_status === "booked"
                  ? "Booked"
                  : selectedRoom.booking_status === "partial"
                    ? "Partially Booked"
                    : "Available"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
