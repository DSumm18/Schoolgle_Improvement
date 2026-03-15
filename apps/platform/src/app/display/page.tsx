"use client";

import { useState, useEffect, useRef } from "react";
import {
  Clock,
  Calendar,
  Megaphone,
  Star,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Maximize2,
  MapPin,
  Video,
  Radio,
  ExternalLink,
} from "lucide-react";
import { EmergencyListener } from "@/components/emergency/EmergencyListener";
import type { Notice } from "@/components/notices/NoticeFeed";

// ─── Types ───────────────────────────────────────────────────────────

interface Branding {
  school_name: string;
  school_motto?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  display_theme: string;
}

interface VideoRoom {
  id: string;
  room_name: string;
  room_type: string;
  provider: string;
  meeting_url?: string;
  status: string;
  host_name?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  is_whole_school: boolean;
  auto_join_display: boolean;
}

// ─── Clock Widget ────────────────────────────────────────────────────

function ClockWidget() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <div className="text-7xl font-bold tracking-tight font-mono text-gray-900">
        {time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className="text-2xl text-gray-500 mt-1">
        {time.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
    </div>
  );
}

// ─── Notice Carousel ─────────────────────────────────────────────────

function NoticeCarousel({ notices }: { notices: Notice[] }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance
  useEffect(() => {
    if (notices.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % notices.length);
    }, 8000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [notices.length]);

  if (notices.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <Megaphone className="w-12 h-12 opacity-30" />
      </div>
    );
  }

  const notice = notices[current];

  const TYPE_COLORS: Record<string, string> = {
    announcement: "border-blue-400",
    event: "border-indigo-400",
    reminder: "border-amber-400",
    celebration: "border-yellow-400",
    safeguarding: "border-red-400",
    sport: "border-orange-400",
    worship: "border-violet-400",
    menu: "border-green-400",
    pta: "border-purple-400",
    maintenance: "border-gray-400",
  };

  const TYPE_ICONS: Record<string, string> = {
    celebration: "🌟",
    sport: "🏆",
    event: "📅",
    reminder: "🔔",
    menu: "🍽️",
    worship: "🙏",
    pta: "👥",
  };

  return (
    <div className="h-full flex flex-col">
      {/* Notice content */}
      <div
        className={`
          flex-1 bg-white rounded-2xl shadow-lg border-l-8 p-8
          ${TYPE_COLORS[notice.notice_type] || "border-gray-300"}
          transition-all duration-500
        `}
      >
        {notice.display_style === "celebration" ? (
          <div className="text-center h-full flex flex-col items-center justify-center">
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-4xl font-bold text-yellow-700">{notice.title}</h2>
            {notice.body && (
              <p className="text-2xl text-yellow-600 mt-4">{notice.body}</p>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">
                {TYPE_ICONS[notice.notice_type] || "📢"}
              </span>
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                {notice.notice_type}
              </span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 leading-tight">
              {notice.title}
            </h2>
            {notice.body && (
              <p className="text-xl text-gray-600 mt-4 leading-relaxed line-clamp-4">
                {notice.body}
              </p>
            )}
            {notice.event_date && (
              <div className="flex items-center gap-3 mt-6 text-xl text-indigo-600 font-semibold">
                <Calendar className="w-6 h-6" />
                {new Date(notice.event_date).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                {notice.event_time && ` at ${notice.event_time}`}
                {notice.event_location && (
                  <>
                    <MapPin className="w-5 h-5 ml-2" />
                    {notice.event_location}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation dots */}
      {notices.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {notices.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`
                w-3 h-3 rounded-full transition-all
                ${i === current ? "bg-gray-800 w-8" : "bg-gray-300"}
              `}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Upcoming Events Sidebar ─────────────────────────────────────────

function UpcomingEvents({ notices }: { notices: Notice[] }) {
  const events = notices
    .filter((n) => n.notice_type === "event" && n.event_date)
    .sort((a, b) => (a.event_date || "").localeCompare(b.event_date || ""))
    .slice(0, 5);

  return (
    <div>
      <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2 mb-3">
        <Calendar className="w-5 h-5 text-indigo-500" />
        Upcoming Events
      </h3>
      {events.length === 0 ? (
        <p className="text-gray-400 text-sm">No upcoming events</p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white/80 rounded-xl p-3 border border-gray-100"
            >
              <div className="text-xs text-indigo-600 font-semibold">
                {event.event_date &&
                  new Date(event.event_date).toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                {event.event_time && ` · ${event.event_time}`}
              </div>
              <div className="text-sm font-semibold text-gray-800 mt-0.5">
                {event.title}
              </div>
              {event.event_location && (
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {event.event_location}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Scrolling Ticker ────────────────────────────────────────────────

function Ticker({ notices }: { notices: Notice[] }) {
  const tickerItems = notices
    .filter((n) => n.priority === "urgent" || n.priority === "high" || n.display_style === "ticker")
    .map((n) => n.title);

  if (tickerItems.length === 0) return null;

  const text = tickerItems.join("     •     ");

  return (
    <div className="bg-indigo-900 text-white py-2 overflow-hidden">
      <div
        className="whitespace-nowrap text-lg font-medium"
        style={{
          animation: `scroll-left ${text.length * 0.15}s linear infinite`,
        }}
      >
        {text}     •     {text}
      </div>
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN DISPLAY PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function DisplayPage() {
  const [branding, setBranding] = useState<Branding | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [videoRooms, setVideoRooms] = useState<VideoRoom[]>([]);
  const [liveAssembly, setLiveAssembly] = useState<VideoRoom | null>(null);
  const [orgId, setOrgId] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Load branding, notices, and video rooms
  useEffect(() => {
    fetch("/api/branding")
      .then((r) => r.json())
      .then((d) => setBranding(d.branding))
      .catch(() => {});

    fetch("/api/notices?display=true&limit=30")
      .then((r) => r.json())
      .then((d) => setNotices(d.notices || []))
      .catch(() => {});

    fetch("/api/video-rooms?display=true&limit=10")
      .then((r) => r.json())
      .then((d) => {
        const rooms = d.rooms || [];
        setVideoRooms(rooms);
        // Auto-detect live assembly for this display
        const live = rooms.find(
          (r: VideoRoom) => r.status === "live" && r.auto_join_display
        );
        setLiveAssembly(live || null);
      })
      .catch(() => {});

    // Get org ID for emergency stream
    setOrgId("demo");

    // Refresh notices every 2 minutes, video rooms every 30 seconds
    const noticeRefresh = setInterval(() => {
      fetch("/api/notices?display=true&limit=30")
        .then((r) => r.json())
        .then((d) => setNotices(d.notices || []))
        .catch(() => setIsOnline(false));
    }, 120000);

    const videoRefresh = setInterval(() => {
      fetch("/api/video-rooms?display=true&limit=10")
        .then((r) => r.json())
        .then((d) => {
          const rooms = d.rooms || [];
          setVideoRooms(rooms);
          const live = rooms.find(
            (r: VideoRoom) => r.status === "live" && r.auto_join_display
          );
          setLiveAssembly(live || null);
        })
        .catch(() => {});
    }, 30000);

    // Online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(noticeRefresh);
      clearInterval(videoRefresh);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const displayNotices = notices.filter(
    (n) => n.display_style !== "ticker"
  );

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col overflow-hidden select-none">
      {/* Emergency Listener — takes over screen if alert is active */}
      {orgId && (
        <EmergencyListener
          organizationId={orgId}
          schoolName={branding?.school_name}
          schoolLogo={branding?.logo_url}
          isDisplayMode
        />
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-4"
        style={{ backgroundColor: branding?.primary_color || "#1e40af" }}
      >
        <div className="flex items-center gap-4">
          {branding?.logo_url && (
            <img
              src={branding.logo_url}
              alt=""
              className="h-12 w-12 object-contain bg-white rounded-lg p-1"
            />
          )}
          <div className="text-white">
            <h1 className="text-2xl font-bold">
              {branding?.school_name || "School Display"}
            </h1>
            {branding?.school_motto && (
              <p className="text-sm opacity-80 italic">{branding.school_motto}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-white">
          {isOnline ? (
            <Wifi className="w-5 h-5 opacity-70" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-300 animate-pulse" />
          )}
          <button onClick={toggleFullscreen} className="opacity-70 hover:opacity-100 transition">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Assembly Overlay */}
      {liveAssembly && liveAssembly.meeting_url && (
        <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-red-500 animate-pulse" />
            <div>
              <span className="text-lg font-bold">LIVE: {liveAssembly.room_name}</span>
              {liveAssembly.host_name && (
                <span className="text-sm text-gray-300 ml-3">
                  Hosted by {liveAssembly.host_name}
                </span>
              )}
            </div>
          </div>
          <a
            href={liveAssembly.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 rounded-xl font-bold transition"
          >
            <Video className="w-5 h-5" />
            Join Assembly
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Ticker */}
      <Ticker notices={notices} />

      {/* Main Content: 2/3 notices carousel, 1/3 sidebar */}
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left: Notice carousel */}
        <div className="flex-1">
          <NoticeCarousel notices={displayNotices} />
        </div>

        {/* Right sidebar */}
        <div className="w-80 flex flex-col gap-6 flex-shrink-0">
          {/* Clock */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <ClockWidget />
          </div>

          {/* Upcoming Video Meetings */}
          {videoRooms.length > 0 && (
            <div className="bg-white/80 rounded-2xl shadow-sm border p-4">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
                <Video className="w-4 h-4 text-green-600" />
                Upcoming Meetings
              </h3>
              <div className="space-y-2">
                {videoRooms.slice(0, 3).map((room) => (
                  <div
                    key={room.id}
                    className={`
                      rounded-lg p-2 text-xs
                      ${room.status === "live" ? "bg-red-50 border border-red-200" : "bg-gray-50"}
                    `}
                  >
                    <div className="flex items-center gap-1">
                      {room.status === "live" && (
                        <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                      )}
                      <span className="font-semibold text-gray-800">{room.room_name}</span>
                    </div>
                    {room.scheduled_start && (
                      <div className="text-gray-500 mt-0.5">
                        {new Date(room.scheduled_start).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="bg-white/80 rounded-2xl shadow-sm border p-4 flex-1 overflow-y-auto">
            <UpcomingEvents notices={notices} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-8 py-2 text-xs text-white/70 flex items-center justify-between"
        style={{ backgroundColor: branding?.primary_color || "#1e40af" }}
      >
        <span>Schoolgle Display Mode</span>
        <span>
          {new Date().toLocaleDateString("en-GB")} · Refreshes automatically
        </span>
      </div>
    </div>
  );
}
