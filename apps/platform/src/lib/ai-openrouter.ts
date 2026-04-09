import OpenAI from "openai";

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
