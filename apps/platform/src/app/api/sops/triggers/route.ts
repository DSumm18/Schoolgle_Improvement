import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { getSopTriggersForIncident } from "@/lib/sop-engine";

// POST /api/sops/triggers — Determine which SOPs should be triggered for an incident
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const {
    incident_type,
    severity,
    is_riddor_reportable,
    investigation_required,
  } = body;

  if (!incident_type) {
    return apiError("incident_type is required", 400, "MISSING_FIELD");
  }

  if (!severity) {
    return apiError("severity is required", 400, "MISSING_FIELD");
  }

  try {
    const triggers = getSopTriggersForIncident({
      incident_type,
      severity,
      is_riddor_reportable: is_riddor_reportable || false,
      investigation_required: investigation_required || false,
    });

    return apiSuccess({ triggers });
  } catch (err: any) {
    console.error("[SOP Triggers] Error determining triggers:", err.message);
    return apiError("Failed to determine SOP triggers", 500);
  }
});
