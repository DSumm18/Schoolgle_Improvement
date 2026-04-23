"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useGeminiLive, VoiceState } from "./useGeminiLive";

/**
 * EdVoiceChat — Full-screen voice conversation overlay with Gemini Live API.
 *
 * Replaces the Fish Audio cascade (4 hops, 1.5-3s latency) with a single
 * persistent WebSocket connection (~300-800ms to first audio).
 */
export default function EdVoiceChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcriptLines, setTranscriptLines] = useState<string[]>([]);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const { state, transcript, start, stop } = useGeminiLive({
    onTranscript: (text) => {
      setTranscriptLines((prev) => {
        const last = prev[prev.length - 1];
        // Append to last line if it's a continuation
        if (last !== undefined) {
          const updated = [...prev];
          updated[updated.length - 1] = last + text;
          return updated;
        }
        return [...prev, text];
      });
    },
    onStateChange: (newState) => {
      if (newState === "listening") {
        // New turn — start fresh transcript line
        setTranscriptLines((prev) => [...prev, ""]);
      }
    },
    onError: (err) => {
      setError(err);
      setTimeout(() => setError(null), 5000);
    },
  });

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcriptLines]);

  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    setError(null);
    setTranscriptLines([]);
    await start();
  }, [start]);

  const handleClose = useCallback(() => {
    stop();
    setIsOpen(false);
    setError(null);
  }, [stop]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  return (
    <>
      {/* Floating voice button — positioned above the Ed widget */}
      <button
        onClick={handleOpen}
        className="fixed bottom-24 left-6 z-[9998] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl active:scale-95"
        title="Talk to Ed"
        aria-label="Start voice conversation with Ed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>

      {/* Full-screen voice overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-6 top-6 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="End voice chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>

          {/* Ed identity */}
          <div className="mb-8 text-center">
            <span className="text-5xl" role="img" aria-label="Ed the elephant">
              🐘
            </span>
            <h2 className="mt-2 text-lg font-medium text-white">Ed</h2>
            <p className="text-sm text-white/50">
              {state === "idle" && "Ready to chat"}
              {state === "connecting" && "Connecting..."}
              {state === "listening" && "Listening..."}
              {state === "speaking" && "Speaking..."}
              {state === "error" && "Something went wrong"}
            </p>
          </div>

          {/* Animated orb */}
          <div className="relative mb-10 flex items-center justify-center">
            <div
              className={`h-32 w-32 rounded-full transition-all duration-500 ${
                state === "listening"
                  ? "animate-pulse bg-blue-500/30 shadow-[0_0_60px_20px_rgba(59,130,246,0.3)]"
                  : state === "speaking"
                    ? "animate-pulse bg-emerald-500/30 shadow-[0_0_60px_20px_rgba(16,185,129,0.3)]"
                    : state === "connecting"
                      ? "animate-spin bg-amber-500/20 shadow-[0_0_40px_10px_rgba(245,158,11,0.2)]"
                      : "bg-white/5"
              }`}
            />
            {/* Inner glow */}
            <div
              className={`absolute h-20 w-20 rounded-full transition-all duration-300 ${
                state === "listening"
                  ? "bg-blue-500/50"
                  : state === "speaking"
                    ? "bg-emerald-500/50"
                    : state === "connecting"
                      ? "bg-amber-500/40"
                      : "bg-white/10"
              }`}
            />
            {/* Centre icon */}
            <div className="absolute flex items-center justify-center text-white/90">
              {state === "listening" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              )}
              {state === "speaking" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
              {state === "connecting" && (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {(state === "idle" || state === "error") && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 max-w-sm rounded-lg bg-red-500/20 px-4 py-2 text-center text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Transcript area */}
          <div
            ref={transcriptRef}
            className="mx-auto mb-8 h-24 w-full max-w-lg overflow-y-auto rounded-lg bg-white/5 p-4"
          >
            {transcriptLines.filter(Boolean).length === 0 ? (
              <p className="text-center text-sm text-white/30">
                {state === "listening"
                  ? "Go ahead, I'm listening..."
                  : state === "connecting"
                    ? "Setting up voice connection..."
                    : "Transcript will appear here"}
              </p>
            ) : (
              transcriptLines.filter(Boolean).map((line, i) => (
                <p key={i} className="mb-1 text-sm text-white/70">
                  {line}
                </p>
              ))
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-4">
            {state === "idle" || state === "error" ? (
              <button
                onClick={handleOpen}
                className="rounded-full bg-blue-600 px-8 py-3 font-medium text-white shadow-lg transition-all hover:bg-blue-500 hover:shadow-xl"
              >
                Start talking
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="rounded-full bg-red-600 px-8 py-3 font-medium text-white shadow-lg transition-all hover:bg-red-500 hover:shadow-xl"
              >
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                    <line x1="23" x2="1" y1="1" y2="23" />
                  </svg>
                  End call
                </span>
              </button>
            )}
          </div>

          {/* Hint */}
          <p className="mt-6 text-xs text-white/30">
            Press{" "}
            <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
              Esc
            </kbd>{" "}
            to end the call
          </p>
        </div>
      )}
    </>
  );
}
