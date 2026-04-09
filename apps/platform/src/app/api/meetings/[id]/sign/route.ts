import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Extract meeting ID from the URL pathname.
 * URL pattern: /api/meetings/[id]/sign
 */
function getMeetingId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/");
  // ["", "api", "meetings", "<id>", "sign"]
  return segments[3];
}

/**
 * POST /api/meetings/[id]/sign
 * Save a digital signature for a meeting
 */
export const POST = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  const body = await request.json();
  const {
    signer_name,
    signer_role,
    signature_data,
    signature_method,
  } = body;

  // orgId MUST come from authenticated session — never from caller
  const resolvedOrgId = auth.organizationId;

  if (!resolvedOrgId || !signer_name || !signer_role || !signature_data) {
    return apiError("Missing required fields", 400);
  }

  if (!["leader", "attendee", "witness"].includes(signer_role)) {
    return apiError("Invalid signer role", 400);
  }

  const supabase = createServiceRoleClient();

  // Verify meeting exists and belongs to org
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("id, organization_id")
    .eq("id", id)
    .eq("organization_id", resolvedOrgId)
    .single();

  if (meetingError || !meeting) {
    return apiError("Meeting not found", 404);
  }

  // Check if this role has already signed
  const { data: existing } = await supabase
    .from("meeting_signatures")
    .select("id")
    .eq("meeting_id", id)
    .eq("signer_role", signer_role)
    .maybeSingle();

  if (existing) {
    return apiError(`${signer_role} has already signed`, 409);
  }

  // Save signature
  const { data: signature, error } = await supabase
    .from("meeting_signatures")
    .insert({
      meeting_id: id,
      signer_name,
      signer_role,
      signature_data,
      signature_method: signature_method || "canvas",
      signed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving signature:", error);
    return apiError("Failed to save signature", 500);
  }

  return apiSuccess({ signature }, 201);
});

/**
 * GET /api/meetings/[id]/sign
 * Get signatures for a meeting
 */
export const GET = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  const { searchParams } = new URL(request.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: signatures, error } = await supabase
    .from("meeting_signatures")
    .select("*")
    .eq("meeting_id", id)
    .order("signed_at");

  if (error) {
    console.error("Error fetching signatures:", error);
    return apiError("Failed to fetch signatures", 500);
  }

  return apiSuccess({ signatures: signatures || [] });
});
