import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function extractIdFromUrl(request: NextRequest): string | null {
  const segments = new URL(request.url).pathname.split("/");
  // /api/sef/[id] → segments = ['', 'api', 'sef', '<id>']
  return segments[segments.length - 1] || null;
}

// GET /api/sef/[id] - Fetch a specific SEF document
export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const id = extractIdFromUrl(request);

  if (!id) {
    return apiError("SEF document ID is required", 400);
  }

  const { data, error } = await supabase
    .from("sef_documents")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error) {
    return apiError("SEF document not found", 404);
  }

  // Fetch related SDP priorities
  const { data: sdpPriorities } = await supabase
    .from("sdp_priorities")
    .select("*")
    .eq("sef_document_id", id)
    .order("priority_number", { ascending: true });

  return apiSuccess({ sef: data, sdpPriorities: sdpPriorities || [] });
});

// PUT /api/sef/[id] - Update SEF status (publish, archive)
export const PUT = protectedRoute(
  async (auth, request: NextRequest) => {
    const supabase = createServiceRoleClient();
    const id = extractIdFromUrl(request);
    const body = await request.json();

    if (!id) {
      return apiError("SEF document ID is required", 400);
    }

    const allowedUpdates: Record<string, any> = {};
    if (
      body.status &&
      ["draft", "published", "archived"].includes(body.status)
    ) {
      allowedUpdates.status = body.status;
    }
    if (body.sections) {
      allowedUpdates.sections = body.sections;
    }
    if (body.executive_summary) {
      allowedUpdates.executive_summary = body.executive_summary;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return apiError("No valid fields to update", 400);
    }

    allowedUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("sef_documents")
      .update(allowedUpdates)
      .eq("id", id)
      .eq("organization_id", auth.organizationId)
      .select()
      .single();

    if (error) {
      return apiError(error.message, 500);
    }

    return apiSuccess(data);
  },
  { requiredRole: "slt" },
);
