"use client";

import { CalendarSource } from "@/app/api/calendar/unified/route";

// ─── Types ────────────────────────────────────────────────────────────

export interface CalendarLayer {
  source: CalendarSource;
  label: string;
  color: string;
  enabled: boolean;
}

interface CalendarSidebarProps {
  layers: CalendarLayer[];
  onToggle: (source: CalendarSource) => void;
}

// ─── Layer config (order matters for display) ─────────────────────────

export const DEFAULT_LAYERS: CalendarLayer[] = [
  { source: "school_events", label: "School Events", color: "#3B82F6", enabled: true },
  { source: "lessons", label: "Lessons", color: "#06B6D4", enabled: true },
  { source: "absences", label: "Staff Absence", color: "#EF4444", enabled: true },
  { source: "meetings", label: "Meetings", color: "#8B5CF6", enabled: true },
  { source: "estates", label: "Estates & Diary", color: "#F59E0B", enabled: true },
  { source: "compliance", label: "Compliance Checks", color: "#10B981", enabled: true },
];

// ─── Component ────────────────────────────────────────────────────────

export default function CalendarSidebar({ layers, onToggle }: CalendarSidebarProps) {
  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-slate-100 p-4 flex flex-col gap-6">
      {/* My Calendars section */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          My Calendars
        </p>
        <ul className="space-y-1">
          {layers.map((layer) => (
            <li key={layer.source}>
              <button
                type="button"
                onClick={() => onToggle(layer.source)}
                className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-left group"
              >
                {/* Checkbox */}
                <span
                  className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={
                    layer.enabled
                      ? { backgroundColor: layer.color, borderColor: layer.color }
                      : { backgroundColor: "transparent", borderColor: "#CBD5E1" }
                  }
                >
                  {layer.enabled && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>

                {/* Label */}
                <span
                  className="text-sm font-medium transition-colors"
                  style={{ color: layer.enabled ? "#1E293B" : "#94A3B8" }}
                >
                  {layer.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Legend */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Legend
        </p>
        <div className="space-y-2">
          <LegendRow color="#3B82F6" label="School-wide event" />
          <LegendRow color="#06B6D4" label="Lesson / class" />
          <LegendRow color="#EF4444" label="Staff absence" />
          <LegendRow color="#8B5CF6" label="Governance meeting" />
          <LegendRow color="#F59E0B" label="Estates diary" />
          <LegendRow color="#10B981" label="Compliance due" />
        </div>
      </div>
    </aside>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 rounded-sm flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
