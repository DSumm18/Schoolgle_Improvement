/**
 * MIS Data Read API
 *
 * GET /api/mis/read?type=pupils|attendance|statutory_results|termly_assessments|behaviour|staff|teacher_class_history|sen_register|historical_ks2
 *
 * Returns the requested MIS data for the user's organization.
 * Data is read from source (local/Drive/Wonde) and processed in memory only.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import type { MISDataType } from "@/lib/mis/types";

const VALID_DATA_TYPES: MISDataType[] = [
  "pupils",
  "attendance",
  "statutory_results",
  "termly_assessments",
  "behaviour",
  "staff",
  "teacher_class_history",
  "sen_register",
  "historical_ks2",
];

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");

  if (!type) {
    return apiError(
      "Missing required query parameter: type",
      400,
      "MISSING_PARAMETER",
      { validTypes: VALID_DATA_TYPES },
    );
  }

  if (!VALID_DATA_TYPES.includes(type as MISDataType)) {
    return apiError(
      `Invalid data type: "${type}". Must be one of: ${VALID_DATA_TYPES.join(", ")}`,
      400,
      "INVALID_DATA_TYPE",
      { validTypes: VALID_DATA_TYPES },
    );
  }

  try {
    const { getMISDataServiceForOrg } = await import("@/lib/mis/data-service");
    const service = await getMISDataServiceForOrg(auth.organizationId);
    const result = await service.read(auth.organizationId, type as MISDataType);

    return apiSuccess({
      success: true,
      data: result.data,
      source: result.source,
      recordCount: result.recordCount,
      warnings: result.warnings,
    });
  } catch (error: any) {
    console.error(`[MIS Read] Error reading ${type}:`, error.message);
    return apiError(
      error.message || `Failed to read MIS data: ${type}`,
      500,
      "MIS_READ_ERROR",
    );
  }
});
