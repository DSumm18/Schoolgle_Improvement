"use client";

import { useState, useEffect } from "react";
import {
  Megaphone,
  Calendar,
  Bell,
  Star,
  Shield,
  Wrench,
  UtensilsCrossed,
  Users,
  Trophy,
  Church,
  Pin,
  Clock,
  Eye,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { authFetch } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────

export interface Notice {
  id: string;
  title: string;
  body?: string;
  image_url?: string;
  notice_type: string;
  priority: string;
  pin_to_top: boolean;
  display_style: string;
  event_date?: string;
  event_time?: string;
  event_location?: string;
  created_by_name?: string;
  publish_at: string;
  expires_at?: string;
  view_count: number;
  acknowledgement_required: boolean;
}

// ─── Icon & colour mapping ───────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: typeof Megaphone; color: string; bg: string }> = {
  announcement: { icon: Megaphone, color: "text-blue-600", bg: "bg-blue-50" },
  event: { icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
  reminder: { icon: Bell, color: "text-amber-600", bg: "bg-amber-50" },
  celebration: { icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
  safeguarding: { icon: Shield, color: "text-red-600", bg: "bg-red-50" },
  maintenance: { icon: Wrench, color: "text-gray-600", bg: "bg-gray-50" },
  menu: { icon: UtensilsCrossed, color: "text-green-600", bg: "bg-green-50" },
  pta: { icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  sport: { icon: Trophy, color: "text-orange-600", bg: "bg-orange-50" },
  worship: { icon: Church, color: "text-violet-600", bg: "bg-violet-50" },
  custom: { icon: Megaphone, color: "text-gray-600", bg: "bg-gray-50" },
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "border-l-4 border-l-red-500 bg-red-50",
  high: "border-l-4 border-l-amber-500 bg-amber-50/50",
  normal: "border-l-4 border-l-transparent",
  low: "border-l-4 border-l-gray-200 opacity-80",
};

// ─── Notice Card ─────────────────────────────────────────────────────

function NoticeCard({ notice }: { notice: Notice }) {
  const config = TYPE_CONFIG[notice.notice_type] || TYPE_CONFIG.custom;
  const Icon = config.icon;
  const timeAgo = getTimeAgo(notice.publish_at);

  return (
    <div
      className={`
        rounded-xl p-4 transition hover:shadow-md
        ${PRIORITY_STYLES[notice.priority] || PRIORITY_STYLES.normal}
        ${notice.priority === "urgent" ? "animate-pulse-slow" : ""}
        bg-white border border-gray-100
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {notice.pin_to_top && (
              <Pin className="w-3 h-3 text-red-500 flex-shrink-0" />
            )}
            <h4 className="font-semibold text-gray-900 text-sm truncate">
              {notice.title}
            </h4>
          </div>
          {notice.body && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {notice.body}
            </p>
          )}
          {notice.event_date && (
            <div className="flex items-center gap-2 mt-2 text-xs text-indigo-600">
              <Calendar className="w-3 h-3" />
              {new Date(notice.event_date).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
              {notice.event_time && ` at ${notice.event_time}`}
              {notice.event_location && (
                <>
                  <MapPin className="w-3 h-3 ml-1" />
                  {notice.event_location}
                </>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo}
            </span>
            {notice.created_by_name && (
              <span>{notice.created_by_name}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Display-mode Card (larger, for classroom boards) ────────────────

function DisplayNoticeCard({ notice }: { notice: Notice }) {
  const config = TYPE_CONFIG[notice.notice_type] || TYPE_CONFIG.custom;
  const Icon = config.icon;

  if (notice.display_style === "celebration") {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl p-6 text-center">
        <Star className="w-10 h-10 text-yellow-500 mx-auto mb-3" />
        <h3 className="text-2xl font-bold text-yellow-800">{notice.title}</h3>
        {notice.body && (
          <p className="text-lg text-yellow-700 mt-2">{notice.body}</p>
        )}
      </div>
    );
  }

  if (notice.display_style === "banner") {
    return (
      <div className={`${config.bg} border-2 border-current rounded-2xl p-4 ${config.color}`}>
        <div className="flex items-center gap-3">
          <Icon className="w-8 h-8 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold">{notice.title}</h3>
            {notice.body && (
              <p className="text-sm opacity-80 mt-1">{notice.body}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default card style
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${config.bg}`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{notice.title}</h3>
          {notice.body && (
            <p className="text-gray-600 mt-1">{notice.body}</p>
          )}
          {notice.event_date && (
            <div className="flex items-center gap-2 mt-3 text-indigo-600 font-semibold">
              <Calendar className="w-5 h-5" />
              {new Date(notice.event_date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              {notice.event_time && ` at ${notice.event_time}`}
              {notice.event_location && (
                <>
                  <span className="mx-1">—</span>
                  <MapPin className="w-4 h-4" />
                  {notice.event_location}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Scrolling Ticker ────────────────────────────────────────────────

function NoticeTicker({ notices }: { notices: Notice[] }) {
  const tickerNotices = notices.filter((n) => n.display_style === "ticker" || n.priority === "urgent");
  if (tickerNotices.length === 0) return null;

  const text = tickerNotices.map((n) => `${n.title}${n.body ? ` — ${n.body}` : ""}`).join("   •   ");

  return (
    <div className="bg-indigo-900 text-white py-2 overflow-hidden">
      <div className="animate-scroll-left whitespace-nowrap text-sm font-medium">
        {text}   •   {text}
      </div>
    </div>
  );
}

// ─── Main Feed Component ─────────────────────────────────────────────

interface NoticeFeedProps {
  mode?: "sidebar" | "display" | "page";
  maxItems?: number;
  types?: string[];
  className?: string;
}

export function NoticeFeed({
  mode = "sidebar",
  maxItems = 20,
  types,
  className = "",
}: NoticeFeedProps) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);
  const { organizationId } = useAuth();

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ limit: maxItems.toString() });
    if (types && types.length > 0) {
      params.set("type", types[0]);
    }

    authFetch(`/api/notices?${params}`, { organizationId })
      .then((r) => r.json())
      .then((d) => {
        setNotices(d.notices || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [maxItems, types, organizationId]);

  const filtered = filter
    ? notices.filter((n) => n.notice_type === filter)
    : notices;

  if (loading) {
    return (
      <div className={`text-center py-8 text-gray-400 ${className}`}>
        Loading notices...
      </div>
    );
  }

  // Sidebar mode (RHS feed on dashboard)
  if (mode === "sidebar") {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-indigo-600" />
            School Feed
          </h3>
          <span className="text-xs text-gray-400">{notices.length} notices</span>
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-1 mb-3">
          <button
            onClick={() => setFilter(null)}
            className={`px-2 py-0.5 rounded text-xs font-medium transition ${
              !filter ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {["event", "celebration", "reminder", "sport"].map((t) => {
            const cfg = TYPE_CONFIG[t];
            const Icon = cfg.icon;
            return (
              <button
                key={t}
                onClick={() => setFilter(filter === t ? null : t)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition flex items-center gap-1 ${
                  filter === t ? `${cfg.bg} ${cfg.color}` : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-3 h-3" />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">
            No notices to show
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Display mode (classroom boards)
  if (mode === "display") {
    return (
      <div className={className}>
        <NoticeTicker notices={notices} />
        <div className="space-y-4 p-4">
          {filtered.slice(0, maxItems).map((notice) => (
            <DisplayNoticeCard key={notice.id} notice={notice} />
          ))}
        </div>
      </div>
    );
  }

  // Page mode (full notice board)
  return (
    <div className={className}>
      <div className="space-y-3">
        {filtered.map((notice) => (
          <NoticeCard key={notice.id} notice={notice} />
        ))}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
