import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { analyseSmartArborImport } from "@/lib/smart-arbor-import";

export const POST = protectedRoute(async (_auth, request) => {
  const body = await request.json();
  const csvText = String(body.csvText || body.csv || "");
  if (!csvText.trim()) return apiError("CSV text is required", 400, "MISSING_CSV");

  return apiSuccess({
    analysis: analyseSmartArborImport(csvText, body.filename || "arbor-export.csv"),
  });
}, { requiredRole: "slt", rateLimit: false });
