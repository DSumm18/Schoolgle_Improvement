// ─── Lesson Studio: Visualisation Generation ──────────────────────────────
// Takes LessonIntent JSON and generates a master SVG/HTML visualisation
// with ARIA labels and interactive elements tagged with curriculum codes.

import { openrouter } from "@/lib/ai-openrouter";
import type { LessonIntent, InteractionPoint } from "./extract-intent";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface InteractionManifest {
  total_interactions: number;
  interactions: InteractionEntry[];
  curriculum_codes_covered: string[];
}

export interface InteractionEntry {
  id: string;
  element_selector: string;
  type: InteractionPoint["type"];
  label: string;
  curriculum_code: string | null;
  aria_label: string;
}

export interface VisualisationResult {
  svg: string;
  html: string;
  interaction_manifest: InteractionManifest;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const MODEL_ID = "anthropic/claude-sonnet-4";

function buildSystemPrompt(): string {
  return `You are an expert educational visualisation designer for UK primary schools.
Your job is to generate SVG diagrams that teach concepts visually.

Rules:
1. Generate clean, well-structured SVG code
2. Every meaningful element MUST have an aria-label attribute
3. Interactive elements MUST have a data-interaction-id attribute matching the interaction point IDs
4. Interactive elements MUST have a data-curriculum-code attribute when a code is available
5. Use clear, age-appropriate labels and colours
6. Use UK English spelling throughout
7. SVG must be self-contained (no external references)
8. Use viewBox for responsive scaling
9. Include a title element for accessibility
10. Use semantic grouping with <g> elements and role attributes

Colour palette for educational diagrams:
- Primary content: #1e3a5f (dark blue)
- Labels: #374151 (dark grey)
- Highlights: #dc2626 (red for arteries), #2563eb (blue for veins)
- Background elements: #f3f4f6 (light grey)
- Interactive hotspots: #f59e0b (amber)

Return ONLY valid JSON with "svg" and "interaction_manifest" fields. No markdown.`;
}

function buildUserPrompt(intent: LessonIntent): string {
  const interactions = intent.suggested_interaction_points
    .map(
      (p) =>
        `- ${p.id}: "${p.label}" (type: ${p.type}, code: ${p.curriculum_code || "none"}) — ${p.description}`,
    )
    .join("\n");

  return `Generate an educational SVG visualisation for this lesson:

Subject: ${intent.subject}
Year Group: ${intent.year_group}
Topic: ${intent.topic}
Concept to Visualise: ${intent.concept_to_visualise}

Learning Objectives:
${intent.learning_objectives.map((o) => `- ${o}`).join("\n")}

Key Vocabulary:
${intent.key_vocabulary.map((v) => `- ${v.word}: ${v.definition}`).join("\n")}

Curriculum Codes: ${intent.curriculum_codes.join(", ")}

Required Interactive Elements:
${interactions}

Return JSON:
{
  "svg": "<svg viewBox='0 0 800 600' xmlns='http://www.w3.org/2000/svg'>...</svg>",
  "interaction_manifest": {
    "total_interactions": ${intent.suggested_interaction_points.length},
    "interactions": [
      {
        "id": "ip-1",
        "element_selector": "[data-interaction-id='ip-1']",
        "type": "reveal",
        "label": "Heart chambers",
        "curriculum_code": "Y6-SC-4a",
        "aria_label": "Click to reveal heart chambers"
      }
    ],
    "curriculum_codes_covered": ["Y6-SC-4a"]
  }
}`;
}

// ─── Main Function ─────────────────────────────────────────────────────────

export async function generateVisualisation(
  intent: LessonIntent,
): Promise<VisualisationResult> {
  if (!intent || !intent.concept_to_visualise) {
    throw new Error("LessonIntent with concept_to_visualise is required");
  }

  const completion = await openrouter.chat.completions.create({
    model: MODEL_ID,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(intent) },
    ],
    max_tokens: 4000,
    temperature: 0.5,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("AI returned empty response during visualisation generation");
  }

  // Extract JSON — handle potential markdown wrapping
  const jsonStr = extractJsonFromResponse(raw);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(
      `AI returned invalid JSON during visualisation generation: ${raw.slice(0, 300)}`,
    );
  }

  const svg = typeof parsed.svg === "string" ? parsed.svg : "";
  if (!svg.includes("<svg")) {
    throw new Error("AI response does not contain valid SVG");
  }

  const manifest = validateManifest(
    parsed.interaction_manifest as Record<string, unknown> | undefined,
    intent,
  );

  // Build HTML wrapper with ARIA landmarks and curriculum metadata
  const html = buildHtmlWrapper(svg, intent, manifest);

  return {
    svg,
    html,
    interaction_manifest: manifest,
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function extractJsonFromResponse(raw: string): string {
  // Try raw first
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;

  // Try extracting from markdown code block
  const jsonMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (jsonMatch) return jsonMatch[1].trim();

  // Last resort: find first { to last }
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return trimmed.slice(start, end + 1);

  return trimmed;
}

function validateManifest(
  data: Record<string, unknown> | undefined,
  intent: LessonIntent,
): InteractionManifest {
  if (!data || typeof data !== "object") {
    // Build manifest from intent interaction points
    return {
      total_interactions: intent.suggested_interaction_points.length,
      interactions: intent.suggested_interaction_points.map((p) => ({
        id: p.id,
        element_selector: `[data-interaction-id='${p.id}']`,
        type: p.type,
        label: p.label,
        curriculum_code: p.curriculum_code,
        aria_label: `${p.type === "reveal" ? "Click to reveal" : "Interactive element"}: ${p.label}`,
      })),
      curriculum_codes_covered: intent.curriculum_codes,
    };
  }

  const interactions = Array.isArray(data.interactions)
    ? data.interactions
        .filter(
          (i): i is Record<string, unknown> =>
            typeof i === "object" && i !== null,
        )
        .map((i) => ({
          id: typeof i.id === "string" ? i.id : "",
          element_selector:
            typeof i.element_selector === "string"
              ? i.element_selector
              : `[data-interaction-id='${i.id}']`,
          type: validateType(i.type),
          label: typeof i.label === "string" ? i.label : "",
          curriculum_code:
            typeof i.curriculum_code === "string" ? i.curriculum_code : null,
          aria_label: typeof i.aria_label === "string" ? i.aria_label : "",
        }))
    : [];

  const codes = Array.isArray(data.curriculum_codes_covered)
    ? data.curriculum_codes_covered.filter(
        (c): c is string => typeof c === "string",
      )
    : intent.curriculum_codes;

  return {
    total_interactions: interactions.length,
    interactions,
    curriculum_codes_covered: codes,
  };
}

function validateType(type: unknown): InteractionPoint["type"] {
  const valid = ["reveal", "label", "sequence", "drag", "toggle"];
  return typeof type === "string" && valid.includes(type)
    ? (type as InteractionPoint["type"])
    : "reveal";
}

function buildHtmlWrapper(
  svg: string,
  intent: LessonIntent,
  manifest: InteractionManifest,
): string {
  const vocabJson = JSON.stringify(intent.key_vocabulary);
  const manifestJson = JSON.stringify(manifest);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(intent.topic)} — ${escapeHtml(intent.subject)} Visualisation</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Poppins', sans-serif; background: #f9fafb; }
    .vis-container {
      max-width: 900px;
      margin: 2rem auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .vis-header {
      padding: 1.5rem;
      background: #1e3a5f;
      color: white;
    }
    .vis-header h1 { font-size: 1.25rem; font-weight: 600; }
    .vis-header p { font-size: 0.875rem; opacity: 0.8; margin-top: 0.25rem; }
    .vis-body { padding: 1.5rem; }
    .vis-body svg { width: 100%; height: auto; }
    .vis-vocab {
      padding: 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.75rem;
    }
    .vocab-item {
      padding: 0.75rem;
      background: #f3f4f6;
      border-radius: 8px;
    }
    .vocab-word { font-weight: 600; color: #1e3a5f; }
    .vocab-def { font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem; }
    [data-interaction-id] { cursor: pointer; }
    [data-interaction-id]:hover { opacity: 0.8; }
    [data-interaction-id]:focus { outline: 3px solid #f59e0b; outline-offset: 2px; }
  </style>
</head>
<body>
  <main class="vis-container" role="main" aria-label="${escapeHtml(intent.topic)} interactive visualisation">
    <header class="vis-header">
      <h1>${escapeHtml(intent.topic)}</h1>
      <p>${escapeHtml(intent.subject)} — ${escapeHtml(intent.year_group)}</p>
    </header>
    <div class="vis-body" role="img" aria-label="${escapeHtml(intent.concept_to_visualise)}">
      ${svg}
    </div>
    <section class="vis-vocab" aria-label="Key vocabulary">
      ${intent.key_vocabulary.map((v) => `<div class="vocab-item"><div class="vocab-word">${escapeHtml(v.word)}</div><div class="vocab-def">${escapeHtml(v.definition)}</div></div>`).join("\n      ")}
    </section>
  </main>
  <script>
    // Interaction manifest for JS-driven interactivity
    window.__LESSON_MANIFEST__ = ${manifestJson};
    window.__LESSON_VOCAB__ = ${vocabJson};
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
