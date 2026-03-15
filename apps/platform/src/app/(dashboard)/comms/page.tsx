"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Radio,
  Video,
  Megaphone,
  Calendar,
  Monitor,
  Plus,
  Clock,
  Users,
  Church,
  Music,
  Star,
  ExternalLink,
  Zap,
  Settings,
  X,
} from "lucide-react";
import { VideoRoomCard } from "@/components/video/VideoRoomEmbed";
import { NoticeFeed } from "@/components/notices/NoticeFeed";
import { QuickMessageBar } from "@/components/notices/QuickMessageBar";

// ─── Types ───────────────────────────────────────────────────────────

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
  display_message?: string;
}

interface AssemblySchedule {
  id: string;
  title: string;
  assembly_type: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location?: string;
  is_virtual: boolean;
  led_by?: string;
  worship_theme?: string;
  is_whole_school: boolean;
  target_year_groups: string[];
}

type Tab = "overview" | "video" | "notices" | "assemblies";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ASSEMBLY_ICONS: Record<string, typeof Calendar> = {
  assembly: Users,
  collective_worship: Church,
  achievement: Star,
  singing: Music,
  visitor: Users,
  class_led: Users,
  year_group: Users,
};

// ─── Create Room Modal ───────────────────────────────────────────────

function CreateRoomModal({ onClose, onCreate }: { onClose: () => void; onCreate: (room: any) => void }) {
  const [form, setForm] = useState({
    room_name: "",
    room_type: "meeting",
    provider: "google_meet",
    meeting_url: "",
    scheduled_start: "",
    scheduled_end: "",
    is_whole_school: false,
    show_on_display: false,
    auto_join_display: false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.room_name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/video-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          scheduled_start: form.scheduled_start || undefined,
          scheduled_end: form.scheduled_end || undefined,
        }),
      });
      const data = await res.json();
      onCreate(data);
      onClose();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Create Video Room</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Room Name</label>
            <input
              type="text"
              value={form.room_name}
              onChange={(e) => setForm({ ...form, room_name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="e.g. Year 4 Parents Evening, Staff CPD"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
              <select
                value={form.room_type}
                onChange={(e) => setForm({ ...form, room_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
              >
                <option value="meeting">General Meeting</option>
                <option value="assembly">Assembly</option>
                <option value="staff_briefing">Staff Briefing</option>
                <option value="parent_meeting">Parent Meeting</option>
                <option value="governor_meeting">Governors</option>
                <option value="classroom_link">Classroom Link</option>
                <option value="cpd_training">CPD / Training</option>
                <option value="external">External</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Provider</label>
              <select
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
              >
                <option value="google_meet">Google Meet</option>
                <option value="microsoft_teams">Microsoft Teams</option>
                <option value="zoom">Zoom</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Meeting URL</label>
            <input
              type="url"
              value={form.meeting_url}
              onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="https://meet.google.com/abc-defg-hij"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Start</label>
              <input
                type="datetime-local"
                value={form.scheduled_start}
                onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">End</label>
              <input
                type="datetime-local"
                value={form.scheduled_end}
                onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_whole_school}
                onChange={(e) => setForm({ ...form, is_whole_school: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span>Whole school</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_on_display}
                onChange={(e) => setForm({ ...form, show_on_display: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Monitor className="w-4 h-4 text-gray-500" />
              <span>Show on displays</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.auto_join_display}
                onChange={(e) => setForm({ ...form, auto_join_display: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span>Auto-play on boards</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!form.room_name || saving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Room"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════

export default function CommsHubPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [rooms, setRooms] = useState<VideoRoom[]>([]);
  const [assemblies, setAssemblies] = useState<AssemblySchedule[]>([]);
  const [liveCount, setLiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/video-rooms?limit=50")
        .then((r) => r.json())
        .catch(() => ({ rooms: [], liveCount: 0 })),
      fetch("/api/assemblies")
        .then((r) => r.json())
        .catch(() => ({ schedules: [] })),
    ]).then(([roomData, assemblyData]) => {
      setRooms(roomData.rooms || []);
      setLiveCount(roomData.liveCount || 0);
      setAssemblies(assemblyData.schedules || []);
      setLoading(false);
    });
  }, []);

  const handleGoLive = useCallback(async (id: string) => {
    await fetch(`/api/video-rooms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "go_live" }),
    });
    setRooms((prev) => prev.map((r) => r.id === id ? { ...r, status: "live" } : r));
    setLiveCount((c) => c + 1);
  }, []);

  const handleEnd = useCallback(async (id: string) => {
    await fetch(`/api/video-rooms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "end" }),
    });
    setRooms((prev) => prev.filter((r) => r.id !== id));
    setLiveCount((c) => Math.max(0, c - 1));
  }, []);

  const liveRooms = rooms.filter((r) => r.status === "live");
  const scheduledRooms = rooms.filter((r) => r.status === "scheduled");
  const today = new Date().getDay();
  const todaysAssemblies = assemblies.filter((a) => a.day_of_week === today);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Radio className="w-8 h-8 text-indigo-600" />
            Communication Hub
          </h1>
          <p className="text-gray-500 mt-1">
            Video meetings, assemblies, notices, and quick messages — all in one place
          </p>
        </div>
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 border border-red-300 rounded-full animate-pulse">
              <Radio className="w-4 h-4 text-red-600" />
              <span className="text-red-700 font-bold text-sm">{liveCount} LIVE</span>
            </div>
          )}
          <button
            onClick={() => setShowCreateRoom(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            <Video className="w-5 h-5" />
            New Video Room
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {[
          { id: "overview" as Tab, label: "Overview", icon: Radio },
          { id: "video" as Tab, label: "Video Rooms", icon: Video },
          { id: "notices" as Tab, label: "Notices", icon: Megaphone },
          { id: "assemblies" as Tab, label: "Assemblies", icon: Calendar },
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

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : (
        <>
          {/* Overview Tab */}
          {tab === "overview" && (
            <div className="grid grid-cols-3 gap-6">
              {/* Left: Live + upcoming rooms */}
              <div className="col-span-2 space-y-6">
                {/* Quick messages */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <QuickMessageBar />
                </div>

                {/* Live rooms */}
                {liveRooms.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                      <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                      Live Now
                    </h3>
                    <div className="space-y-3">
                      {liveRooms.map((room) => (
                        <VideoRoomCard key={room.id} room={room} onEnd={handleEnd} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Today's assemblies */}
                {todaysAssemblies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                      <Calendar className="w-5 h-5 text-indigo-500" />
                      Today&apos;s Assemblies
                    </h3>
                    <div className="space-y-2">
                      {todaysAssemblies.map((a) => {
                        const Icon = ASSEMBLY_ICONS[a.assembly_type] || Calendar;
                        return (
                          <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-50 rounded-lg">
                                <Icon className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{a.title}</div>
                                <div className="text-sm text-gray-500">
                                  {a.start_time}–{a.end_time}
                                  {a.location && ` · ${a.location}`}
                                  {a.led_by && ` · Led by ${a.led_by}`}
                                </div>
                              </div>
                            </div>
                            {a.is_virtual && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                Virtual
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Scheduled rooms */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-gray-500" />
                    Upcoming Meetings
                  </h3>
                  {scheduledRooms.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400">
                      No upcoming meetings scheduled
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scheduledRooms.slice(0, 5).map((room) => (
                        <VideoRoomCard key={room.id} room={room} compact onGoLive={handleGoLive} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right sidebar: Notice feed */}
              <div>
                <NoticeFeed mode="sidebar" maxItems={15} />
              </div>
            </div>
          )}

          {/* Video Rooms Tab */}
          {tab === "video" && (
            <div className="space-y-4">
              {rooms.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No video rooms yet</p>
                  <button
                    onClick={() => setShowCreateRoom(true)}
                    className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
                  >
                    Create First Room
                  </button>
                </div>
              ) : (
                rooms.map((room) => (
                  <VideoRoomCard key={room.id} room={room} onGoLive={handleGoLive} onEnd={handleEnd} />
                ))
              )}
            </div>
          )}

          {/* Notices Tab */}
          {tab === "notices" && (
            <NoticeFeed mode="page" maxItems={50} />
          )}

          {/* Assemblies Tab */}
          {tab === "assemblies" && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Assembly Schedule</h3>
              {assemblies.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No assemblies scheduled</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((day) => {
                    const dayAssemblies = assemblies.filter((a) => a.day_of_week === day);
                    if (dayAssemblies.length === 0) return null;
                    return (
                      <div key={day}>
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                          {DAYS[day]}
                          {day === today && (
                            <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full normal-case font-semibold">
                              Today
                            </span>
                          )}
                        </h4>
                        <div className="space-y-2">
                          {dayAssemblies.map((a) => {
                            const Icon = ASSEMBLY_ICONS[a.assembly_type] || Calendar;
                            return (
                              <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-indigo-50 rounded-lg">
                                    <Icon className="w-5 h-5 text-indigo-600" />
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{a.title}</div>
                                    <div className="text-sm text-gray-500">
                                      {a.start_time}–{a.end_time}
                                      {a.location && ` · ${a.location}`}
                                      {a.led_by && ` · ${a.led_by}`}
                                    </div>
                                    {a.worship_theme && (
                                      <div className="text-xs text-violet-600 mt-0.5">
                                        Theme: {a.worship_theme}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {a.is_whole_school ? (
                                    <span className="text-xs text-gray-400">Whole school</span>
                                  ) : (
                                    <span className="text-xs text-gray-400">
                                      {a.target_year_groups?.join(", ")}
                                    </span>
                                  )}
                                  {a.is_virtual && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                      Virtual
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onCreate={(room) => setRooms((prev) => [room, ...prev])}
        />
      )}
    </div>
  );
}
