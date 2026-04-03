"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  X,
  Flame,
  ShieldCheck,
  AlertTriangle,
  Eye,
  EyeOff,
  Tag,
  Box,
  Layers,
  Zap,
} from "lucide-react";
import {
  ROOMS_3D,
  BLOCK_COLORS,
  ZONE_ASSEMBLY,
  COMPLIANCE_STATUS,
  COMPLIANCE_NOTES,
  type Room3D,
  type ComplianceStatus,
} from "@/components/show-me-site/grove-house-3d-data";

// Dynamic import — Three.js doesn't SSR
const GroveHouse3DScene = dynamic(
  () => import("@/components/show-me-site/GroveHouse3DScene"),
  { ssr: false, loading: () => <SceneLoader /> }
);

// ─── Loading Placeholder ─────────────────────────────────

function SceneLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0f1a]">
      <div className="text-center">
        <div className="flex gap-1 justify-center mb-3">
          {["#6B7280", "#F59E0B", "#3B82F6", "#9F1239", "#F97316", "#A78BFA", "#06B6D4"].map(
            (c, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: c, animationDelay: `${i * 0.1}s` }}
              />
            )
          )}
        </div>
        <p className="text-sm text-slate-500 font-medium">Loading 3D Site Plan...</p>
      </div>
    </div>
  );
}

// ─── Schoolgle Logo Dots ─────────────────────────────────

const MODULE_COLORS = [
  "#6B7280", "#F59E0B", "#3B82F6", "#9F1239", "#F97316", "#A78BFA", "#06B6D4",
];

function LogoDots() {
  return (
    <div className="flex gap-[3px]">
      {MODULE_COLORS.map((c, i) => (
        <div
          key={i}
          className="w-[7px] h-[7px] rounded-full"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

// ─── Toolbar Button ──────────────────────────────────────

function ToolBtn({
  label,
  active,
  onClick,
  variant,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: "fire";
  icon?: React.ReactNode;
}) {
  const base =
    "px-2.5 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer transition-all duration-200 flex items-center gap-1 whitespace-nowrap font-['Poppins',sans-serif]";

  const classes = variant === "fire"
    ? active
      ? `${base} bg-red-500 text-white border-red-500`
      : `${base} bg-gradient-to-br from-red-900 to-red-800 border-red-500 text-red-300 hover:bg-red-800 hover:text-white`
    : active
    ? `${base} bg-amber-500 text-slate-900 border-amber-500`
    : `${base} bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-500 hover:text-slate-200`;

  return (
    <button className={classes} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

// ─── Compliance Badge ────────────────────────────────────

function CompBadge({ status, note }: { status: ComplianceStatus; note?: string }) {
  const config = {
    green: { bg: "bg-emerald-900/50", text: "text-emerald-300", label: "COMPLIANT" },
    amber: { bg: "bg-amber-900/50", text: "text-amber-300", label: "ACTION NEEDED" },
    red: { bg: "bg-red-900/50", text: "text-red-300", label: "OVERDUE" },
  };
  const c = config[status];

  return (
    <div className={`${c.bg} ${c.text} rounded-lg px-3 py-2 text-xs font-medium`}>
      <span className="mr-1">●</span>
      {c.label}
      {note && <span className="block mt-0.5 opacity-80 font-normal">{note}</span>}
    </div>
  );
}

// ─── Room Detail Panel ───────────────────────────────────

function RoomPanel({
  room,
  onClose,
}: {
  room: Room3D | null;
  onClose: () => void;
}) {
  if (!room) return null;

  const block = BLOCK_COLORS[room.block];
  const compStatus = COMPLIANCE_STATUS[room.id] || "green";
  const compNote = COMPLIANCE_NOTES[room.id];
  const assembly = ZONE_ASSEMBLY[room.zone];

  const gradients: Record<string, string> = {
    Classroom: "from-blue-900/80 to-slate-900",
    EYFS: "from-green-900/80 to-slate-900",
    Assembly: "from-purple-900/80 to-slate-900",
    Specialist: "from-cyan-900/80 to-slate-900",
    Staff: "from-slate-700/80 to-slate-900",
    Admin: "from-slate-700/80 to-slate-900",
    Service: "from-red-900/40 to-slate-900",
    Entrance: "from-amber-900/40 to-slate-900",
    Facilities: "from-slate-800 to-slate-900",
    SEN: "from-violet-900/60 to-slate-900",
    Welfare: "from-emerald-900/60 to-slate-900",
    Plant: "from-orange-900/40 to-slate-900",
  };
  const grad = gradients[room.type] || gradients.Classroom;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className="absolute top-4 right-4 w-[300px] bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden z-10 shadow-2xl"
    >
      {/* Header gradient */}
      <div className={`h-[120px] bg-gradient-to-br ${grad} relative p-4 flex flex-col justify-end`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-slate-400 hover:text-white flex items-center justify-center text-sm"
        >
          <X size={14} />
        </button>
        <h2 className="text-base font-bold text-white">{room.name}</h2>
        <p className="text-[11px] text-slate-400">
          {room.type} · Ground Floor
        </p>
      </div>

      {/* Body */}
      <div className="p-4 space-y-1">
        <PanelRow label="Block">
          <span style={{ color: block?.hex || "#94a3b8" }}>
            {room.block}
          </span>
        </PanelRow>
        {room.capacity && <PanelRow label="Capacity">{room.capacity}</PanelRow>}
        <PanelRow label="Fire Zone">Zone {room.zone}</PanelRow>
        {assembly && (
          <PanelRow label="Assembly">{assembly.label}</PanelRow>
        )}
        <PanelRow label="Fire Route">
          <span className="text-emerald-400">✓ Mapped from plan</span>
        </PanelRow>

        <div className="pt-2">
          <CompBadge status={compStatus} note={compNote} />
        </div>
      </div>
    </motion.div>
  );
}

function PanelRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between py-1.5 text-xs text-slate-400 border-b border-slate-800 last:border-none">
      <span>{label}</span>
      <span className="text-slate-200 font-medium">{children}</span>
    </div>
  );
}

// ─── Info Badge (bottom center) ──────────────────────────

function InfoBadge({ fireMode }: { fireMode: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/92 backdrop-blur-xl border rounded-xl px-5 py-2.5 flex items-center gap-4 ${
        fireMode ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "border-slate-700"
      }`}
    >
      {fireMode ? (
        <>
          <div className="text-center">
            <div className="text-[9px] text-red-500 uppercase tracking-wide">🔥 Fire Routes Active</div>
            <div className="text-sm font-bold text-red-400">5 Zones · 12 Exits</div>
          </div>
          <div className="w-px h-6 bg-slate-700" />
          <div className="text-[10px] text-red-300">Routes extracted from Bradford Council fire plan</div>
        </>
      ) : (
        <>
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-wide">Building</div>
            <div className="text-sm font-bold text-amber-500">Grove House Primary</div>
          </div>
          <div className="w-px h-6 bg-slate-700" />
          <div className="text-center">
            <div className="text-[9px] text-slate-500 uppercase tracking-wide">Blocks</div>
            <div className="text-sm font-bold text-amber-500">5 + 2 Extensions</div>
          </div>
          <div className="w-px h-6 bg-slate-700" />
          <div className="text-[10px] text-slate-400">Bradford · URN 148201</div>
        </>
      )}
    </motion.div>
  );
}

// ─── Hint Overlay ────────────────────────────────────────

function Hint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 bg-slate-900/85 backdrop-blur-lg border border-slate-700 rounded-xl px-5 py-2 text-[11px] text-slate-400 pointer-events-none"
        >
          <strong className="text-amber-500">Drag</strong> to orbit ·{" "}
          <strong className="text-amber-500">Scroll</strong> to zoom ·{" "}
          <strong className="text-amber-500">Click</strong> rooms to inspect
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function SitePlanPage() {
  const [showWalls, setShowWalls] = useState(true);
  const [showRoof, setShowRoof] = useState(true);
  const [showCompliance, setShowCompliance] = useState(false);
  const [showXray, setShowXray] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showFireRoutes, setShowFireRoutes] = useState(false);
  const [showFireEquipment, setShowFireEquipment] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room3D | null>(null);

  const handleRoomClick = useCallback((room: Room3D) => {
    setSelectedRoom(room);
  }, []);

  const closePanel = useCallback(() => {
    setSelectedRoom(null);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#0a0f1a] text-slate-200 font-['Poppins',sans-serif]">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <LogoDots />
          <div>
            <h1 className="text-[15px] font-bold">
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Schoolgle
              </span>{" "}
              <span className="bg-gradient-to-r from-slate-400 to-slate-300 bg-clip-text text-transparent font-normal">
                3D Site Plan
              </span>
            </h1>
            <p className="text-[10px] text-slate-500">
              Grove House Primary — Click rooms to inspect
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex gap-1.5 flex-wrap">
          <ToolBtn
            label="Rooms"
            active={showWalls}
            onClick={() => setShowWalls((v) => !v)}
            icon={<Box size={12} />}
          />
          <ToolBtn
            label="Roof"
            active={showRoof}
            onClick={() => setShowRoof((v) => !v)}
            icon={<Layers size={12} />}
          />
          <ToolBtn
            label="Compliance"
            active={showCompliance}
            onClick={() => setShowCompliance((v) => !v)}
            icon={<ShieldCheck size={12} />}
          />
          <ToolBtn
            label="X-Ray"
            active={showXray}
            onClick={() => setShowXray((v) => !v)}
            icon={<Eye size={12} />}
          />
          <ToolBtn
            label="Labels"
            active={showLabels}
            onClick={() => setShowLabels((v) => !v)}
            icon={<Tag size={12} />}
          />
          <ToolBtn
            label="🧯 Equipment"
            active={showFireEquipment}
            onClick={() => setShowFireEquipment((v) => !v)}
          />
          <ToolBtn
            label="🔥 Fire Routes"
            active={showFireRoutes}
            onClick={() => setShowFireRoutes((v) => !v)}
            variant="fire"
            icon={<Flame size={12} />}
          />
        </div>
      </div>

      {/* 3D Scene */}
      <div className="flex-1 relative min-h-0">
        <GroveHouse3DScene
          onRoomClick={handleRoomClick}
          showWalls={showWalls}
          showRoof={showRoof}
          showCompliance={showCompliance}
          showXray={showXray}
          showLabels={showLabels}
          showFireRoutes={showFireRoutes}
          showFireEquipment={showFireEquipment}
          selectedRoomId={selectedRoom?.id || null}
        />

        {/* Room Detail Panel */}
        <AnimatePresence>
          {selectedRoom && (
            <RoomPanel room={selectedRoom} onClose={closePanel} />
          )}
        </AnimatePresence>

        {/* Info Badge */}
        <InfoBadge fireMode={showFireRoutes} />

        {/* Hint */}
        <Hint />
      </div>
    </div>
  );
}
