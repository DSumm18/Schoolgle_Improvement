"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Flame,
  Wind,
  HeartPulse,
  Bomb,
  Users,
  Radio,
  Send,
  MapPin,
  Volume2,
  VolumeX,
  Monitor,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  Shield,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface Zone {
  id: string;
  zone_name: string;
  zone_code: string;
  zone_type: string;
  assembly_point?: string;
  evacuation_route?: string;
  online_devices: number;
}

interface ActiveBroadcast {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  status: string;
  triggered_by_name: string;
  triggered_at: string;
  affected_zone_names: string[];
  is_whole_school: boolean;
  is_drill: boolean;
}

// ─── Alert Type Options ──────────────────────────────────────────────

const ALERT_TYPES = [
  {
    value: "lockdown",
    label: "Lockdown",
    icon: ShieldAlert,
    color: "bg-gray-900 text-white",
    hoverColor: "hover:bg-gray-800",
    description: "Intruder, threat, or police instruction. SILENT mode — no audio.",
    defaultTitle: "LOCKDOWN",
    defaultMessage: "Lock all doors. Lights off. Move away from windows and doors. Stay silent. Do NOT open doors until ALL CLEAR.",
    severity: "critical",
    audio: "silent",
  },
  {
    value: "evacuation",
    label: "Fire Evacuation",
    icon: Flame,
    color: "bg-red-600 text-white",
    hoverColor: "hover:bg-red-700",
    description: "Fire, gas leak, or structural emergency. Evacuate to assembly points.",
    defaultTitle: "FIRE EVACUATION",
    defaultMessage: "Evacuate the building immediately via your nearest fire exit. Proceed to your designated assembly point. Take registers.",
    severity: "critical",
    audio: "alarm",
  },
  {
    value: "shelter_in_place",
    label: "Shelter in Place",
    icon: Wind,
    color: "bg-amber-600 text-white",
    hoverColor: "hover:bg-amber-700",
    description: "Environmental hazard, chemical spill, severe weather. Stay inside.",
    defaultTitle: "SHELTER IN PLACE",
    defaultMessage: "Remain inside. Close all windows and doors. Move to interior rooms. Await further instructions.",
    severity: "urgent",
    audio: "tone",
  },
  {
    value: "medical",
    label: "Medical Emergency",
    icon: HeartPulse,
    color: "bg-blue-600 text-white",
    hoverColor: "hover:bg-blue-700",
    description: "Serious medical incident in a specific zone. First aiders respond.",
    defaultTitle: "MEDICAL EMERGENCY",
    defaultMessage: "Medical emergency in progress. First aiders please respond immediately. Keep area clear.",
    severity: "urgent",
    audio: "tone",
  },
  {
    value: "bomb_threat",
    label: "Bomb Threat",
    icon: Bomb,
    color: "bg-red-900 text-white",
    hoverColor: "hover:bg-red-800",
    description: "Bomb threat received. Follow NaCTSO guidance. Do NOT use mobile phones near suspect area.",
    defaultTitle: "BOMB THREAT",
    defaultMessage: "Bomb threat alert. Evacuate AWAY from suspect area. Do NOT use mobile phones within 15m. Follow police instructions.",
    severity: "critical",
    audio: "alarm",
  },
  {
    value: "invacuation",
    label: "Invacuation",
    icon: Users,
    color: "bg-orange-600 text-white",
    hoverColor: "hover:bg-orange-700",
    description: "Bring all outdoor pupils inside immediately.",
    defaultTitle: "INVACUATION",
    defaultMessage: "All outdoor activities stop. Bring pupils inside immediately. Secure external doors once everyone is in.",
    severity: "urgent",
    audio: "bell",
  },
];

// ─── Component ───────────────────────────────────────────────────────

interface EmergencyTriggerPanelProps {
  organizationId: string;
}

export function EmergencyTriggerPanel({ organizationId }: EmergencyTriggerPanelProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeBroadcasts, setActiveBroadcasts] = useState<ActiveBroadcast[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [isWholeSchool, setIsWholeSchool] = useState(false);
  const [isDrill, setIsDrill] = useState(false);
  const [playAudio, setPlayAudio] = useState(true);
  const [showFloorPlan, setShowFloorPlan] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load zones and active broadcasts
  useEffect(() => {
    fetch("/api/emergency/zones")
      .then((r) => r.json())
      .then((d) => setZones(d.zones || []))
      .catch(() => {});

    fetch("/api/emergency/broadcast?status=active")
      .then((r) => r.json())
      .then((d) => setActiveBroadcasts(d.broadcasts || []))
      .catch(() => {});
  }, []);

  const totalOnlineDevices = zones.reduce((sum, z) => sum + z.online_devices, 0);

  // Select alert type and prefill
  const handleSelectType = useCallback((type: string) => {
    const config = ALERT_TYPES.find((t) => t.value === type);
    if (!config) return;
    setSelectedType(type);
    setTitle(config.defaultTitle);
    setMessage(config.defaultMessage);
    setPlayAudio(config.audio !== "silent");
    setConfirmStep(false);
    setError(null);
  }, []);

  const toggleZone = useCallback((zoneId: string) => {
    setSelectedZones((prev) =>
      prev.includes(zoneId) ? prev.filter((z) => z !== zoneId) : [...prev, zoneId]
    );
    setIsWholeSchool(false);
  }, []);

  const handleWholeSchool = useCallback(() => {
    setIsWholeSchool(true);
    setSelectedZones(zones.map((z) => z.id));
  }, [zones]);

  // TRIGGER the broadcast
  const handleTrigger = useCallback(async () => {
    if (!selectedType || !title || !message) {
      setError("Please select an alert type and provide a message");
      return;
    }
    if (selectedZones.length === 0 && !isWholeSchool) {
      setError("Please select at least one zone or choose Whole School");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const config = ALERT_TYPES.find((t) => t.value === selectedType);
      const res = await fetch("/api/emergency/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_type: selectedType,
          severity: config?.severity || "critical",
          title,
          message,
          affected_zone_ids: selectedZones,
          is_whole_school: isWholeSchool,
          play_audio: playAudio,
          audio_type: config?.audio || "alarm",
          show_floor_plan: showFloorPlan,
          is_drill: isDrill,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send broadcast");
      }

      const broadcast = await res.json();
      setActiveBroadcasts((prev) => [broadcast, ...prev]);

      // Reset form
      setSelectedType(null);
      setTitle("");
      setMessage("");
      setSelectedZones([]);
      setIsWholeSchool(false);
      setConfirmStep(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  }, [selectedType, title, message, selectedZones, isWholeSchool, playAudio, showFloorPlan, isDrill]);

  // Resolve a broadcast
  const handleResolve = useCallback(async (broadcastId: string) => {
    try {
      await fetch(`/api/emergency/broadcast/${broadcastId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "all_clear" }),
      });
      setActiveBroadcasts((prev) => prev.filter((b) => b.id !== broadcastId));
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Active Broadcasts Banner */}
      {activeBroadcasts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <h3 className="text-red-800 font-bold flex items-center gap-2 mb-3">
            <Radio className="w-5 h-5 animate-pulse" />
            ACTIVE BROADCASTS ({activeBroadcasts.length})
          </h3>
          {activeBroadcasts.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between bg-white rounded-lg p-3 mb-2 border border-red-200"
            >
              <div>
                <span className="font-bold text-red-800">{b.title}</span>
                {b.is_drill && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                    DRILL
                  </span>
                )}
                <p className="text-sm text-gray-600">
                  {b.is_whole_school ? "Whole School" : b.affected_zone_names.join(", ")} —
                  Triggered by {b.triggered_by_name}
                </p>
              </div>
              <button
                onClick={() => handleResolve(b.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                ALL CLEAR
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Connection Status */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">
            <strong>{totalOnlineDevices}</strong> devices online across{" "}
            <strong>{zones.length}</strong> zones
          </span>
        </div>
      </div>

      {/* Alert Type Selection */}
      {!selectedType ? (
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Trigger Emergency Broadcast
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ALERT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => handleSelectType(type.value)}
                  className={`
                    ${type.color} ${type.hoverColor}
                    rounded-xl p-4 text-left transition-all
                    hover:scale-[1.02] hover:shadow-lg
                    active:scale-[0.98]
                  `}
                >
                  <Icon className="w-8 h-8 mb-2" />
                  <div className="font-bold text-lg">{type.label}</div>
                  <div className="text-sm opacity-80 mt-1">{type.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : !confirmStep ? (
        /* Configuration Step */
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">
              Configure: {ALERT_TYPES.find((t) => t.value === selectedType)?.label}
            </h3>
            <button
              onClick={() => setSelectedType(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Alert Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Instructions (shown on all screens)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
          </div>

          {/* Zone Selection */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Affected Area
            </label>
            <button
              onClick={handleWholeSchool}
              className={`
                w-full mb-2 px-4 py-3 rounded-lg border-2 font-bold transition text-left
                ${isWholeSchool ? "bg-red-50 border-red-500 text-red-700" : "bg-gray-50 border-gray-200 hover:border-red-300"}
              `}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Whole School
              </div>
              <p className="text-sm font-normal opacity-70 mt-1">
                Alert cascaded to all zones and devices
              </p>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {zones.map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => toggleZone(zone.id)}
                  className={`
                    px-3 py-2 rounded-lg border-2 text-left text-sm transition
                    ${
                      selectedZones.includes(zone.id)
                        ? "bg-red-50 border-red-400 text-red-700"
                        : "bg-gray-50 border-gray-200 hover:border-gray-300"
                    }
                  `}
                >
                  <div className="font-semibold flex items-center justify-between">
                    <span>{zone.zone_name}</span>
                    <span className="text-xs opacity-60">{zone.zone_code}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs opacity-60">
                    <Monitor className="w-3 h-3" />
                    {zone.online_devices} devices
                    {zone.assembly_point && (
                      <>
                        <MapPin className="w-3 h-3 ml-2" />
                        {zone.assembly_point}
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-4 mb-6 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDrill}
                onChange={(e) => setIsDrill(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="font-medium">This is a drill</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFloorPlan}
                onChange={(e) => setShowFloorPlan(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="font-medium">Show site map</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={playAudio}
                onChange={(e) => setPlayAudio(e.target.checked)}
                disabled={selectedType === "lockdown"}
                className="rounded border-gray-300"
              />
              <span className="font-medium">
                {selectedType === "lockdown" ? "Audio disabled (lockdown)" : "Play audio alarm"}
              </span>
            </label>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Proceed to confirmation */}
          <button
            onClick={() => setConfirmStep(true)}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-xl hover:bg-red-700 transition flex items-center justify-center gap-3"
          >
            <AlertTriangle className="w-6 h-6" />
            PREPARE TO BROADCAST
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      ) : (
        /* Confirmation Step */
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6">
          <div className="text-center mb-6">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-red-800">CONFIRM BROADCAST</h2>
            <p className="text-red-600 mt-2">
              This will immediately alert{" "}
              <strong>
                {isWholeSchool
                  ? "the entire school"
                  : `${selectedZones.length} zone${selectedZones.length > 1 ? "s" : ""}`}
              </strong>
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 mb-6 space-y-2 text-sm">
            <div>
              <strong>Type:</strong> {ALERT_TYPES.find((t) => t.value === selectedType)?.label}
              {isDrill && <span className="ml-2 text-yellow-600 font-bold">(DRILL)</span>}
            </div>
            <div>
              <strong>Title:</strong> {title}
            </div>
            <div>
              <strong>Message:</strong> {message}
            </div>
            <div>
              <strong>Zones:</strong>{" "}
              {isWholeSchool
                ? "Whole School"
                : zones
                    .filter((z) => selectedZones.includes(z.id))
                    .map((z) => z.zone_name)
                    .join(", ")}
            </div>
            <div>
              <strong>Audio:</strong> {playAudio ? "Alarm will sound" : "Silent"}
            </div>
            <div>
              <strong>Devices:</strong> {totalOnlineDevices} online
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setConfirmStep(false)}
              className="flex-1 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 transition"
            >
              GO BACK
            </button>
            <button
              onClick={handleTrigger}
              disabled={isSending}
              className="flex-1 py-4 bg-red-700 text-white rounded-xl font-black text-xl hover:bg-red-800 transition flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  SENDING...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  BROADCAST NOW
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
