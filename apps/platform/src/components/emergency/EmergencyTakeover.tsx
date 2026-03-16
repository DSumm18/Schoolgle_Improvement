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
  CheckCircle2,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
  ChevronRight,
} from "lucide-react";
import type { EmergencyBroadcast, ZoneInstruction } from "./useEmergencyStream";

// ─── Alert Type Configuration ────────────────────────────────────────

const ALERT_CONFIG: Record<
  string,
  {
    icon: typeof AlertTriangle;
    bgColor: string;
    bgGradient: string;
    label: string;
    audioFreq?: number;
  }
> = {
  lockdown: {
    icon: ShieldAlert,
    bgColor: "bg-black",
    bgGradient: "from-gray-900 via-black to-gray-900",
    label: "LOCKDOWN",
  },
  evacuation: {
    icon: Flame,
    bgColor: "bg-red-700",
    bgGradient: "from-red-800 via-red-600 to-red-800",
    label: "EVACUATION",
    audioFreq: 880,
  },
  shelter_in_place: {
    icon: Wind,
    bgColor: "bg-amber-700",
    bgGradient: "from-amber-800 via-amber-600 to-amber-800",
    label: "SHELTER IN PLACE",
  },
  medical: {
    icon: HeartPulse,
    bgColor: "bg-blue-700",
    bgGradient: "from-blue-800 via-blue-600 to-blue-800",
    label: "MEDICAL EMERGENCY",
  },
  bomb_threat: {
    icon: Bomb,
    bgColor: "bg-red-900",
    bgGradient: "from-red-950 via-red-800 to-red-950",
    label: "BOMB THREAT",
    audioFreq: 660,
  },
  invacuation: {
    icon: Users,
    bgColor: "bg-orange-700",
    bgGradient: "from-orange-800 via-orange-600 to-orange-800",
    label: "INVACUATION",
  },
  all_clear: {
    icon: CheckCircle2,
    bgColor: "bg-green-700",
    bgGradient: "from-green-800 via-green-600 to-green-800",
    label: "ALL CLEAR",
  },
  custom: {
    icon: AlertTriangle,
    bgColor: "bg-purple-700",
    bgGradient: "from-purple-800 via-purple-600 to-purple-800",
    label: "ALERT",
  },
};

const PROXIMITY_CONFIG = {
  affected: {
    border: "border-red-500",
    badge: "bg-red-600",
    label: "YOUR AREA IS AFFECTED",
    pulse: true,
  },
  adjacent: {
    border: "border-amber-500",
    badge: "bg-amber-600",
    label: "ADJACENT AREA AFFECTED",
    pulse: false,
  },
  distant: {
    border: "border-blue-500",
    badge: "bg-blue-600",
    label: "AWARENESS",
    pulse: false,
  },
};

// ─── Audio Player ────────────────────────────────────────────────────

function playAlarmAudio(type: string, shouldPlay: boolean) {
  if (!shouldPlay || typeof window === "undefined") return null;

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

  function playTone(frequency: number, duration: number) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = "square";
    gainNode.gain.value = 0.3;
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  let interval: NodeJS.Timeout | null = null;

  if (type === "alarm") {
    // Rising/falling siren
    let high = true;
    interval = setInterval(() => {
      playTone(high ? 880 : 660, 0.4);
      high = !high;
    }, 500);
  } else if (type === "bell") {
    interval = setInterval(() => {
      playTone(1000, 0.15);
    }, 300);
  } else if (type === "tone") {
    playTone(800, 2);
  }

  return {
    stop: () => {
      if (interval) clearInterval(interval);
      audioCtx.close();
    },
  };
}

// ─── Floor Plan Overlay ──────────────────────────────────────────────

function FloorPlanOverlay({
  affectedZoneNames,
  allZoneNames,
}: {
  affectedZoneNames: string[];
  allZoneNames?: string[];
}) {
  // Simple zone map visualization when no SVG floor plan is available
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5" />
        <span className="text-lg font-bold">SITE MAP - AFFECTED AREAS</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(allZoneNames || affectedZoneNames).map((zone) => {
          const isAffected = affectedZoneNames.includes(zone);
          return (
            <div
              key={zone}
              className={`
                rounded-xl p-4 text-center font-bold text-sm
                transition-all duration-300
                ${
                  isAffected
                    ? "bg-red-600 animate-pulse ring-4 ring-red-400 shadow-lg shadow-red-600/50"
                    : "bg-white/20"
                }
              `}
            >
              {isAffected && (
                <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
              )}
              {zone}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-4 text-sm opacity-80">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded animate-pulse" />
          <span>Affected Zone</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/20 rounded" />
          <span>Other Zones</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Takeover Component ─────────────────────────────────────────

interface EmergencyTakeoverProps {
  broadcast: EmergencyBroadcast;
  zoneInstruction?: ZoneInstruction | null;
  allClear?: boolean;
  schoolName?: string;
  schoolLogo?: string;
  onAcknowledge?: (data: {
    headcount?: number;
    all_accounted_for?: boolean;
    needs_assistance?: boolean;
    notes?: string;
  }) => void;
  onDismiss?: () => void;
  isDisplayMode?: boolean; // Full-screen classroom board mode
}

export function EmergencyTakeover({
  broadcast,
  zoneInstruction,
  allClear = false,
  schoolName,
  schoolLogo,
  onAcknowledge,
  onDismiss,
  isDisplayMode = false,
}: EmergencyTakeoverProps) {
  const [audioEnabled, setAudioEnabled] = useState(broadcast.play_audio);
  const [acknowledged, setAcknowledged] = useState(false);
  const [headcount, setHeadcount] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState("0:00");
  const [flashOn, setFlashOn] = useState(true);

  const config = ALERT_CONFIG[broadcast.alert_type] || ALERT_CONFIG.custom;
  const proximity = zoneInstruction
    ? PROXIMITY_CONFIG[zoneInstruction.proximity]
    : null;
  const Icon = config.icon;

  // Elapsed time counter
  useEffect(() => {
    const start = new Date(broadcast.triggered_at).getTime();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      setElapsedTime(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [broadcast.triggered_at]);

  // Flash effect
  useEffect(() => {
    if (!broadcast.flash_screen) return;
    const interval = setInterval(() => setFlashOn((p) => !p), 500);
    return () => clearInterval(interval);
  }, [broadcast.flash_screen]);

  // Audio
  useEffect(() => {
    if (!audioEnabled || broadcast.audio_type === "silent") return;
    const audio = playAlarmAudio(broadcast.audio_type, true);
    return () => audio?.stop();
  }, [audioEnabled, broadcast.audio_type]);

  const handleAcknowledge = useCallback(() => {
    setAcknowledged(true);
    onAcknowledge?.({
      headcount: headcount ? parseInt(headcount) : undefined,
      all_accounted_for: true,
      needs_assistance: false,
    });
  }, [headcount, onAcknowledge]);

  // ALL CLEAR overlay
  if (allClear) {
    return (
      <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-green-800 via-green-600 to-green-800 flex flex-col items-center justify-center text-white">
        <CheckCircle2 className="w-32 h-32 mb-8 text-green-200" />
        <h1 className="text-8xl font-black tracking-wider mb-4">ALL CLEAR</h1>
        <p className="text-3xl opacity-90 mb-2">The emergency has been resolved</p>
        <p className="text-xl opacity-70">You may resume normal activities</p>
        {broadcast.is_drill && (
          <div className="mt-8 px-6 py-3 bg-white/20 rounded-full text-xl">
            This was a planned drill
          </div>
        )}
        {onDismiss && !isDisplayMode && (
          <button
            onClick={onDismiss}
            className="mt-8 px-8 py-3 bg-white/20 hover:bg-white/30 rounded-xl text-lg transition"
          >
            Dismiss
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        fixed inset-0 z-[99999] flex flex-col text-white overflow-hidden
        bg-gradient-to-br ${config.bgGradient}
        ${broadcast.flash_screen && !flashOn ? "opacity-80" : "opacity-100"}
        transition-opacity duration-200
      `}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/30">
        <div className="flex items-center gap-4">
          {schoolLogo && (
            <img src={schoolLogo} alt="" className="h-10 w-10 object-contain rounded" />
          )}
          <span className="text-lg font-semibold opacity-90">
            {schoolName || "School Emergency Broadcast"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {broadcast.is_drill && (
            <span className="px-4 py-1 bg-yellow-500 text-black font-bold rounded-full text-sm animate-pulse">
              DRILL
            </span>
          )}
          <div className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            <span className="font-mono">{elapsedTime}</span>
          </div>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="p-2 rounded-full hover:bg-white/20 transition"
          >
            {audioEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-6">
        {/* Alert Icon & Type */}
        <Icon className={`w-24 h-24 mb-6 ${proximity?.pulse ? "animate-pulse" : ""}`} />

        <h1
          className={`
            font-black tracking-wider mb-4 text-center
            ${isDisplayMode ? "text-8xl" : "text-5xl md:text-7xl"}
          `}
        >
          {config.label}
        </h1>

        {/* Proximity badge */}
        {proximity && (
          <div
            className={`
              px-6 py-2 rounded-full font-bold text-lg mb-6
              ${proximity.badge}
              ${proximity.pulse ? "animate-pulse" : ""}
            `}
          >
            {proximity.label}
          </div>
        )}

        {/* Main instruction */}
        <div
          className={`
            max-w-4xl text-center mb-6
            ${isDisplayMode ? "text-4xl" : "text-2xl md:text-3xl"}
            leading-relaxed font-semibold
          `}
        >
          {zoneInstruction?.instruction || broadcast.message}
        </div>

        {/* Secondary instruction */}
        {zoneInstruction?.secondary_instruction && (
          <div
            className={`
              max-w-3xl text-center mb-6 opacity-90
              ${isDisplayMode ? "text-2xl" : "text-lg md:text-xl"}
            `}
          >
            {zoneInstruction.secondary_instruction}
          </div>
        )}

        {/* Assembly point / Evacuation route */}
        {(zoneInstruction?.assembly_point || zoneInstruction?.evacuation_route) && (
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 max-w-3xl w-full mb-6">
            {zoneInstruction.evacuation_route && (
              <div className="flex items-start gap-3 mb-3">
                <ChevronRight className="w-6 h-6 mt-1 text-yellow-300 flex-shrink-0" />
                <div>
                  <span className="text-sm font-bold uppercase opacity-70">Route</span>
                  <p className={isDisplayMode ? "text-2xl font-bold" : "text-lg font-bold"}>
                    {zoneInstruction.evacuation_route}
                  </p>
                </div>
              </div>
            )}
            {zoneInstruction.assembly_point && (
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 mt-1 text-green-300 flex-shrink-0" />
                <div>
                  <span className="text-sm font-bold uppercase opacity-70">Assembly Point</span>
                  <p className={isDisplayMode ? "text-2xl font-bold" : "text-lg font-bold"}>
                    {zoneInstruction.assembly_point}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floor plan / zone map */}
        {broadcast.show_floor_plan && broadcast.affected_zone_names.length > 0 && (
          <FloorPlanOverlay affectedZoneNames={broadcast.affected_zone_names} />
        )}
      </div>

      {/* Footer: Acknowledge / Actions */}
      <div className="px-6 py-4 bg-black/30">
        {!acknowledged ? (
          <div className="flex items-center justify-center gap-4">
            <input
              type="number"
              placeholder="Headcount (optional)"
              value={headcount}
              onChange={(e) => setHeadcount(e.target.value)}
              className="bg-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 w-48 text-center text-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={handleAcknowledge}
              className="px-8 py-3 bg-white/25 hover:bg-white/35 rounded-xl text-xl font-bold transition border-2 border-white/50"
            >
              ACKNOWLEDGE RECEIPT
            </button>
            {!isDisplayMode && onDismiss && (
              <button
                onClick={onDismiss}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition"
              >
                Minimize
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 text-green-300">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-lg font-semibold">
              Acknowledged{headcount ? ` — ${headcount} persons in this area` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
