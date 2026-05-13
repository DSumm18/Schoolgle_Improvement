"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Square,
  Maximize2,
  Minimize2,
  Clock,
  AlertCircle,
  Check,
  MessageSquare,
  Mic,
  Pause,
  Play,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  StickyNote,
  Plus,
  Shield,
  Download,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import type {
  Meeting,
  MeetingTemplate,
  MeetingChecklistItem,
  MeetingNote,
} from "@/lib/meetings";

type FocusMode = "opening" | "item" | "closing";

interface LivePrepContext {
  placeholder_replacements?: Record<string, string>;
  extracted_facts?: {
    label: string;
    value: string;
    source?: string;
  }[];
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: {
    transcript: string;
  };
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type WindowWithSpeechRecognition = Window &
  typeof globalThis & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };

export default function MeetingLivePage() {
  const router = useRouter();
  const params = useParams();
  const meetingId = params.id as string;
  const { session, organization } = useAuth();
  const organizationId = organization?.id || "";

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [template, setTemplate] = useState<MeetingTemplate | null>(null);
  const [checklistItems, setChecklistItems] = useState<MeetingChecklistItem[]>(
    [],
  );
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [prepContext, setPrepContext] = useState<LivePrepContext | null>(null);

  // Focus state
  const [focusMode, setFocusMode] = useState<FocusMode>("opening");
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

  // Notes panel
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState("");

  // Recording state
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [recordingDeclined, setRecordingDeclined] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const [liveCaption, setLiveCaption] = useState("");
  const [fullTranscript, setFullTranscript] = useState("");
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [hasStopped, setHasStopped] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const detectedPhrasesRef = useRef<Set<string>>(new Set());
  const transcriptRef = useRef("");

  // Meeting timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const requestHeaders = useMemo(
    () =>
      session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {},
    [session?.access_token],
  );

  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Web Speech API
  useEffect(() => {
    if (typeof window === "undefined") return;
    const speechWindow = window as WindowWithSpeechRecognition;
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let finalised = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalised += result[0].transcript + " ";
        }
      }

      const lastResult = event.results[event.results.length - 1];
      if (lastResult) {
        setLiveCaption(lastResult[0].transcript);
      }

      if (finalised) {
        const accumulated = (transcriptRef.current + finalised).trim();
        transcriptRef.current = accumulated + " ";
        setFullTranscript(transcriptRef.current.trim());
      }
    };

    recognition.onerror = () => {};
    recognition.onend = () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state === "recording") {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {}
    };
  }, []);

  // Auto-tick from transcript
  useEffect(() => {
    if (!fullTranscript || checklistItems.length === 0) return;
    const lower = fullTranscript.toLowerCase();

    for (const item of checklistItems) {
      if (item.manually_ticked) continue;

      // Extract key words (4+ chars) for matching
      const words = item.phrase
        .split(/\s+/)
        .filter(
          (w) =>
            w.length >= 4 &&
            ![
              "this",
              "that",
              "with",
              "from",
              "your",
              "have",
              "been",
              "will",
            ].includes(w.toLowerCase()),
        )
        .slice(0, 5);

      if (words.length === 0) continue;

      if (detectedPhrasesRef.current.has(item.id)) continue;

      // Check if enough key words are mentioned
      const matchedWords = words.filter((w) => lower.includes(w.toLowerCase()));
      const matchRatio = matchedWords.length / words.length;

      if (matchRatio >= 0.6) {
        detectedPhrasesRef.current.add(item.id);
        handleToggleItem(item.id, true);
      }
    }
  }, [fullTranscript, checklistItems]);

  useEffect(() => {
    if (!organizationId || !meetingId || !session?.access_token) return;
    fetch(`/api/meetings/${meetingId}?organizationId=${organizationId}`, {
      headers: requestHeaders,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.meeting?.status === "completed") {
          router.replace(`/dashboard/hr/meetings/${meetingId}/minutes`);
          return;
        }
        setRecordingConsent(Boolean(data.meeting?.recording_consent));
        setMeeting(data.meeting);
        setTemplate(data.template);
        setChecklistItems(data.checklist_items || []);
        setNotes(data.meeting?.notes || []);
        setPrepContext(data.meeting?.prep_context || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [organizationId, meetingId, requestHeaders, router, session?.access_token]);

  const handleAddNote = useCallback(
    async (text: string) => {
      const note: MeetingNote = { timestamp: new Date().toISOString(), text };
      const updated = [...notes, note];
      setNotes(updated);
      await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...requestHeaders,
        },
        body: JSON.stringify({ organizationId, notes: updated }),
      });
    },
    [notes, meetingId, organizationId, requestHeaders],
  );

  const handleToggleItem = useCallback(
    async (itemId: string, forceOn?: boolean) => {
      const item = checklistItems.find((i) => i.id === itemId);
      if (!item) return;

      const newTicked = forceOn ? true : !item.manually_ticked;
      if (item.manually_ticked === newTicked) return;

      const updated = checklistItems.map((i) =>
        i.id === itemId
          ? {
              ...i,
              manually_ticked: newTicked,
              status: newTicked ? ("green" as const) : ("red" as const),
            }
          : i,
      );
      setChecklistItems(updated);

      try {
        await fetch(`/api/meetings/${meetingId}/checklist`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...requestHeaders,
          },
          body: JSON.stringify({
            organizationId,
            items: [{ id: itemId, manually_ticked: newTicked }],
          }),
        });
      } catch (err) {
        console.error("Failed to save checklist item:", err);
      }
    },
    [checklistItems, meetingId, organizationId, requestHeaders],
  );

  const handleEndMeeting = async () => {
    setEnding(true);
    setEndError("");
    try {
      // Stop recording if active
      if (isRecording) stopRecording();

      const res = await fetch(`/api/meetings/${meetingId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...requestHeaders,
        },
        body: JSON.stringify({ organizationId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Unable to complete the meeting.");
      }

      const minutesRes = await fetch(`/api/meetings/${meetingId}/minutes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...requestHeaders,
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!minutesRes.ok) {
        const data = await minutesRes.json().catch(() => null);
        throw new Error(data?.error || "Meeting ended, but minutes failed.");
      }

      router.push(`/dashboard/hr/meetings/${meetingId}/minutes`);
    } catch (err) {
      console.error("Failed to end meeting:", err);
      setEndError(
        err instanceof Error
          ? err.message
          : "Something went wrong ending the meeting.",
      );
    } finally {
      setEnding(false);
    }
  };

  const handleConfirmRecordingConsent = useCallback(async () => {
    setRecordingConsent(true);
    setRecordingDeclined(false);
    try {
      await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...requestHeaders,
        },
        body: JSON.stringify({
          organizationId,
          recording_consent: true,
          recording_consent_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("Failed to save recording consent:", err);
    }
  }, [meetingId, organizationId, requestHeaders]);

  // Recording functions
  const startRecording = useCallback(async () => {
    if (!recordingConsent) {
      setEndError("Confirm recording consent before starting the recorder.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];
      transcriptRef.current = "";
      detectedPhrasesRef.current = new Set();
      setFullTranscript("");
      setRecordingBlob(null);
      setHasStopped(false);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setIsPaused(false);
      setRecDuration(0);

      recTimerRef.current = setInterval(() => {
        setRecDuration((d) => d + 1);
      }, 1000);

      try {
        recognitionRef.current?.start();
      } catch {}
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, [recordingConsent]);

  const pauseRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state !== "recording") return;
    mr.pause();
    setIsPaused(true);
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch {}
  }, []);

  const resumeRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state !== "paused") return;
    mr.resume();
    setIsPaused(false);
    recTimerRef.current = setInterval(() => {
      setRecDuration((d) => d + 1);
    }, 1000);
    try {
      recognitionRef.current?.start();
    } catch {}
  }, []);

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setRecordingBlob(blob);
      setHasStopped(true);
    };
    mr.stop();
    mr.stream.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setIsPaused(false);
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch {}
    setLiveCaption("");
  }, []);

  const handleUseNotesOnly = useCallback(async () => {
    setRecordingConsent(false);
    setRecordingDeclined(true);
    if (isRecording) stopRecording();

    try {
      await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...requestHeaders,
        },
        body: JSON.stringify({
          organizationId,
          recording_consent: false,
          recording_consent_at: null,
        }),
      });
    } catch (err) {
      console.error("Failed to save notes-only recording choice:", err);
    }
  }, [isRecording, meetingId, organizationId, requestHeaders, stopRecording]);

  const downloadRecording = useCallback(() => {
    if (!recordingBlob) return;
    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-${meetingId}-${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordingBlob, meetingId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading meeting...</p>
        </div>
      </div>
    );
  }

  if (!meeting || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-400">Meeting not found</p>
      </div>
    );
  }

  // Sort and group items
  const sortedItems = [...checklistItems].sort(
    (a, b) => a.order_index - b.order_index,
  );
  const tickedCount = sortedItems.filter((i) => i.manually_ticked).length;
  const totalCount = sortedItems.length;
  const progress =
    totalCount > 0 ? Math.round((tickedCount / totalCount) * 100) : 0;
  const missedCritical = sortedItems.filter(
    (i) => i.is_critical && !i.manually_ticked,
  );

  // Group by category
  const categories = new Map<string, MeetingChecklistItem[]>();
  for (const item of sortedItems) {
    const cat = item.category || "General";
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(item);
  }

  // Apply placeholder replacements from prep context
  const replacePlaceholders = (text: string): string => {
    if (!prepContext?.placeholder_replacements) return text;
    let result = text;
    for (const [placeholder, value] of Object.entries(
      prepContext.placeholder_replacements,
    )) {
      result = result.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        value as string,
      );
    }
    return result;
  };

  // Render text with highlighted unfilled placeholders
  const renderWithPlaceholders = (text: string): React.ReactNode => {
    const replaced = replacePlaceholders(text);
    // Split on bracket placeholders like [X days], [period], etc.
    const parts = replaced.split(/(\[[^\]]*\])/g);
    if (parts.length === 1) return replaced;
    return parts.map((part, i) =>
      part.startsWith("[") && part.endsWith("]") ? (
        <span
          key={i}
          className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded font-semibold border border-amber-200 dark:border-amber-700 border-dashed text-base"
          title="Upload documents to auto-fill this value"
        >
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  // Get focused item
  const focusedItem = focusedItemId
    ? sortedItems.find((i) => i.id === focusedItemId)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* -- Sticky Header ------------------------------------------------- */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {template.name}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  with {meeting.attendee_name}
                  {meeting.attendee_role && ` . ${meeting.attendee_role}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Persistent recording controls */}
              {!recordingConsent ? (
                <div className="hidden xl:flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 dark:border-indigo-800 dark:bg-indigo-900/20">
                  <Mic size={14} className="text-indigo-500" />
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-indigo-800 dark:text-indigo-200">
                      {recordingDeclined ? "Notes only mode" : "Recording consent"}
                    </p>
                    <p className="text-[11px] text-indigo-600/70 dark:text-indigo-300/70">
                      {recordingDeclined
                        ? "Recording is off"
                        : "Ask before recording"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleConfirmRecordingConsent}
                    className="h-8 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Consent confirmed
                  </Button>
                  {!recordingDeclined && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUseNotesOnly}
                      className="h-8 rounded-lg px-3 text-xs font-semibold"
                    >
                      Notes only
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  className={`hidden xl:flex items-center gap-2 rounded-xl border px-3 py-2 ${
                    isRecording && !isPaused
                      ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
                      : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                  }`}
                >
                  <Mic
                    size={14}
                    className={
                      isRecording && !isPaused
                        ? "text-red-500 animate-pulse"
                        : "text-slate-400"
                    }
                  />
                  <div className="leading-tight">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {isRecording
                        ? isPaused
                          ? "Recording paused"
                          : "Recording"
                        : hasStopped
                          ? "Recording stopped"
                          : "Ready to record"}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {isRecording || hasStopped
                        ? formatTimer(recDuration)
                        : "Consent confirmed"}
                    </p>
                  </div>
                  {isRecording && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={isPaused ? resumeRecording : pauseRecording}
                      className="h-8 rounded-lg px-3 text-xs font-semibold gap-1.5"
                    >
                      {isPaused ? <Play size={13} /> : <Pause size={13} />}
                      {isPaused ? "Resume recording" : "Pause recording"}
                    </Button>
                  )}
                  {!hasStopped && (
                    <Button
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`h-8 rounded-lg px-3 text-xs font-semibold ${
                        isRecording
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {isRecording ? "Stop recording" : "Start recording"}
                    </Button>
                  )}
                </div>
              )}

              {/* Timer */}
              <div
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${isRecording && !isPaused ? "bg-red-50 dark:bg-red-900/20" : "bg-slate-100 dark:bg-slate-800"}`}
              >
                <Clock
                  size={14}
                  className={
                    isRecording && !isPaused
                      ? "text-red-500 animate-pulse"
                      : "text-slate-400"
                  }
                />
                <span className="text-sm font-mono font-semibold text-slate-600 dark:text-slate-300">
                  {formatTimer(elapsed)}
                </span>
              </div>

              {/* Progress */}
              <div
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 ${
                  progress === 100
                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <CheckCircle2
                  size={14}
                  className={
                    progress === 100 ? "text-emerald-500" : "text-slate-400"
                  }
                />
                <span
                  className={`text-sm font-bold ${
                    progress === 100
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {tickedCount}/{totalCount}
                </span>
              </div>

              {/* Notes toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotes(!showNotes)}
                className={`rounded-lg h-9 w-9 ${showNotes ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : ""}`}
              >
                <StickyNote size={16} />
              </Button>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="rounded-lg h-9 w-9"
              >
                {isFullscreen ? (
                  <Minimize2 size={16} />
                ) : (
                  <Maximize2 size={16} />
                )}
              </Button>

              {/* End Meeting */}
              <Button
                onClick={handleEndMeeting}
                disabled={ending}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg gap-2 h-9 px-4 text-sm"
              >
                {ending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Square size={14} />
                )}
                End Meeting
              </Button>
            </div>
          </div>
          {endError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <p>{endError}</p>
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
              <motion.div
                className="h-1.5 rounded-full"
                style={{
                  backgroundColor:
                    progress === 100
                      ? "#10b981"
                      : progress >= 50
                        ? "#f59e0b"
                        : "#ef4444",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* -- Main Content -------------------------------------------------- */}
      <div className="flex-1 max-w-[1400px] mx-auto w-full p-4 md:p-6">
        <div className="flex gap-6 h-full">
          {/* -- Left: Script & Prompt ------------------------------------- */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Prep context banner */}
            {prepContext?.summary && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 p-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle
                    size={14}
                    className="text-indigo-500 mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                      Preparation Notes
                    </p>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300">
                      {prepContext.summary}
                    </p>
                    {prepContext.concerns?.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {prepContext.concerns.map((c: string, i: number) => (
                          <p
                            key={i}
                            className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5"
                          >
                            <AlertTriangle
                              size={11}
                              className="mt-0.5 shrink-0"
                            />
                            {c}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Opening Script */}
            {focusMode === "opening" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Opening Statement
                  </span>
                  <span className="text-xs text-slate-400 ml-auto">
                    Read aloud to begin
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={14} className="text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      You say:
                    </span>
                  </div>
                  <div className="space-y-4">
                    {template.opening_script.map((p, i) => (
                      <p
                        key={i}
                        className="text-lg leading-relaxed text-slate-700 dark:text-slate-200"
                      >
                        &ldquo;{renderWithPlaceholders(p)}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setFocusMode("item");
                    setFocusedItemId(sortedItems[0]?.id || null);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl gap-2 h-12"
                >
                  Move to Checklist
                  <ChevronRight size={16} />
                </Button>

                {/* Quick reference: key facts & notes */}
                <div className="grid gap-3 mt-2">
                  {prepContext?.extracted_facts?.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                        <AlertCircle size={12} className="text-indigo-500" />
                        Key Facts from Documents
                      </p>
                      <div className="space-y-2">
                        {prepContext.extracted_facts.map(
                          (
                            fact: {
                              label: string;
                              value: string;
                              source?: string;
                            },
                            i: number,
                          ) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 text-sm"
                            >
                              <CheckCircle2
                                size={14}
                                className="text-emerald-500 mt-0.5 shrink-0"
                              />
                              <span className="text-slate-600 dark:text-slate-300">
                                <span className="font-semibold text-slate-800 dark:text-slate-100">
                                  {fact.label}:
                                </span>{" "}
                                {fact.value}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Inline notes input always visible */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <StickyNote size={12} />
                      Quick Note
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && noteText.trim()) {
                            handleAddNote(noteText.trim());
                            setNoteText("");
                          }
                        }}
                        placeholder="Type a note and press Enter..."
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => {
                          if (noteText.trim()) {
                            handleAddNote(noteText.trim());
                            setNoteText("");
                          }
                        }}
                        className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    {notes.length > 0 && (
                      <div className="mt-3 space-y-1.5 max-h-32 overflow-y-auto">
                        {notes.map((note, i) => (
                          <div
                            key={i}
                            className="bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300"
                          >
                            {note.text}
                            <span className="text-slate-400 ml-2">
                              {new Date(note.timestamp).toLocaleTimeString(
                                "en-GB",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Focused Item */}
            {focusMode === "item" && focusedItem && (
              <motion.div
                key={focusedItem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFocusMode("opening")}
                    className="text-xs text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    Opening
                  </button>
                  <ChevronRight size={12} className="text-slate-300" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {focusedItem.category}
                  </span>
                  <ChevronRight size={12} className="text-slate-300" />
                  <button
                    onClick={() => setFocusMode("closing")}
                    className="text-xs text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    Closing
                  </button>
                </div>

                <div
                  className={`bg-white dark:bg-slate-900 rounded-2xl border-2 p-6 shadow-sm transition-all ${
                    focusedItem.manually_ticked
                      ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10"
                      : focusedItem.is_critical
                        ? "border-amber-300 dark:border-amber-700"
                        : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={14} className="text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      You say:
                    </span>
                    {focusedItem.is_critical &&
                      !focusedItem.manually_ticked && (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                          <AlertCircle size={11} />
                          Legally Required
                        </span>
                      )}
                    {focusedItem.manually_ticked && (
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                        <Check size={11} />
                        Covered
                      </span>
                    )}
                  </div>

                  <p className="text-xl leading-relaxed text-slate-800 dark:text-slate-100 font-medium">
                    &ldquo;{renderWithPlaceholders(focusedItem.phrase)}&rdquo;
                  </p>

                  <button
                    onClick={() => handleToggleItem(focusedItem.id)}
                    className={`mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
                      focusedItem.manually_ticked
                        ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Check
                      size={16}
                      strokeWidth={focusedItem.manually_ticked ? 3 : 2}
                    />
                    {focusedItem.manually_ticked
                      ? "Covered"
                      : "Mark as Covered"}
                  </button>
                </div>

                {/* Prev / Next navigation */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const idx = sortedItems.findIndex(
                        (i) => i.id === focusedItem.id,
                      );
                      if (idx > 0) setFocusedItemId(sortedItems[idx - 1].id);
                      else setFocusMode("opening");
                    }}
                    className="flex-1 rounded-xl gap-1"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                  <Button
                    onClick={() => {
                      const idx = sortedItems.findIndex(
                        (i) => i.id === focusedItem.id,
                      );
                      if (idx < sortedItems.length - 1)
                        setFocusedItemId(sortedItems[idx + 1].id);
                      else setFocusMode("closing");
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Closing */}
            {focusMode === "closing" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Closing Statement
                  </span>
                </div>

                {/* Missed critical items warning */}
                {missedCritical.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle
                        size={16}
                        className="text-red-500 mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                          {missedCritical.length} critical item
                          {missedCritical.length > 1 ? "s" : ""} not yet covered
                        </p>
                        <ul className="mt-2 space-y-1">
                          {missedCritical.map((item) => (
                            <li
                              key={item.id}
                              className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5"
                            >
                              <span>&bull;</span>
                              <button
                                onClick={() => {
                                  setFocusMode("item");
                                  setFocusedItemId(item.id);
                                }}
                                className="text-left hover:underline"
                              >
                                {item.phrase}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare size={14} className="text-indigo-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      You say:
                    </span>
                  </div>
                  <div className="space-y-4">
                    {template.closing_script.map((p, i) => (
                      <p
                        key={i}
                        className="text-lg leading-relaxed text-slate-700 dark:text-slate-200"
                      >
                        &ldquo;{renderWithPlaceholders(p)}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>

                {/* Compliance summary */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 text-center shadow-sm">
                  <div
                    className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-3 ${
                      progress === 100
                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                        : progress >= 70
                          ? "bg-amber-100 dark:bg-amber-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    <span
                      className={`text-3xl font-black ${
                        progress === 100
                          ? "text-emerald-600"
                          : progress >= 70
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    >
                      {progress}%
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {tickedCount} of {totalCount} compliance items covered
                  </p>
                </div>

                <Button
                  onClick={handleEndMeeting}
                  disabled={ending}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl gap-2 w-full h-14 text-lg"
                >
                  {ending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Square size={18} />
                      End Meeting &amp; Generate Minutes
                    </>
                  )}
                </Button>
                {endError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <p>{endError}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* -- Right: Compliance Tracker --------------------------------- */}
          <div className="hidden lg:block w-[380px] shrink-0">
            <div className="sticky top-[85px] space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
              {/* Compliance checklist - grouped by category */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Compliance Tracker
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {tickedCount} of {totalCount} covered . {progress}%
                  </p>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {Array.from(categories.entries()).map(([category, items]) => (
                    <div key={category} className="px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                        {category}
                      </p>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setFocusMode("item");
                              setFocusedItemId(item.id);
                            }}
                            className={`w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-lg transition-all text-sm group ${
                              focusedItemId === item.id
                                ? "bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-200 dark:ring-indigo-800"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            }`}
                          >
                            <motion.div
                              className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                item.manually_ticked
                                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                                  : "border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-400"
                              }`}
                              animate={
                                item.manually_ticked
                                  ? { scale: [1, 1.3, 1] }
                                  : { scale: 1 }
                              }
                              transition={{ duration: 0.3 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleItem(item.id);
                              }}
                            >
                              {item.manually_ticked && (
                                <motion.div
                                  initial={{ scale: 0, rotate: -45 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 25,
                                  }}
                                >
                                  <Check size={12} strokeWidth={3} />
                                </motion.div>
                              )}
                            </motion.div>
                            <span
                              className={`flex-1 leading-snug ${
                                item.manually_ticked
                                  ? "text-slate-400 dark:text-slate-500 line-through"
                                  : "text-slate-700 dark:text-slate-200"
                              }`}
                            >
                              {renderWithPlaceholders(item.phrase)}
                            </span>
                            {item.is_critical && !item.manually_ticked && (
                              <span className="shrink-0 text-[9px] font-bold uppercase text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                                req
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes panel */}
              <AnimatePresence>
                {showNotes && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Meeting Notes
                      </h3>
                      {notes.length > 0 && (
                        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                          {notes.map((note, i) => (
                            <div
                              key={i}
                              className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5"
                            >
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {note.text}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {new Date(note.timestamp).toLocaleTimeString(
                                  "en-GB",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && noteText.trim()) {
                              handleAddNote(noteText.trim());
                              setNoteText("");
                            }
                          }}
                          placeholder="Add note..."
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => {
                            if (noteText.trim()) {
                              handleAddNote(noteText.trim());
                              setNoteText("");
                            }
                          }}
                          className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile: Compliance tracker below */}
        <div className="lg:hidden mt-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Compliance Tracker . {tickedCount}/{totalCount}
              </h2>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {Array.from(categories.entries()).map(([category, items]) => (
                <div key={category} className="px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                    {category}
                  </p>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setFocusMode("item");
                          setFocusedItemId(item.id);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="w-full text-left flex items-start gap-2.5 px-3 py-2 rounded-lg text-sm"
                      >
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                            item.manually_ticked
                              ? "bg-emerald-500 text-white"
                              : "border-2 border-slate-300 dark:border-slate-600"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleItem(item.id);
                          }}
                        >
                          {item.manually_ticked && (
                            <Check size={12} strokeWidth={3} />
                          )}
                        </div>
                        <span
                          className={`flex-1 ${item.manually_ticked ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`}
                        >
                          {renderWithPlaceholders(item.phrase)}
                        </span>
                        {item.is_critical && !item.manually_ticked && (
                          <span className="text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                            req
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* -- Fixed Bottom Bar: Recording + Captions ------------------------ */}
      <div className="sticky bottom-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-[1400px] mx-auto px-4 py-3">
          {/* Recording consent gate */}
          {!recordingConsent ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex-1 flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3 border border-indigo-200 dark:border-indigo-800">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <Mic size={18} className="text-indigo-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                    {recordingDeclined
                      ? "Recording off - manual notes mode"
                      : "Ask for recording consent before you start"}
                  </p>
                  {recordingDeclined ? (
                    <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">
                      Recording is disabled for this meeting. Use the checklist
                      prompts and meeting notes panel to capture the discussion.
                    </p>
                  ) : (
                    <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">
                      Suggested wording: &quot;To make sure the minutes are
                      accurate and nothing important is missed, I would like to
                      record this meeting for transcription and minute-taking
                      only. The recording is used to create the notes and can be
                      removed afterwards. Are you happy for me to start
                      recording?&quot;
                    </p>
                  )}
                  <p className="text-[11px] text-indigo-500/80 dark:text-indigo-300/80 mt-1">
                    If consent is not given, continue with manual notes and
                    checklist prompts.
                  </p>
                  <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-0.5">
                    Auto-ticks checklist items as you speak. Audio stays on
                    this device unless the school chooses to upload it for
                    transcription.
                  </p>
                </div>
                <button
                  onClick={handleConfirmRecordingConsent}
                  className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Shield size={14} />
                  Consent confirmed
                </button>
                {!recordingDeclined && (
                  <button
                    onClick={handleUseNotesOnly}
                    className="shrink-0 bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
                  >
                    Notes only
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {/* Recording indicator */}
              <div className="flex items-center gap-3">
                {isRecording ? (
                  <div className="relative">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg ${isPaused ? "bg-amber-500" : "bg-red-500"}`}
                    >
                      <Mic size={20} className="text-white" />
                    </div>
                    {!isPaused && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                        <div className="absolute -inset-1 rounded-full border-2 border-red-400/50 animate-pulse" />
                      </>
                    )}
                  </div>
                ) : hasStopped ? (
                  <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                    <Check size={20} className="text-white" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Mic size={20} className="text-slate-400" />
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {isRecording
                      ? isPaused
                        ? "Paused"
                        : "Recording"
                      : hasStopped
                        ? "Complete"
                        : "Ready"}
                  </p>
                  {(isRecording || hasStopped) && (
                    <p
                      className={`text-xs font-mono ${isRecording && !isPaused ? "text-red-500" : "text-slate-400"}`}
                    >
                      {formatTimer(recDuration)}
                    </p>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {isRecording && (
                  <button
                    onClick={isPaused ? resumeRecording : pauseRecording}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                )}
                {!hasStopped && (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {isRecording ? "Stop" : "Start"}
                  </button>
                )}
                {hasStopped && recordingBlob && (
                  <button
                    onClick={downloadRecording}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Download size={12} />
                    Download
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

              {/* Live caption */}
              <div className="flex-1 min-w-0">
                {liveCaption ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 italic truncate">
                    &ldquo;{liveCaption}&rdquo;
                  </p>
                ) : isRecording ? (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Shield size={12} className="text-emerald-500" />
                    Listening . Audio stays on your device
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    {hasStopped
                      ? "Recording saved locally"
                      : "Enable to auto-detect checklist items from speech"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
