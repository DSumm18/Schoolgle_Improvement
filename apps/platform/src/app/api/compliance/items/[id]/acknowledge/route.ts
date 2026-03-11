import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/items/[id]/acknowledge
 * Get acknowledgement status for a compliance item
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const acknowledgeIdx = segments.indexOf("acknowledge");
  const id = acknowledgeIdx > 0 ? segments[acknowledgeIdx - 1] : null;

  if (!id) return apiError("Compliance item ID required", 400);

  const { data, error } = await supabase
    .from("compliance_acknowledgements")
    .select("*")
    .eq("compliance_item_id", id)
    .order("acknowledged_at", { ascending: false });

  if (error) {
    console.error("Error fetching acknowledgements:", error);
    return apiError("Failed to fetch acknowledgements", 500);
  }

  return apiSuccess({ acknowledgements: data || [] });
});

/**
 * POST /api/compliance/items/[id]/acknowledge
 * Record a staff acknowledgement
 */
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const acknowledgeIdx = segments.indexOf("acknowledge");
  const id = acknowledgeIdx > 0 ? segments[acknowledgeIdx - 1] : null;

  if (!id) return apiError("Compliance item ID required", 400);

  const body = await req.json();
  const { version_id, method } = body;

  // Check if already acknowledged this version
  const { data: existing } = await supabase
    .from("compliance_acknowledgements")
    .select("id")
    .eq("compliance_item_id", id)
    .eq("user_id", auth.userId)
    .eq("version_id", version_id)
    .maybeSingle();

  if (existing) {
    return apiError("Already acknowledged", 409);
  }

  const { data: ack, error } = await supabase
    .from("compliance_acknowledgements")
    .insert({
      compliance_item_id: id,
      version_id,
      user_id: auth.userId,
      user_name: auth.email,
      method: method || "web",
      acknowledged_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error recording acknowledgement:", error);
    return apiError("Failed to record acknowledgement", 500);
  }

  // Audit log
  const { data: item } = await supabase
    .from("compliance_items")
    .select("organization_id")
    .eq("id", id)
    .single();

  if (item) {
    await supabase.from("compliance_audit_log").insert({
      organization_id: item.organization_id,
      entity_type: "compliance_acknowledgement",
      entity_id: ack.id,
      action: "acknowledged",
      actor_user_id: auth.userId,
      metadata: { compliance_item_id: id, version_id },
    });
  }

  return apiSuccess({ acknowledgement: ack }, 201);
});
