"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Zap,
  CloudRain,
  Users,
  UtensilsCrossed,
  Clock,
  Trophy,
  Eye,
  XCircle,
  Camera,
  Send,
  CheckCircle2,
} from "lucide-react";

interface QuickMessage {
  id: string;
  label: string;
  message: string;
  icon: string;
  color: string;
  category: string;
  play_chime: boolean;
}

const ICON_MAP: Record<string, typeof Zap> = {
  users: Users,
  "cloud-rain": CloudRain,
  utensils: UtensilsCrossed,
  clock: Clock,
  trophy: Trophy,
  eye: Eye,
  "x-circle": XCircle,
  camera: Camera,
};

interface QuickMessageBarProps {
  className?: string;
}

export function QuickMessageBar({ className = "" }: QuickMessageBarProps) {
  const [messages, setMessages] = useState<QuickMessage[]>([]);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");

  useEffect(() => {
    fetch("/api/notices/quick")
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []))
      .catch(() => {});
  }, []);

  const sendQuickMessage = useCallback(async (qm: QuickMessage) => {
    setSending(qm.id);
    try {
      await fetch("/api/notices/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quick_message_id: qm.id }),
      });
      setSent(qm.id);
      setTimeout(() => setSent(null), 2000);
    } catch {
      // error
    } finally {
      setSending(null);
    }
  }, []);

  const sendCustom = useCallback(async () => {
    if (!customText.trim()) return;
    setSending("custom");
    try {
      await fetch("/api/notices/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_message: customText }),
      });
      setCustomText("");
      setCustomMode(false);
      setSent("custom");
      setTimeout(() => setSent(null), 2000);
    } catch {
      // error
    } finally {
      setSending(null);
    }
  }, [customText]);

  if (messages.length === 0) return null;

  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-bold text-gray-700">Quick Messages</span>
        <span className="text-xs text-gray-400">— tap to send to all displays</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {messages.map((qm) => {
          const Icon = ICON_MAP[qm.icon] || Zap;
          const isSending = sending === qm.id;
          const isSent = sent === qm.id;

          return (
            <button
              key={qm.id}
              onClick={() => sendQuickMessage(qm)}
              disabled={isSending}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition hover:scale-[1.02] active:scale-[0.98] border disabled:opacity-50"
              style={{
                backgroundColor: isSent ? "#059669" : `${qm.color}15`,
                borderColor: isSent ? "#059669" : `${qm.color}40`,
                color: isSent ? "white" : qm.color,
              }}
            >
              {isSent ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              {isSent ? "Sent!" : qm.label}
            </button>
          );
        })}

        {/* Custom message */}
        {!customMode ? (
          <button
            onClick={() => setCustomMode(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition border border-gray-200"
          >
            <Send className="w-4 h-4" />
            Custom...
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendCustom()}
              placeholder="Type a message for all displays..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={sendCustom}
              disabled={!customText.trim() || sending === "custom"}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setCustomMode(false); setCustomText(""); }}
              className="px-2 py-2 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
