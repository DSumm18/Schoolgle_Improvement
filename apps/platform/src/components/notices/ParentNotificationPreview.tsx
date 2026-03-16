"use client";

import { useState } from "react";
import {
  Mail,
  Smartphone,
  MessageSquare,
  Eye,
  Send,
  ChevronRight,
  CheckCircle2,
  School,
  Clock,
  Calendar,
  MapPin,
  ExternalLink,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// PARENT NOTIFICATION PREVIEW
// Shows staff how their notice/message will appear to parents across
// different channels: email, app push notification, SMS
// ═══════════════════════════════════════════════════════════════════════

interface NotificationContent {
  title: string;
  body: string;
  notice_type?: string;
  priority?: string;
  event_date?: string;
  event_time?: string;
  event_location?: string;
  school_name?: string;
  school_logo?: string;
}

type PreviewChannel = "email" | "push" | "sms";

interface ParentNotificationPreviewProps {
  content: NotificationContent;
  onSend?: (channels: PreviewChannel[]) => void;
  className?: string;
}

export function ParentNotificationPreview({
  content,
  onSend,
  className = "",
}: ParentNotificationPreviewProps) {
  const [activeChannel, setActiveChannel] = useState<PreviewChannel>("email");
  const [selectedChannels, setSelectedChannels] = useState<PreviewChannel[]>(["email", "push"]);
  const [sent, setSent] = useState(false);

  const toggleChannel = (ch: PreviewChannel) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSend = () => {
    if (onSend && selectedChannels.length > 0) {
      onSend(selectedChannels);
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
  };

  const schoolName = content.school_name || "School";
  const truncatedBody = content.body.length > 160
    ? content.body.slice(0, 157) + "..."
    : content.body;

  const channels: { id: PreviewChannel; label: string; icon: typeof Mail; desc: string }[] = [
    { id: "email", label: "Email", icon: Mail, desc: "Full HTML email to parents" },
    { id: "push", label: "App Push", icon: Smartphone, desc: "Mobile app notification" },
    { id: "sms", label: "SMS", icon: MessageSquare, desc: "Text message (costs apply)" },
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-sm text-gray-800">Parent Notification Preview</span>
        </div>
        <div className="flex gap-1">
          {channels.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveChannel(id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition
                ${activeChannel === id
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-100"
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Area */}
      <div className="p-5 bg-gray-50 min-h-[300px] flex items-center justify-center">
        {activeChannel === "email" && (
          <EmailPreview content={content} schoolName={schoolName} />
        )}
        {activeChannel === "push" && (
          <PushPreview content={content} schoolName={schoolName} />
        )}
        {activeChannel === "sms" && (
          <SMSPreview content={content} schoolName={schoolName} />
        )}
      </div>

      {/* Send Controls */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between">
        <div className="flex gap-3">
          {channels.map(({ id, label, icon: Icon }) => (
            <label key={id} className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selectedChannels.includes(id)}
                onChange={() => toggleChannel(id)}
                className="rounded border-gray-300"
              />
              <Icon className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-gray-700">{label}</span>
            </label>
          ))}
        </div>
        {onSend && (
          <button
            onClick={handleSend}
            disabled={selectedChannels.length === 0 || sent}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition
              ${sent
                ? "bg-green-600 text-white"
                : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              }
            `}
          >
            {sent ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Sent!
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to Parents
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Email Preview ─────────────────────────────────────────────────

function EmailPreview({ content, schoolName }: { content: NotificationContent; schoolName: string }) {
  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border">
      {/* Email header bar */}
      <div className="bg-gray-100 px-4 py-2 flex items-center gap-2 text-xs text-gray-500 border-b">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <span className="ml-2">Inbox</span>
      </div>
      {/* Email meta */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <School className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{schoolName}</div>
            <div className="text-xs text-gray-400">notifications@schoolgle.co.uk</div>
          </div>
        </div>
        <h3 className="font-bold text-gray-900 mt-2">{content.title}</h3>
      </div>
      {/* Email body */}
      <div className="px-5 py-4">
        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{content.body}</p>

        {content.event_date && (
          <div className="mt-4 bg-indigo-50 rounded-lg p-3 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-indigo-800">
                {new Date(content.event_date).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              {content.event_time && (
                <div className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {content.event_time}
                </div>
              )}
              {content.event_location && (
                <div className="text-xs text-indigo-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {content.event_location}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
          Sent via {schoolName} on Schoolgle
          <br />
          <a href="#" className="text-indigo-500 hover:underline">Manage notification preferences</a>
        </div>
      </div>
    </div>
  );
}

// ─── Push Notification Preview ─────────────────────────────────────

function PushPreview({ content, schoolName }: { content: NotificationContent; schoolName: string }) {
  const truncated = content.body.length > 120
    ? content.body.slice(0, 117) + "..."
    : content.body;

  return (
    <div className="w-full max-w-sm">
      {/* Phone frame */}
      <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-gray-800 rounded-[2rem] overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 py-2 text-white text-xs">
            <span className="font-semibold">
              {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2.5 border border-white rounded-sm">
                <div className="w-2.5 h-1.5 bg-green-400 rounded-sm m-px" />
              </div>
            </div>
          </div>

          {/* Lock screen content area */}
          <div className="px-4 py-6 text-center">
            <div className="text-white text-4xl font-extralight mb-1">
              {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div className="text-gray-400 text-xs mb-8">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </div>
          </div>

          {/* Notification card */}
          <div className="px-3 pb-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
                  <School className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/80">{schoolName}</span>
                    <span className="text-[10px] text-white/50">now</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-0.5 leading-tight">{content.title}</h4>
                  <p className="text-xs text-white/70 mt-0.5 leading-snug">{truncated}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SMS Preview ───────────────────────────────────────────────────

function SMSPreview({ content, schoolName }: { content: NotificationContent; schoolName: string }) {
  const smsBody = content.body.length > 160
    ? content.body.slice(0, 157) + "..."
    : content.body;
  const charCount = `${schoolName}: ${content.title}\n\n${smsBody}`.length;

  return (
    <div className="w-full max-w-sm">
      {/* Phone frame */}
      <div className="bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-white rounded-[2rem] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b">
            <ChevronRight className="w-5 h-5 text-blue-500 rotate-180" />
            <div className="flex-1 text-center">
              <div className="font-semibold text-sm text-gray-900">{schoolName}</div>
              <div className="text-[10px] text-gray-400">SMS</div>
            </div>
            <div className="w-5" />
          </div>

          {/* Messages area */}
          <div className="px-4 py-6 min-h-[200px] flex flex-col justify-end">
            {/* Time stamp */}
            <div className="text-center text-[10px] text-gray-400 mb-3">
              Today {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </div>

            {/* SMS bubble */}
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%]">
                <p className="text-sm text-gray-900 leading-relaxed">
                  <strong>{schoolName}:</strong> {content.title}
                </p>
                <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">{smsBody}</p>
                {content.event_date && (
                  <p className="text-xs text-blue-600 mt-1.5">
                    {new Date(content.event_date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                    {content.event_time && ` at ${content.event_time}`}
                  </p>
                )}
              </div>
            </div>

            {/* Character count */}
            <div className="text-right mt-2">
              <span className={`text-[10px] ${charCount > 160 ? "text-red-500" : "text-gray-400"}`}>
                {charCount}/160 chars
                {charCount > 160 && ` (${Math.ceil(charCount / 160)} SMS)`}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
