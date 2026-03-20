"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { useEdChatbot } from "@/components/EdChatbotProvider";
import {
  X,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Navigation,
  MessageCircle,
  Ticket,
  Building2,
  MapPin,
  DoorOpen,
  Layers,
  UserPlus,
  Flame,
  Droplets,
  Zap,
  Wind,
  ShieldAlert,
  Utensils,
  Users,
  BookOpen,
  Package,
  FileText,
  Clock,
} from "lucide-react";
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

// ─── Types ──────────────────────────────────────────────

type OverlayMode =
  | "normal"
  | "tickets"
  | "compliance"
  | "evacuation"
  | "induction"
  | "coshh";

// ─── Room-to-Compliance Domain Mapping ──────────────────

interface ComplianceDomain {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const COMPLIANCE_DOMAINS: Record<string, ComplianceDomain> = {
  fire: {
    id: "fire",
    label: "Fire Safety",
    icon: Flame,
    color: "text-red-500",
  },
  water: {
    id: "water",
    label: "Water / Legionella",
    icon: Droplets,
    color: "text-blue-500",
  },
  gas: { id: "gas", label: "Gas Safety", icon: Wind, color: "text-amber-500" },
  electrical: {
    id: "electrical",
    label: "Electrical",
    icon: Zap,
    color: "text-yellow-600",
  },
  asbestos: {
    id: "asbestos",
    label: "Asbestos",
    icon: ShieldAlert,
    color: "text-orange-500",
  },
  catering: {
    id: "catering",
    label: "Food Hygiene",
    icon: Utensils,
    color: "text-pink-500",
  },
};

function getComplianceDomainsForRoom(room: Room): ComplianceDomain[] {
  const domains: ComplianceDomain[] = [COMPLIANCE_DOMAINS.fire]; // fire applies everywhere

  switch (room.type) {
    case "boiler":
      domains.push(
        COMPLIANCE_DOMAINS.gas,
        COMPLIANCE_DOMAINS.water,
        COMPLIANCE_DOMAINS.asbestos,
      );
      break;
    case "kitchen":
      domains.push(
        COMPLIANCE_DOMAINS.gas,
        COMPLIANCE_DOMAINS.catering,
        COMPLIANCE_DOMAINS.water,
      );
      break;
    case "toilet":
      domains.push(COMPLIANCE_DOMAINS.water);
      break;
    case "hall":
    case "ict_suite":
      domains.push(COMPLIANCE_DOMAINS.electrical);
      break;
    case "storage":
      if (room.name.toLowerCase().includes("caretaker")) {
        domains.push(COMPLIANCE_DOMAINS.asbestos);
      }
      break;
    default:
      domains.push(COMPLIANCE_DOMAINS.electrical);
  }

  return domains;
}

// ─── Constants ──────────────────────────────────────────

const FLOOR_OPTIONS = AURORA_SITE.buildings[0].floors.map((f) => ({
  id: f.id,
  label: f.label,
  level: f.level,
}));

const OVERLAY_MODES: {
  id: OverlayMode;
  label: string;
  icon: React.ElementType;
}[] = [
  { id: "normal", label: "Normal", icon: Layers },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "evacuation", label: "Evacuation", icon: Navigation },
  { id: "induction", label: "Induction", icon: UserPlus },
  { id: "coshh", label: "COSHH", icon: AlertTriangle },
];

const ROOM_TYPE_LABELS: Record<string, string> = {
  classroom: "Classroom",
  hall: "Hall",
  office: "Office",
  staffroom: "Staff Room",
  library: "Library",
  send_room: "Intervention Room",
  kitchen: "Kitchen",
  dining: "Dining Area",
  toilet: "Toilets",
  storage: "Storage",
  boiler: "Boiler Room",
  medical: "Medical Room",
  reception: "Reception",
  head_office: "Head's Office",
  meeting: "Meeting Room",
  ict_suite: "ICT Suite",
  cloakroom: "Cloakroom",
};

const ROOM_COLORS: Record<string, string> = {
  classroom: "#E8F5E9",
  hall: "#FFF3E0",
  office: "#E3F2FD",
  staffroom: "#F3E5F5",
  library: "#E0F7FA",
  send_room: "#FFF9C4",
  kitchen: "#FFEBEE",
  dining: "#FFF3E0",
  toilet: "#ECEFF1",
  storage: "#F5F5F5",
  boiler: "#FFCDD2",
  medical: "#FCE4EC",
  reception: "#E8EAF6",
  head_office: "#E8EAF6",
  meeting: "#E8EAF6",
  ict_suite: "#E0F7FA",
  cloakroom: "#ECEFF1",
};

const ROOM_STROKES: Record<string, string> = {
  classroom: "#4CAF50",
  hall: "#FF9800",
  office: "#2196F3",
  staffroom: "#9C27B0",
  library: "#00BCD4",
  send_room: "#FBC02D",
  kitchen: "#F44336",
  dining: "#FF9800",
  toilet: "#607D8B",
  storage: "#9E9E9E",
  boiler: "#D32F2F",
  medical: "#E91E63",
  reception: "#3F51B5",
  head_office: "#3F51B5",
  meeting: "#3F51B5",
  ict_suite: "#00BCD4",
  cloakroom: "#607D8B",
};

const CELL = 50;
const PAD = 20;

// ─── Drawer Section Component ───────────────────────────

function DrawerSection({
  title,
  icon: Icon,
  iconColor,
  children,
  empty,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  children: React.ReactNode;
  empty?: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {title}
        </h3>
      </div>
      {empty ? <p className="text-xs text-zinc-400">{empty}</p> : children}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export default function ShowMeSitePage() {
  const { organizationId } = useAuth();
  const { openChatWith } = useEdChatbot();
  const [selectedFloor, setSelectedFloor] = useState("ground");
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("normal");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [coshhRegister, setCoshhRegister] = useState<any[]>([]);
  const [coshhChecks, setCoshhChecks] = useState<any[]>([]);
  const [coshhEvidence, setCoshhEvidence] = useState<any[]>([]);
  const [coshhAnalysis, setCoshhAnalysis] = useState<any>(null);
  const [analysing, setAnalysing] = useState(false);
  const [addingProduct, setAddingProduct] = useState<any>(null);
  const [coshhReviews, setCoshhReviews] = useState<any[]>([]);
  const [activeReview, setActiveReview] = useState<any>(null);
  const [startingReview, setStartingReview] = useState(false);
  const [completingReview, setCompletingReview] = useState(false);
  const [signOffNotes, setSignOffNotes] = useState("");

  const selectedRoom = selectedRoomId ? getRoomById(selectedRoomId) : null;
  const selectedFloorObj = AURORA_SITE.buildings[0].floors.find(
    (f) => f.id === selectedFloor,
  );
  const floorRooms = getRoomsOnFloor(selectedFloor);
  const evacRoute = selectedRoom
    ? getEvacuationRoute(selectedRoom.id)
    : undefined;
  const complianceDomains = selectedRoom
    ? getComplianceDomainsForRoom(selectedRoom)
    : [];

  // Fetch live data (tickets + COSHH checks)
  useEffect(() => {
    if (!organizationId) return;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const h: Record<string, string> = {};
      if (session?.access_token)
        h["Authorization"] = `Bearer ${session.access_token}`;

      // Tickets
      try {
        const res = await fetch(
          `/api/estates/helpdesk?organizationId=${organizationId}`,
          { headers: h },
        );
        const data = await res.json();
        setAllTickets(data?.tickets || data?.data || []);
      } catch {
        setAllTickets([]);
      }

      // COSHH checks
      try {
        const regRes = await fetch(
          `/api/estates/statutory-completions?organizationId=${organizationId}&domain=coshh`,
          { headers: h },
        );
        const regData = await regRes.json();
        setCoshhChecks(
          regData?.completions || regData?.domains?.[0]?.completions || [],
        );
      } catch {
        setCoshhChecks([]);
      }

      // COSHH register
      try {
        const coshhRes = await fetch(
          `/api/coshh?organizationId=${organizationId}`,
          { headers: h },
        );
        const coshhData = await coshhRes.json();
        setCoshhRegister(coshhData?.register || []);
      } catch {
        setCoshhRegister([]);
      }

      // COSHH evidence
      try {
        const evRes = await fetch(
          `/api/estates/evidence?organizationId=${organizationId}&compliance_domain=coshh&page_size=20`,
          { headers: h },
        );
        const evData = await evRes.json();
        setCoshhEvidence(evData?.items || evData?.data || []);
      } catch {
        setCoshhEvidence([]);
      }

      // COSHH reviews
      try {
        const revRes = await fetch(
          `/api/compliance/reviews?organizationId=${organizationId}&domain=coshh&limit=10`,
          { headers: h },
        );
        const revData = await revRes.json();
        const reviews = revData?.reviews || [];
        setCoshhReviews(reviews);
        // Find active review (in_progress or pending sign-off)
        const active = reviews.find(
          (r: any) =>
            r.overall_status === "in_progress" ||
            r.sign_off_status === "pending",
        );
        setActiveReview(active || null);
      } catch {
        setCoshhReviews([]);
      }
    })();
  }, [organizationId]);

  // COSHH room identification — rooms that are likely COSHH locations based on type
  const COSHH_ROOM_TYPES = ["boiler", "kitchen", "storage", "medical"];
  const isCoshhRoom = useCallback((room: Room) => {
    return (
      COSHH_ROOM_TYPES.includes(room.type) ||
      room.name.toLowerCase().includes("caretaker") ||
      room.name.toLowerCase().includes("cleaning") ||
      room.name.toLowerCase().includes("science")
    );
  }, []);

  const matchTicketsToRoom = useCallback(
    (room: Room) => {
      const roomName = room.name.toLowerCase().split(" (")[0];
      return allTickets.filter((t: any) => {
        const loc = (t.location || t.room || "").toLowerCase();
        return loc.includes(roomName) || loc.includes(room.id);
      });
    },
    [allTickets],
  );

  const getOverlayColor = useCallback(
    (room: Room): { fill: string; stroke: string } => {
      if (overlayMode === "tickets") {
        const count = matchTicketsToRoom(room).length;
        if (count > 1) return { fill: "#FFCDD2", stroke: "#D32F2F" };
        if (count === 1) return { fill: "#FFF3E0", stroke: "#FF9800" };
      }
      if (overlayMode === "evacuation" || overlayMode === "induction") {
        if (room.hasFireExit) return { fill: "#C8E6C9", stroke: "#2E7D32" };
        const route = getEvacuationRoute(room.id);
        if (route) {
          if (route.distanceMetres <= 30)
            return { fill: "#C8E6C9", stroke: "#4CAF50" };
          if (route.distanceMetres <= 60)
            return { fill: "#FFF9C4", stroke: "#FBC02D" };
          return { fill: "#FFCDD2", stroke: "#F44336" };
        }
      }
      if (overlayMode === "coshh") {
        if (isCoshhRoom(room)) return { fill: "#FFF3E0", stroke: "#E65100" };
        return { fill: "#F5F5F5", stroke: "#E0E0E0" };
      }
      if (overlayMode === "compliance") {
        const domains = getComplianceDomainsForRoom(room);
        if (domains.length > 3) return { fill: "#FFF3E0", stroke: "#FF9800" };
        if (domains.length > 1) return { fill: "#FFF9C4", stroke: "#FBC02D" };
      }
      return {
        fill: ROOM_COLORS[room.type] || "#F5F5F5",
        stroke: ROOM_STROKES[room.type] || "#9E9E9E",
      };
    },
    [overlayMode, matchTicketsToRoom],
  );

  // When switching to induction, auto-select first classroom on the current floor
  useEffect(() => {
    if (overlayMode === "induction" && !selectedRoomId) {
      const firstClassroom = floorRooms.find((r) => r.type === "classroom");
      if (firstClassroom) setSelectedRoomId(firstClassroom.id);
    }
  }, [overlayMode, selectedRoomId, floorRooms]);

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left: Floor Plan */}
      <div
        className={`flex flex-col ${selectedRoom ? "w-3/5" : "w-full"} transition-all duration-300 border-r border-zinc-200 dark:border-zinc-800`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-5 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <h1 className="text-lg font-bold">Show Me: Site</h1>
            </div>
            <p className="text-xs text-zinc-500">{AURORA_SITE.name}</p>
          </div>

          {/* Floor selector */}
          <div className="flex items-center gap-1 mb-3">
            {FLOOR_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFloor(f.id);
                  setSelectedRoomId(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  selectedFloor === f.id
                    ? "bg-teal-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Overlay modes */}
          <div className="flex items-center gap-1">
            {OVERLAY_MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setOverlayMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    overlayMode === m.id
                      ? m.id === "induction"
                        ? "bg-indigo-600 text-white"
                        : "bg-blue-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* COSHH banner */}
          {overlayMode === "coshh" && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
              <p className="text-xs text-orange-700 dark:text-orange-300">
                <strong>COSHH View</strong> — Highlighted rooms contain or may
                contain hazardous substances. Click to view the register,
                evidence, and compliance checks.
              </p>
            </div>
          )}

          {/* Induction banner */}
          {overlayMode === "induction" && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
              <UserPlus className="w-4 h-4 text-indigo-600 shrink-0" />
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                <strong>Induction Mode</strong> — Select your working room to
                see evacuation route, muster point, and first-day guidance.
              </p>
            </div>
          )}
        </div>

        {/* SVG Floor Plan */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-50 dark:bg-zinc-900">
          {selectedFloorObj && (
            <svg
              viewBox={`0 0 ${12 * CELL + PAD * 2} ${(selectedFloorObj.level === -1 ? 3 : selectedFloorObj.level === 0 ? 9 : selectedFloorObj.level === 1 ? 8 : 6) * CELL + PAD * 2 + 30}`}
              className="w-full max-w-4xl mx-auto"
              style={{ minHeight: 300 }}
            >
              <rect width="100%" height="100%" fill="white" rx="8" />
              <text
                x={PAD}
                y={22}
                style={{ fontSize: 14, fontWeight: 700, fill: "#1a1a1a" }}
              >
                {selectedFloorObj.label}
              </text>

              {/* Corridors */}
              {selectedFloorObj.zones.flatMap((z) =>
                z.corridors.map((c) => (
                  <rect
                    key={c.id}
                    x={PAD + c.gridX * CELL}
                    y={PAD + 30 + c.gridY * CELL}
                    width={c.gridW * CELL}
                    height={c.gridH * CELL}
                    fill="#EEEEEE"
                    stroke="#BDBDBD"
                    strokeWidth={0.5}
                    rx={2}
                  />
                )),
              )}

              {/* Rooms */}
              {floorRooms.map((room) => {
                const colors = getOverlayColor(room);
                const isSelected = selectedRoomId === room.id;
                return (
                  <g
                    key={room.id}
                    onClick={() =>
                      setSelectedRoomId(isSelected ? null : room.id)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <rect
                      x={PAD + room.gridX * CELL}
                      y={PAD + 30 + room.gridY * CELL}
                      width={room.gridW * CELL}
                      height={room.gridH * CELL}
                      fill={
                        isSelected
                          ? overlayMode === "induction"
                            ? "#C5CAE9"
                            : "#BBDEFB"
                          : colors.fill
                      }
                      stroke={
                        isSelected
                          ? overlayMode === "induction"
                            ? "#283593"
                            : "#1565C0"
                          : colors.stroke
                      }
                      strokeWidth={isSelected ? 3 : 1.5}
                      rx={4}
                    />
                    <text
                      x={PAD + room.gridX * CELL + (room.gridW * CELL) / 2}
                      y={
                        PAD +
                        30 +
                        room.gridY * CELL +
                        (room.gridH * CELL) / 2 -
                        (room.className ? 4 : 0)
                      }
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        fill: "#333",
                        pointerEvents: "none",
                      }}
                    >
                      {room.className || room.name.split(" (")[0]}
                    </text>
                    {room.className && (
                      <text
                        x={PAD + room.gridX * CELL + (room.gridW * CELL) / 2}
                        y={
                          PAD +
                          30 +
                          room.gridY * CELL +
                          (room.gridH * CELL) / 2 +
                          10
                        }
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{
                          fontSize: 7,
                          fill: "#666",
                          pointerEvents: "none",
                        }}
                      >
                        {room.yearGroup === "R"
                          ? "Reception"
                          : `Year ${room.yearGroup}`}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Fire exits */}
              {FIRE_EXITS.filter((e) => e.floorId === selectedFloor).map(
                (exit) => (
                  <g key={exit.id}>
                    <rect
                      x={PAD + exit.gridX * CELL - 2}
                      y={PAD + 30 + exit.gridY * CELL - 2}
                      width={CELL * 0.8}
                      height={14}
                      fill="#FFCDD2"
                      stroke="#D32F2F"
                      strokeWidth={1}
                      rx={3}
                    />
                    <text
                      x={PAD + exit.gridX * CELL + CELL * 0.4 - 2}
                      y={PAD + 30 + exit.gridY * CELL + 8}
                      textAnchor="middle"
                      style={{
                        fontSize: 7,
                        fontWeight: 700,
                        fill: "#D32F2F",
                        pointerEvents: "none",
                      }}
                    >
                      {exit.name}
                    </text>
                  </g>
                ),
              )}

              {/* Legend */}
              {(overlayMode === "evacuation" ||
                overlayMode === "induction") && (
                <g
                  transform={`translate(${PAD}, ${PAD + 30 + (selectedFloorObj.level === -1 ? 3 : selectedFloorObj.level === 0 ? 9 : selectedFloorObj.level === 1 ? 8 : 6) * CELL - 20})`}
                >
                  {[
                    { x: 0, fill: "#C8E6C9", stroke: "#4CAF50", label: "<30m" },
                    {
                      x: 55,
                      fill: "#FFF9C4",
                      stroke: "#FBC02D",
                      label: "30-60m",
                    },
                    {
                      x: 115,
                      fill: "#FFCDD2",
                      stroke: "#F44336",
                      label: ">60m",
                    },
                  ].map((l) => (
                    <React.Fragment key={l.x}>
                      <rect
                        x={l.x}
                        y={0}
                        width={8}
                        height={8}
                        fill={l.fill}
                        stroke={l.stroke}
                        rx={1}
                      />
                      <text
                        x={l.x + 12}
                        y={7}
                        style={{ fontSize: 7, fill: "#666" }}
                      >
                        {l.label}
                      </text>
                    </React.Fragment>
                  ))}
                </g>
              )}
            </svg>
          )}
        </div>
      </div>

      {/* Right: Detail Drawer */}
      <AnimatePresence>
        {selectedRoom && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "40%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col bg-zinc-50 dark:bg-zinc-900 overflow-y-auto"
          >
            {/* Header */}
            <div
              className={`sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 px-5 py-4 ${
                overlayMode === "induction"
                  ? "bg-indigo-50 dark:bg-indigo-950/20"
                  : "bg-zinc-50 dark:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  {overlayMode === "induction" && (
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                      Induction — Your Working Room
                    </p>
                  )}
                  <h2 className="text-lg font-bold">{selectedRoom.name}</h2>
                  <p className="text-xs text-zinc-500">
                    {getFloorForRoom(selectedRoom.id)?.label} ·{" "}
                    {ROOM_TYPE_LABELS[selectedRoom.type] || selectedRoom.type}
                    {selectedRoom.capacity &&
                      ` · Capacity ${selectedRoom.capacity}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRoomId(null)}
                  className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 px-5 py-4 space-y-4">
              {/* ═══ SECTION: Overview ═══ */}
              <DrawerSection
                title="Overview"
                icon={Building2}
                iconColor="text-teal-500"
              >
                <div className="grid grid-cols-2 gap-2">
                  {selectedRoom.className && (
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-2.5 border border-zinc-100 dark:border-zinc-700">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">
                        Class
                      </p>
                      <p className="text-sm font-semibold">
                        {selectedRoom.className}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {selectedRoom.yearGroup === "R"
                          ? "Reception"
                          : `Year ${selectedRoom.yearGroup}`}
                      </p>
                    </div>
                  )}
                  {selectedRoom.areaSqm && (
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-2.5 border border-zinc-100 dark:border-zinc-700">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">
                        Area
                      </p>
                      <p className="text-sm font-semibold">
                        {selectedRoom.areaSqm} m²
                      </p>
                    </div>
                  )}
                  <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-2.5 border border-zinc-100 dark:border-zinc-700">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">
                      Type
                    </p>
                    <p className="text-sm font-semibold">
                      {ROOM_TYPE_LABELS[selectedRoom.type] || selectedRoom.type}
                    </p>
                  </div>
                  {selectedRoom.capacity && (
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-2.5 border border-zinc-100 dark:border-zinc-700">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">
                        Capacity
                      </p>
                      <p className="text-sm font-semibold">
                        {selectedRoom.capacity}
                      </p>
                    </div>
                  )}
                </div>
              </DrawerSection>

              {/* ═══ SECTION: Tickets ═══ */}
              {(() => {
                const tickets = matchTicketsToRoom(selectedRoom);
                return (
                  <DrawerSection
                    title={`Helpdesk Tickets${tickets.length > 0 ? ` (${tickets.length})` : ""}`}
                    icon={Ticket}
                    iconColor="text-amber-500"
                    empty={
                      tickets.length === 0
                        ? "No open tickets for this room"
                        : undefined
                    }
                  >
                    <div className="space-y-2">
                      {tickets.slice(0, 4).map((t: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate flex-1 mr-2">
                            {t.title || t.subject || "Ticket"}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                              t.status === "open"
                                ? "bg-red-100 text-red-700"
                                : t.status === "in_progress"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                      ))}
                      <a
                        href="/estates-compliance/helpdesk"
                        className="text-xs text-blue-600 hover:underline block mt-1"
                      >
                        View all tickets
                      </a>
                    </div>
                  </DrawerSection>
                );
              })()}

              {/* ═══ SECTION: Compliance ═══ */}
              <DrawerSection
                title="Applicable Compliance"
                icon={ShieldCheck}
                iconColor="text-emerald-500"
              >
                <div className="space-y-2">
                  {complianceDomains.map((d) => {
                    const Icon = d.icon;
                    return (
                      <div
                        key={d.id}
                        className="flex items-center gap-2.5 py-1.5"
                      >
                        <Icon className={`w-3.5 h-3.5 ${d.color} shrink-0`} />
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 flex-1">
                          {d.label}
                        </span>
                        <a
                          href="/estates-compliance"
                          className="text-[10px] text-blue-600 hover:underline shrink-0"
                        >
                          View checks
                        </a>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-zinc-400 mt-2">
                  Based on room type. Check the compliance hub for current
                  statuses.
                </p>
              </DrawerSection>

              {/* ═══ SECTION: Evacuation / Induction ═══ */}
              <DrawerSection
                title={
                  overlayMode === "induction"
                    ? "Your Evacuation Route"
                    : "Evacuation"
                }
                icon={Navigation}
                iconColor="text-red-500"
              >
                {evacRoute ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                        <DoorOpen className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase">
                            Nearest Exit
                          </p>
                          <p className="text-xs font-semibold text-red-900 dark:text-red-100">
                            {
                              FIRE_EXITS.find((e) => e.id === evacRoute.exitId)
                                ?.name
                            }
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                            Muster Point
                          </p>
                          <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                            {
                              AURORA_SITE.musterPoints.find(
                                (m) => m.id === evacRoute.musterPointId,
                              )?.name
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500">
                      Estimated distance: ~{evacRoute.distanceMetres}m
                    </p>

                    <div className="pl-3 border-l-2 border-red-300 dark:border-red-700 space-y-1.5">
                      {evacRoute.steps.map((step, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedRoom.hasFireExit ? (
                  <p className="text-xs text-emerald-600 font-medium">
                    This room has a direct fire exit.
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400">
                    No specific route defined. Follow nearest corridor fire exit
                    signs.
                  </p>
                )}
              </DrawerSection>

              {/* ═══ SECTION: Induction Guidance (only in induction mode) ═══ */}
              {overlayMode === "induction" && (
                <DrawerSection
                  title="First Day Guidance"
                  icon={UserPlus}
                  iconColor="text-indigo-500"
                >
                  <div className="space-y-3">
                    <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 p-3">
                      <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
                        {selectedRoom.type === "classroom"
                          ? `Welcome to ${selectedRoom.name}. This is a ${selectedRoom.yearGroup === "R" ? "Reception" : `Year ${selectedRoom.yearGroup}`} classroom with capacity for ${selectedRoom.capacity || 30} pupils. Make sure you know your fire exit route and muster point before the children arrive.`
                          : selectedRoom.type === "office" ||
                              selectedRoom.type === "head_office" ||
                              selectedRoom.type === "reception"
                            ? `Welcome to ${selectedRoom.name}. This is an admin area on the ${getFloorForRoom(selectedRoom.id)?.label}. Your nearest fire exit is shown above. Please sign in at Reception if you haven't already.`
                            : `Welcome to ${selectedRoom.name}. This room is on the ${getFloorForRoom(selectedRoom.id)?.label}. Please familiarise yourself with the nearest fire exit and muster point.`}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5">
                        Key Contacts
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <Users className="w-3 h-3 text-zinc-400" />
                          <span className="text-zinc-600 dark:text-zinc-400">
                            School Office — Main Reception
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <ShieldAlert className="w-3 h-3 text-red-400" />
                          <span className="text-zinc-600 dark:text-zinc-400">
                            First Aider — ask at Reception
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span className="text-zinc-600 dark:text-zinc-400">
                            Fire Marshal — ask at Reception
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2 italic">
                        Contact details will show here once staff connectors are
                        set up.
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5">
                        Checklist
                      </p>
                      <div className="space-y-1">
                        {[
                          "Know your fire exit route",
                          "Know your muster point",
                          "Sign in at Reception",
                          "Locate the nearest first aid kit",
                          "Check your room's emergency lighting",
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400"
                          >
                            <div className="w-3.5 h-3.5 rounded border border-zinc-300 dark:border-zinc-600 shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DrawerSection>
              )}

              {/* ═══ SECTION: COSHH (shown for COSHH-relevant rooms) ═══ */}
              {(overlayMode === "coshh" || isCoshhRoom(selectedRoom)) && (
                <>
                  {/* COSHH Overview */}
                  <DrawerSection
                    title="COSHH Status"
                    icon={AlertTriangle}
                    iconColor="text-orange-500"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-orange-800 dark:text-orange-200">
                            COSHH Location
                          </p>
                          <p className="text-[10px] text-orange-700 dark:text-orange-300">
                            {selectedRoom.type === "boiler"
                              ? "Gas, water treatment, and maintenance chemicals likely stored here"
                              : selectedRoom.type === "kitchen"
                                ? "Cleaning chemicals, sanitisers, and food-safe products likely stored here"
                                : selectedRoom.name
                                      .toLowerCase()
                                      .includes("caretaker")
                                  ? "Cleaning chemicals, maintenance products, and site management supplies likely stored here"
                                  : "This room may contain hazardous substances requiring COSHH assessment"}
                          </p>
                        </div>
                      </div>

                      {/* COSHH Checks Summary */}
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5">
                          Statutory Checks
                        </p>
                        {coshhChecks.length > 0 ? (
                          <div className="space-y-1">
                            {coshhChecks
                              .slice(0, 4)
                              .map((c: any, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="text-zinc-700 dark:text-zinc-300 truncate flex-1 mr-2">
                                    {c.check_name ||
                                      c.check_id?.replace(/_/g, " ") ||
                                      "Check"}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
                                      c.status === "completed"
                                        ? "bg-green-100 text-green-700"
                                        : c.status === "overdue"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-amber-100 text-amber-700"
                                    }`}
                                  >
                                    {c.rag_status || c.status}
                                  </span>
                                </div>
                              ))}
                            {coshhChecks.length > 4 && (
                              <p className="text-[10px] text-zinc-400">
                                +{coshhChecks.length - 4} more checks
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400">
                            No COSHH checks recorded yet. Initialise COSHH
                            checks in the Compliance Hub.
                          </p>
                        )}
                        <a
                          href="/estates-compliance/coshh"
                          className="text-xs text-blue-600 hover:underline block mt-2"
                        >
                          View all COSHH checks
                        </a>
                      </div>
                    </div>
                  </DrawerSection>

                  {/* ═══ Monthly Review Workflow ═══ */}
                  <DrawerSection
                    title="Monthly Review"
                    icon={Clock}
                    iconColor="text-purple-500"
                  >
                    <div className="space-y-3">
                      {/* Active review state */}
                      {activeReview ? (
                        <div className="space-y-3">
                          <div
                            className={`p-3 rounded-lg border ${
                              activeReview.sign_off_status === "signed_off"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                : activeReview.sign_off_status === "pending" &&
                                    activeReview.overall_status !==
                                      "in_progress"
                                  ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                                  : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span
                                className={`text-xs font-bold ${
                                  activeReview.sign_off_status === "signed_off"
                                    ? "text-emerald-700 dark:text-emerald-300"
                                    : activeReview.overall_status ===
                                        "in_progress"
                                      ? "text-blue-700 dark:text-blue-300"
                                      : "text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                {activeReview.sign_off_status === "signed_off"
                                  ? "Signed Off"
                                  : activeReview.overall_status ===
                                      "in_progress"
                                    ? "Review In Progress"
                                    : "Awaiting Sign-Off"}
                              </span>
                              <span className="text-[10px] text-zinc-400">
                                {activeReview.review_date
                                  ? new Date(
                                      activeReview.review_date,
                                    ).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : ""}
                              </span>
                            </div>
                            {activeReview.reviewed_by_name && (
                              <p className="text-[10px] text-zinc-500">
                                Reviewer: {activeReview.reviewed_by_name}
                              </p>
                            )}
                            {activeReview.signed_off_by_name && (
                              <p className="text-[10px] text-zinc-500">
                                Signed off by: {activeReview.signed_off_by_name}
                              </p>
                            )}
                          </div>

                          {/* Action buttons based on review state */}
                          {activeReview.overall_status === "in_progress" && (
                            <button
                              onClick={async () => {
                                setCompletingReview(true);
                                const {
                                  data: { session },
                                } = await supabase.auth.getSession();
                                const h: Record<string, string> = {
                                  "Content-Type": "application/json",
                                };
                                if (session?.access_token)
                                  h["Authorization"] =
                                    `Bearer ${session.access_token}`;

                                // Attach any AI findings to the review
                                if (coshhAnalysis) {
                                  await fetch("/api/compliance/reviews", {
                                    method: "POST",
                                    headers: h,
                                    body: JSON.stringify({
                                      action: "add_findings",
                                      organizationId,
                                      review_id: activeReview.id,
                                      findings: coshhAnalysis,
                                      ai_analysis: coshhAnalysis,
                                      ai_model:
                                        "google/gemini-2.5-flash-preview",
                                    }),
                                  });
                                }

                                const res = await fetch(
                                  "/api/compliance/reviews",
                                  {
                                    method: "POST",
                                    headers: h,
                                    body: JSON.stringify({
                                      action: "complete",
                                      organizationId,
                                      review_id: activeReview.id,
                                      overall_status:
                                        coshhAnalysis?.suspected_new?.length >
                                          0 ||
                                        coshhAnalysis?.storage_concerns
                                          ?.length > 0
                                          ? "concerns"
                                          : "compliant",
                                    }),
                                  },
                                );
                                const data = await res.json();
                                if (data?.review) setActiveReview(data.review);
                                setCompletingReview(false);
                              }}
                              disabled={completingReview}
                              className="w-full px-3 py-2.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                              {completingReview
                                ? "Completing..."
                                : "Complete Review"}
                            </button>
                          )}

                          {activeReview.sign_off_status === "pending" &&
                            activeReview.overall_status !== "in_progress" && (
                              <div className="space-y-2">
                                <textarea
                                  value={signOffNotes}
                                  onChange={(e) =>
                                    setSignOffNotes(e.target.value)
                                  }
                                  placeholder="Sign-off notes (optional)"
                                  className="w-full px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 resize-none"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      const {
                                        data: { session },
                                      } = await supabase.auth.getSession();
                                      const h: Record<string, string> = {
                                        "Content-Type": "application/json",
                                      };
                                      if (session?.access_token)
                                        h["Authorization"] =
                                          `Bearer ${session.access_token}`;
                                      const res = await fetch(
                                        "/api/compliance/reviews",
                                        {
                                          method: "POST",
                                          headers: h,
                                          body: JSON.stringify({
                                            action: "sign_off",
                                            organizationId,
                                            review_id: activeReview.id,
                                            approved: true,
                                            sign_off_notes:
                                              signOffNotes || null,
                                          }),
                                        },
                                      );
                                      const data = await res.json();
                                      if (data?.review) {
                                        setActiveReview(data.review);
                                        setSignOffNotes("");
                                      }
                                    }}
                                    className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                                  >
                                    Sign Off
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const {
                                        data: { session },
                                      } = await supabase.auth.getSession();
                                      const h: Record<string, string> = {
                                        "Content-Type": "application/json",
                                      };
                                      if (session?.access_token)
                                        h["Authorization"] =
                                          `Bearer ${session.access_token}`;
                                      const res = await fetch(
                                        "/api/compliance/reviews",
                                        {
                                          method: "POST",
                                          headers: h,
                                          body: JSON.stringify({
                                            action: "sign_off",
                                            organizationId,
                                            review_id: activeReview.id,
                                            approved: false,
                                            sign_off_notes:
                                              signOffNotes ||
                                              "Rejected — see notes",
                                          }),
                                        },
                                      );
                                      const data = await res.json();
                                      if (data?.review) {
                                        setActiveReview(data.review);
                                        setSignOffNotes("");
                                      }
                                    }}
                                    className="px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            )}
                        </div>
                      ) : (
                        /* No active review — show start button */
                        <div className="space-y-2">
                          {coshhReviews.length > 0 && (
                            <p className="text-xs text-zinc-500">
                              Last review:{" "}
                              {new Date(
                                coshhReviews[0].review_date,
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                              {coshhReviews[0].signed_off_by_name &&
                                ` — signed off by ${coshhReviews[0].signed_off_by_name}`}
                            </p>
                          )}
                          <button
                            onClick={async () => {
                              if (!selectedRoom) return;
                              setStartingReview(true);
                              const {
                                data: { session },
                              } = await supabase.auth.getSession();
                              const h: Record<string, string> = {
                                "Content-Type": "application/json",
                              };
                              if (session?.access_token)
                                h["Authorization"] =
                                  `Bearer ${session.access_token}`;
                              try {
                                const res = await fetch(
                                  "/api/compliance/reviews",
                                  {
                                    method: "POST",
                                    headers: h,
                                    body: JSON.stringify({
                                      action: "start",
                                      organizationId,
                                      compliance_domain: "coshh",
                                      review_type: "monthly_coshh",
                                      location_id: selectedRoom.id,
                                      location_name: selectedRoom.name,
                                    }),
                                  },
                                );
                                const data = await res.json();
                                if (data?.review) setActiveReview(data.review);
                              } catch {
                                /* handle */
                              }
                              setStartingReview(false);
                            }}
                            disabled={startingReview}
                            className="w-full px-3 py-2.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                          >
                            {startingReview
                              ? "Starting..."
                              : "Start Monthly COSHH Review"}
                          </button>
                          {coshhReviews.length === 0 && (
                            <p className="text-[10px] text-zinc-400">
                              No previous reviews. Start your first COSHH review
                              for this location.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Review history */}
                      {coshhReviews.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1.5">
                            Review History
                          </p>
                          <div className="space-y-1.5">
                            {coshhReviews.slice(0, 3).map((r: any) => (
                              <div
                                key={r.id}
                                className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-700 last:border-0"
                              >
                                <div>
                                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                                    {new Date(r.review_date).toLocaleDateString(
                                      "en-GB",
                                      { day: "numeric", month: "short" },
                                    )}
                                  </p>
                                  <p className="text-[10px] text-zinc-400">
                                    {r.reviewed_by_name || "Unknown"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                      r.overall_status === "compliant"
                                        ? "bg-green-100 text-green-700"
                                        : r.overall_status === "concerns"
                                          ? "bg-amber-100 text-amber-700"
                                          : r.overall_status === "non_compliant"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-zinc-100 text-zinc-500"
                                    }`}
                                  >
                                    {r.overall_status || "pending"}
                                  </span>
                                  {r.sign_off_status === "signed_off" && (
                                    <span className="text-[10px] text-emerald-600">
                                      ✓
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DrawerSection>

                  {/* COSHH Register — live data */}
                  <DrawerSection
                    title={`Substance Register${coshhRegister.length > 0 ? ` (${coshhRegister.length})` : ""}`}
                    icon={FileText}
                    iconColor="text-orange-500"
                    empty={
                      coshhRegister.length === 0
                        ? "No substances registered yet. Add products manually or upload evidence photos for AI-assisted detection."
                        : undefined
                    }
                  >
                    <div className="space-y-2">
                      {coshhRegister.slice(0, 6).map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 py-1.5 border-b border-zinc-100 dark:border-zinc-700 last:border-0"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              item.signal_word === "Danger"
                                ? "bg-red-500"
                                : item.signal_word === "Warning"
                                  ? "bg-amber-500"
                                  : "bg-zinc-300"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                              {item.product_name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.manufacturer && (
                                <span className="text-[10px] text-zinc-400">
                                  {item.manufacturer}
                                </span>
                              )}
                              {item.current_quantity && (
                                <span className="text-[10px] text-zinc-400">
                                  · {item.current_quantity}
                                </span>
                              )}
                            </div>
                            {item.ghs_hazard_codes?.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {item.ghs_hazard_codes
                                  .slice(0, 3)
                                  .map((code: string) => (
                                    <span
                                      key={code}
                                      className="px-1 py-0.5 rounded bg-red-50 dark:bg-red-950/20 text-[9px] font-mono text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                    >
                                      {code}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 shrink-0">
                            {item.sds_url ? "SDS ✓" : "No SDS"}
                          </span>
                        </div>
                      ))}
                      {coshhRegister.length > 6 && (
                        <p className="text-[10px] text-zinc-400">
                          +{coshhRegister.length - 6} more products
                        </p>
                      )}
                      <a
                        href="/estates-compliance/coshh"
                        className="text-xs text-blue-600 hover:underline block mt-1"
                      >
                        View full register in Compliance Hub
                      </a>
                    </div>
                  </DrawerSection>

                  {/* COSHH Evidence Gallery */}
                  <DrawerSection
                    title={`Evidence${coshhEvidence.length > 0 ? ` (${coshhEvidence.length})` : ""}`}
                    icon={Package}
                    iconColor="text-orange-500"
                    empty={
                      coshhEvidence.length === 0
                        ? "No evidence photos yet. Upload photos of this storage area to start tracking."
                        : undefined
                    }
                  >
                    <div className="space-y-3">
                      {coshhEvidence.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {coshhEvidence.slice(0, 6).map((ev: any) => (
                            <div key={ev.id} className="relative group">
                              <div className="aspect-square rounded-lg bg-zinc-200 dark:bg-zinc-700 overflow-hidden border border-zinc-300 dark:border-zinc-600">
                                {ev.file_url &&
                                ev.file_type?.startsWith("image") ? (
                                  <img
                                    src={ev.file_url}
                                    alt={ev.title || "Evidence"}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-zinc-400" />
                                  </div>
                                )}
                              </div>
                              <p className="text-[9px] text-zinc-400 mt-0.5 truncate">
                                {ev.created_at
                                  ? new Date(ev.created_at).toLocaleDateString(
                                      "en-GB",
                                      { day: "numeric", month: "short" },
                                    )
                                  : ""}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      <a
                        href="/estates-compliance/evidence/upload"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors w-full justify-center"
                      >
                        <Package className="w-3.5 h-3.5" />
                        Upload Evidence Photo
                      </a>
                    </div>
                  </DrawerSection>

                  {/* AI Analysis Results */}
                  {coshhAnalysis && (
                    <DrawerSection
                      title="AI Analysis — Proposed Findings"
                      icon={AlertTriangle}
                      iconColor="text-blue-500"
                    >
                      <div className="space-y-3">
                        <p className="text-[10px] text-zinc-400 italic bg-blue-50 dark:bg-blue-950/20 rounded p-2 border border-blue-200 dark:border-blue-800">
                          These are proposed findings from AI analysis. No
                          changes have been made to the register. Review each
                          item and confirm or dismiss.
                        </p>

                        {coshhAnalysis.confirmed?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">
                              Confirmed on register (
                              {coshhAnalysis.confirmed.length})
                            </p>
                            {coshhAnalysis.confirmed.map(
                              (p: any, i: number) => (
                                <p
                                  key={i}
                                  className="text-xs text-zinc-600 dark:text-zinc-400 py-0.5"
                                >
                                  ✓ {p.product_name}
                                </p>
                              ),
                            )}
                          </div>
                        )}

                        {coshhAnalysis.suspected_new?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">
                              Suspected new — not on register (
                              {coshhAnalysis.suspected_new.length})
                            </p>
                            {coshhAnalysis.suspected_new.map(
                              (p: any, i: number) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-700 last:border-0"
                                >
                                  <div>
                                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                                      {p.product_name}
                                    </p>
                                    {p.manufacturer && (
                                      <p className="text-[10px] text-zinc-400">
                                        {p.manufacturer}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => setAddingProduct(p)}
                                    className="px-2 py-1 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 transition-colors shrink-0"
                                  >
                                    Add to Register
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                        {coshhAnalysis.suspected_missing?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-red-600 uppercase mb-1">
                              Not detected — may be missing (
                              {coshhAnalysis.suspected_missing.length})
                            </p>
                            {coshhAnalysis.suspected_missing.map(
                              (p: any, i: number) => (
                                <div key={i} className="py-1">
                                  <p className="text-xs text-red-700 dark:text-red-300">
                                    {p.product_name}
                                  </p>
                                  <p className="text-[10px] text-zinc-400">
                                    {p.note}
                                  </p>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                        {coshhAnalysis.storage_concerns?.length > 0 && (
                          <div>
                            <p className="text-[10px] font-bold text-orange-600 uppercase mb-1">
                              Storage concerns
                            </p>
                            {coshhAnalysis.storage_concerns.map(
                              (c: string, i: number) => (
                                <p
                                  key={i}
                                  className="text-xs text-orange-700 dark:text-orange-300 py-0.5"
                                >
                                  ⚠ {c}
                                </p>
                              ),
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => setCoshhAnalysis(null)}
                          className="text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                          Dismiss analysis
                        </button>
                      </div>
                    </DrawerSection>
                  )}

                  {/* Add Product Confirmation Modal (inline) */}
                  {addingProduct && (
                    <DrawerSection
                      title="Confirm: Add to Register"
                      icon={FileText}
                      iconColor="text-emerald-500"
                    >
                      <div className="space-y-3">
                        <p className="text-xs text-zinc-500">
                          AI detected this product. Please review before adding
                          to the register.
                        </p>
                        <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 border border-zinc-200 dark:border-zinc-700 space-y-1">
                          <p className="text-sm font-semibold">
                            {addingProduct.product_name}
                          </p>
                          {addingProduct.manufacturer && (
                            <p className="text-xs text-zinc-500">
                              Manufacturer: {addingProduct.manufacturer}
                            </p>
                          )}
                          {addingProduct.likely_hazard_category && (
                            <p className="text-xs text-zinc-500">
                              Hazard: {addingProduct.likely_hazard_category}
                            </p>
                          )}
                          <p className="text-[10px] text-zinc-400">
                            Source: AI-detected from evidence photo
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              const {
                                data: { session },
                              } = await supabase.auth.getSession();
                              const h: Record<string, string> = {
                                "Content-Type": "application/json",
                              };
                              if (session?.access_token)
                                h["Authorization"] =
                                  `Bearer ${session.access_token}`;
                              try {
                                await fetch("/api/coshh", {
                                  method: "POST",
                                  headers: h,
                                  body: JSON.stringify({
                                    action: "add",
                                    organizationId,
                                    product_name: addingProduct.product_name,
                                    manufacturer: addingProduct.manufacturer,
                                    ghs_hazard_codes:
                                      addingProduct.likely_hazard_category
                                        ? [addingProduct.likely_hazard_category]
                                        : [],
                                  }),
                                });
                                // Refresh register
                                const regRes = await fetch(
                                  `/api/coshh?organizationId=${organizationId}`,
                                  { headers: h },
                                );
                                const regData = await regRes.json();
                                setCoshhRegister(regData?.register || []);
                                setAddingProduct(null);
                              } catch {
                                /* handle error */
                              }
                            }}
                            className="flex-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
                          >
                            Confirm — Add to Register
                          </button>
                          <button
                            onClick={() => setAddingProduct(null)}
                            className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </DrawerSection>
                  )}
                </>
              )}

              {/* ═══ SECTION: Future — Assets (placeholder) ═══ */}
              <DrawerSection
                title="Assets"
                icon={Package}
                iconColor="text-zinc-400"
                empty="Asset tracking for this room will appear here once assets are linked to rooms."
              >
                <></>
              </DrawerSection>

              {/* ═══ SECTION: Future — People (placeholder) ═══ */}
              {selectedRoom.type === "classroom" && (
                <DrawerSection
                  title="People"
                  icon={Users}
                  iconColor="text-zinc-400"
                  empty={`Staff and class information for ${selectedRoom.className || selectedRoom.name} will appear here once class assignments are connected.`}
                >
                  <></>
                </DrawerSection>
              )}

              {/* Ask Ed */}
              <button
                onClick={() => {
                  const prompt =
                    overlayMode === "coshh" && isCoshhRoom(selectedRoom)
                      ? `What are the COSHH requirements for ${selectedRoom.name}? What hazardous substances are typically stored in a ${selectedRoom.type === "kitchen" ? "school kitchen" : selectedRoom.type === "boiler" ? "boiler room" : "caretaker's storage area"} and what checks should be done?`
                      : overlayMode === "induction"
                        ? `I am new and working in ${selectedRoom.name}. What do I need to know about this room, fire safety, and getting started?`
                        : selectedRoom.type === "classroom"
                          ? `Tell me about ${selectedRoom.name} — who teaches there, what year group, and are there any open issues?`
                          : `Tell me about ${selectedRoom.name} — what is this room used for and are there any maintenance or compliance issues?`;
                  openChatWith(prompt);
                }}
                className="flex items-center gap-2 w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {overlayMode === "coshh" && isCoshhRoom(selectedRoom)
                  ? "Ask Ed about COSHH for this room"
                  : overlayMode === "induction"
                    ? "Ask Ed about starting in this room"
                    : "Ask Ed about this room"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
