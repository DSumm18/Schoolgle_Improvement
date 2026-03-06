import OpenAI from "openai";

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
