/**
 * Vision extractor that runs against an arbitrary floor-plan image.
 *
 * Unlike the prototype extract endpoint (which is hardcoded to Grove House),
 * this works on any school's own rasterised plan. Returns a *clean* production
 * extraction result — no Grove House seeds.
 */

import {
  normaliseBounds,
  type PathfinderExtractionResult,
  type PathfinderRoomDraft,
  type PathfinderRoomType,
} from "@/lib/pathfinder/prototype";
import {
  buildProductionExtractionResult,
  type ProductionImageDescriptor,
} from "@/lib/pathfinder/production";

interface VisionRoom {
  label?: string;
  room_code?: string;
  block?: string;
  type?: string;
  confidence?: number;
  bbox_pct?: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
  };
}

interface VisionResponse {
  rooms?: VisionRoom[];
  warnings?: unknown[];
}

const ROOM_TYPES: PathfinderRoomType[] = [
  "classroom",
  "office",
  "toilet",
  "corridor",
  "hall",
  "headteacher",
  "kitchen",
  "medical",
  "storage",
  "entrance",
  "plant",
  "other",
];

function toRoomType(value: unknown): PathfinderRoomType {
  return ROOM_TYPES.includes(value as PathfinderRoomType)
    ? (value as PathfinderRoomType)
    : "other";
}

function isVisionResponse(value: unknown): value is VisionResponse {
  return Boolean(value && typeof value === "object");
}

function parseJsonObject(text: string): VisionResponse | null {
  try {
    const parsed = JSON.parse(text) as unknown;
    return isVisionResponse(parsed) ? parsed : null;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]) as unknown;
      return isVisionResponse(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function mapVisionRooms(
  rooms: VisionRoom[],
  image: ProductionImageDescriptor,
): PathfinderRoomDraft[] {
  return rooms
    .map((room, index): PathfinderRoomDraft | null => {
      const box = room.bbox_pct;
      if (!box || box.x == null || box.y == null || box.w == null || box.h == null) {
        return null;
      }

      const bounds = normaliseBounds({
        x: (box.x / 100) * image.width,
        y: (box.y / 100) * image.height,
        width: (box.w / 100) * image.width,
        height: (box.h / 100) * image.height,
      });

      return {
        id: `vision-${String(index + 1).padStart(2, "0")}`,
        label: room.label || `Detected space ${index + 1}`,
        roomCode: room.room_code || undefined,
        block: room.block || undefined,
        type: toRoomType(room.type),
        bounds,
        polygon: [
          { x: bounds.x, y: bounds.y },
          { x: bounds.x + bounds.width, y: bounds.y },
          { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
          { x: bounds.x, y: bounds.y + bounds.height },
        ],
        confidence: typeof room.confidence === "number" ? room.confidence : 0.55,
        needsReview: true,
        notes: "Detected by Pathfinder vision extraction.",
      };
    })
    .filter((room): room is PathfinderRoomDraft => Boolean(room));
}

const EXTRACTION_PROMPT = `Extract a draft Pathfinder site model from this UK school floor plan.

Return only JSON:
{
  "rooms": [
    {
      "label": "visible label or likely room name",
      "room_code": "visible room number/code or null",
      "block": "visible block/building label or null",
      "type": "classroom|office|toilet|corridor|hall|headteacher|kitchen|medical|storage|entrance|plant|other",
      "confidence": 0.0,
      "bbox_pct": { "x": 0.0, "y": 0.0, "w": 0.0, "h": 0.0 }
    }
  ],
  "warnings": ["short review notes"]
}

Coordinates must be percentages of the full image. Prefer distinct rooms and corridors over furniture, legends, notes, and symbols. Keep room bounds approximate but useful for a human review overlay.`;

function emptyResult(
  image: ProductionImageDescriptor,
  warning: string,
  model?: string,
): PathfinderExtractionResult {
  return buildProductionExtractionResult({
    image,
    source: "vision-ai-with-fallback",
    model,
    rooms: [],
    warnings: [warning],
  });
}

async function downloadImageAsBase64(url: string): Promise<{ base64: string; mime: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download source image (HTTP ${response.status})`);
  }
  const mime = response.headers.get("content-type") ?? "image/png";
  const buffer = Buffer.from(await response.arrayBuffer());
  return { base64: buffer.toString("base64"), mime };
}

export interface RunVisionExtractionInput {
  image: ProductionImageDescriptor;
}

export async function runVisionExtractionAgainstImage(
  input: RunVisionExtractionInput,
): Promise<PathfinderExtractionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return emptyResult(
      input.image,
      "Vision mode was requested, but no OPENROUTER_API_KEY or OPENAI_API_KEY is configured.",
    );
  }

  const model = "google/gemini-2.5-flash";

  try {
    const { base64, mime } = await downloadImageAsBase64(input.image.src);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://schoolgle.co.uk",
        "X-Title": "Schoolgle Pathfinder Extract",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              {
                type: "image_url",
                image_url: { url: `data:${mime};base64,${base64}` },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 6000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return emptyResult(
        input.image,
        `Vision extraction failed with HTTP ${response.status}.`,
        model,
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = typeof content === "string" ? parseJsonObject(content) : null;
    const visionRooms = Array.isArray(parsed?.rooms) ? mapVisionRooms(parsed.rooms, input.image) : [];

    if (visionRooms.length === 0) {
      return emptyResult(
        input.image,
        "Vision extraction did not return usable room geometry.",
        model,
      );
    }

    return buildProductionExtractionResult({
      image: input.image,
      source: "vision-ai",
      model,
      rooms: visionRooms,
      warnings: [
        "Vision extraction is a draft. Confirm rooms, doors, scale, routes, and compliance assets before use.",
        ...(Array.isArray(parsed?.warnings)
          ? parsed.warnings
              .slice(0, 5)
              .filter((warning): warning is string => typeof warning === "string")
          : []),
      ],
    });
  } catch (error) {
    return emptyResult(
      input.image,
      `Vision extraction failed: ${error instanceof Error ? error.message : "unknown error"}.`,
      model,
    );
  }
}
