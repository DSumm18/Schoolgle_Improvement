"use client";

import React, { useState } from "react";
import {
  Map,
  Upload,
  Building2,
  Layers,
  ChevronRight,
  ChevronLeft,
  Info,
  Package,
  AlertTriangle,
  Flame,
  Accessibility,
  Zap,
  UserPlus,
  HardHat,
  CalendarDays,
  ClipboardCheck,
} from "lucide-react";
import FloorPlanViewer, {
  FloorPlanData,
  FloorPlanRoom,
} from "@/components/floor-plan/FloorPlanViewer";

// ─── Demo data ─────────────────────────────────────────────────────────────

const DEMO_FLOOR_PLAN: FloorPlanData = {
  id: "demo-primary-school",
  title: "Demo Primary School — Ground Floor",
  width: 900,
  height: 560,
  rooms: [
    {
      id: "reception",
      name: "Reception",
      type: "reception",
      polygon_points: "20,20 200,20 200,120 20,120",
      fill_color: "#f0f9ff",
      area_sqm: 32,
      assets_count: 3,
      issues_count: 0,
      accessible: true,
      temperature: 21,
      booking_status: "available",
      daily_check_order: 1,
      daily_check_done: true,
    },
    {
      id: "office",
      name: "Office",
      type: "office",
      polygon_points: "200,20 360,20 360,120 200,120",
      fill_color: "#fdf4ff",
      area_sqm: 28,
      assets_count: 5,
      issues_count: 1,
      accessible: true,
      temperature: 22,
      daily_check_order: 2,
      daily_check_done: true,
    },
    {
      id: "hall",
      name: "Main Hall",
      type: "hall",
      polygon_points: "20,140 360,140 360,340 20,340",
      fill_color: "#fffbeb",
      area_sqm: 136,
      assets_count: 8,
      issues_count: 1,
      fire_exit: true,
      fire_route: true,
      accessible: true,
      temperature: 19,
      booking_status: "booked",
      daily_check_order: 3,
      daily_check_done: false,
    },
    {
      id: "kitchen",
      name: "Kitchen",
      type: "kitchen",
      polygon_points: "20,360 200,360 200,540 20,540",
      fill_color: "#fff1f2",
      area_sqm: 54,
      assets_count: 12,
      issues_count: 2,
      temperature: 24,
      daily_check_order: 4,
      daily_check_done: false,
    },
    {
      id: "store",
      name: "Store Room",
      type: "storage",
      polygon_points: "200,360 360,360 360,450 200,450",
      fill_color: "#f8fafc",
      area_sqm: 18,
      assets_count: 2,
      issues_count: 0,
      temperature: 17,
    },
    {
      id: "toilets",
      name: "Toilets",
      type: "toilet",
      polygon_points: "200,450 360,450 360,540 200,540",
      fill_color: "#f0fdfa",
      area_sqm: 22,
      assets_count: 4,
      issues_count: 1,
      accessible: true,
      temperature: 19,
      daily_check_order: 5,
      daily_check_done: false,
    },
    {
      id: "classroom-1",
      name: "Classroom 1",
      type: "classroom",
      polygon_points: "400,20 620,20 620,160 400,160",
      fill_color: "#f0fdf4",
      area_sqm: 56,
      assets_count: 6,
      issues_count: 0,
      accessible: true,
      temperature: 21,
      booking_status: "booked",
      daily_check_order: 6,
      daily_check_done: false,
    },
    {
      id: "classroom-2",
      name: "Classroom 2",
      type: "classroom",
      polygon_points: "660,20 880,20 880,160 660,160",
      fill_color: "#f0fdf4",
      area_sqm: 56,
      assets_count: 6,
      issues_count: 0,
      accessible: true,
      temperature: 20,
      booking_status: "booked",
      daily_check_order: 7,
      daily_check_done: false,
    },
    {
      id: "classroom-3",
      name: "Classroom 3",
      type: "classroom",
      polygon_points: "400,200 620,200 620,340 400,340",
      fill_color: "#eff6ff",
      area_sqm: 56,
      assets_count: 6,
      issues_count: 1,
      accessible: true,
      temperature: 22,
      booking_status: "booked",
      daily_check_order: 8,
      daily_check_done: false,
    },
    {
      id: "classroom-4",
      name: "Classroom 4",
      type: "classroom",
      polygon_points: "660,200 880,200 880,340 660,340",
      fill_color: "#eff6ff",
      area_sqm: 56,
      assets_count: 6,
      issues_count: 0,
      fire_exit: true,
      accessible: true,
      temperature: 21,
      booking_status: "partial",
      daily_check_order: 9,
      daily_check_done: false,
    },
    {
      id: "corridor",
      name: "Corridor",
      type: "corridor",
      polygon_points: "360,20 400,20 400,540 360,540",
      fill_color: "#f1f5f9",
      area_sqm: 40,
      assets_count: 2,
      issues_count: 0,
      fire_route: true,
      accessible: true,
      temperature: 18,
      daily_check_order: 10,
      daily_check_done: false,
    },
    {
      id: "staff-room",
      name: "Staff Room",
      type: "office",
      polygon_points: "400,380 620,380 620,540 400,540",
      fill_color: "#fdf4ff",
      area_sqm: 48,
      assets_count: 4,
      issues_count: 0,
      accessible: true,
      temperature: 21,
      booking_status: "available",
    },
    {
      id: "sen-room",
      name: "SEND Room",
      type: "classroom",
      polygon_points: "660,380 880,380 880,540 660,540",
      fill_color: "#fef9c3",
      area_sqm: 36,
      assets_count: 3,
      issues_count: 0,
      accessible: true,
      temperature: 21,
      booking_status: "available",
    },
  ],
};

const OVERLAY_LEGEND = [
  {
    icon: <Package className="w-3.5 h-3.5" />,
    label: "Assets & Compliance",
    color: "text-green-600",
    desc: "Asset pins, service history, certificates",
  },
  {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: "Issues & Tasks",
    color: "text-orange-600",
    desc: "Helpdesk tickets, maintenance urgency",
  },
  {
    icon: <Flame className="w-3.5 h-3.5" />,
    label: "Fire Safety",
    color: "text-red-600",
    desc: "Exits, routes, extinguishers, alarms",
  },
  {
    icon: <Accessibility className="w-3.5 h-3.5" />,
    label: "Accessibility",
    color: "text-blue-600",
    desc: "DDA routes, ramps, SEND provision",
  },
  {
    icon: <Zap className="w-3.5 h-3.5" />,
    label: "Energy",
    color: "text-yellow-600",
    desc: "Temperature, heating, consumption",
  },
  {
    icon: <UserPlus className="w-3.5 h-3.5" />,
    label: "New Starter",
    color: "text-purple-600",
    desc: "Induction tour, key locations",
  },
  {
    icon: <HardHat className="w-3.5 h-3.5" />,
    label: "Contractor",
    color: "text-gray-600",
    desc: "Service route, hazard alerts",
  },
  {
    icon: <CalendarDays className="w-3.5 h-3.5" />,
    label: "Room Booking",
    color: "text-cyan-600",
    desc: "Availability, utilisation heatmap",
  },
  {
    icon: <ClipboardCheck className="w-3.5 h-3.5" />,
    label: "Daily Checks",
    color: "text-teal-600",
    desc: "Caretaker route, tap-to-complete",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────

export default function FloorPlanPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const totalAssets = DEMO_FLOOR_PLAN.rooms.reduce(
    (s, r) => s + (r.assets_count ?? 0),
    0,
  );
  const totalIssues = DEMO_FLOOR_PLAN.rooms.reduce(
    (s, r) => s + (r.issues_count ?? 0),
    0,
  );
  const totalArea = DEMO_FLOOR_PLAN.rooms.reduce(
    (s, r) => s + (r.area_sqm ?? 0),
    0,
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-50 rounded-lg">
            <Map className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Interactive Floor Plan
            </h1>
            <p className="text-xs text-slate-500">
              {DEMO_FLOOR_PLAN.rooms.length} rooms &middot; {totalArea} m&sup2;
              total &middot; {totalAssets} assets &middot; {totalIssues} open
              issues
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            {sidebarOpen ? "Hide" : "Show"} Sidebar
          </button>
        </div>
      </div>

      {/* Demo banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-800">
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          This is a <strong>demo floor plan</strong>. Upload your own floor plan
          (PDF, DXF, or image) to replace it with your school layout.
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Floor plan viewer */}
        <div className="flex-1 flex flex-col min-w-0">
          <FloorPlanViewer data={DEMO_FLOOR_PLAN} className="flex-1" />
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
            {/* Upload zone */}
            <div className="p-4 border-b border-slate-200">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-cyan-400 hover:bg-cyan-50/30 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">
                  Upload Floor Plan
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  PDF, DXF, DWG, PNG, JPG
                </p>
              </div>
            </div>

            {/* Room list */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  Rooms ({DEMO_FLOOR_PLAN.rooms.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {DEMO_FLOOR_PLAN.rooms.map((room) => (
                  <RoomListItem key={room.id} room={room} />
                ))}
              </div>
            </div>

            {/* Overlay legend */}
            <div className="border-t border-slate-200 bg-slate-50 overflow-y-auto max-h-64">
              <div className="px-4 py-2 border-b border-slate-200">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Overlay Legend
                </h3>
              </div>
              <div className="p-3 space-y-1.5">
                {OVERLAY_LEGEND.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-2 text-[11px]"
                  >
                    <span className={`mt-0.5 ${item.color}`}>{item.icon}</span>
                    <div>
                      <span className="font-medium text-slate-700">
                        {item.label}
                      </span>
                      <span className="text-slate-400 ml-1">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Room list item ────────────────────────────────────────────────────────

function RoomListItem({ room }: { room: FloorPlanRoom }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer group">
      <div
        className="w-3 h-3 rounded-sm flex-shrink-0 border border-slate-300"
        style={{ backgroundColor: room.fill_color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 truncate">
          {room.name}
        </p>
        <p className="text-[10px] text-slate-400 capitalize">
          {room.type}
          {room.area_sqm ? ` \u00B7 ${room.area_sqm} m\u00B2` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 text-[10px]">
        {(room.assets_count ?? 0) > 0 && (
          <span className="text-green-600 font-medium">
            {room.assets_count}
          </span>
        )}
        {(room.issues_count ?? 0) > 0 && (
          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
            {room.issues_count}
          </span>
        )}
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
    </div>
  );
}
