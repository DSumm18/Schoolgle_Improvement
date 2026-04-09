import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/documents
 * List generated documents with filtering and pagination
 *
 * Query params: organizationId, module, status, recipientType,
 *               contextType, contextId, search, limit, offset
 */
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);

  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const module = searchParams.get("module");
  const status = searchParams.get("status");
  const recipientType = searchParams.get("recipientType");
  const contextType = searchParams.get("contextType");
  const contextId = searchParams.get("contextId");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  let query = supabase
    .from("generated_documents")
    .select(
      "*, document_templates(id, name, module, category, document_type)",
      { count: "exact" },
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq("status", status);
  if (recipientType) query = query.eq("recipient_type", recipientType);
  if (contextType) query = query.eq("context_type", contextType);
  if (contextId) query = query.eq("context_id", contextId);
  if (search) {
    query = query.or(
      `subject.ilike.%${search}%,recipient_name.ilike.%${search}%`,
    );
  }

  // Filter by module directly (generated_documents has its own module column)
  if (module) {
    query = query.eq("module", module);
  }

  const { data: documents, error, count } = await query;

  if (error) {
    console.error("Error fetching documents:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess({
    documents: documents || [],
    total: count || 0,
    limit,
    offset,
  });
});
