import { NextRequest, NextResponse } from "next/server";

/**
 * Fish Audio TTS Proxy - /api/fish-audio/tts
 * The ed-widget posts to /api/fish-audio/tts (matching the Fish Audio v1/tts endpoint)
 * This route forwards to https://api.fish.audio/v1/tts with server-side API key
 */
export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const apiKey = process.env.FISH_AUDIO_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Fish Audio API key not configured" },
        { status: 500 },
      );
    }

    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "Fish Audio TTS failed",
          details: errorText,
          status: response.status,
        },
        { status: response.status },
      );
    }

    const audioBlob = await response.blob();
    return new NextResponse(audioBlob, {
      headers: { "Content-Type": "audio/mpeg" },
    });
  } catch (error) {
    console.error("[Fish Audio TTS Proxy] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
