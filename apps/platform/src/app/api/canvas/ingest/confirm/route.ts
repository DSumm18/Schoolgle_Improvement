/**
 * POST /api/canvas/ingest/confirm — Confirm Field Mappings
 *
 * After the user reviews and approves the suggested field mappings,
 * this endpoint:
 * 1. Logs the approved mappings in the canvas session
 * 2. Updates the network-effect field mapping registry (boosts confidence)
 * 3. Records the data import in data_imports
 *
 * This is the human-in-the-loop audit point.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

interface ConfirmRequest {
  sessionId: string;
  detectedSystem: string;
  exportType: string;
  entityType: string;
  mappings: Array<{
    sourceColumn: string;
    targetEntity: string;
    targetField: string;
    confidence: number;
    userApproved: boolean;
    userCorrectedField?: string;
  }>;
  fileName: string;
  totalRows: number;
  rawHeaders: string[];
}

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = (await request.json()) as ConfirmRequest;

  if (!body.mappings || body.mappings.length === 0) {
    return apiError("No mappings provided", 400);
  }

  const supabase = createServiceRoleClient();

  // 1. Update session with approved mappings
  if (body.sessionId) {
    await supabase
      .from("canvas_sessions")
      .update({
        field_mappings_approved: body.mappings,
        stage: "SCOPE_AGREED",
      })
      .eq("id", body.sessionId)
      .eq("organization_id", auth.organizationId);
  }

  // 2. Update network-effect field mapping registry
  // Only for approved mappings from detected systems
  if (body.detectedSystem && body.detectedSystem !== "unknown") {
    for (const mapping of body.mappings) {
      if (!mapping.userApproved) continue;

      const targetField = mapping.userCorrectedField || mapping.targetField;

      await supabase.from("canvas_field_mappings").upsert(
        {
          source_system: body.detectedSystem,
          source_column: mapping.sourceColumn,
          target_entity: mapping.targetEntity,
          target_field: targetField,
          confidence: Math.min(0.99, mapping.confidence + 0.05),
          detection_method: "user_confirmed",
          confirmed_count: 1,
          last_confirmed_at: new Date().toISOString(),
        },
        {
          onConflict: "source_system,source_column,target_entity,target_field",
        },
      );

      // Increment confirmed_count if it already existed
      try {
        await supabase.rpc("increment_field_mapping_confidence", {
          p_source_system: body.detectedSystem,
          p_source_column: mapping.sourceColumn,
          p_target_entity: mapping.targetEntity,
          p_target_field: targetField,
        });
      } catch {
        // RPC may not exist yet — that's OK, the upsert above is the important part
      }
    }
  }

  // 3. Record the import in data_imports
  const { data: importRecord } = await supabase
    .from("data_imports")
    .insert({
      organization_id: auth.organizationId,
      data_source_id: null,
      import_type: body.entityType || "other",
      file_name: body.fileName,
      file_type: body.fileName.split(".").pop() || "csv",
      status: "mapped",
      total_rows: body.totalRows,
      column_mapping: Object.fromEntries(
        body.mappings
          .filter((m) => m.userApproved)
          .map((m) => [m.sourceColumn, m.userCorrectedField || m.targetField]),
      ),
      unmapped_columns: body.mappings
        .filter((m) => !m.userApproved)
        .map((m) => m.sourceColumn),
      raw_headers: body.rawHeaders,
      imported_by: auth.userId,
    })
    .select("id")
    .single();

  return apiSuccess({
    success: true,
    importId: importRecord?.id,
    mappingsConfirmed: body.mappings.filter((m) => m.userApproved).length,
    mappingsSkipped: body.mappings.filter((m) => !m.userApproved).length,
    auditNote: `Field mappings confirmed by ${auth.email} on ${new Date().toISOString()}`,
  });
});
