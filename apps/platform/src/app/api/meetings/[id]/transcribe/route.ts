import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  applySpeakerMap,
  composeTranscriptFullText,
  extractSpeakerLabels,
  parseDeepgramUtterances,
} from "@/lib/meetings";
import { createServiceRoleClient } from "@/lib/supabase-server";

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

/**
 * Extract meeting ID from the URL pathname.
 * URL pattern: /api/meetings/[id]/transcribe
 */
function getMeetingId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/");
  // ["", "api", "meetings", "<id>", "transcribe"]
  return segments[3];
}

/**
 * POST /api/meetings/[id]/transcribe
 * Send recorded audio to Deepgram with speaker diarisation,
 * store the result in meeting_transcripts.
 */
export const POST = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  const formData = await request.formData();
  const audioFile = formData.get("audio") as File;
  const purpose = getFormString(formData, "purpose");
  const recordingContext = getFormString(formData, "recording_context");
  const attendeeNotes = getFormString(formData, "attendee_notes");
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!audioFile || !organizationId) {
    return apiError("Missing audio file or organizationId", 400);
  }

  if (!DEEPGRAM_API_KEY) {
    return apiError("Deepgram API key not configured", 500);
  }

  // Validate file size (max 100MB for meetings)
  if (audioFile.size > 100 * 1024 * 1024) {
    return apiError("Audio file must be less than 100MB", 400);
  }

  const supabase = createServiceRoleClient();

  // Verify meeting exists and belongs to org
  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, status")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!meeting) {
    return apiError("Meeting not found", 404);
  }

  // Send to Deepgram with diarisation
  const audioBuffer = await audioFile.arrayBuffer();

  const dgResponse = await fetch(
    "https://api.deepgram.com/v1/listen?" +
      new URLSearchParams({
        model: "nova-3",
        language: "en",
        diarize: "true",
        punctuate: "true",
        paragraphs: "true",
        utterances: "true",
        smart_format: "true",
      }),
    {
      method: "POST",
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": audioFile.type || "audio/webm",
      },
      body: audioBuffer,
    },
  );

  if (!dgResponse.ok) {
    const errText = await dgResponse.text();
    console.error("Deepgram error:", dgResponse.status, errText);
    return apiError("Transcription failed", 502);
  }

  const dgResult = await dgResponse.json();

  // Extract utterances with speaker labels
  const chunks = parseDeepgramUtterances(dgResult);
  const fullText = composeTranscriptFullText(chunks, {
    purpose,
    recordingContext,
    attendeeNotes,
  });

  // Store transcript — upsert in case one already exists
  const { data: existing } = await supabase
    .from("meeting_transcripts")
    .select("id")
    .eq("meeting_id", id)
    .maybeSingle();

  let transcript;
  if (existing) {
    const { data, error } = await supabase
      .from("meeting_transcripts")
      .update({ chunks, full_text: fullText })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    transcript = data;
  } else {
    const { data, error } = await supabase
      .from("meeting_transcripts")
      .insert({ meeting_id: id, chunks, full_text: fullText })
      .select()
      .single();
    if (error) throw error;
    transcript = data;
  }

  // Count unique speakers
  const speakers = extractSpeakerLabels(chunks);

  return apiSuccess({
    transcript,
    summary: {
      duration_seconds: dgResult.metadata?.duration || 0,
      speaker_count: speakers.length,
      utterance_count: chunks.length,
      word_count: fullText.split(/\s+/).length,
      speaker_labels: speakers,
    },
  });
});

/**
 * PATCH /api/meetings/[id]/transcribe
 * Rename diarised speakers after the transcript is generated.
 */
export const PATCH = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId", 400);
  }

  const body = await request.json();
  const speakerMap = body.speakerMap as Record<string, string> | undefined;

  if (!speakerMap || Object.keys(speakerMap).length === 0) {
    return apiError("Missing speaker map", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (!meeting) {
    return apiError("Meeting not found", 404);
  }

  const { data: transcript, error: transcriptError } = await supabase
    .from("meeting_transcripts")
    .select("*")
    .eq("meeting_id", id)
    .maybeSingle();

  if (transcriptError) {
    console.error("Error fetching transcript:", transcriptError);
    return apiError("Failed to fetch transcript", 500);
  }

  if (!transcript) {
    return apiError("Transcript not found", 404);
  }

  const chunks = applySpeakerMap(transcript.chunks || [], speakerMap);
  const fullText = preserveTranscriptContext(
    transcript.full_text,
    composeTranscriptFullText(chunks),
  );

  const { data: updated, error } = await supabase
    .from("meeting_transcripts")
    .update({ chunks, full_text: fullText })
    .eq("id", transcript.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating transcript speakers:", error);
    return apiError("Failed to update speakers", 500);
  }

  return apiSuccess({
    transcript: updated,
    speaker_labels: extractSpeakerLabels(chunks),
  });
});

function getFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function preserveTranscriptContext(
  previousFullText: string | null,
  transcriptText: string,
): string {
  if (!previousFullText?.includes("\n\nTRANSCRIPT:\n")) {
    return transcriptText;
  }

  const [context] = previousFullText.split("\n\nTRANSCRIPT:\n");
  return `${context}\n\nTRANSCRIPT:\n${transcriptText}`;
}
