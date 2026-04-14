import fs from "node:fs/promises";
import path from "node:path";

import {
  PATHFINDER_PROTOTYPE_IMAGE,
  buildExtractionResult,
  buildLocalPathfinderBaseline,
  normaliseBounds,
  type PathfinderExtractionResult,
  type PathfinderRoomDraft,
  type PathfinderRoomType,
} from "@/lib/pathfinder/prototype";
import { buildRasterPathfinderBaseline } from "@/lib/pathfinder/raster-extractor";

export const runtime = "nodejs";

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

function mapVisionRooms(rooms: VisionRoom[]): PathfinderRoomDraft[] {
  return rooms
    .map((room, index): PathfinderRoomDraft | null => {
      const box = room.bbox_pct;
      if (!box || box.x == null || box.y == null || box.w == null || box.h == null) {
        return null;
      }

      const bounds = normaliseBounds({
        x: (box.x / 100) * PATHFINDER_PROTOTYPE_IMAGE.width,
        y: (box.y / 100) * PATHFINDER_PROTOTYPE_IMAGE.height,
        width: (box.w / 100) * PATHFINDER_PROTOTYPE_IMAGE.width,
        height: (box.h / 100) * PATHFINDER_PROTOTYPE_IMAGE.height,
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
        notes: "Detected by prototype vision extraction.",
      };
    })
    .filter((room): room is PathfinderRoomDraft => Boolean(room));
}

function visionFallback(warning: string, model?: string): PathfinderExtractionResult {
  const fallback = buildLocalPathfinderBaseline();
  return {
    ...fallback,
    source: "vision-ai-with-fallback",
    model,
    warnings: [warning, ...fallback.warnings],
  };
}

async function runVisionExtraction(): Promise<PathfinderExtractionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return visionFallback(
      "Vision mode was requested, but no OPENROUTER_API_KEY or OPENAI_API_KEY is configured.",
    );
  }

  const model = "google/gemini-2.5-flash";

  const prompt = `Extract a draft Pathfinder site model from this UK primary school floor plan.

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

  try {
    const imagePath = path.join(
      process.cwd(),
      "public",
      "site-plans",
      "grove-house-ground-floor.png",
    );
    const imageBase64 = await fs.readFile(imagePath, "base64");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://schoolgle.co.uk",
        "X-Title": "Schoolgle Pathfinder Prototype",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`,
                },
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
      return visionFallback(
        `Vision extraction failed with HTTP ${response.status}. Returned local baseline instead.`,
        model,
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = typeof content === "string" ? parseJsonObject(content) : null;
    const visionRooms = Array.isArray(parsed?.rooms) ? mapVisionRooms(parsed.rooms) : [];

    if (visionRooms.length === 0) {
      return visionFallback(
        "Vision extraction did not return usable room geometry. Returned local baseline instead.",
        model,
      );
    }

    return buildExtractionResult({
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
    return visionFallback(
      `Vision extraction failed locally: ${error instanceof Error ? error.message : "unknown error"}. Returned local baseline instead.`,
      model,
    );
  }
}

export async function POST(request: Request) {
  let body: { mode?: "local" | "raster" | "vision" } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.mode === "vision") {
    const result = await runVisionExtraction();
    return Response.json(result);
  }

  if (body.mode === "local") {
    return Response.json(buildLocalPathfinderBaseline());
  }

  return Response.json(await buildRasterPathfinderBaseline());
}

export async function GET() {
  return Response.json(await buildRasterPathfinderBaseline());
}
