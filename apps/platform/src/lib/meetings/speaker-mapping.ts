import type { TranscriptChunk } from "./types";

export interface TranscriptContext {
  purpose?: string | null;
  recordingContext?: string | null;
  attendeeNotes?: string | null;
}

interface DeepgramUtterance {
  start?: number;
  speaker?: string | number;
  transcript?: string;
}

interface DeepgramResult {
  results?: {
    utterances?: DeepgramUtterance[];
  };
}

export function extractSpeakerLabels(chunks: TranscriptChunk[]): string[] {
  return Array.from(new Set(chunks.map((chunk) => chunk.speaker).filter(Boolean))).sort(
    compareSpeakerLabels,
  );
}

export function applySpeakerMap(
  chunks: TranscriptChunk[],
  speakerMap: Record<string, string>,
): TranscriptChunk[] {
  return chunks.map((chunk) => {
    const mappedName = speakerMap[chunk.speaker]?.trim();
    return mappedName ? { ...chunk, speaker: mappedName } : chunk;
  });
}

export function composeTranscriptFullText(
  chunks: TranscriptChunk[],
  context?: TranscriptContext,
): string {
  const transcriptText = chunks
    .map((chunk) => `[${chunk.timestamp}] ${chunk.speaker}: ${chunk.text}`)
    .join("\n");

  const contextLines = [
    context?.purpose ? `Purpose: ${context.purpose}` : null,
    context?.recordingContext ? `Context: ${context.recordingContext}` : null,
    context?.attendeeNotes ? `Attendees / speaker notes: ${context.attendeeNotes}` : null,
  ].filter(Boolean);

  if (contextLines.length === 0) {
    return transcriptText;
  }

  return `RECORDING CONTEXT:\n${contextLines.join("\n")}\n\nTRANSCRIPT:\n${transcriptText}`;
}

export function parseDeepgramUtterances(result: DeepgramResult): TranscriptChunk[] {
  const utterances = result.results?.utterances || [];
  return utterances
    .filter((utterance) => utterance.transcript?.trim())
    .map((utterance) => ({
      timestamp: formatSeconds(utterance.start || 0),
      speaker: `Speaker ${utterance.speaker ?? "0"}`,
      text: utterance.transcript!.trim(),
    }));
}

function compareSpeakerLabels(a: string, b: string): number {
  const aNumber = getTrailingNumber(a);
  const bNumber = getTrailingNumber(b);

  if (aNumber !== null && bNumber !== null) {
    return aNumber - bNumber;
  }

  return a.localeCompare(b);
}

function getTrailingNumber(label: string): number | null {
  const match = label.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}
