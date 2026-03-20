import { NextResponse } from "next/server";

/**
 * Returns the Gemini Live API WebSocket URL with the API key embedded.
 * This keeps the GEMINI_API_KEY server-side — the client never sees the raw key.
 *
 * In production, replace this with ephemeral token generation or a WebSocket proxy.
 */
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 },
    );
  }

  const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

  return NextResponse.json({ wsUrl });
}
