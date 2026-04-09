/**
 * Morning Brief Script Generator
 *
 * Takes a structured MorningBriefData and generates a natural language script
 * using an LLM via OpenRouter. Falls back to template-based generation if
 * the AI call fails.
 */

import type { BriefSections, BriefSection } from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Use DeepSeek for cost-efficiency (matches existing model stack)
const MODEL = "deepseek/deepseek-chat";

// ─── AI script generation ───────────────────────────────────────────

function buildPrompt(
  schoolName: string,
  headName: string,
  date: string,
  sections: BriefSections,
): string {
  return `You are Ed, the AI assistant for ${schoolName}. Generate a 60-90 second spoken briefing for the headteacher.

Rules:
- Start with "Good morning ${headName}. Here's your ${schoolName} briefing for ${date}."
- Only include sections where there IS something to report. Skip empty sections entirely.
- Lead with anything urgent (safeguarding flags, failed compliance checks).
- Be concise — one or two sentences per section maximum.
- End with "That's your briefing. Have a good day."
- Tone: warm, professional, calm. Like a trusted deputy giving a handover.
- NEVER include pupil names. Use counts only.
- Staff names OK for absence notifications (operational data, not PII).
- Do NOT use markdown, bullet points, or formatting — this is a spoken script.

Data:
${JSON.stringify(sections, null, 2)}`;
}

export async function generateScript(
  schoolName: string,
  headName: string,
  date: string,
  sections: BriefSections,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.log("[Script Generator] No OPENROUTER_API_KEY — using template fallback");
    return templateFallback(schoolName, headName, date, sections);
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://schoolgle.co.uk",
        "X-Title": "Schoolgle Morning Brief",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: buildPrompt(schoolName, headName, date, sections),
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error(`[Script Generator] OpenRouter error: ${response.status}`);
      return templateFallback(schoolName, headName, date, sections);
    }

    const data = await response.json();
    const script = data?.choices?.[0]?.message?.content?.trim();

    if (!script) {
      return templateFallback(schoolName, headName, date, sections);
    }

    return script;
  } catch (err) {
    console.error("[Script Generator] AI generation failed:", err);
    return templateFallback(schoolName, headName, date, sections);
  }
}

// ─── Template fallback ──────────────────────────────────────────────

function sectionNarration(name: string, section: BriefSection): string {
  if (section.count === 0 || section.summary.includes("not yet connected") || section.summary.includes("No data available")) {
    return "";
  }

  return section.summary;
}

function templateFallback(
  schoolName: string,
  headName: string,
  date: string,
  sections: BriefSections,
): string {
  const lines: string[] = [];

  lines.push(`Good morning ${headName}. Here's your ${schoolName} briefing for ${date}.`);

  // Lead with urgent (red) sections
  const sectionOrder: Array<[string, BriefSection]> = [
    ["Safeguarding", sections.safeguarding],
    ["Estates", sections.estates],
    ["Staffing", sections.staffing],
    ["Governance", sections.governance],
    ["Finance", sections.finance],
    ["Teaching", sections.teaching],
    ["Ofsted readiness", sections.ofsted],
  ];

  const red = sectionOrder.filter(([, s]) => s.rag === "red");
  const amber = sectionOrder.filter(([, s]) => s.rag === "amber");
  const green = sectionOrder.filter(
    ([, s]) => s.rag === "green" && s.count > 0,
  );

  for (const [name, section] of red) {
    const narration = sectionNarration(name, section);
    if (narration) lines.push(`${name}: ${narration}`);
  }

  for (const [name, section] of amber) {
    const narration = sectionNarration(name, section);
    if (narration) lines.push(`${name}: ${narration}`);
  }

  for (const [name, section] of green) {
    const narration = sectionNarration(name, section);
    if (narration) lines.push(`${name}: ${narration}`);
  }

  // Mention all-clear areas
  const allClear = sectionOrder.filter(
    ([, s]) => s.rag === "green" && s.count === 0 && !s.summary.includes("not yet"),
  );
  if (allClear.length > 0) {
    const names = allClear.map(([n]) => n.toLowerCase()).join(", ");
    lines.push(`Everything else — ${names} — all clear.`);
  }

  lines.push("That's your briefing. Have a good day.");

  return lines.join(" ");
}
