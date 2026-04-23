"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Building2, Info, Loader2, AlertCircle } from "lucide-react";
import type { Room3D, RoomMedia, RoomAssetDetail, RoomIssue } from "@/components/estates-compliance/building-3d-viewer";
import type { Building3DData } from "@/components/estates-compliance/building-3d-viewer/Building3DViewer";
import { motion } from "framer-motion";
import SimpleBuildingViewer from "@/components/estates-compliance/building-3d-viewer/SimpleBuildingViewer";

const RoomDetailPanel = dynamic(
  () => import("@/components/estates-compliance/building-3d-viewer").then(mod => ({ default: mod.RoomDetailPanel })),
  { ssr: false }
);

// ─── Demo Data: Grove House School 3D Model ───────────────────────────────────

const GROVE_HOUSE_DATA: Building3DData = {
  id: "grove-house",
  name: "Grove House Primary School",
  buildings: [
    {
      id: "main-building",
      name: "Main Building",
      position: [0, 0, 0],
      floors: [
        {
          id: "ground-floor",
          label: "Ground Floor",
          level: 0,
          height: 3.5,
          rooms: [
            // Ground floor classrooms
            {
              id: "rm-g1",
              name: "Classroom 1A",
              type: "classroom",
              position: [-8, 0, -5],
              size: [6, 2.8, 5],
              color: "#bfdbfe",
              hasFireExit: true,
              assets: [
                { id: "ext-1", type: "fire_extinguisher", position: [2.5, 1.5, 2], status: "ok", label: "Fire Extinguisher" },
                { id: "alarm-1", type: "fire_alarm", position: [0, 2.5, 0], status: "ok", label: "Fire Alarm" },
              ],
              issues: 0,
            },
            {
              id: "rm-g2",
              name: "Classroom 1B",
              type: "classroom",
              position: [0, 0, -5],
              size: [6, 2.8, 5],
              color: "#bfdbfe",
              hasFireExit: false,
              assets: [
                { id: "ext-2", type: "fire_extinguisher", position: [2.5, 1.5, 2], status: "ok", label: "Fire Extinguisher" },
              ],
              issues: 1,
            },
            {
              id: "rm-g3",
              name: "Classroom 2",
              type: "classroom",
              position: [8, 0, -5],
              size: [6, 2.8, 5],
              color: "#bfdbfe",
              hasFireExit: true,
              assets: [
                { id: "ext-3", type: "fire_extinguisher", position: [2.5, 1.5, 2], status: "warning", label: "Fire Extinguisher (Check)" },
              ],
              issues: 0,
            },
            // Hall
            {
              id: "rm-hall",
              name: "Main Hall",
              type: "hall",
              position: [0, 0, 2],
              size: [12, 3.5, 6],
              color: "#fed7aa",
              hasFireExit: true,
              assets: [
                { id: "ext-4", type: "fire_extinguisher", position: [5, 1.5, 2], status: "ok", label: "Fire Extinguisher" },
                { id: "ext-5", type: "fire_extinguisher", position: [-5, 1.5, 2], status: "ok", label: "Fire Extinguisher" },
                { id: "alarm-2", type: "fire_alarm", position: [0, 3, 0], status: "ok", label: "Fire Alarm" },
                { id: "first-aid-1", type: "first_aid_kit", position: [5.5, 1.2, 2.5], status: "ok", label: "First Aid Kit" },
              ],
              issues: 0,
            },
            // Reception
            {
              id: "rm-reception",
              name: "Reception",
              type: "reception",
              position: [-8, 0, 2],
              size: [4, 2.8, 6],
              color: "#c7d2fe",
              hasFireExit: true,
              assets: [
                { id: "ext-6", type: "fire_extinguisher", position: [1.5, 1.5, 2], status: "ok", label: "Fire Extinguisher" },
                { id: "defib-1", type: "defibrillator", position: [1.5, 1.2, 0], status: "ok", label: "Defibrillator" },
              ],
              issues: 0,
            },
            // Offices
            {
              id: "rm-office1",
              name: "Headteacher's Office",
              type: "head_office",
              position: [-12, 0, -5],
              size: [4, 2.8, 4],
              color: "#a5b4fc",
              hasFireExit: false,
              assets: [],
              issues: 0,
            },
            {
              id: "rm-office2",
              name: "School Office",
              type: "office",
              position: [-12, 0, 0],
              size: [4, 2.8, 4],
              color: "#ddd6fe",
              hasFireExit: false,
              assets: [],
              issues: 0,
            },
            // Toilets
            {
              id: "rm-toilet-m",
              name: "Boys' Toilet",
              type: "toilet",
              position: [8, 0, 2],
              size: [3, 2.8, 3],
              color: "#e0f2fe",
              hasFireExit: false,
              assets: [],
              issues: 0,
            },
            {
              id: "rm-toilet-f",
              name: "Girls' Toilet",
              type: "toilet",
              position: [8, 0, 5.5],
              size: [3, 2.8, 3],
              color: "#e0f2fe",
              hasFireExit: false,
              assets: [],
              issues: 0,
            },
            // Staff Room
            {
              id: "rm-staff",
              name: "Staff Room",
              type: "staffroom",
              position: [12, 0, -5],
              size: [5, 2.8, 5],
              color: "#fbcfe8",
              hasFireExit: false,
              assets: [
                { id: "first-aid-2", type: "first_aid_kit", position: [2, 1.2, 2], status: "ok", label: "First Aid Kit" },
              ],
              issues: 0,
            },
            // Kitchen
            {
              id: "rm-kitchen",
              name: "Kitchen",
              type: "kitchen",
              position: [12, 0, 2],
              size: [5, 2.8, 5],
              color: "#fecaca",
              hasFireExit: true,
              assets: [
                { id: "ext-7", type: "fire_extinguisher", position: [2, 1.5, 2], status: "ok", label: "Fire Extinguisher" },
                { id: "alarm-3", type: "fire_alarm", position: [0, 2.5, 0], status: "ok", label: "Fire Alarm" },
              ],
              issues: 0,
            },
            // Storage
            {
              id: "rm-storage",
              name: "Storage",
              type: "storage",
              position: [-12, 0, 5],
              size: [4, 2.8, 4],
              color: "#d1d5db",
              hasFireExit: false,
              assets: [],
              issues: 0,
            },
            // Corridor (implicit - connects areas)
            {
              id: "rm-corridor",
              name: "Main Corridor",
              type: "corridor",
              position: [0, 0, 0],
              size: [22, 2.8, 2],
              color: "#f1f5f9",
              hasFireExit: false,
              assets: [],
              issues: 0,
            },
          ],
        },
      ],
    },
  ],
  groundPlane: { width: 50, depth: 40 },
};

// Demo media for room detail panel
const demoRoomMedia: RoomMedia[] = [
  {
    id: "media-1",
    type: "image",
    url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800",
    caption: "Classroom view from entrance",
  },
  {
    id: "media-2",
    type: "image",
    url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
    caption: "Interactive whiteboard setup",
  },
  {
    id: "media-3",
    type: "image",
    url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800",
    caption: "Reading corner with book display",
  },
];

const demoRoomAssets: RoomAssetDetail[] = [
  {
    id: "asset-1",
    type: "fire_extinguisher",
    position: [2.5, 1.5, 2],
    status: "ok",
    name: "Fire Extinguisher",
    label: "By the door",
    lastInspected: "2025-12-15",
    nextDue: "2026-06-15",
  },
  {
    id: "asset-2",
    type: "fire_alarm",
    position: [0, 2.5, 0],
    status: "ok",
    name: "Fire Alarm",
    label: "Front wall",
    lastInspected: "2025-12-01",
    nextDue: "2026-03-01",
  },
  {
    id: "asset-3",
    type: "first_aid_kit",
    position: [2, 1.2, 2],
    status: "ok",
    name: "First Aid Kit",
    label: "Teacher's desk",
    lastInspected: "2025-12-10",
    nextDue: "2026-01-10",
  },
];

const demoRoomIssues: RoomIssue[] = [
  {
    id: "issue-1",
    title: "Door hinge squeaking",
    priority: "low",
    description: "Main classroom door hinge needs lubrication",
    status: "open",
    createdAt: "2025-12-20",
  },
];

// ─── Loading State ───────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading 3D Viewer...</p>
      </div>
    </div>
  );
}

// ─── Page Component ─────────────────────────────────────────────────────────────

export default function Building3DPage() {
  const [selectedRoom, setSelectedRoom] = useState<Room3D | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Building3DPage mounting...");
    setIsMounted(true);
  }, []);

  const handleRoomSelect = (room: Room3D | null) => {
    console.log("Room selected:", room);
    setSelectedRoom(room);
  };

  if (!isMounted) {
    return <LoadingState />;
  }

  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to Load 3D Viewer</h2>
          <p className="text-slate-400 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <Building2 className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                3D Building Viewer
              </h1>
              <p className="text-sm text-slate-400">
                Interactive visualization of Grove House Primary School
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-slate-300 text-sm transition-colors">
            <Info className="w-4 h-4" />
            Help
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* 3D Canvas */}
        <div className="w-full h-full">
          <SimpleBuildingViewer
            data={GROVE_HOUSE_DATA}
            onRoomSelect={handleRoomSelect}
          />
        </div>

        {/* Room Detail Panel */}
        {selectedRoom && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-96 bg-white shadow-2xl overflow-hidden"
          >
            <RoomDetailPanel
              room={selectedRoom}
              onClose={() => setSelectedRoom(null)}
              media={demoRoomMedia}
              assets={demoRoomAssets}
              issues={demoRoomIssues}
            />
          </motion.div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700 px-6 py-2">
        <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-300" />
            <span>Classroom</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-300" />
            <span>Hall</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-300" />
            <span>Office</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-300" />
            <span>Kitchen</span>
          </div>
          <div className="text-slate-500">|</div>
          <span>Drag to rotate • Scroll to zoom • Click rooms to explore</span>
        </div>
      </div>
    </div>
  );
}
