import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

/**
 * POST /api/meetings/[id]/transcribe
 * Send recorded audio to Deepgram with speaker diarisation,
 * store the result in meeting_transcripts.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const organizationId = formData.get("organizationId") as string;

    if (!audioFile || !organizationId) {
      return NextResponse.json(
        { error: "Missing audio file or organizationId" },
        { status: 400 },
      );
    }

    if (!DEEPGRAM_API_KEY) {
      return NextResponse.json(
        { error: "Deepgram API key not configured" },
        { status: 500 },
      );
    }

    // Validate file size (max 100MB for meetings)
    if (audioFile.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file must be less than 100MB" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify meeting exists and belongs to org
    const { data: meeting } = await supabase
      .from("meetings")
      .select("id, status")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
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
      return NextResponse.json(
        { error: "Transcription failed", details: errText },
        { status: 502 },
      );
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

    return NextResponse.json({
      transcript,
      summary: {
        duration_seconds: dgResult.metadata?.duration || 0,
        speaker_count: speakers.size,
        utterance_count: chunks.length,
        word_count: fullText.split(/\s+/).length,
      },
    });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
