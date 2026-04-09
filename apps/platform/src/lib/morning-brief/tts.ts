/**
 * Morning Brief TTS (Text-to-Speech)
 *
 * Converts a script string into audio via Fish Audio API.
 * Also provides a template-based script builder as a fallback
 * for the AI script generator.
 */

import type { BriefSection, BriefSections } from "./types";

// Default voice: prefer FISH_AUDIO_VOICE_ID_ED env var, fallback to hardcoded Edwina voice
function getDefaultVoiceId(): string {
  return (
    process.env.FISH_AUDIO_VOICE_ID_ED ??
    process.env.FISH_AUDIO_VOICE_ID_EDWINA ??
    "72e3a3135204461ba041df787dc5c834"
  );
}

// ─── Template script builder (fallback) ─────────────────────────────

function sectionNarration(name: string, section: BriefSection): string {
  if (section.count === 0) {
    return `${name}: all clear.`;
  }

  const itemNames = section.items
    .slice(0, 3)
    .map((i) => i.title)
    .join(", ");

  const extra =
    section.count > 3 ? ` and ${section.count - 3} more` : "";

  return `${name}: ${section.count} item${section.count !== 1 ? "s" : ""}. ${itemNames}${extra}.`;
}

export function briefToScript(sections: BriefSections, headline: string): string {
  const lines: string[] = [];

  lines.push("Good morning. Here is your morning brief.");
  lines.push(headline);

  const sectionOrder: Array<[string, BriefSection]> = [
    ["Safeguarding", sections.safeguarding],
    ["Estates", sections.estates],
    ["Staffing", sections.staffing],
    ["Governance", sections.governance],
    ["Finance", sections.finance],
    ["Teaching", sections.teaching],
    ["Ofsted readiness", sections.ofsted],
  ];

  // Only narrate non-green sections, then summarise green ones
  const nonGreen = sectionOrder.filter(([, s]) => s.rag !== "green");
  const green = sectionOrder.filter(([, s]) => s.rag === "green" && s.count > 0);

  for (const [name, section] of nonGreen) {
    lines.push(sectionNarration(name, section));
  }

  if (green.length > 0) {
    const greenNames = green.map(([n]) => n.toLowerCase()).join(", ");
    lines.push(`${greenNames} — all clear.`);
  }

  lines.push("That's your brief. Have a great day.");

  return lines.join(" ");
}

/** Strip Fish Audio emotion tags for plain text display */
export function stripEmotionTags(script: string): string {
  return script.replace(/\[[\w\s]+\]\s*/g, "");
}

// ─── Audio generation ───────────────────────────────────────────────

export async function generateBriefAudio(
  scriptText: string,
  voiceId?: string,
): Promise<ArrayBuffer | null> {
  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) {
    console.log("[Morning Brief TTS] No FISH_AUDIO_API_KEY set — skipping audio generation");
    return null;
  }

  try {
    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: scriptText,
        voice_id: voiceId ?? getDefaultVoiceId(),
      }),
    });

    if (!response.ok) {
      console.error(
        `[Morning Brief TTS] Fish Audio API error: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    return await response.arrayBuffer();
  } catch (err) {
    console.error("[Morning Brief TTS] Failed to generate audio:", err);
    return null;
  }
}
