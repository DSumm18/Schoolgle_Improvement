import { NextRequest, NextResponse } from "next/server";

/**
 * Gemini Live TTS Endpoint
 *
 * Generates voice audio from text using Gemini Live API.
 * This endpoint is called by EdChatWindow to play voice responses.
 *
 * POST /api/ed/tts/gemini
 * Body: { text: string, mode?: string, module?: string }
 * Returns: Audio blob (PCM or WAV format)
 */
export async function POST(request: NextRequest) {
  try {
    const { text, mode = "normal", module } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Don't generate very short messages or in inspection mode
    if (text.length < 10 || mode === "inspection") {
      return NextResponse.json(
        { error: "Text too short or inspection mode" },
        { status: 200 }
      );
    }

    // Get API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[Gemini TTS] GEMINI_API_KEY not configured");
      return NextResponse.json(
        { error: "Voice service not configured" },
        { status: 500 }
      );
    }

    // Build system instruction based on mode
    const systemInstruction = buildSystemInstruction(mode, module);

    // Call Gemini API for text-to-speech
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-native-audio-preview-12-2025:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text }],
            },
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Kore", // Ed's voice
                },
              },
              temperature: 0.15, // Low temperature for consistency
              topP: 0.9,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Gemini TTS] API error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to generate voice" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract audio data from response
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioData) {
      console.error("[Gemini TTS] No audio in response", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { error: "No audio generated" },
        { status: 500 }
      );
    }

    // Convert base64 to binary
    const audioBuffer = Buffer.from(audioData, "base64");

    // Return as WAV/PCM audio
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[Gemini TTS] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Build system instruction for voice generation
 */
function buildSystemInstruction(mode: string, module?: string): string {
  const baseInstruction = `You are Ed, a calm, intelligent assistant used by school staff across all areas of a UK school.

VOICE AND TONE:
- Speak in clear British English — neutral, slightly refined (similar to a BBC newsreader)
- Maintain a calm, steady speaking pace
- Use a warm but professional tone
- Add light dry humour occasionally
- Never sound exaggerated, theatrical, or like a cartoon character

SPEAKING RULES:
- Keep responses concise
- Use British English terminology: headteacher, Year 6, maths, timetable, half-term
- Use school-specific language naturally: pupil premium, SEND, safeguarding
- NEVER use Americanisms: principal, 6th grade, math, schedule
- NEVER use slang or colloquialisms

IMPORTANT: Competence first, personality second. Never sacrifice clarity for wit.`;

  if (mode === "inspection") {
    return `${baseInstruction}

INSPECTION MODE:
- Fully professional
- No humour
- Clear, direct, and supportive`;
  }

  if (module) {
    const moduleInstructions: Record<string, string> = {
      teaching_learning: "You are helping with teaching and learning. Be encouraging and knowledgeable about curriculum, assessment, and lesson planning.",
      estates_compliance: "You are helping with estates and compliance. Be practical and safety-focused.",
      hr: "You are helping with HR matters. Be supportive, discreet, and professional.",
      finance: "You are helping with finance. Be precise and objective with financial information.",
      intelligence: "You are helping with school intelligence and data. Be analytical and insightful about patterns and trends.",
    };

    return `${baseInstruction}

${moduleInstructions[module] || ""}`;
  }

  return baseInstruction;
}
