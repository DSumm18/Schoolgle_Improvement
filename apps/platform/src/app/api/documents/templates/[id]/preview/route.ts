import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * POST /api/documents/templates/[id]/preview
 * Render a template with sample or provided placeholder values
 *
 * Body: { values: Record<string, string> }
 * Returns: { subject: string, body_html: string }
 */
export const POST = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();

  // Extract ID from URL path: /api/documents/templates/[id]/preview
  const segments = request.nextUrl.pathname.split("/");
  const previewIdx = segments.indexOf("preview");
  const id = previewIdx > 0 ? segments[previewIdx - 1] : null;

  if (!id) {
    return apiError("Template ID is required", 400, "MISSING_ID");
  }

  const body = await request.json();
  const values: Record<string, string> = body.values || {};

  // Fetch the template
  const { data: template, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !template) {
    return apiError("Template not found", 404, "NOT_FOUND");
  }

  // Ensure the template is accessible
  if (
    template.organization_id &&
    template.organization_id !== auth.organizationId
  ) {
    return apiError("Access denied", 403, "FORBIDDEN");
  }

  // Replace placeholders in subject and body
  const replacePlaceholders = (
    text: string,
    vals: Record<string, string>,
  ): string => {
    if (!text) return "";
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return vals[key] !== undefined ? vals[key] : match;
    });
  };

  const subject = replacePlaceholders(template.subject_template || "", values);
  const body_html = replacePlaceholders(template.body_template || "", values);

  return apiSuccess({ subject, body_html });
});
