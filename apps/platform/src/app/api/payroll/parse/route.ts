import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import {
  parsePayrollCSV,
  summarisePayroll,
  type ParseOptions,
} from "@/lib/payroll-parser";

/**
 * POST /api/payroll/parse
 *
 * Accepts payroll CSV text, returns parsed staff and ICFP-ready summary.
 * Privacy-first: no data is stored. Processing only.
 *
 * Body: { csv: string, options?: ParseOptions, schoolIncome?: number }
 */
export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const body = await request.json();

    const { csv, options, schoolIncome } = body as {
      csv: string;
      options?: ParseOptions;
      schoolIncome?: number;
    };

    if (!csv || typeof csv !== "string") {
      return apiError("CSV text is required", 400, "MISSING_CSV");
    }

    if (csv.length > 5 * 1024 * 1024) {
      return apiError("CSV too large. Maximum 5MB.", 413, "CSV_TOO_LARGE");
    }

    const staff = parsePayrollCSV(csv, options);

    if (staff.length === 0) {
      return apiError(
        "No valid staff records found. Check CSV format includes salary and role columns.",
        422,
        "NO_RECORDS",
      );
    }

    const summary = summarisePayroll(
      staff,
      schoolIncome && typeof schoolIncome === "number"
        ? schoolIncome
        : undefined,
    );

    return apiSuccess({
      staff,
      summary,
      meta: {
        rowsParsed: staff.length,
        organizationId: auth.organizationId,
        parsedAt: new Date().toISOString(),
      },
    });
  },
  { requiredRole: "slt" },
);
