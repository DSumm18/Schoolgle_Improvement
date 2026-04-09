import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
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
  const utterances = dgResult.results?.utterances || [];
  const chunks = utterances.map((u: any) => ({
    timestamp: formatSeconds(u.start),
    speaker: `Speaker ${u.speaker}`,
    text: u.transcript,
  }));

  // Build full text with speaker labels
  const fullText = chunks
    .map((c: any) => `[${c.timestamp}] ${c.speaker}: ${c.text}`)
    .join("\n");

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
  const speakers = new Set(chunks.map((c: any) => c.speaker));

  return apiSuccess({
    transcript,
    summary: {
      duration_seconds: dgResult.metadata?.duration || 0,
      speaker_count: speakers.size,
      utterance_count: chunks.length,
      word_count: fullText.split(/\s+/).length,
    },
  });
});

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
