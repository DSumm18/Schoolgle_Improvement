/**
 * Building Detection API — AI-powered room extraction from floor plans
 *
 * POST /api/estates/building-detect
 *
 * Accepts: PDF, PNG, JPG floor plan files
 * Returns: 3D building model with detected rooms, positions, and metadata
 *
 * Process:
 * 1. Convert PDF to image (if needed)
 * 2. Use vision model to detect rooms, walls, doors
 * 3. Extract room labels from text
 * 4. Generate 3D coordinates
 * 5. Return Building3DData structure
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import {
  Building3DData,
  Building3D,
  Floor3D,
  Room3D,
  RoomType3D,
} from "@/components/estates-compliance/building-3d-viewer/Building3DViewer";

// ─── Types ─────────────────────────────────────────────────────────────────

interface DetectRequest {
  fileUrl: string;
  fileName: string;
  buildingName?: string;
  floorLevel?: number; // -1 = basement, 0 = ground, etc.
}

interface DetectedRoom {
  name: string;
  type: RoomType3D;
  position: [number, number, number]; // x, y, z
  size: [number, number, number]; // width, height, depth
  confidence: number;
  hasFireExit?: boolean;
}

interface VisionDetectionResult {
  rooms: DetectedRoom[];
  buildingName?: string;
  floorNumber?: number;
  confidence: number;
}

// ─── Vision Model Prompt ───────────────────────────────────────────────────

const DETECTION_PROMPT = `
You are an architectural floor plan analyzer. Examine this school floor plan and extract ALL rooms.

For each room detected, provide:
1. name: The room label as shown on the plan
2. type: One of: classroom, hall, office, staffroom, library, send_room, kitchen, dining, toilet, storage, boiler, medical, reception, head_office, meeting, ict_suite, cloakroom, corridor, entrance, external
3. position: [x, y, z] coordinates relative to building center (in meters, estimate from grid)
4. size: [width, height, depth] in meters (estimate from room scale)
5. hasFireExit: true if room has a fire exit door
6. confidence: 0-1 score

Rules:
- Use the origin (0,0) as building center
- Estimate 1 grid square ≈ 1 meter unless scale is shown
- Corridors connect rooms, mark as type: "corridor"
- Look for fire exit symbols (often green running man icons)
- If uncertain, still provide the room with lower confidence

Return ONLY valid JSON in this exact format:
{
  "rooms": [
    {
      "name": "Reception",
      "type": "reception",
      "position": [5, 0, 2],
      "size": [4, 2.8, 3],
      "hasFireExit": true,
      "confidence": 0.95
    }
  ],
  "buildingName": "Main Building",
  "floorNumber": 0,
  "confidence": 0.9
}
`;

// ─── Helper: Call Vision Model ───────────────────────────────────────────────

async function detectRoomsFromImage(
  imageUrl: string
): Promise<VisionDetectionResult> {
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
  });

  try {
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-exp:free",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: DETECTION_PROMPT,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from vision model");
    }

    const parsed = JSON.parse(content);
    return parsed as VisionDetectionResult;
  } catch (error) {
    console.error("Vision detection error:", error);
    throw error;
  }
}

// ─── Helper: Convert Detected Rooms to Room3D ───────────────────────────────

function convertToRoom3D(rooms: DetectedRoom[]): Room3D[] {
  const roomColors: Record<RoomType3D, string> = {
    classroom: "#bfdbfe", // blue
    hall: "#fed7aa", // orange
    office: "#ddd6fe", // purple
    staffroom: "#fbcfe8", // pink
    library: "#bbf7d0", // green
    send_room: "#f0abfc", // fuchsia
    kitchen: "#fecaca", // red
    dining: "#fde68a", // yellow
    toilet: "#e0f2fe", // sky
    storage: "#d1d5db", // gray
    boiler: "#fcd34d", // amber
    medical: "#86efac", // emerald
    reception: "#c7d2fe", // indigo
    head_office: "#a5b4fc", // violet
    meeting: "#f5d0fe", // purple
    ict_suite: "#99f6e4", // teal
    cloakroom: "#ffe4e6", // rose
    corridor: "#f1f5f9", // slate
    entrance: "#fef3c7", // amber
    external: "#dcfce7", // green
  };

  return rooms.map((room, index) => ({
    id: `room-${Date.now()}-${index}`,
    name: room.name,
    type: room.type,
    position: room.position,
    size: room.size,
    color: roomColors[room.type] || "#e2e8f0",
    hasFireExit: room.hasFireExit,
  }));
}

// ─── Helper: Save Detected Building to Database ─────────────────────────────

async function saveBuildingToDatabase(
  organizationId: string,
  buildingData: Building3DData,
  supabase: any
) {
  // Save to estates_floor_plans table
  const { data, error } = await supabase
    .from("estates_floor_plans")
    .insert({
      organization_id: organizationId,
      title: buildingData.name,
      // Store full 3D data as JSONB
      building_data: buildingData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── API Route Handler ──────────────────────────────────────────────────────

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  try {
    const body: DetectRequest = await req.json();
    const { fileUrl, fileName, buildingName = "Main Building", floorLevel = 0 } = body;

    if (!fileUrl) {
      return apiError("fileUrl is required", 400);
    }

    // Step 1: Use vision model to detect rooms
    const detection = await detectRoomsFromImage(fileUrl);

    // Step 2: Convert to our 3D format
    const rooms: Room3D[] = convertToRoom3D(detection.rooms);

    // Step 3: Create building structure
    const floor: Floor3D = {
      id: `floor-${Date.now()}`,
      label: floorLevel === -1 ? "Basement" : floorLevel === 0 ? "Ground Floor" : `Floor ${floorLevel}`,
      level: floorLevel,
      height: 3.5, // Standard floor height
      rooms,
    };

    const building: Building3D = {
      id: `building-${Date.now()}`,
      name: detection.buildingName || buildingName,
      position: [0, 0, 0],
      floors: [floor],
    };

    const buildingData: Building3DData = {
      id: `site-${Date.now()}`,
      name: detection.buildingName || buildingName,
      buildings: [building],
      groundPlane: { width: 100, depth: 100 },
    };

    // Step 4: Save to database
    await saveBuildingToDatabase(auth.organizationId, buildingData, supabase);

    return apiSuccess({
      buildingData,
      detection: {
        roomsDetected: detection.rooms.length,
        confidence: detection.confidence,
        floorNumber: detection.floorNumber,
      },
    });
  } catch (error: any) {
    console.error("Building detection error:", error);
    return apiError(
      error.message || "Failed to detect building from floor plan",
      500
    );
  }
});

// ─── GET: List existing floor plans ─────────────────────────────────────────

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from("estates_floor_plans")
      .select("*")
      .eq("organization_id", auth.organizationId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return apiSuccess({
      floorPlans: data,
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch floor plans", 500);
  }
});

// ─── PATCH: Update detected building data (user corrections) ────────────────

export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  try {
    const body = await req.json();
    const { id, buildingData } = body;

    if (!id || !buildingData) {
      return apiError("id and buildingData are required", 400);
    }

    const { data, error } = await supabase
      .from("estates_floor_plans")
      .update({
        building_data: buildingData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organization_id", auth.organizationId)
      .select()
      .single();

    if (error) throw error;

    return apiSuccess({
      floorPlan: data,
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to update floor plan", 500);
  }
});

// ─── DELETE: Remove a floor plan ────────────────────────────────────────────

export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("id is required", 400);
    }

    const { error } = await supabase
      .from("estates_floor_plans")
      .delete()
      .eq("id", id)
      .eq("organization_id", auth.organizationId);

    if (error) throw error;

    return apiSuccess({
      deleted: true,
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to delete floor plan", 500);
  }
});
