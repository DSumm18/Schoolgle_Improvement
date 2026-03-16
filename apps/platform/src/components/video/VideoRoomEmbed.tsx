"use client";

import { useState, useCallback } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  ExternalLink,
  Users,
  Radio,
  MonitorPlay,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────

interface VideoRoom {
  id: string;
  room_name: string;
  room_type: string;
  provider: string;
  meeting_url?: string;
  meeting_id?: string;
  status: string;
  host_name?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  is_whole_school: boolean;
  auto_join_display: boolean;
  display_message?: string;
}

// ─── Provider Logo ───────────────────────────────────────────────────

function ProviderLogo({ provider }: { provider: string }) {
  const logos: Record<string, { label: string; color: string }> = {
    google_meet: { label: "Google Meet", color: "text-green-600" },
    microsoft_teams: { label: "Microsoft Teams", color: "text-purple-600" },
    zoom: { label: "Zoom", color: "text-blue-600" },
    custom: { label: "Video Link", color: "text-gray-600" },
  };
  const info = logos[provider] || logos.custom;
  return (
    <span className={`text-xs font-semibold ${info.color}`}>{info.label}</span>
  );
}

// ─── Meeting Embed (iframe) ──────────────────────────────────────────

function MeetingEmbed({
  room,
  isFullscreen,
}: {
  room: VideoRoom;
  isFullscreen: boolean;
}) {
  // Google Meet and Teams can be opened in a new window
  // Direct iframe embedding requires Google Meet API (paid) or Teams SDK
  // For now we show a "Join in new window" pattern that works universally
  // Schools with Google Meet API access can enable true embedding later

  return (
    <div
      className={`
        bg-gray-900 rounded-2xl overflow-hidden flex flex-col
        ${isFullscreen ? "fixed inset-0 z-[9999]" : ""}
      `}
    >
      {/* Video area */}
      <div className="flex-1 flex items-center justify-center min-h-[400px] relative">
        <div className="text-center text-white">
          <MonitorPlay className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-2xl font-bold mb-2">{room.room_name}</h3>
          <ProviderLogo provider={room.provider} />

          {room.status === "live" && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-red-400 font-semibold">LIVE NOW</span>
              {room.host_name && (
                <span className="text-gray-400">— hosted by {room.host_name}</span>
              )}
            </div>
          )}

          {room.meeting_url && (
            <a
              href={room.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-lg transition"
              onClick={() => {
                // Record join
                fetch(`/api/video-rooms/${room.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "join", join_method: "link" }),
                }).catch(() => {});
              }}
            >
              <Video className="w-6 h-6" />
              Join {room.provider === "google_meet" ? "Google Meet" : room.provider === "microsoft_teams" ? "Teams Meeting" : "Video Call"}
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {room.display_message && (
            <p className="mt-4 text-gray-400 text-sm max-w-md mx-auto">
              {room.display_message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Room Card (for lists) ───────────────────────────────────────────

interface VideoRoomCardProps {
  room: VideoRoom;
  onGoLive?: (id: string) => void;
  onEnd?: (id: string) => void;
  compact?: boolean;
}

export function VideoRoomCard({ room, onGoLive, onEnd, compact = false }: VideoRoomCardProps) {
  const isLive = room.status === "live";
  const startTime = room.scheduled_start
    ? new Date(room.scheduled_start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;
  const endTime = room.scheduled_end
    ? new Date(room.scheduled_end).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  const TYPE_LABELS: Record<string, string> = {
    assembly: "Assembly",
    staff_briefing: "Staff Briefing",
    parent_meeting: "Parent Meeting",
    governor_meeting: "Governors",
    classroom_link: "Classroom Link",
    cpd_training: "CPD / Training",
    external: "External",
    meeting: "Meeting",
  };

  if (compact) {
    return (
      <div
        className={`
          flex items-center justify-between p-3 rounded-xl border transition
          ${isLive ? "bg-red-50 border-red-200" : "bg-white border-gray-200 hover:border-gray-300"}
        `}
      >
        <div className="flex items-center gap-3">
          {isLive && <Radio className="w-4 h-4 text-red-500 animate-pulse" />}
          <div>
            <div className="font-semibold text-sm text-gray-900">{room.room_name}</div>
            <div className="text-xs text-gray-500">
              {startTime && `${startTime}${endTime ? `–${endTime}` : ""}`}
              {" · "}
              <ProviderLogo provider={room.provider} />
            </div>
          </div>
        </div>
        {room.meeting_url && (
          <a
            href={room.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition
              ${isLive ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"}
            `}
          >
            <Video className="w-3.5 h-3.5" />
            {isLive ? "Join Live" : "Join"}
          </a>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-2xl border p-5 transition
        ${isLive ? "bg-red-50 border-red-300 shadow-lg shadow-red-100" : "bg-white border-gray-200"}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            {isLive && <Radio className="w-5 h-5 text-red-500 animate-pulse" />}
            <h3 className="text-lg font-bold text-gray-900">{room.room_name}</h3>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
              {TYPE_LABELS[room.room_type] || room.room_type}
            </span>
            <ProviderLogo provider={room.provider} />
            {room.host_name && <span>Hosted by {room.host_name}</span>}
          </div>
        </div>
        <div className="text-right text-sm">
          {startTime && (
            <div className="font-semibold text-gray-700">
              {startTime}{endTime ? ` – ${endTime}` : ""}
            </div>
          )}
          {room.scheduled_start && (
            <div className="text-xs text-gray-400">
              {new Date(room.scheduled_start).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </div>
          )}
        </div>
      </div>

      {room.is_whole_school && (
        <div className="flex items-center gap-2 text-sm text-indigo-600 mb-3">
          <Users className="w-4 h-4" />
          <span className="font-medium">Whole School</span>
          {room.auto_join_display && (
            <span className="px-2 py-0.5 bg-indigo-100 rounded text-xs">
              Auto-plays on displays
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        {room.meeting_url && (
          <a
            href={room.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition
              ${isLive ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"}
            `}
          >
            <Video className="w-5 h-5" />
            {isLive ? "Join Live Now" : "Join Meeting"}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {!isLive && onGoLive && (
          <button
            onClick={() => onGoLive(room.id)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-xl font-semibold hover:bg-red-200 transition"
          >
            <Radio className="w-4 h-4" />
            Go Live
          </button>
        )}
        {isLive && onEnd && (
          <button
            onClick={() => onEnd(room.id)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
          >
            <PhoneOff className="w-4 h-4" />
            End Meeting
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Display Mode Assembly Player ────────────────────────────────────

interface AssemblyDisplayProps {
  room: VideoRoom;
  schoolName?: string;
  schoolLogo?: string;
}

export function AssemblyDisplay({ room, schoolName, schoolLogo }: AssemblyDisplayProps) {
  return (
    <div className="fixed inset-0 z-[9990] bg-gray-900 flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-black/50">
        <div className="flex items-center gap-3 text-white">
          {schoolLogo && (
            <img src={schoolLogo} alt="" className="h-8 w-8 object-contain rounded" />
          )}
          <span className="font-semibold">{schoolName}</span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <Radio className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-red-400 font-semibold text-sm">LIVE ASSEMBLY</span>
          <span className="text-gray-400 text-sm ml-2">{room.room_name}</span>
        </div>
      </div>

      {/* Main video area */}
      <div className="flex-1 flex items-center justify-center">
        <MeetingEmbed room={room} isFullscreen={false} />
      </div>
    </div>
  );
}

export { MeetingEmbed };
