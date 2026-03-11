"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Download,
  Shield,
  AlertTriangle,
} from "lucide-react";

interface Props {
  meetingId: string;
  organizationId: string;
  onTranscriptUpdate?: (fullTranscript: string) => void;
  onPhraseDetected?: (phrase: string) => void;
  checklistPhrases?: string[];
  consentGiven?: boolean;
  onConsentChange?: (consented: boolean) => void;
}

export function MeetingRecorder({
  meetingId,
  organizationId,
  onTranscriptUpdate,
  onPhraseDetected,
  checklistPhrases = [],
  consentGiven: externalConsent,
  onConsentChange,
}: Props) {
  const [internalConsent, setInternalConsent] = useState(false);
  const consentGiven = externalConsent ?? internalConsent;

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [liveCaption, setLiveCaption] = useState("");
  const [fullTranscript, setFullTranscript] = useState("");
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [hasStopped, setHasStopped] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const detectedPhrasesRef = useRef<Set<string>>(new Set());
  const transcriptRef = useRef("");

  // Initialise Web Speech API for live captions
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
      // Build transcript from all final results plus current interim
      let finalised = "";
      let interim = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalised += result[0].transcript + " ";
        } else {
          interim = result[0].transcript;
        }
      }

      // Update the live caption with the latest interim result
      const lastResult = event.results[event.results.length - 1];
      if (lastResult) {
        setLiveCaption(lastResult[0].transcript);
      }

      // Build the accumulated transcript
      const accumulated = (transcriptRef.current + finalised).trim();
      if (finalised) {
        transcriptRef.current = accumulated + " ";
        setFullTranscript(transcriptRef.current.trim());
        onTranscriptUpdate?.(transcriptRef.current.trim());
      }

      // Check for checklist phrase matches in the new final text
      if (finalised && checklistPhrases.length > 0) {
        const lowerFinal = finalised.toLowerCase();
        for (const phrase of checklistPhrases) {
          const lowerPhrase = phrase.toLowerCase();
          if (
            lowerFinal.includes(lowerPhrase) &&
            !detectedPhrasesRef.current.has(lowerPhrase)
          ) {
            detectedPhrasesRef.current.add(lowerPhrase);
            onPhraseDetected?.(phrase);
          }
        }
      }
    };

    recognition.onerror = () => {};
    recognition.onend = () => {
      // Restart if still recording and not paused
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phrase detection on transcript changes (catches across recognition restarts)
  useEffect(() => {
    if (!fullTranscript || checklistPhrases.length === 0) return;
    const lower = fullTranscript.toLowerCase();
    for (const phrase of checklistPhrases) {
      const lowerPhrase = phrase.toLowerCase();
      if (
        lower.includes(lowerPhrase) &&
        !detectedPhrasesRef.current.has(lowerPhrase)
      ) {
        detectedPhrasesRef.current.add(lowerPhrase);
        onPhraseDetected?.(phrase);
      }
    }
  }, [fullTranscript, checklistPhrases, onPhraseDetected]);

  const handleConsentChange = useCallback(
    (checked: boolean) => {
      setInternalConsent(checked);
      onConsentChange?.(checked);
    },
    [onConsentChange],
  );

  const startRecording = useCallback(async () => {
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
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      try {
        recognitionRef.current?.start();
      } catch {}
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, []);

  const pauseRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state !== "recording") return;

    mediaRecorder.pause();
    setIsPaused(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      recognitionRef.current?.stop();
    } catch {}
  }, []);

  const resumeRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state !== "paused") return;

    mediaRecorder.resume();
    setIsPaused(false);

    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);

    try {
      recognitionRef.current?.start();
    } catch {}
  }, []);

  const stopRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder) return;

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setRecordingBlob(blob);
      setHasStopped(true);
    };

    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setIsPaused(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      recognitionRef.current?.stop();
    } catch {}
    setLiveCaption("");
  }, []);

  const downloadRecording = useCallback(() => {
    if (!recordingBlob) return;

    const url = URL.createObjectURL(recordingBlob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `meeting-${meetingId}-${timestamp}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordingBlob, meetingId]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  // ─── Consent card ─────────────────────────────────────────────────────────────
  if (!consentGiven) {
    return (
      <div className="space-y-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-300 dark:border-amber-600 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <AlertTriangle
                size={18}
                className="text-amber-600 dark:text-amber-400"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Recording Consent Required
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Under UK GDPR and the Data Protection Act 2018, all parties must
                consent before a meeting is recorded. Please confirm that
                everyone present has been informed and has agreed.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-4">
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
              <li>
                &bull; All participants have been told this meeting will be
                recorded
              </li>
              <li>&bull; The purpose of the recording has been explained</li>
              <li>
                &bull; Audio will be stored locally on your device only &mdash;
                it is not uploaded to any server
              </li>
              <li>&bull; Participants may withdraw consent at any time</li>
            </ul>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => handleConsentChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
              Both parties have consented to this recording
            </span>
          </label>
        </div>
      </div>
    );
  }

  // ─── Recording controls ────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isRecording ? (
              <div className="relative">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isPaused ? "bg-amber-500" : "bg-red-500"
                  }`}
                >
                  <Mic size={18} className="text-white" />
                </div>
                {!isPaused && (
                  <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
                )}
              </div>
            ) : hasStopped ? (
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <Download size={18} className="text-white" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <MicOff size={18} className="text-slate-400" />
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {isRecording
                  ? isPaused
                    ? "Paused"
                    : "Recording"
                  : hasStopped
                    ? "Recording complete"
                    : "Ready to record"}
              </p>
              {(isRecording || hasStopped) && (
                <p
                  className={`text-xs font-mono ${
                    isRecording && !isPaused
                      ? "text-red-500"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {formatTime(duration)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pause / Resume */}
            {isRecording && (
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
              </button>
            )}

            {/* Start / Stop */}
            {!hasStopped && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                {isRecording ? "Stop Recording" : "Start Recording"}
              </button>
            )}

            {/* Download */}
            {hasStopped && recordingBlob && (
              <button
                onClick={downloadRecording}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Download Recording
              </button>
            )}
          </div>
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

        {/* Accumulated transcript */}
        {fullTranscript && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Transcript
            </p>
            <div className="max-h-40 overflow-y-auto">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {fullTranscript}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* GDPR notice */}
      {hasStopped && (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 flex items-start gap-2.5">
          <Shield
            size={16}
            className="text-green-600 dark:text-green-400 shrink-0 mt-0.5"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Recording is stored locally on your device only. Schoolgle does not
            store or process audio recordings.
          </p>
        </div>
      )}
    </div>
  );
}
