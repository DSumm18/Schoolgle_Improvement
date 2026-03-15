"use client";

import { useState, useEffect } from "react";
import {
  Radio,
  Shield,
  MapPin,
  Monitor,
  History,
  Settings,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { EmergencyTriggerPanel } from "@/components/emergency/EmergencyTriggerPanel";

// ─── Types ───────────────────────────────────────────────────────────

interface Broadcast {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  triggered_by_name: string;
  triggered_at: string;
  resolved_at?: string;
  resolved_by_name?: string;
  resolution_notes?: string;
  affected_zone_names: string[];
  is_whole_school: boolean;
  is_drill: boolean;
}

interface Zone {
  id: string;
  zone_name: string;
  zone_code: string;
  zone_type: string;
  assembly_point?: string;
  online_devices: number;
}

// ─── Tab Views ───────────────────────────────────────────────────────

type Tab = "trigger" | "history" | "zones" | "devices";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-red-100 text-red-800 border-red-200",
  escalated: "bg-red-200 text-red-900 border-red-300",
  resolved: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  drill: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const ALERT_LABELS: Record<string, string> = {
  lockdown: "Lockdown",
  evacuation: "Fire Evacuation",
  shelter_in_place: "Shelter in Place",
  medical: "Medical Emergency",
  bomb_threat: "Bomb Threat",
  invacuation: "Invacuation",
  custom: "Custom Alert",
};

export default function EmergencyBroadcastPage() {
  const [tab, setTab] = useState<Tab>("trigger");
  const [history, setHistory] = useState<Broadcast[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/emergency/broadcast?limit=50")
        .then((r) => r.json())
        .catch(() => ({ broadcasts: [] })),
      fetch("/api/emergency/zones")
        .then((r) => r.json())
        .catch(() => ({ zones: [] })),
    ]).then(([broadcastData, zoneData]) => {
      setHistory(broadcastData.broadcasts || []);
      setZones(zoneData.zones || []);
      setLoading(false);
    });
  }, []);

  const activeBroadcasts = history.filter(
    (b) => b.status === "active" || b.status === "escalated"
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Radio className="w-8 h-8 text-red-600" />
            Emergency Broadcast
          </h1>
          <p className="text-gray-500 mt-1">
            Real-time emergency alerts to all connected classroom displays and devices
          </p>
        </div>
        {activeBroadcasts.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-300 rounded-full animate-pulse">
            <div className="w-3 h-3 bg-red-600 rounded-full" />
            <span className="text-red-800 font-bold">
              {activeBroadcasts.length} ACTIVE
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {[
          { id: "trigger" as Tab, label: "Trigger Alert", icon: AlertTriangle },
          { id: "history" as Tab, label: "Broadcast History", icon: History },
          { id: "zones" as Tab, label: "Zones", icon: MapPin },
          { id: "devices" as Tab, label: "Devices", icon: Monitor },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition
              ${tab === id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}
            `}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : (
        <>
          {tab === "trigger" && (
            <EmergencyTriggerPanel organizationId="" />
          )}

          {tab === "history" && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Broadcast History
              </h3>
              {history.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No broadcasts recorded yet</p>
                </div>
              ) : (
                history.map((b) => (
                  <div
                    key={b.id}
                    className={`
                      border rounded-xl p-4
                      ${STATUS_COLORS[b.status] || STATUS_COLORS.cancelled}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{b.title}</span>
                          {b.is_drill && (
                            <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-bold rounded">
                              DRILL
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-white/50 text-xs font-semibold rounded capitalize">
                            {b.status}
                          </span>
                        </div>
                        <p className="text-sm mt-1 opacity-80">{b.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs opacity-70">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(b.triggered_at).toLocaleString()}
                          </span>
                          <span>
                            Type: {ALERT_LABELS[b.alert_type] || b.alert_type}
                          </span>
                          <span>
                            By: {b.triggered_by_name}
                          </span>
                          <span>
                            {b.is_whole_school
                              ? "Whole School"
                              : b.affected_zone_names?.join(", ")}
                          </span>
                        </div>
                        {b.resolved_at && (
                          <div className="text-xs mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Resolved at {new Date(b.resolved_at).toLocaleString()}
                            {b.resolved_by_name && ` by ${b.resolved_by_name}`}
                            {b.resolution_notes && ` — ${b.resolution_notes}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "zones" && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Emergency Zones
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Zones define areas of your school. When an alert is triggered for a zone,
                adjacent zones receive different instructions based on proximity.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {zones.map((z) => (
                  <div
                    key={z.id}
                    className="border border-gray-200 rounded-xl p-4 bg-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800">{z.zone_name}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-mono">
                        {z.zone_code}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        Assembly: {z.assembly_point || "Not set"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor className="w-3 h-3" />
                        {z.online_devices} devices online
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {zones.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No zones configured yet</p>
                  <p className="text-sm mt-1">
                    Zones can be linked to your estates locations
                  </p>
                </div>
              )}
            </div>
          )}

          {tab === "devices" && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Connected Devices
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Devices register when they enter Display Mode. Any browser connected to
                Schoolgle will receive emergency broadcasts.
              </p>
              <div className="text-center py-12 text-gray-400">
                <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Devices appear here when they connect</p>
                <p className="text-sm mt-1">
                  Open <code>/display</code> on a classroom board to register it
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
