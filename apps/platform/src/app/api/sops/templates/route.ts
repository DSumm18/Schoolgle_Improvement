import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { getTemplates } from "@/lib/sop-engine";

// GET /api/sops/templates — List all SOP templates, optional ?category= filter
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const category = req.nextUrl.searchParams.get("category");

  try {
    const supabase = createServiceRoleClient();
    const templates = await getTemplates(supabase, {
      category: category || undefined,
    });
    if (templates.error) {
      return apiError(templates.error, 500);
    }
    return apiSuccess({ templates: templates.templates });
  } catch (err: any) {
    console.error("[SOP Templates] Error listing templates:", err.message);
    return apiError("Failed to list SOP templates", 500);
  }
});
