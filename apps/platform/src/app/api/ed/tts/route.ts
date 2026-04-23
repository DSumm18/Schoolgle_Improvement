/**
 * Ed TTS API - Text-to-Speech using Fish Audio
 *
 * Converts Ed's text responses to natural speech using Fish Audio's S1 model.
 * POST /api/ed/tts
 * Body: { text: string, mode?: "normal" | "inspection" }
 * Returns: Audio file (MP3)
 */

import { NextRequest, NextResponse } from "next/server";

interface TTSRequest {
  text: string;
  mode?: "normal" | "inspection";
  speed?: number;
}

// Fish Audio API configuration
const FISH_AUDIO_API_KEY = process.env.FISH_AUDIO_API_KEY || process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY || "";
const FISH_AUDIO_VOICE_ID_ED = process.env.FISH_AUDIO_VOICE_ID_ED || "";
const FISH_AUDIO_API_URL = "https://api.fish.audio/api/v1/tts";

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json();
    const { text, mode = "normal", speed = 1.0 } = body;

    if (!text || text.trim() === "") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Clean the text - remove any markdown or special characters
    const cleanedText = text
      .replace(/\*\*/g, "") // Remove bold markdown
      .replace(/\*/g, "") // Remove italic markdown
      .replace(/#{1,6}\s/g, "") // Remove headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove markdown links
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    if (cleanedText.length === 0) {
      return NextResponse.json(
        { error: "No valid text to speak" },
        { status: 400 }
      );
    }

    if (!FISH_AUDIO_API_KEY) {
      return NextResponse.json(
        { error: "Fish Audio API key not configured" },
        { status: 500 }
      );
    }

    console.log("[Ed TTS] Generating speech:", {
      textLength: cleanedText.length,
      mode,
      speed,
      voiceId: FISH_AUDIO_VOICE_ID_ED || "default",
    });

    // Build Fish Audio API request
    const requestBody: any = {
      text: cleanedText,
      speed: mode === "inspection" ? 0.95 : speed, // Slightly slower for inspection mode
    };

    // Add voice ID if available (cloned Ed voice)
    if (FISH_AUDIO_VOICE_ID_ED) {
      requestBody.reference_id = FISH_AUDIO_VOICE_ID_ED;
    }

    // Call Fish Audio API
    const response = await fetch(FISH_AUDIO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${FISH_AUDIO_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Ed TTS] Fish Audio API error:", {
        status: response.status,
        error: errorText,
      });

      // Return fallback response
      return NextResponse.json(
        {
          error: "Voice generation failed",
          details: process.env.NODE_ENV === "development" ? errorText : undefined,
        },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();

    // Return the audio file
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `inline; filename="ed-response-${Date.now()}.mp3"`,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });

  } catch (error) {
    console.error("[Ed TTS] Error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate speech",
        details: process.env.NODE_ENV === "development"
          ? (error as Error).message
          : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check TTS availability
 */
export async function GET() {
  return NextResponse.json({
    available: !!FISH_AUDIO_API_KEY,
    hasVoice: !!FISH_AUDIO_VOICE_ID_ED,
    voiceId: FISH_AUDIO_VOICE_ID_ED ? "configured" : "not set",
  });
}
