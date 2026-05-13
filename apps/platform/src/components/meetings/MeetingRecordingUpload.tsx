"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  FileAudio,
  FileText,
  Loader2,
  Mic2,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { extractSpeakerLabels, type MeetingAttendee, type MeetingTranscript } from "@/lib/meetings";

interface MeetingRecordingUploadProps {
  meetingId: string;
  organizationId: string;
  defaultPurpose?: string | null;
  attendees?: MeetingAttendee[];
  onTranscriptReady?: (transcript: MeetingTranscript) => void;
  onMinutesGenerated?: () => void;
}

interface TranscriptionSummary {
  duration_seconds: number;
  speaker_count: number;
  utterance_count: number;
  word_count: number;
  speaker_labels?: string[];
}

const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/aac",
  "audio/ogg",
  "audio/webm",
  "video/mp4",
  "video/quicktime",
  "video/webm",
];

export function MeetingRecordingUpload({
  meetingId,
  organizationId,
  defaultPurpose,
  attendees = [],
  onTranscriptReady,
  onMinutesGenerated,
}: MeetingRecordingUploadProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [purpose, setPurpose] = useState(defaultPurpose || "");
  const [recordingContext, setRecordingContext] = useState("");
  const [attendeeNotes, setAttendeeNotes] = useState("");
  const [hasConsent, setHasConsent] = useState(false);
  const [transcript, setTranscript] = useState<MeetingTranscript | null>(null);
  const [summary, setSummary] = useState<TranscriptionSummary | null>(null);
  const [speakerMap, setSpeakerMap] = useState<Record<string, string>>({});
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSavingSpeakers, setIsSavingSpeakers] = useState(false);
  const [isGeneratingMinutes, setIsGeneratingMinutes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectedSpeakers = useMemo(() => {
    if (summary?.speaker_labels?.length) return summary.speaker_labels;
    if (transcript?.chunks?.length) return extractSpeakerLabels(transcript.chunks);
    return [];
  }, [summary, transcript]);

  const knownAttendeeNames = useMemo(
    () => attendees.map((attendee) => attendee.name).filter(Boolean),
    [attendees],
  );

  const handleFileChange = (file: File | null) => {
    setError(null);
    setTranscript(null);
    setSummary(null);
    setSpeakerMap({});

    if (!file) {
      setAudioFile(null);
      return;
    }

    if (!ACCEPTED_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|webm|mp4|mov|aac|ogg)$/i)) {
      setError("Please upload an audio or video recording file.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError("Recording must be under 100MB.");
      return;
    }

    setAudioFile(file);
  };

  const handleTranscribe = async () => {
    if (!audioFile || !hasConsent) return;

    setIsTranscribing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", audioFile);
      if (purpose.trim()) formData.append("purpose", purpose.trim());
      if (recordingContext.trim()) {
        formData.append("recording_context", recordingContext.trim());
      }
      if (attendeeNotes.trim()) formData.append("attendee_notes", attendeeNotes.trim());

      const response = await fetch(`/api/meetings/${meetingId}/transcribe`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transcription failed");
      }

      setTranscript(data.transcript);
      setSummary(data.summary);
      onTranscriptReady?.(data.transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSaveSpeakerNames = async () => {
    const cleanedMap = Object.fromEntries(
      Object.entries(speakerMap).filter(([, value]) => value.trim()),
    );
    if (Object.keys(cleanedMap).length === 0) return;

    setIsSavingSpeakers(true);
    setError(null);

    try {
      const response = await fetch(`/api/meetings/${meetingId}/transcribe`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId, speakerMap: cleanedMap }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save speaker names");
      }

      setTranscript(data.transcript);
      setSummary((current) =>
        current ? { ...current, speaker_labels: data.speaker_labels } : current,
      );
      onTranscriptReady?.(data.transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save speaker names");
    } finally {
      setIsSavingSpeakers(false);
    }
  };

  const handleGenerateMinutes = async () => {
    setIsGeneratingMinutes(true);
    setError(null);

    try {
      const response = await fetch(`/api/meetings/${meetingId}/minutes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate minutes");
      }

      onMinutesGenerated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate minutes");
    } finally {
      setIsGeneratingMinutes(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
          <FileAudio size={20} className="text-indigo-600 dark:text-indigo-300" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Upload a Meeting Recording
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Use an existing Teams, Zoom, phone, or dictaphone recording. Add context first so the minutes generator understands what this meeting was for.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <label className="block rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-5 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
        <input
          type="file"
          accept=".mp3,.wav,.m4a,.webm,.mp4,.mov,.aac,.ogg,audio/*,video/*"
          className="hidden"
          onChange={(event) => handleFileChange(event.target.files?.[0] || null)}
        />
        <Mic2 size={24} className="mx-auto text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {audioFile ? audioFile.name : "Choose an audio or video recording"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          MP3, WAV, M4A, WEBM, MP4, MOV, AAC or OGG · max 100MB
        </p>
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
            Meeting purpose
          </label>
          <input
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            placeholder="e.g. Back-to-work meeting after sickness absence"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
            Attendees / speaker clues
          </label>
          <input
            value={attendeeNotes}
            onChange={(event) => setAttendeeNotes(event.target.value)}
            placeholder="e.g. Speaker 0 is likely the headteacher; Speaker 1 is Sam"
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 block">
          Extra context for the minutes
        </label>
        <textarea
          value={recordingContext}
          onChange={(event) => setRecordingContext(event.target.value)}
          rows={3}
          placeholder="Where did the recording come from? Anything the transcript model may miss? What outcome should the minutes focus on?"
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
        />
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-3">
        <input
          type="checkbox"
          checked={hasConsent}
          onChange={(event) => setHasConsent(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        <span className="text-xs text-slate-600 dark:text-slate-300">
          I confirm this recording can be uploaded for transcription and minute generation. Schoolgle stores the transcript/minutes for review; the recording itself is only sent for transcription and is not saved by this app.
        </span>
      </label>

      <Button
        onClick={handleTranscribe}
        disabled={!audioFile || !hasConsent || isTranscribing}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-2 h-11 disabled:opacity-50"
      >
        {isTranscribing ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Transcribing and detecting speakers...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Transcribe Recording
          </>
        )}
      </Button>

      {summary && (
        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 p-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <SummaryStat label="Speakers" value={summary.speaker_count} />
            <SummaryStat label="Utterances" value={summary.utterance_count} />
            <SummaryStat label="Words" value={summary.word_count} />
            <SummaryStat label="Duration" value={`${Math.round(summary.duration_seconds / 60)} min`} />
          </div>

          {detectedSpeakers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} className="text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Name the detected speakers
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {detectedSpeakers.map((speaker) => (
                  <div key={speaker}>
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">
                      {speaker}
                    </label>
                    <input
                      list={`meeting-attendees-${meetingId}`}
                      value={speakerMap[speaker] || ""}
                      onChange={(event) =>
                        setSpeakerMap((current) => ({
                          ...current,
                          [speaker]: event.target.value,
                        }))
                      }
                      placeholder="Enter name, or leave as speaker label"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                  </div>
                ))}
              </div>
              {knownAttendeeNames.length > 0 && (
                <datalist id={`meeting-attendees-${meetingId}`}>
                  {knownAttendeeNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              )}
              <Button
                onClick={handleSaveSpeakerNames}
                disabled={isSavingSpeakers || Object.values(speakerMap).every((value) => !value.trim())}
                variant="outline"
                className="mt-3 rounded-xl gap-2"
              >
                {isSavingSpeakers ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Users size={14} />
                )}
                Save Speaker Names
              </Button>
            </div>
          )}

          <Button
            onClick={handleGenerateMinutes}
            disabled={isGeneratingMinutes}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-2 h-11"
          >
            {isGeneratingMinutes ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}
            Generate Draft Minutes
          </Button>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white/70 dark:bg-slate-900/70 p-3">
      <p className="text-lg font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
