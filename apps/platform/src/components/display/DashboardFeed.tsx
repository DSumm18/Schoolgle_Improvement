"use client";

import { useState, useEffect } from "react";
import {
  Radio,
  Video,
  Megaphone,
  Calendar,
  Bell,
  Star,
  Clock,
  ChevronRight,
  MapPin,
  Shield,
  Trophy,
  UtensilsCrossed,
  Users,
  Pin,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD FEED SIDEBAR
// Compact live feed that sits on the right side of any dashboard page
// Shows: live rooms, urgent notices, upcoming events, celebrations
// ═══════════════════════════════════════════════════════════════════════

interface FeedNotice {
  id: string;
  title: string;
  body?: string;
  notice_type: string;
  priority: string;
  pin_to_top: boolean;
  event_date?: string;
  event_time?: string;
  event_location?: string;
  created_by_name?: string;
  publish_at: string;
}

interface FeedVideoRoom {
  id: string;
  room_name: string;
  room_type: string;
  provider: string;
  meeting_url?: string;
  status: string;
  host_name?: string;
  scheduled_start?: string;
}

const TYPE_ICONS: Record<string, typeof Megaphone> = {
  announcement: Megaphone,
  event: Calendar,
  reminder: Bell,
  celebration: Star,
  safeguarding: Shield,
  sport: Trophy,
  menu: UtensilsCrossed,
  pta: Users,
};

const TYPE_COLORS: Record<string, string> = {
  announcement: "text-blue-600 bg-blue-50",
  event: "text-indigo-600 bg-indigo-50",
  reminder: "text-amber-600 bg-amber-50",
  celebration: "text-yellow-600 bg-yellow-50",
  safeguarding: "text-red-600 bg-red-50",
  sport: "text-orange-600 bg-orange-50",
  menu: "text-green-600 bg-green-50",
  pta: "text-purple-600 bg-purple-50",
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

interface DashboardFeedProps {
  className?: string;
}

export function DashboardFeed({ className = "" }: DashboardFeedProps) {
  const [notices, setNotices] = useState<FeedNotice[]>([]);
  const [liveRooms, setLiveRooms] = useState<FeedVideoRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/notices?limit=12")
        .then((r) => r.json())
        .catch(() => ({ notices: [] })),
      fetch("/api/video-rooms?limit=5")
        .then((r) => r.json())
        .catch(() => ({ rooms: [] })),
    ]).then(([noticeData, roomData]) => {
      setNotices(noticeData.notices || []);
      setLiveRooms((roomData.rooms || []).filter((r: FeedVideoRoom) => r.status === "live" || r.status === "scheduled"));
      setLoading(false);
    });

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      fetch("/api/notices?limit=12")
        .then((r) => r.json())
        .then((d) => setNotices(d.notices || []))
        .catch(() => {});
      fetch("/api/video-rooms?limit=5")
        .then((r) => r.json())
        .then((d) => setLiveRooms((d.rooms || []).filter((r: FeedVideoRoom) => r.status === "live" || r.status === "scheduled")))
        .catch(() => {});
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`w-72 ${className}`}>
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const urgentNotices = notices.filter((n) => n.priority === "urgent");
  const pinnedNotices = notices.filter((n) => n.pin_to_top && n.priority !== "urgent");
  const regularNotices = notices.filter((n) => !n.pin_to_top && n.priority !== "urgent");
  const live = liveRooms.filter((r) => r.status === "live");
  const upcoming = liveRooms.filter((r) => r.status === "scheduled").slice(0, 3);

  return (
    <div className={`w-72 flex-shrink-0 space-y-4 overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-indigo-600" />
          School Feed
        </h3>
        <a href="/notices" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
          View all <ChevronRight className="w-3 h-3" />
        </a>
      </div>

      {/* Live rooms */}
      {live.length > 0 && (
        <div className="space-y-1.5">
          {live.map((room) => (
            <a
              key={room.id}
              href={room.meeting_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-sm hover:bg-red-100 transition group"
            >
              <Radio className="w-4 h-4 text-red-500 animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-red-800 truncate">{room.room_name}</div>
                <div className="text-xs text-red-600">
                  Live now{room.host_name ? ` · ${room.host_name}` : ""}
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-red-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
            </a>
          ))}
        </div>
      )}

      {/* Urgent notices */}
      {urgentNotices.length > 0 && (
        <div className="space-y-1.5">
          {urgentNotices.map((n) => (
            <div key={n.id} className="p-2.5 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                <span className="font-semibold text-red-800 text-sm truncate">{n.title}</span>
              </div>
              {n.body && (
                <p className="text-xs text-red-600 mt-0.5 line-clamp-2">{n.body}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pinned + regular notices */}
      <div className="space-y-1.5">
        {[...pinnedNotices, ...regularNotices].slice(0, 10).map((n) => {
          const Icon = TYPE_ICONS[n.notice_type] || Megaphone;
          const colorClass = TYPE_COLORS[n.notice_type] || "text-gray-600 bg-gray-50";
          const [iconColor, iconBg] = colorClass.split(" ");

          return (
            <div
              key={n.id}
              className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition"
            >
              <div className={`p-1.5 rounded-lg ${iconBg} flex-shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {n.pin_to_top && <Pin className="w-3 h-3 text-red-400 flex-shrink-0" />}
                  <span className="font-medium text-gray-800 text-sm truncate">{n.title}</span>
                </div>
                {n.event_date && (
                  <div className="text-xs text-indigo-600 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(n.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {n.event_time && ` ${n.event_time}`}
                  </div>
                )}
                {!n.event_date && n.body && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.body}</p>
                )}
                <span className="text-xs text-gray-400">{timeAgo(n.publish_at)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming meetings */}
      {upcoming.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Video className="w-3 h-3" />
            Upcoming Meetings
          </h4>
          <div className="space-y-1">
            {upcoming.map((room) => (
              <div key={room.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-xs">
                <Video className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span className="truncate text-gray-700 font-medium">{room.room_name}</span>
                {room.scheduled_start && (
                  <span className="text-gray-400 ml-auto flex-shrink-0">
                    {new Date(room.scheduled_start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
