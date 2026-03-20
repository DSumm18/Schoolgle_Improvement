/**
 * GET /api/canvas/templates — List available canvas templates
 *
 * Returns system templates + school-created templates.
 * Filtered by user's role.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { CANVAS_TEMPLATES } from "@/lib/canvas/templates";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const role = auth.role || "viewer";

  // Filter built-in templates by user role
  const systemTemplates = CANVAS_TEMPLATES.filter(
    (t) =>
      t.targetRoles.includes(role) ||
      role === "admin" ||
      role === "headteacher",
  ).map((t) => ({
    ...t,
    isSystem: true,
    organizationId: null,
  }));

  // Load school-created templates
  const supabase = createServiceRoleClient();
  const { data: customTemplates } = await supabase
    .from("canvas_templates")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .eq("is_system", false)
    .order("usage_count", { ascending: false });

  return apiSuccess({
    templates: [
      ...systemTemplates,
      ...(customTemplates || []).map((t: Record<string, unknown>) => ({
        ...t,
        isSystem: false,
      })),
    ],
    totalSystem: systemTemplates.length,
    totalCustom: customTemplates?.length || 0,
  });
});
