"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

interface Props {
  meetingId: string;
  organizationId: string;
  onTranscriptReady?: (transcript: any) => void;
}

export function MeetingRecorder({
  meetingId,
  organizationId,
  onTranscriptReady,
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [liveCaption, setLiveCaption] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Live captions via Web Speech API (free, instant)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-GB";

    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (last) {
        setLiveCaption(last[0].transcript);
      }
    };

    recognition.onerror = () => {};
    recognition.onend = () => {
      // Restart if still recording
      if (mediaRecorderRef.current?.state === "recording") {
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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000); // Collect in 1-second chunks
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      // Start live captions
      try {
        recognitionRef.current?.start();
      } catch {}
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    return new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        resolve(blob);
      };
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      try {
        recognitionRef.current?.stop();
      } catch {}
      setLiveCaption("");
    });
  }, []);

  const handleStopAndTranscribe = useCallback(async () => {
    const blob = await stopRecording();
    if (!blob || blob.size === 0) return;

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "meeting-recording.webm");
      formData.append("organizationId", organizationId);

      const res = await fetch(`/api/meetings/${meetingId}/transcribe`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onTranscriptReady?.(data);
      } else {
        const err = await res.json();
        console.error("Transcription failed:", err);
      }
    } catch (err) {
      console.error("Transcription error:", err);
    } finally {
      setIsTranscribing(false);
    }
  }, [stopRecording, meetingId, organizationId, onTranscriptReady]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {/* Recording controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isRecording ? (
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <Mic size={18} className="text-white" />
                </div>
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
              </div>
            ) : isTranscribing ? (
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                <Loader2 size={18} className="text-white animate-spin" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <MicOff size={18} className="text-slate-400" />
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {isTranscribing
                  ? "Transcribing with Deepgram..."
                  : isRecording
                    ? "Recording"
                    : "Not recording"}
              </p>
              {isRecording && (
                <p className="text-xs text-red-500 font-mono">
                  {formatTime(duration)}
                </p>
              )}
              {isTranscribing && (
                <p className="text-xs text-indigo-500">
                  Speaker diarisation in progress
                </p>
              )}
            </div>
          </div>

          {!isTranscribing && (
            <button
              onClick={isRecording ? handleStopAndTranscribe : startRecording}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
              }`}
            >
              {isRecording ? "Stop & Transcribe" : "Start Recording"}
            </button>
          )}
        </div>

        {/* Live captions */}
        {isRecording && liveCaption && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Live Caption
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 italic">
              &ldquo;{liveCaption}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
