"use client";

import { useState, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Calendar,
  Bell,
  Star,
  Shield,
  Wrench,
  UtensilsCrossed,
  Users,
  Trophy,
  Church,
  Monitor,
  Send,
  X,
  FileText,
  Clock,
} from "lucide-react";
import { NoticeFeed } from "@/components/notices/NoticeFeed";
import { QuickMessageBar } from "@/components/notices/QuickMessageBar";
import { ParentNotificationPreview } from "@/components/notices/ParentNotificationPreview";
import { NoticeTemplates } from "@/components/notices/NoticeTemplates";

const NOTICE_TYPES = [
  { value: "announcement", label: "Announcement", icon: Megaphone },
  { value: "event", label: "Event", icon: Calendar },
  { value: "reminder", label: "Reminder", icon: Bell },
  { value: "celebration", label: "Celebration", icon: Star },
  { value: "safeguarding", label: "Safeguarding", icon: Shield },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
  { value: "menu", label: "Lunch Menu", icon: UtensilsCrossed },
  { value: "pta", label: "PTA / Friends", icon: Users },
  { value: "sport", label: "Sports", icon: Trophy },
  { value: "worship", label: "Worship / Assembly", icon: Church },
];

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "all_staff", label: "All Staff" },
  { value: "teachers", label: "Teachers" },
  { value: "support_staff", label: "Support Staff" },
  { value: "slt", label: "Senior Leaders" },
  { value: "governors", label: "Governors" },
  { value: "parents", label: "Parents" },
  { value: "pupils", label: "Pupils (displays)" },
];

const DISPLAY_STYLES = [
  { value: "card", label: "Card" },
  { value: "banner", label: "Banner" },
  { value: "hero", label: "Hero Image" },
  { value: "ticker", label: "Scrolling Ticker" },
  { value: "countdown", label: "Countdown" },
  { value: "celebration", label: "Celebration" },
];

export default function NoticesPage() {
  const [showComposer, setShowComposer] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [recurrence, setRecurrence] = useState("none");

  // Form state
  const [form, setForm] = useState({
    title: "",
    body: "",
    notice_type: "announcement",
    priority: "normal",
    audience: "all_staff",
    show_on_display: true,
    show_on_dashboard: true,
    pin_to_top: false,
    display_style: "card",
    event_date: "",
    event_time: "",
    event_location: "",
    expires_at: "",
    image_url: "",
  });

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectTemplate = (template: any) => {
    setForm((prev) => ({
      ...prev,
      title: template.title_template,
      body: template.body_template,
      notice_type: template.notice_type,
      audience: template.default_audience,
      priority: template.default_priority,
      display_style: template.default_display_style,
      show_on_display: template.default_show_on_display,
      show_on_dashboard: template.default_show_on_dashboard,
    }));
    setShowTemplates(false);
    setShowComposer(true);
  };

  const handleSubmit = useCallback(async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const noticePayload = {
        ...form,
        event_date: form.event_date || undefined,
        event_time: form.event_time || undefined,
        expires_at: form.expires_at || undefined,
        image_url: form.image_url || undefined,
      };

      if (scheduleMode && scheduledFor) {
        // Schedule for later
        await fetch("/api/notices/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...noticePayload,
            scheduled_for: scheduledFor,
            recurrence,
          }),
        });
      } else {
        // Publish immediately
        await fetch("/api/notices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(noticePayload),
        });
      }

      setShowComposer(false);
      setScheduleMode(false);
      setScheduledFor("");
      setRecurrence("none");
      setForm({
        title: "",
        body: "",
        notice_type: "announcement",
        priority: "normal",
        audience: "all_staff",
        show_on_display: true,
        show_on_dashboard: true,
        pin_to_top: false,
        display_style: "card",
        event_date: "",
        event_time: "",
        event_location: "",
        expires_at: "",
        image_url: "",
      });
      window.location.reload();
    } catch {
      // error
    } finally {
      setSaving(false);
    }
  }, [form, scheduleMode, scheduledFor, recurrence]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-indigo-600" />
            School Notices
          </h1>
          <p className="text-gray-500 mt-1">
            Announcements, events, reminders, and celebrations — shown across displays and the dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            <FileText className="w-5 h-5 text-indigo-600" />
            Templates
          </button>
          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" />
            New Notice
          </button>
        </div>
      </div>

      {/* Quick Messages */}
      <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
        <QuickMessageBar />
      </div>

      {/* Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Create Notice</h2>
              <button onClick={() => setShowComposer(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <div className="flex flex-wrap gap-2">
                  {NOTICE_TYPES.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => updateForm("notice_type", value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                        form.notice_type === value
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Summer Fayre — Saturday 5th July"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                <textarea
                  value={form.body}
                  onChange={(e) => updateForm("body", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Details..."
                />
              </div>

              {/* Event fields */}
              {form.notice_type === "event" && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                    <input
                      type="date"
                      value={form.event_date}
                      onChange={(e) => updateForm("event_date", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Time</label>
                    <input
                      type="time"
                      value={form.event_time}
                      onChange={(e) => updateForm("event_time", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                    <input
                      type="text"
                      value={form.event_location}
                      onChange={(e) => updateForm("event_location", e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. Main Hall"
                    />
                  </div>
                </div>
              )}

              {/* Audience & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => updateForm("audience", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {AUDIENCES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => updateForm("priority", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Display options */}
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_on_display}
                    onChange={(e) => updateForm("show_on_display", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Monitor className="w-4 h-4 text-gray-500" />
                  <span>Show on displays</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.show_on_dashboard}
                    onChange={(e) => updateForm("show_on_dashboard", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Show on dashboard</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.pin_to_top}
                    onChange={(e) => updateForm("pin_to_top", e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Pin to top</span>
                </label>
              </div>

              {/* Display style */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Display Style</label>
                <div className="flex flex-wrap gap-2">
                  {DISPLAY_STYLES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updateForm("display_style", value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                        form.display_style === value
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                          : "bg-gray-50 border-gray-200 text-gray-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parent Notification Preview */}
              {(form.audience === "all" || form.audience === "parents") && form.title.trim() && (
                <ParentNotificationPreview
                  content={{
                    title: form.title,
                    body: form.body,
                    notice_type: form.notice_type,
                    priority: form.priority,
                    event_date: form.event_date || undefined,
                    event_time: form.event_time || undefined,
                    event_location: form.event_location || undefined,
                  }}
                />
              )}

              {/* Expiry */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Auto-expire (optional)
                </label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => updateForm("expires_at", e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Schedule toggle */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-blue-800 mb-2">
                  <input
                    type="checkbox"
                    checked={scheduleMode}
                    onChange={(e) => setScheduleMode(e.target.checked)}
                    className="rounded border-blue-300"
                  />
                  <Clock className="w-4 h-4" />
                  Schedule for later
                </label>
                {scheduleMode && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 mb-1">Send at</label>
                      <input
                        type="datetime-local"
                        value={scheduledFor}
                        onChange={(e) => setScheduledFor(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-700 mb-1">Repeat</label>
                      <select
                        value={recurrence}
                        onChange={(e) => setRecurrence(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none bg-white"
                      >
                        <option value="none">Once only</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="term_start">Every term start</option>
                        <option value="term_end">Every term end</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.title.trim() || saving || (scheduleMode && !scheduledFor)}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {scheduleMode ? (
                  <>
                    <Clock className="w-4 h-4" />
                    {saving ? "Scheduling..." : "Schedule Notice"}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {saving ? "Publishing..." : "Publish Notice"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <NoticeTemplates
          onSelect={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Notice Feed */}
      <NoticeFeed mode="page" maxItems={50} />
    </div>
  );
}
