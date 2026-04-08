/**
 * Morning Brief TTS (Text-to-Speech)
 *
 * Converts a MorningBriefData object into a spoken script and generates
 * audio via Fish Audio API.
 */

import type { MorningBriefData, BriefSection } from "./types";

// Re-export for consumers
export type { MorningBriefData };

// Default Edwina voice — matches packages/ed-agents Fish Audio provider
const DEFAULT_VOICE_ID = "72e3a3135204461ba041df787dc5c834";

// ─── Script builder ─────────────────────────────────────────────────

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

export function briefToScript(brief: MorningBriefData): string {
  const lines: string[] = [];

  lines.push("Good morning. Here is your morning brief.");
  lines.push(brief.headline);

  const sectionOrder: Array<[string, BriefSection]> = [
    ["Compliance", brief.sections.compliance],
    ["Tasks", brief.sections.tasks],
    ["Risks", brief.sections.risks],
    ["Staffing", brief.sections.staffing],
    ["Calendar", brief.sections.calendar],
  ];

  // Only narrate non-green sections, then summarise green ones
  const nonGreen = sectionOrder.filter(([, s]) => s.rag !== "green");
  const green = sectionOrder.filter(([, s]) => s.rag === "green");

  for (const [name, section] of nonGreen) {
    lines.push(sectionNarration(name, section));
  }

  if (green.length > 0 && green.length < sectionOrder.length) {
    const greenNames = green.map(([n]) => n.toLowerCase()).join(", ");
    lines.push(`${greenNames} — all clear.`);
  }

  lines.push("That's your brief. Have a great day.");

  return lines.join(" ");
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
        voice_id: voiceId ?? DEFAULT_VOICE_ID,
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
