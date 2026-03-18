"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Megaphone,
  Eye,
  CheckCircle2,
  Monitor,
  Wifi,
  AlertTriangle,
  Radio,
  Clock,
  TrendingUp,
  ArrowLeft,
  Zap,
  Users,
  Volume2,
  Calendar,
  Send,
  Bell,
} from "lucide-react";

interface AnalyticsData {
  summary: {
    totalNotices: number;
    totalViews: number;
    totalAcknowledgements: number;
    urgentNotices: number;
    onlineDevices: number;
    totalDevices: number;
    totalBroadcasts: number;
    drillCount: number;
    realAlertCount: number;
    scheduledPending: number;
    avgResponseTimeSeconds: number | null;
  };
  typeBreakdown: Record<string, number>;
  audienceBreakdown: Record<string, number>;
  dailyActivity: Record<string, number>;
  channelBreakdown: Record<string, number>;
}

const RANGE_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "14d", label: "14 days" },
  { value: "30d", label: "30 days" },
];

const TYPE_COLORS: Record<string, string> = {
  announcement: "bg-indigo-500",
  event: "bg-blue-500",
  reminder: "bg-amber-500",
  celebration: "bg-yellow-500",
  safeguarding: "bg-red-500",
  maintenance: "bg-slate-500",
  menu: "bg-orange-500",
  pta: "bg-pink-500",
  sport: "bg-green-500",
  worship: "bg-violet-500",
  custom: "bg-gray-500",
};

const AUDIENCE_LABELS: Record<string, string> = {
  all: "Everyone",
  all_staff: "All Staff",
  teachers: "Teachers",
  support_staff: "Support Staff",
  slt: "Senior Leaders",
  governors: "Governors",
  parents: "Parents",
  pupils: "Pupils",
};

export default function CommsAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [range, setRange] = useState("7d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/comms/analytics?range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range]);

  const s = data?.summary;

  // Compute max for bar chart scaling
  const dailyValues = Object.values(data?.dailyActivity || {});
  const maxDaily = Math.max(...dailyValues, 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/comms"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Comms Hub
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Communication Analytics
          </h1>
          <p className="text-gray-500 mt-1">
            Track message reach, engagement, and device connectivity
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGE_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                range === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading analytics...</div>
      ) : !data ? (
        <div className="text-center py-20 text-gray-400">No data available yet</div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Megaphone}
              label="Notices Sent"
              value={s?.totalNotices || 0}
              color="indigo"
            />
            <StatCard
              icon={Eye}
              label="Total Views"
              value={s?.totalViews || 0}
              color="blue"
            />
            <StatCard
              icon={CheckCircle2}
              label="Acknowledged"
              value={s?.totalAcknowledgements || 0}
              color="green"
            />
            <StatCard
              icon={AlertTriangle}
              label="Urgent Notices"
              value={s?.urgentNotices || 0}
              color="red"
            />
          </div>

          {/* Second row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Monitor}
              label="Devices Online"
              value={`${s?.onlineDevices || 0}/${s?.totalDevices || 0}`}
              color="teal"
              subtitle={s?.totalDevices ? `${Math.round(((s?.onlineDevices || 0) / s.totalDevices) * 100)}% uptime` : undefined}
            />
            <StatCard
              icon={Radio}
              label="Broadcasts"
              value={s?.totalBroadcasts || 0}
              color="orange"
              subtitle={`${s?.drillCount || 0} drills · ${s?.realAlertCount || 0} real`}
            />
            <StatCard
              icon={Clock}
              label="Avg Response"
              value={s?.avgResponseTimeSeconds ? `${Math.floor(s.avgResponseTimeSeconds / 60)}m ${s.avgResponseTimeSeconds % 60}s` : "—"}
              color="purple"
              subtitle="Broadcast to all-clear"
            />
            <StatCard
              icon={Calendar}
              label="Scheduled"
              value={s?.scheduledPending || 0}
              color="amber"
              subtitle="Pending notices"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Activity */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Daily Activity
              </h3>
              {Object.keys(data.dailyActivity).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No activity in this period</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(data.dailyActivity)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, count]) => {
                      const dayName = new Date(date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
                      const pct = (count / maxDaily) * 100;
                      return (
                        <div key={date} className="flex items-center gap-3">
                          <div className="w-24 text-xs text-gray-500 text-right font-medium">{dayName}</div>
                          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="w-8 text-xs text-gray-600 font-bold">{count}</div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Notice Type Breakdown */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-amber-600" />
                Notice Types
              </h3>
              {Object.keys(data.typeBreakdown).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No notices in this period</div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data.typeBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([type, count]) => {
                      const total = Object.values(data.typeBreakdown).reduce((s, v) => s + v, 0);
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${TYPE_COLORS[type] || "bg-gray-400"}`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                              <span className="text-xs text-gray-500">{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${TYPE_COLORS[type] || "bg-gray-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Audience breakdown & Channel breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audience */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-green-600" />
                Audience Reach
              </h3>
              {Object.keys(data.audienceBreakdown).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No data yet</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(data.audienceBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([audience, count]) => (
                      <div key={audience} className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className="text-2xl font-black text-gray-800">{count}</div>
                        <div className="text-xs text-gray-500 font-medium">{AUDIENCE_LABELS[audience] || audience}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Channel */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                <Send className="w-5 h-5 text-blue-600" />
                Delivery Channels
              </h3>
              {Object.keys(data.channelBreakdown).length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  Channel data will appear as notices are viewed and acknowledged
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(data.channelBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([channel, count]) => {
                      const icons: Record<string, typeof Monitor> = {
                        display: Monitor,
                        dashboard: BarChart3,
                        email: Send,
                        push: Bell,
                        sms: Volume2,
                        pa: Volume2,
                      };
                      const Icon = icons[channel] || Bell;
                      return (
                        <div key={channel} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                          <Icon className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-lg font-black text-gray-800">{count}</div>
                            <div className="text-xs text-gray-500 capitalize">{channel}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  subtitle,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    teal: "bg-teal-50 text-teal-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl ${colorMap[color] || "bg-gray-50 text-gray-600"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-3xl font-black text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}
