/**
 * Generate educational illustrations using Gemini 2.5 Flash Image (Nano Banana).
 * Uses OpenRouter for reliable paid-tier access with no free-tier quota issues.
 * Creates modern, engaging visuals for primary school lessons.
 */

export interface ImageGenRequest {
  prompt: string;
  style?: "illustration" | "photograph" | "diagram" | "cartoon";
  aspectRatio?: "square" | "landscape" | "portrait";
}

export interface GeneratedImage {
  imageBase64?: string;
  mimeType?: string;
  prompt: string;
  generationTimeMs: number;
}

const MODEL_ID = "google/gemini-2.5-flash-image";

/**
 * Generate a single educational image via OpenRouter (Gemini 2.5 Flash Image).
 * Returns the base64-encoded PNG without the data: URI prefix.
 */
export async function generateLessonImage(
  req: ImageGenRequest,
): Promise<GeneratedImage> {
  const startTime = performance.now();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const stylePrompt = {
    illustration:
      "Modern digital illustration, bright colours, friendly and engaging for UK primary school children, clean white background",
    photograph:
      "High-quality photograph, natural lighting, educational context, suitable for UK primary school",
    diagram:
      "Clean educational diagram with clear labels, flat design, teal and slate colour scheme, suitable for UK primary school children",
    cartoon:
      "Friendly cartoon illustration, child-appropriate, vibrant colours, clean white background",
  }[req.style ?? "illustration"];

  const aspectNote = {
    square: "Square composition.",
    landscape: "Landscape orientation, wide format.",
    portrait: "Portrait orientation, tall format.",
  }[req.aspectRatio ?? "square"];

  const fullPrompt = `${req.prompt}. Style: ${stylePrompt}. ${aspectNote} Suitable for UK primary school pupils aged 5-11. No text or written labels in the image unless specifically requested. High quality, child-friendly.`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://schoolgle.co.uk",
      "X-Title": "Schoolgle Lesson Studio",
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [{ role: "user", content: fullPrompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Image generation failed (${response.status}): ${err.slice(0, 200)}`);
  }

  const data = await response.json();

  // OpenRouter returns images in choices[0].message.images[]
  // Each image: { type: "image_url", image_url: { url: "data:image/png;base64,..." } }
  const images: Array<{ type: string; image_url: { url: string } }> =
    data?.choices?.[0]?.message?.images ?? [];

  if (images.length === 0) {
    throw new Error("No image returned from Gemini image generation");
  }

  const imageUrl = images[0].image_url.url;
  // Strip the data URI prefix — e.g. "data:image/png;base64,"
  const [header, b64data] = imageUrl.split(",", 2);
  const mimeType = header?.replace("data:", "").replace(";base64", "") ?? "image/png";

  return {
    imageBase64: b64data,
    mimeType,
    prompt: fullPrompt,
    generationTimeMs: Math.round(performance.now() - startTime),
  };
}

/**
 * Generate a set of images for a lesson:
 * - title: hero image for the lesson
 * - teach: concept diagram
 * - vocab-<word>: one image per key vocabulary word (max 3)
 *
 * All images run in parallel via Promise.allSettled for resilience.
 */
export async function generateLessonImageSet(params: {
  title: string;
  subject: string;
  yearGroup: string;
  keyVocabulary: string[];
  teachConcept: string;
  theme?: string; // e.g. "football", "space", "none"
}): Promise<Record<string, GeneratedImage>> {
  const themeSuffix =
    params.theme && params.theme !== "none"
      ? ` Use ${params.theme}-related imagery where appropriate.`
      : "";

  const requests: Array<[string, ImageGenRequest]> = [
    [
      "title",
      {
        prompt: `Hero image representing a ${params.yearGroup} ${params.subject} lesson titled "${params.title}".${themeSuffix}`,
        style: "illustration",
        aspectRatio: "landscape",
      },
    ],
    [
      "teach",
      {
        prompt: `Educational diagram or illustration showing the concept: ${params.teachConcept}.${themeSuffix}`,
        style: "diagram",
        aspectRatio: "landscape",
      },
    ],
  ];

  // Add vocabulary images (max 3 to control cost — ~£0.15 per set)
  for (const word of (params.keyVocabulary ?? []).slice(0, 3)) {
    const key = `vocab-${word.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
    requests.push([
      key,
      {
        prompt: `Simple, clear visual representation of the word "${word}" for primary school children.${themeSuffix}`,
        style: "cartoon",
        aspectRatio: "square",
      },
    ]);
  }

  const results: Record<string, GeneratedImage> = {};

  const settled = await Promise.allSettled(
    requests.map(async ([key, req]) => {
      const result = await generateLessonImage(req);
      return { key, result };
    }),
  );

  for (const outcome of settled) {
    if (outcome.status === "fulfilled") {
      results[outcome.value.key] = outcome.value.result;
    } else {
      console.warn("[ImageGenerator] Failed for one image:", outcome.reason);
    }
  }

  return results;
}
