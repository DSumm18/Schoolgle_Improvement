import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are Ed, the friendly AI assistant for Aurora Primary School.
Aurora Primary is a Church of England primary school. Motto: "Learn. Love. Grow."
Christian values: Compassion, Courage, Forgiveness, Friendship, Respect, Thankfulness.
Founded in 1710. Located in Yorkshire, England.

You help parents, visitors, and staff with:
- School information (location, contact, hours)
- Admissions and enrolment enquiries
- Term dates and calendar events
- Form filling guidance (be patient, supportive)
- General questions about the school

Guidelines:
- Be warm, welcoming, and professional
- Keep responses concise (2-3 sentences for simple questions)
- If you don't know specific information, suggest contacting the school office
- Support parents for whom English isn't their first language
- When helping with forms, guide through each field patiently
- If the user speaks in another language, respond in that language
- Flag attendance risks if discussing absence requests (90% threshold, penalty notices)

You are the public face of the school. Be helpful, warm, and accurate.`;

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();
    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        id: crypto.randomUUID(),
        answer:
          "I'm having trouble connecting right now. Please try again in a moment.",
        confidence: 0.5,
        source: "fallback",
      });
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://schoolgle.co.uk",
          "X-Title": "Schoolgle Ed Demo",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite-001",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: question },
          ],
          temperature: 0.7,
          max_tokens: 512,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[Demo Chat] OpenRouter error:",
        response.status,
        errorText,
      );
      throw new Error(`OpenRouter ${response.status}`);
    }

    const data = await response.json();
    const answer =
      data.choices?.[0]?.message?.content ||
      "I'm sorry, I couldn't process that. Could you try again?";

    return NextResponse.json({
      id: crypto.randomUUID(),
      answer,
      confidence: 0.85,
      source: "ai",
    });
  } catch (error) {
    console.error("[Demo Chat] Error:", error);
    return NextResponse.json({
      id: crypto.randomUUID(),
      answer:
        "I'm having a moment — could you try asking again? If it keeps happening, the school office can help directly.",
      confidence: 0,
      source: "fallback",
    });
  }
}
