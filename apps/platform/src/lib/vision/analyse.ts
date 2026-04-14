/**
 * Vision Analysis Service — Gemini 2.5 Flash Integration
 *
 * Lightweight image analysis for visual auditing: caretaker takes a photo
 * of a room/cupboard/playground → AI identifies everything visible →
 * returns structured data for COSHH, asset register, compliance checks.
 *
 * Uses Gemini 2.5 Flash as a dedicated vision model — cheap ($0.30/M input
 * tokens), fast, and purpose-built for structured object detection.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VisionAnalysisItem {
  name: string;
  category:
    | "chemical"
    | "equipment"
    | "furniture"
    | "safety"
    | "electrical"
    | "cleaning"
    | "stationery"
    | "other";
  quantity: number;
  condition?: "good" | "fair" | "poor" | "hazard";
  location_description: string;
  compliance_concerns?: string[];
  confidence: number; // 0-1
}

export interface VisionAnalysisResult {
  items: VisionAnalysisItem[];
  summary: string;
  total_items: number;
  compliance_flags: number;
  raw_description: string;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert school estates inspector and inventory auditor. Analyse this image and identify every distinct item visible. For each item return: name, category (chemical/equipment/furniture/safety/electrical/cleaning/stationery/other), estimated quantity, condition if assessable (good/fair/poor/hazard), location description within the image, and any compliance concerns (e.g. chemicals stored above shoulder height, missing COSHH labels, fire exits blocked, expired extinguishers). Return ONLY valid JSON matching this schema:
{
  "items": [{ "name": string, "category": string, "quantity": number, "condition": string|null, "location_description": string, "compliance_concerns": string[]|null, "confidence": number }],
  "summary": string,
  "total_items": number,
  "compliance_flags": number,
  "raw_description": string
}`;

// ---------------------------------------------------------------------------
// Context-specific prompt additions
// ---------------------------------------------------------------------------

const CONTEXT_PROMPTS: Record<string, string> = {
  "Chemical Store":
    "Focus on chemicals: identify every bottle, container, and substance. Check COSHH labelling, storage height, segregation of incompatible chemicals, ventilation, and spill containment.",
  Playground:
    "Focus on playground equipment and surfaces: check for damage, wear, trip hazards, sharp edges, appropriate surfacing under equipment, and fencing integrity.",
  "Plant Room":
    "Focus on mechanical/electrical equipment: boilers, pumps, controls. Check safety signage, access clearance, leak indicators, and maintenance labels/dates.",
  Classroom:
    "Focus on furniture layout, electrical safety, display boards, emergency exits, and general cleanliness. Note any broken furniture or safety hazards.",
  General:
    "Provide a comprehensive inventory of everything visible with emphasis on any health and safety concerns.",
};

// ---------------------------------------------------------------------------
// Core analysis function
// ---------------------------------------------------------------------------

/**
 * Analyse an image using Gemini 2.5 Flash and return structured inventory data.
 *
 * @param imageBase64 - Base64-encoded image data (with or without data URL prefix)
 * @param context - Optional context hint for specialised prompts
 * @returns Structured VisionAnalysisResult
 */
export async function analyseImage(
  imageBase64: string,
  context?: string,
): Promise<VisionAnalysisResult> {
  // Use GOOGLE_AI_API_KEY, falling back to GEMINI_API_KEY for backwards compatibility
  const googleKey = process.env.GOOGLE_AI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const apiKey = (googleKey && googleKey !== "placeholder_david_will_replace") ? googleKey : geminiKey;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY is not configured. Set it in .env.local with your Google AI Studio key.",
    );
  }

  // Strip data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/[^;]+;base64,/, "");

  if (!base64Data || base64Data.length < 50) {
    throw new Error(
      "Invalid image data: base64 string is empty or too short.",
    );
  }

  // Detect mime type from data URL prefix, default to jpeg
  const mimeMatch = imageBase64.match(/^data:(image\/[^;]+);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

  // Build the prompt with optional context
  const contextAddition = context && CONTEXT_PROMPTS[context]
    ? `\n\nAdditional context — this is a ${context}: ${CONTEXT_PROMPTS[context]}`
    : "";
  const fullPrompt = SYSTEM_PROMPT + contextAddition;

  // Call Gemini 2.5 Flash via Google AI SDK
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    { text: fullPrompt },
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
  ]);

  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error("No response text from Gemini vision model.");
  }

  // Parse JSON response — strip markdown code fences if present
  const cleanedText = text
    .replace(/^```json\s*\n?/, "")
    .replace(/\n?```\s*$/, "")
    .trim();

  let parsed: VisionAnalysisResult;
  try {
    parsed = JSON.parse(cleanedText);
  } catch {
    throw new Error(
      `Failed to parse Gemini response as JSON. Raw response: ${text.slice(0, 500)}`,
    );
  }

  // Validate and normalise the response
  return {
    items: Array.isArray(parsed.items) ? parsed.items.map(normaliseItem) : [],
    summary: parsed.summary || "No summary provided.",
    total_items: parsed.total_items ?? (parsed.items?.length ?? 0),
    compliance_flags:
      parsed.compliance_flags ??
      (parsed.items?.filter(
        (i) => i.compliance_concerns && i.compliance_concerns.length > 0,
      ).length ?? 0),
    raw_description: parsed.raw_description || parsed.summary || text,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseItem(item: Partial<VisionAnalysisItem>): VisionAnalysisItem {
  return {
    name: item.name || "Unknown item",
    category: validateCategory(item.category),
    quantity: typeof item.quantity === "number" ? item.quantity : 1,
    condition: validateCondition(item.condition),
    location_description: item.location_description || "Not specified",
    compliance_concerns: Array.isArray(item.compliance_concerns)
      ? item.compliance_concerns
      : undefined,
    confidence:
      typeof item.confidence === "number"
        ? Math.max(0, Math.min(1, item.confidence))
        : 0.5,
  };
}

const VALID_CATEGORIES = [
  "chemical",
  "equipment",
  "furniture",
  "safety",
  "electrical",
  "cleaning",
  "stationery",
  "other",
] as const;

function validateCategory(
  cat: string | undefined,
): VisionAnalysisItem["category"] {
  if (cat && VALID_CATEGORIES.includes(cat as VisionAnalysisItem["category"])) {
    return cat as VisionAnalysisItem["category"];
  }
  return "other";
}

const VALID_CONDITIONS = ["good", "fair", "poor", "hazard"] as const;

function validateCondition(
  cond: string | undefined,
): VisionAnalysisItem["condition"] | undefined {
  if (
    cond &&
    VALID_CONDITIONS.includes(cond as NonNullable<VisionAnalysisItem["condition"]>)
  ) {
    return cond as VisionAnalysisItem["condition"];
  }
  return undefined;
}
