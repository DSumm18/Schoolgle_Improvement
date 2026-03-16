/**
 * AI Meter Reading API
 *
 * POST /api/estates/energy/meter-reading
 *
 * Accepts a meter photo (base64), uses Gemini 2.5 Flash via OpenRouter
 * to read the display and return the value + meter type + confidence.
 *
 * Request:  { image: "base64...", meters: [{ id, reference, type, location }] }
 * Response: { reading, meter_type, matched_meter_id, confidence }
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "google/gemini-2.5-flash-preview";

interface MeterInfo {
  id: string;
  reference: string;
  type: string;
  location: string;
}

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();
  const { image, meters } = body as { image?: string; meters?: MeterInfo[] };

  if (!image) {
    return apiError("image (base64) is required", 400);
  }

  if (!OPENROUTER_API_KEY) {
    return apiError("OpenRouter API key not configured", 500);
  }

  // Build the meter context for the prompt
  const meterContext = (meters ?? [])
    .map((m) => `- ${m.reference} (${m.type}) at ${m.location} [id: ${m.id}]`)
    .join("\n");

  const systemPrompt = `You are an expert utility meter reader. Your job is to accurately read meter displays from photographs.

Rules:
1. Read the exact numeric value shown on the meter display. For dial meters, read each dial carefully (alternating clockwise/anticlockwise). For digital meters, read the digits left to right.
2. Ignore any red digits — they represent decimal places and should not be included in the main reading.
3. Identify the meter type: electricity_digital, electricity_dial, gas_digital, gas_dial, water, or unknown.
4. If the school has registered meters, try to match the photo to one of them based on any visible reference numbers, serial numbers, or meter type.
5. Provide a confidence score 0-1 (1 = crystal clear digital display, 0.5 = partially obscured, < 0.3 = very uncertain).
6. If you cannot read the meter at all, return reading as null with confidence 0.

Respond ONLY with a JSON object (no markdown, no explanation):
{
  "reading": <number or null>,
  "meter_type": "<type>",
  "matched_meter_id": "<id or null>",
  "matched_meter_reference": "<reference or null>",
  "confidence": <0-1>,
  "notes": "<any observations about the reading>"
}`;

  const userPrompt = meterContext
    ? `Read this meter. The school has these registered meters:\n${meterContext}\n\nMatch to one if possible.`
    : "Read this meter and identify its type.";

  // Detect mime type from base64 header or default to jpeg
  let mimeType = "image/jpeg";
  let imageData = image;
  if (image.startsWith("data:")) {
    const match = image.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      imageData = match[2];
    }
  }

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://schoolgle.co.uk",
          "X-Title": "Schoolgle Meter Reading",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${imageData}` },
                },
              ],
            },
          ],
          max_tokens: 500,
          temperature: 0.1,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "[meter-reading] OpenRouter error:",
        response.status,
        errorText,
      );
      return apiError(`AI model error: ${response.status}`, 502);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content ?? "";

    // Parse the JSON response — strip any markdown fences
    const cleaned = content
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    let parsed: {
      reading: number | null;
      meter_type: string;
      matched_meter_id: string | null;
      matched_meter_reference: string | null;
      confidence: number;
      notes: string;
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[meter-reading] Failed to parse AI response:", content);
      return apiError("Failed to parse meter reading from AI response", 500);
    }

    // ── Store image & persist reading to Supabase ──────────────────
    const supabase = createServiceRoleClient();
    const orgId = auth.organizationId;

    let imageUrl: string | null = null;
    let storagePath: string | null = null;
    let readingId: string | null = null;

    if (parsed.reading !== null) {
      const timestamp = Date.now();
      const ext = mimeType.split("/")[1] || "jpg";
      storagePath = `${orgId}/${parsed.matched_meter_id ?? "unknown"}/${new Date().toISOString().slice(0, 10)}_${timestamp}.${ext}`;

      // Convert base64 to buffer and upload
      const buffer = Buffer.from(imageData, "base64");

      const { error: uploadError } = await supabase.storage
        .from("meter-readings")
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from("meter-readings")
          .getPublicUrl(storagePath);
        imageUrl = urlData?.publicUrl ?? null;
      } else {
        console.error(
          "[meter-reading] Storage upload error:",
          uploadError.message,
        );
      }

      // Persist reading to energy_meter_readings table
      if (parsed.matched_meter_id) {
        const { data: insertedRow, error: dbError } = await supabase
          .from("energy_meter_readings")
          .upsert(
            {
              organization_id: orgId,
              meter_id: parsed.matched_meter_id,
              reading_value: parsed.reading,
              reading_date: new Date().toISOString().slice(0, 10),
              image_url: imageUrl,
              image_storage_path: storagePath,
              submitted_by: auth.userId,
              ai_confidence: parsed.confidence,
              ai_meter_type: parsed.meter_type,
              ai_notes: parsed.notes,
              source: "photo",
            },
            { onConflict: "organization_id,meter_id,reading_date" },
          )
          .select("id")
          .single();

        if (dbError) {
          console.error("[meter-reading] DB persist error:", dbError.message);
        } else {
          readingId = insertedRow?.id ?? null;
        }
      }
    }

    return apiSuccess({
      reading: parsed.reading,
      meter_type: parsed.meter_type,
      matched_meter_id: parsed.matched_meter_id ?? null,
      matched_meter_reference: parsed.matched_meter_reference ?? null,
      confidence: parsed.confidence,
      notes: parsed.notes ?? null,
      model: MODEL,
      image_url: imageUrl,
      reading_id: readingId,
    });
  } catch (err: any) {
    console.error("[meter-reading] Request failed:", err.message);
    return apiError(`Meter reading request failed: ${err.message}`, 500);
  }
});
