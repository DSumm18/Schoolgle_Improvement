import OpenAI from "openai";
import { assertApprovedModelId } from "@/lib/ai/model-policy";

export const ROUTER_MODELS = {
  DEFAULT: "google/gemini-2.5-flash",
  FAST_FALLBACK: "meta-llama/llama-3.3-70b-instruct",
  REASONING: "openai/o3-mini",
  VISION: "anthropic/claude-3-5-sonnet:beta",
};

export const DEFAULT_ROUTING_FALLBACKS = [
  ROUTER_MODELS.DEFAULT,
  ROUTER_MODELS.FAST_FALLBACK
];

export const openrouter = new OpenAI({
  apiKey:
    process.env.OPENROUTER_API_KEY ||
    process.env.VITE_OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://schoolgle.co.uk",
    "X-Title": "Schoolgle",
  },
});

const originalCreate = openrouter.chat.completions.create.bind(
  openrouter.chat.completions,
);

type ChatCompletionCreateArgs = Parameters<typeof originalCreate>;

openrouter.chat.completions.create = ((...args: ChatCompletionCreateArgs) => {
  const request = args[0] as { model?: string };
  if (request.model) {
    assertApprovedModelId(request.model);
  }
  return originalCreate(...args);
}) as typeof openrouter.chat.completions.create;
