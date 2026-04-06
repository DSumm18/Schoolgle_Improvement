// ─── Lesson Studio: Intent Extraction ──────────────────────────────────────
// Takes raw lesson plan text (formal plans, brief teacher notes, or voice
// transcription) and extracts structured lesson intent via Claude on OpenRouter.

import { openrouter } from "@/lib/ai-openrouter";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface InteractionPoint {
  id: string;
  label: string;
  type: "reveal" | "label" | "sequence" | "drag" | "toggle";
  curriculum_code: string | null;
  description: string;
}

export interface LessonIntent {
  subject: string;
  year_group: string;
  topic: string;
  learning_objectives: string[];
  key_vocabulary: { word: string; definition: string }[];
  concept_to_visualise: string;
  curriculum_codes: string[];
  suggested_interaction_points: InteractionPoint[];
}

// ─── Constants ─────────────────────────────────────────────────────────────

const MODEL_ID = "anthropic/claude-sonnet-4";

const SYSTEM_PROMPT = `You are an expert UK primary school curriculum analyst. Your job is to extract structured lesson intent from raw lesson plan text.

The input may be:
- A formal, structured lesson plan with objectives, success criteria, and activities
- Brief teacher notes (e.g. "Do circulatory system. Heart, blood, lungs. Year 6 science.")
- Voice transcription from speech-to-text (may contain errors, incomplete sentences, filler words)

For ALL input types, extract the structured intent. Infer missing details from context:
- If year_group is not stated, infer from curriculum codes or topic complexity
- If curriculum_codes are not stated, infer from the subject and topic
- For concept_to_visualise, choose the most visual/diagrammatic concept in the lesson
- For interaction_points, suggest 3-6 interactive elements that would help pupils engage with the visualisation

Use UK National Curriculum codes where possible (e.g. "Y6-SC-4" for Year 6 Science strand 4).

Return ONLY valid JSON matching the schema. No markdown, no explanation.`;

const USER_PROMPT_TEMPLATE = `Extract the lesson intent from this raw lesson plan text:

---
{INPUT_TEXT}
---

Return JSON with this exact structure:
{
  "subject": "e.g. Science",
  "year_group": "e.g. Year 6",
  "topic": "e.g. The Circulatory System",
  "learning_objectives": ["objective 1", "objective 2"],
  "key_vocabulary": [{"word": "artery", "definition": "A blood vessel that carries blood away from the heart"}],
  "concept_to_visualise": "The human circulatory system showing the heart, lungs, arteries, veins, and capillaries",
  "curriculum_codes": ["Y6-SC-4a", "Y6-SC-4b"],
  "suggested_interaction_points": [
    {
      "id": "ip-1",
      "label": "Heart chambers",
      "type": "reveal",
      "curriculum_code": "Y6-SC-4a",
      "description": "Click to reveal the four chambers of the heart and their functions"
    }
  ]
}`;

// ─── Main Function ─────────────────────────────────────────────────────────

export async function extractLessonIntent(
  rawText: string,
): Promise<LessonIntent> {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("Cannot extract intent from empty text");
  }

  const userPrompt = USER_PROMPT_TEMPLATE.replace("{INPUT_TEXT}", rawText);

  const completion = await openrouter.chat.completions.create({
    model: MODEL_ID,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 2000,
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("AI returned empty response during intent extraction");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`AI returned invalid JSON during intent extraction: ${raw.slice(0, 200)}`);
  }

  return validateLessonIntent(parsed);
}

// ─── Validation ────────────────────────────────────────────────────────────

function validateLessonIntent(data: Record<string, unknown>): LessonIntent {
  const subject = typeof data.subject === "string" ? data.subject : "Unknown";
  const year_group = typeof data.year_group === "string" ? data.year_group : "Unknown";
  const topic = typeof data.topic === "string" ? data.topic : "Unknown";

  const learning_objectives = Array.isArray(data.learning_objectives)
    ? data.learning_objectives.filter((o): o is string => typeof o === "string")
    : [];

  const key_vocabulary = Array.isArray(data.key_vocabulary)
    ? data.key_vocabulary
        .filter(
          (v): v is { word: string; definition: string } =>
            typeof v === "object" &&
            v !== null &&
            typeof (v as Record<string, unknown>).word === "string" &&
            typeof (v as Record<string, unknown>).definition === "string",
        )
        .map((v) => ({ word: v.word, definition: v.definition }))
    : [];

  const concept_to_visualise =
    typeof data.concept_to_visualise === "string"
      ? data.concept_to_visualise
      : topic;

  const curriculum_codes = Array.isArray(data.curriculum_codes)
    ? data.curriculum_codes.filter((c): c is string => typeof c === "string")
    : [];

  const suggested_interaction_points = Array.isArray(
    data.suggested_interaction_points,
  )
    ? data.suggested_interaction_points
        .filter(
          (p): p is Record<string, unknown> =>
            typeof p === "object" && p !== null,
        )
        .map((p, i) => ({
          id: typeof p.id === "string" ? p.id : `ip-${i + 1}`,
          label: typeof p.label === "string" ? p.label : `Point ${i + 1}`,
          type: validateInteractionType(p.type),
          curriculum_code:
            typeof p.curriculum_code === "string" ? p.curriculum_code : null,
          description:
            typeof p.description === "string" ? p.description : "",
        }))
    : [];

  return {
    subject,
    year_group,
    topic,
    learning_objectives,
    key_vocabulary,
    concept_to_visualise,
    curriculum_codes,
    suggested_interaction_points,
  };
}

function validateInteractionType(
  type: unknown,
): InteractionPoint["type"] {
  const valid = ["reveal", "label", "sequence", "drag", "toggle"];
  return typeof type === "string" && valid.includes(type)
    ? (type as InteractionPoint["type"])
    : "reveal";
}
