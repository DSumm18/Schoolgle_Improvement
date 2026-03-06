/**
 * Vision AI -- Model Routing
 *
 * Selects the optimal model for each vision context type.
 * Uses direct Gemini API for vision tasks (lower latency, native video).
 * Falls back to OpenRouter for report generation.
 */

import type { VisionContextType } from "./types";

// ---------------------------------------------------------------------------
// Model definitions
// ---------------------------------------------------------------------------

export interface VisionModelConfig {
  id: string;
  provider: "gemini" | "openrouter";
  /** Gemini API model name or OpenRouter model path */
  modelName: string;
  costPerCallEstimate: number;
  maxTokens: number;
  temperature: number;
  supportsVideo: boolean;
}

const GEMINI_FLASH: VisionModelConfig = {
  id: "gemini-2.5-flash",
  provider: "gemini",
  modelName: "gemini-2.5-flash-preview-04-17",
  costPerCallEstimate: 0.003,
  maxTokens: 4096,
  temperature: 0.1,
  supportsVideo: true,
};

const GEMINI_PRO: VisionModelConfig = {
  id: "gemini-2.5-pro",
  provider: "gemini",
  modelName: "gemini-2.5-pro-preview-05-06",
  costPerCallEstimate: 0.01,
  maxTokens: 8192,
  temperature: 0.1,
  supportsVideo: true,
};

const QWEN_VISION: VisionModelConfig = {
  id: "qwen-2.5-vl",
  provider: "openrouter",
  modelName: "qwen/qwen-2.5-vl-72b-instruct",
  costPerCallEstimate: 0.004,
  maxTokens: 4096,
  temperature: 0.1,
  supportsVideo: false,
};

const CLAUDE_SONNET: VisionModelConfig = {
  id: "claude-sonnet-4",
  provider: "openrouter",
  modelName: "anthropic/claude-sonnet-4",
  costPerCallEstimate: 0.008,
  maxTokens: 4096,
  temperature: 0.2,
  supportsVideo: false,
};

const DEEPSEEK: VisionModelConfig = {
  id: "deepseek-chat",
  provider: "openrouter",
  modelName: "deepseek/deepseek-chat",
  costPerCallEstimate: 0.002,
  maxTokens: 4096,
  temperature: 0.2,
  supportsVideo: false,
};

// ---------------------------------------------------------------------------
// Task-to-model mapping
// ---------------------------------------------------------------------------

type VisionTaskType = VisionContextType | "report-generation";

const TASK_MODEL_MAP: Record<VisionTaskType, VisionModelConfig[]> = {
  "room-assessment": [GEMINI_FLASH, QWEN_VISION],
  "coshh-scan": [GEMINI_FLASH, QWEN_VISION],
  snagging: [GEMINI_PRO, GEMINI_FLASH],
  "lone-worker": [GEMINI_FLASH],
  "report-generation": [CLAUDE_SONNET, DEEPSEEK],
};

// ---------------------------------------------------------------------------
// Model selection
// ---------------------------------------------------------------------------

export function selectVisionModel(
  task: VisionTaskType,
  options?: { preferCheap?: boolean },
): VisionModelConfig {
  const models = TASK_MODEL_MAP[task] ?? TASK_MODEL_MAP["room-assessment"];

  if (options?.preferCheap && models.length > 1) {
    // Return cheapest available
    return models.reduce((cheapest, m) =>
      m.costPerCallEstimate < cheapest.costPerCallEstimate ? m : cheapest,
    );
  }

  // Default: first (optimal) model
  return models[0];
}

export function getFallbackModel(
  task: VisionTaskType,
): VisionModelConfig | undefined {
  const models = TASK_MODEL_MAP[task];
  return models && models.length > 1 ? models[1] : undefined;
}

// ---------------------------------------------------------------------------
// Gemini API call
// ---------------------------------------------------------------------------

export async function callGeminiVision(
  model: VisionModelConfig,
  systemPrompt: string,
  imageBase64: string,
  mimeType: string = "image/jpeg",
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  // Strip data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model.modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { inlineData: { mimeType, data: base64Data } },
            ],
          },
        ],
        generationConfig: {
          temperature: model.temperature,
          maxOutputTokens: model.maxTokens,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini vision model");
  return text;
}

// ---------------------------------------------------------------------------
// OpenRouter API call (for report generation / fallback)
// ---------------------------------------------------------------------------

export async function callOpenRouterVision(
  model: VisionModelConfig,
  systemPrompt: string,
  imageBase64: string,
  mimeType: string = "image/jpeg",
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const imageUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:${mimeType};base64,${imageBase64}`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://schoolgle.co.uk",
        "X-Title": "Schoolgle Vision AI",
      },
      body: JSON.stringify({
        model: model.modelName,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyse this image and return structured JSON.",
              },
              {
                type: "image_url",
                image_url: { url: imageUrl, detail: "high" },
              },
            ],
          },
        ],
        max_tokens: model.maxTokens,
        temperature: model.temperature,
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ---------------------------------------------------------------------------
// Unified call -- routes to the right provider
// ---------------------------------------------------------------------------

export async function callVisionModel(
  model: VisionModelConfig,
  systemPrompt: string,
  imageBase64: string,
  mimeType?: string,
): Promise<string> {
  if (model.provider === "gemini") {
    return callGeminiVision(model, systemPrompt, imageBase64, mimeType);
  }
  return callOpenRouterVision(model, systemPrompt, imageBase64, mimeType);
}
