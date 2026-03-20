/**
 * POST /api/canvas/ingest — Smart Data Ingest
 *
 * Accepts file upload (CSV, Excel, JSON), analyses it:
 * - Detects source system (Arbor, Bromcom, SIMS, Every HR, Payroll, etc.)
 * - Maps fields semantically (labels + data patterns)
 * - Returns analysis with suggested mappings for user approval
 *
 * No data is stored — this is analysis only. The user must approve
 * mappings before any data flows further.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { ingestFile } from "@/lib/canvas/ingest-service";

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return apiError("No file provided", 400);
  }

  // Size limit: 10MB
  if (file.size > 10 * 1024 * 1024) {
    return apiError("File too large. Maximum 10MB.", 400);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Load known signatures and mappings from DB (network effect)
  const supabase = createServiceRoleClient();

  const [sigResult, mapResult] = await Promise.all([
    supabase
      .from("canvas_source_signatures")
      .select(
        "system_name, export_type, signature_columns, optional_columns, default_mappings, match_confidence",
      )
      .eq("is_active", true),
    supabase
      .from("canvas_field_mappings")
      .select(
        "source_system, source_column, target_entity, target_field, confidence",
      )
      .gte("confidence", 0.7)
      .order("confidence", { ascending: false }),
  ]);

  const knownSignatures = sigResult.data || [];
  const knownMappings = mapResult.data || [];

  // Run the ingest analysis
  const result = ingestFile(
    buffer,
    file.name,
    file.type,
    knownSignatures,
    knownMappings,
  );

  return apiSuccess({
    fileName: file.name,
    fileSize: file.size,
    ...result,
  });
});
