"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Mic,
  Play,
  Square,
  Settings,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// TEXT-TO-SPEECH PA SYSTEM
// Uses the Web Speech API to announce messages through display speakers
// Works on Chrome, Edge, Safari — perfect for classroom boards
// ═══════════════════════════════════════════════════════════════════════

interface AnnouncementPlayerProps {
  /** When a new message arrives, speak it */
  message?: string;
  /** Play a chime before speaking */
  playChime?: boolean;
  /** Volume 0-1 */
  volume?: number;
  /** Whether TTS is enabled on this device */
  enabled?: boolean;
}

// Attention chime using Web Audio API
function playAttentionChime(volume: number = 0.3): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") { resolve(); return; }

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // Three-note ascending chime (C5, E5, G5)
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(volume, now + i * 0.15 + 0.05);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.4);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.5);
    });

    setTimeout(resolve, 800);
  });
}

export function AnnouncementPlayer({
  message,
  playChime = true,
  volume = 0.8,
  enabled = true,
}: AnnouncementPlayerProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = useCallback(
    async (text: string) => {
      if (!enabled || !text || !synthRef.current) return;

      // Don't repeat the same message
      if (text === lastMessage) return;
      setLastMessage(text);

      // Cancel any current speech
      synthRef.current.cancel();

      // Play chime first
      if (playChime) {
        await playAttentionChime(volume * 0.5);
      }

      // Speak the message
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-GB";
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1;
      utterance.volume = volume;

      // Try to use a British English voice
      const voices = synthRef.current.getVoices();
      const britishVoice = voices.find(
        (v) =>
          v.lang === "en-GB" &&
          (v.name.includes("Google") || v.name.includes("Microsoft") || v.name.includes("Daniel"))
      );
      if (britishVoice) {
        utterance.voice = britishVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synthRef.current.speak(utterance);
    },
    [enabled, volume, playChime, lastMessage]
  );

  // Auto-speak when a new message arrives
  useEffect(() => {
    if (message && message !== lastMessage) {
      speak(message);
    }
  }, [message, speak, lastMessage]);

  if (!enabled) return null;

  return (
    <div className="flex items-center gap-2">
      {isSpeaking ? (
        <Volume2 className="w-4 h-4 text-green-500 animate-pulse" />
      ) : (
        <VolumeX className="w-4 h-4 text-gray-400" />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PA ANNOUNCEMENT COMPOSER (for staff to type & broadcast)
// ═══════════════════════════════════════════════════════════════════════

export function PAComposer() {
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0.8);

  const announce = useCallback(async () => {
    if (!text.trim() || typeof window === "undefined") return;

    setIsSpeaking(true);

    // Play chime
    await playAttentionChime(volume * 0.5);

    // Speak
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 0.9;
    utterance.volume = volume;

    const voices = synth.getVoices();
    const britishVoice = voices.find((v) => v.lang === "en-GB");
    if (britishVoice) utterance.voice = britishVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.speak(utterance);
  }, [text, volume]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Mic className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-bold text-gray-700">PA Announcement</span>
        <span className="text-xs text-gray-400">— speaks through display speakers</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && announce()}
          placeholder="Type a message to announce..."
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
          disabled={isSpeaking}
        />
        {isSpeaking ? (
          <button
            onClick={stop}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
          >
            <Square className="w-4 h-4" />
            Stop
          </button>
        ) : (
          <button
            onClick={announce}
            disabled={!text.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Announce
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Volume2 className="w-3 h-3 text-gray-400" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-24 h-1 bg-gray-200 rounded-full appearance-none"
        />
        <span className="text-xs text-gray-400">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  );
}
