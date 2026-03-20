/**
 * COSHH API
 *
 * GET  /api/coshh?organizationId=...                    — list register entries
 * POST /api/coshh  { action: "add", ... }               — add register entry (human-confirmed)
 * POST /api/coshh  { action: "analyse", imageUrl: ... }  — AI vision analysis
 * POST /api/coshh  { action: "confirm", proposalId: ... } — confirm AI proposal
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const { organizationId } = auth;
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get("location_id");

    let query = supabase
      .from("coshh_register")
      .select("*")
      .eq("organization_id", organizationId)
      .order("product_name");

    if (locationId) {
      query = query.eq("storage_location_id", locationId);
    }

    const { data, error } = await query;

    if (error) {
      return apiError("Failed to fetch COSHH register", 500);
    }

    return apiSuccess({ register: data || [], count: (data || []).length });
  },
  { requiredRole: "caretaker" },
);

export const POST = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const { organizationId, userId } = auth;
    const body = await request.json();

    if (body.action === "add") {
      // Human-confirmed addition to register
      const { data, error } = await supabase
        .from("coshh_register")
        .insert({
          organization_id: organizationId,
          product_name: body.product_name,
          brand: body.brand || null,
          manufacturer: body.manufacturer || null,
          ghs_hazard_codes: body.ghs_hazard_codes || [],
          ghs_pictogram_codes: body.ghs_pictogram_codes || [],
          signal_word: body.signal_word || null,
          hazard_statements: body.hazard_statements || [],
          precautionary_statements: body.precautionary_statements || [],
          storage_location_id: body.storage_location_id || null,
          storage_conditions: body.storage_conditions || null,
          incompatible_with: body.incompatible_with || [],
          max_storage_quantity: body.max_storage_quantity || null,
          current_quantity: body.current_quantity || null,
          sds_url: body.sds_url || null,
          coshh_assessment_date: body.coshh_assessment_date || null,
        })
        .select()
        .single();

      if (error) {
        return apiError(error.message, 500);
      }

      return apiSuccess(
        { entry: data, message: "Product added to COSHH register" },
        201,
      );
    }

    if (body.action === "analyse") {
      // AI vision analysis — detect products from image
      const imageUrl = body.image_url;
      if (!imageUrl) {
        return apiError("image_url is required for analysis", 400);
      }

      // Fetch current register for comparison
      const { data: register } = await supabase
        .from("coshh_register")
        .select(
          "product_name, manufacturer, ghs_hazard_codes, current_quantity",
        )
        .eq("organization_id", organizationId);

      const registerNames = (register || []).map((r: any) =>
        r.product_name.toLowerCase(),
      );

      // Call vision API
      try {
        const aiRes = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-preview",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Analyse this photo of a school chemical storage area. Return valid JSON only.

List every visible product you can identify from labels or packaging.

For each product provide:
{
  "detected_products": [
    {
      "product_name": "string",
      "manufacturer": "string or null",
      "likely_hazard_category": "corrosive|flammable|toxic|irritant|oxidising|environmental|health_hazard|none",
      "confidence": 0.0-1.0
    }
  ],
  "storage_concerns": [
    "string description of any storage safety issues observed"
  ]
}

Current COSHH register for comparison: ${JSON.stringify(registerNames)}

Be specific about product names. If you cannot read a label, note it as "Unidentifiable product" with low confidence.`,
                    },
                    {
                      type: "image_url",
                      image_url: { url: imageUrl },
                    },
                  ],
                },
              ],
            }),
          },
        );

        if (!aiRes.ok) {
          return apiError("AI analysis failed — please try again", 502);
        }

        const aiData = await aiRes.json();
        const content = aiData.choices?.[0]?.message?.content || "";

        // Parse AI response
        let analysis;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          analysis = jsonMatch
            ? JSON.parse(jsonMatch[0])
            : { detected_products: [], storage_concerns: [] };
        } catch {
          analysis = {
            detected_products: [],
            storage_concerns: [],
            raw: content,
          };
        }

        // Compare detected products against register
        const findings = {
          confirmed: [] as any[],
          suspected_new: [] as any[],
          suspected_missing: [] as any[],
          storage_concerns: analysis.storage_concerns || [],
        };

        const detectedNames = new Set<string>();

        for (const product of analysis.detected_products || []) {
          const name = (product.product_name || "").toLowerCase();
          detectedNames.add(name);

          const match = registerNames.find(
            (rn: string) =>
              rn.includes(name) ||
              name.includes(rn) ||
              levenshteinClose(rn, name),
          );

          if (match) {
            findings.confirmed.push({ ...product, register_match: match });
          } else {
            findings.suspected_new.push(product);
          }
        }

        // Check for registered items not detected
        for (const entry of register || []) {
          const regName = entry.product_name.toLowerCase();
          const found = Array.from(detectedNames).some(
            (dn) =>
              dn.includes(regName) ||
              regName.includes(dn) ||
              levenshteinClose(dn, regName),
          );
          if (!found) {
            findings.suspected_missing.push({
              product_name: entry.product_name,
              manufacturer: entry.manufacturer,
              note: "Registered but not detected in photo — may be out of frame or removed",
            });
          }
        }

        return apiSuccess({
          analysis: findings,
          ai_model: "google/gemini-2.5-flash-preview",
          register_count: registerNames.length,
          detected_count: (analysis.detected_products || []).length,
          message:
            "Analysis complete — review proposed findings below. No changes have been made to the register.",
        });
      } catch (err: any) {
        return apiError(`AI analysis error: ${err.message}`, 500);
      }
    }

    if (body.action === "update_status") {
      // Update a register entry status (confirmed review, mark removed)
      const { entry_id, status, notes } = body;
      if (!entry_id) return apiError("entry_id required", 400);

      const { data, error } = await supabase
        .from("coshh_register")
        .update({
          ...(status && { signal_word: status }),
          ...(notes && { storage_conditions: notes }),
          last_scanned_at: new Date().toISOString(),
        })
        .eq("id", entry_id)
        .eq("organization_id", organizationId)
        .select()
        .single();

      if (error) return apiError(error.message, 500);
      return apiSuccess({ entry: data });
    }

    return apiError("Invalid action. Use: add, analyse, update_status", 400);
  },
  { requiredRole: "caretaker" },
);

// Simple fuzzy match helper
function levenshteinClose(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 5) return false;
  let matches = 0;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  for (const char of shorter) {
    if (longer.includes(char)) matches++;
  }
  return matches / shorter.length > 0.7;
}
