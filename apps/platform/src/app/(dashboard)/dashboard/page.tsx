"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from "swr";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import { MODULES, APPS, canUserAccess, Role } from "@/lib/modules/registry";
import { MyTasksWidget } from "@/components/dashboard/MyTasksWidget";
import { DashboardFeed } from "@/components/display/DashboardFeed";
import Link from "next/link";
import {
  Megaphone,
  Pin,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Flame,
  BookOpen,
  Shield,
  UserMinus,
  Monitor,
  GraduationCap,
  ClipboardList,
  Link as LinkIcon,
  Plus,
  ChevronRight,
  Sun,
  Sunrise,
  Moon,
  Users,
  LayoutGrid,
  AlertCircle,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";

// Icon mapping for quick links
const iconMap: Record<string, React.ElementType> = {
  flame: Flame,
  "book-open": BookOpen,
  shield: Shield,
  "user-minus": UserMinus,
  monitor: Monitor,
  calendar: Calendar,
  "graduation-cap": GraduationCap,
  "clipboard-list": ClipboardList,
  link: LinkIcon,
};

// Event type colors
const eventTypeColors: Record<string, string> = {
  meeting: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  training:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  assembly:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  trip: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  deadline: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  holiday: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
  inspection:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  general: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

// Priority colors for announcements
const priorityColors: Record<string, string> = {
  urgent: "border-l-red-500 bg-red-50 dark:bg-red-950/20",
  high: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
  normal: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10",
  low: "border-l-slate-300 bg-slate-50 dark:bg-slate-950/10",
};

function getGreeting(): { text: string; icon: React.ElementType } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", icon: Sunrise };
  if (hour < 17) return { text: "Good afternoon", icon: Sun };
  return { text: "Good evening", icon: Moon };
}

function formatTime(time: string | null): string {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "pm" : "am";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m}${ampm}`;
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Modal Backdrop ──────────────────────────────────────────────────

function ModalBackdrop({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── New Announcement Modal ──────────────────────────────────────────

function NewAnnouncementModal({
  organizationId,
  userName,
  userId,
  onClose,
}: {
  organizationId: string;
  userName: string;
  userId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/intranet/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title: title.trim(),
          content: content.trim(),
          priority,
          pinned,
          authorName: userName,
          authorId: userId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create announcement");
      }

      mutate(`/api/intranet/announcements?organizationId=${organizationId}`);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">New Announcement</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Staff meeting rescheduled"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded border-border"
                />
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-sm font-medium">Pin to top</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim() || !content.trim()}
            className="px-5 py-2 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Posting..." : "Post Announcement"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

// ─── Add Event Modal ─────────────────────────────────────────────────

function AddEventModal({
  organizationId,
  userId,
  onClose,
}: {
  organizationId: string;
  userId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState("general");
  const [allDay, setAllDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !eventDate) {
      setError("Title and date are required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/intranet/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          title: title.trim(),
          description: description.trim() || null,
          eventDate,
          startTime: allDay ? null : startTime || null,
          endTime: allDay ? null : endTime || null,
          location: location.trim() || null,
          eventType,
          allDay,
          createdBy: userId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create event");
      }

      mutate(`/api/intranet/events?organizationId=${organizationId}&days=7`);
      onClose();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Add Event</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Year 6 Parents Evening"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Date</label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5">Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              >
                <option value="general">General</option>
                <option value="meeting">Meeting</option>
                <option value="training">Training</option>
                <option value="assembly">Assembly</option>
                <option value="trip">Trip</option>
                <option value="deadline">Deadline</option>
                <option value="holiday">Holiday</option>
                <option value="inspection">Inspection</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm font-medium">All day event</span>
            </label>
          </div>

          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Location{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Hall"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any details..."
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>

        <div className="p-5 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim() || !eventDate}
            className="px-5 py-2 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Adding..." : "Add Event"}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
}

// ─── Main Dashboard Page ─────────────────────────────────────────────

export default function DashboardPage() {
  const { user, organization } = useAuth();
  const organizationId = organization?.id || "";
  const userRole = organization?.role as Role;
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const userName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Staff";
  const userId = user?.id || "";

  // Fetch intranet data
  const { data: announcements = [] } = useSWR(
    organizationId
      ? `/api/intranet/announcements?organizationId=${organizationId}`
      : null,
    fetcher,
    { refreshInterval: 60000 },
  );

  const { data: quickLinks = [] } = useSWR(
    organizationId
      ? `/api/intranet/quick-links?organizationId=${organizationId}`
      : null,
    fetcher,
  );

  const { data: events = [] } = useSWR(
    organizationId
      ? `/api/intranet/events?organizationId=${organizationId}&days=7`
      : null,
    fetcher,
    { refreshInterval: 300000 },
  );

  // Group events by date
  const eventsByDate = (events as any[]).reduce(
    (acc: Record<string, any[]>, event: any) => {
      const dateLabel = formatEventDate(event.event_date);
      if (!acc[dateLabel]) acc[dateLabel] = [];
      acc[dateLabel].push(event);
      return acc;
    },
    {},
  );

  // Get accessible modules — show all if no role set yet (new user)
  const accessibleModules = userRole
    ? MODULES.filter((m) => canUserAccess(m.requiredPermissions, userRole))
    : MODULES;

  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const canManage = userRole === "admin" || userRole === "slt";

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Modals */}
      <AnimatePresence>
        {showAnnouncementModal && (
          <NewAnnouncementModal
            organizationId={organizationId}
            userName={userName}
            userId={userId}
            onClose={() => setShowAnnouncementModal(false)}
          />
        )}
        {showEventModal && (
          <AddEventModal
            organizationId={organizationId}
            userId={userId}
            onClose={() => setShowEventModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <GreetingIcon className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-black tracking-tight">
              {greeting.text}, {displayName}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-9">
            {currentDate}
            {organization?.name && (
              <span className="ml-2 text-primary font-semibold">
                &middot; {organization.name}
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* My Tasks Widget */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <MyTasksWidget limit={8} />
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Announcements + Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Announcements</h2>
                {(announcements as any[]).length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                    {(announcements as any[]).length}
                  </span>
                )}
              </div>
              {canManage && (
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="text-xs text-primary font-medium flex items-center gap-1 hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New
                </button>
              )}
            </div>

            <div className="divide-y divide-border">
              {(announcements as any[]).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No announcements yet</p>
                  {canManage && (
                    <button
                      onClick={() => setShowAnnouncementModal(true)}
                      className="mt-3 text-sm text-primary font-medium hover:underline"
                    >
                      Create the first announcement
                    </button>
                  )}
                </div>
              ) : (
                (announcements as any[]).map((ann: any, i: number) => (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-4 border-l-4 ${priorityColors[ann.priority] || priorityColors.normal}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {ann.pinned && (
                            <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <h3 className="font-bold text-sm truncate">
                            {ann.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {ann.content}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {ann.author_name && (
                            <span className="font-medium">
                              {ann.author_name}
                            </span>
                          )}
                          <span>{timeAgo(ann.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* What's Happening This Week */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">This Week</h2>
              </div>
              {canManage && (
                <button
                  onClick={() => setShowEventModal(true)}
                  className="text-xs text-primary font-medium flex items-center gap-1 hover:text-primary/80 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Event
                </button>
              )}
            </div>

            <div className="divide-y divide-border">
              {Object.keys(eventsByDate).length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No events this week</p>
                  {canManage && (
                    <button
                      onClick={() => setShowEventModal(true)}
                      className="mt-3 text-sm text-primary font-medium hover:underline"
                    >
                      Add the first event
                    </button>
                  )}
                </div>
              ) : (
                Object.entries(eventsByDate).map(([dateLabel, dayEvents]) => (
                  <div key={dateLabel} className="p-4">
                    <h3
                      className={`text-xs font-bold uppercase tracking-wider mb-3 ${dateLabel === "Today" ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {dateLabel}
                    </h3>
                    <div className="space-y-2">
                      {(dayEvents as any[]).map((event: any) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-3 group"
                        >
                          <div
                            className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${eventTypeColors[event.event_type] || eventTypeColors.general}`}
                          >
                            {event.event_type}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">
                              {event.title}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              {event.start_time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(event.start_time)}
                                  {event.end_time &&
                                    ` - ${formatTime(event.end_time)}`}
                                </span>
                              )}
                              {event.all_day && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  All day
                                </span>
                              )}
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </span>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Quick Links + Modules */}
        <div className="space-y-6">
          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-lg">Quick Links</h2>
              </div>
              {canManage && (
                <button
                  disabled
                  className="text-xs text-muted-foreground font-medium flex items-center gap-1 transition-colors opacity-50 cursor-not-allowed"
                  title="Coming Soon"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add (Coming Soon)
                </button>
              )}
            </div>

            <div className="p-3 grid grid-cols-2 gap-2">
              {(quickLinks as any[]).length === 0 ? (
                <div className="col-span-2 p-6 text-center text-muted-foreground">
                  <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No quick links set up yet</p>
                </div>
              ) : (
                (quickLinks as any[]).map((link: any) => {
                  const Icon = iconMap[link.icon] || LinkIcon;
                  return (
                    <button
                      key={link.id}
                      className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-accent transition-colors text-left group"
                      onClick={() => {
                        if (link.url) window.open(link.url, "_blank");
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">
                          {link.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {link.category}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* School Feed */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl overflow-hidden p-4"
          >
            <DashboardFeed className="w-full" />
          </motion.div>

          {/* My Modules */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg">My Modules</h2>
            </div>

            <div className="p-3 space-y-1">
              {accessibleModules.map((module) => {
                const moduleApps = APPS.filter(
                  (a) =>
                    a.moduleId === module.id &&
                    canUserAccess(a.requiredPermissions, userRole),
                );

                const colorMap: Record<string, string> = {
                  rose: "bg-rose-500",
                  blue: "bg-blue-500",
                  teal: "bg-teal-500",
                  purple: "bg-purple-500",
                  amber: "bg-amber-500",
                  indigo: "bg-indigo-500",
                  gray: "bg-slate-500",
                  sky: "bg-sky-500",
                };

                return (
                  <Link
                    key={module.id}
                    href={`/dashboard/${module.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent transition-colors group"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorMap[module.color] || "bg-primary"} text-white`}
                    >
                      <module.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">
                        {module.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {moduleApps.length} app
                        {moduleApps.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Today's Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm">Quick Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card/80 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-primary">
                  {
                    (events as any[]).filter(
                      (e: any) => formatEventDate(e.event_date) === "Today",
                    ).length
                  }
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Today&apos;s Events
                </p>
              </div>
              <div className="bg-card/80 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-primary">
                  {(announcements as any[]).filter((a: any) => a.pinned).length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Pinned Items
                </p>
              </div>
              <div className="bg-card/80 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-primary">
                  {(events as any[]).length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  This Week
                </p>
              </div>
              <div className="bg-card/80 rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-primary">
                  {(quickLinks as any[]).length}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Quick Links
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
