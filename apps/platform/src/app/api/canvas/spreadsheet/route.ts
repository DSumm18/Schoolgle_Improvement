/**
 * POST /api/canvas/spreadsheet — Generate and download a spreadsheet
 *
 * Types:
 * - reconciliation: Reconciliation tracker with conflicts
 * - migration: Migration readiness report with actions
 * - data: Generic data export from Canvas
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiError } from "@/lib/api-utils";
import {
  generateReconciliationSpreadsheet,
  generateMigrationSpreadsheet,
  generateDataSpreadsheet,
} from "@/lib/canvas/spreadsheet-generator";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();

  if (!body.type) {
    return apiError("Spreadsheet type is required", 400);
  }

  // Get school name
  const supabase = createServiceRoleClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", auth.organizationId)
    .single();

  const schoolName = org?.name || "School";
  let buffer: Buffer;
  let fileName: string;

  switch (body.type) {
    case "reconciliation": {
      if (!body.reconciliationResult) {
        return apiError("Reconciliation result data required", 400);
      }
      buffer = generateReconciliationSpreadsheet(
        body.reconciliationResult,
        schoolName,
      );
      fileName = `Reconciliation_Tracker_${new Date().toISOString().split("T")[0]}.xlsx`;
      break;
    }

    case "migration": {
      if (!body.migrationReport) {
        return apiError("Migration report data required", 400);
      }
      buffer = generateMigrationSpreadsheet(body.migrationReport, schoolName);
      fileName = `Migration_Report_${body.migrationReport.fromSystem}_to_${body.migrationReport.toSystem}_${new Date().toISOString().split("T")[0]}.xlsx`;
      break;
    }

    case "data": {
      if (!body.headers || !body.rows) {
        return apiError("Headers and rows required for data export", 400);
      }
      buffer = generateDataSpreadsheet(
        body.title || "Canvas Export",
        body.headers,
        body.rows,
        schoolName,
      );
      fileName = `${(body.title || "Canvas_Export").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
      break;
    }

    default:
      return apiError(`Unknown spreadsheet type: ${body.type}`, 400);
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
});
