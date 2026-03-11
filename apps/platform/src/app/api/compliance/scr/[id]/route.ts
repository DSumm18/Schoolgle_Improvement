import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/scr/[id]
 * Get a single SCR entry
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const wrappedHandler = protectedRoute(async (auth, request) => {
    const { id } = await params;
    const supabase = createServiceRoleClient();

    const { data: entry, error } = await supabase
      .from("compliance_scr_entries")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !entry) {
      return apiError("SCR entry not found", 404);
    }

    return apiSuccess({ entry });
  });

  return wrappedHandler(req);
}

/**
 * PUT /api/compliance/scr/[id]
 * Update an SCR entry
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const wrappedHandler = protectedRoute(
    async (auth, request) => {
      const { id } = await params;
      const body = await request.json();

      const supabase = createServiceRoleClient();

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      const allowedFields = [
        "staff_name",
        "role",
        "start_date",
        "dbs_certificate_number",
        "dbs_date",
        "dbs_type",
        "dbs_update_service",
        "dbs_update_service_checked_date",
        "barred_list_checked",
        "barred_list_checked_date",
        "identity_verified",
        "identity_verified_date",
        "qualifications_verified",
        "qualifications_verified_date",
        "right_to_work_verified",
        "right_to_work_verified_date",
        "prohibition_check",
        "prohibition_check_date",
        "section_128_check",
        "section_128_date",
        "overseas_check",
        "overseas_check_date",
        "references_received",
        "references_received_date",
        "medical_clearance",
        "medical_clearance_date",
        "safeguarding_training_date",
        "safeguarding_training_level",
        "notes",
        "status",
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }

      const { data, error } = await supabase
        .from("compliance_scr_entries")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating SCR entry:", error);
        return apiError("Failed to update SCR entry", 500);
      }

      // Audit log
      await supabase.from("compliance_audit_log").insert({
        organization_id: data.organization_id,
        entity_type: "scr_entry",
        entity_id: id,
        action: "updated",
        actor_user_id: auth.userId,
        metadata: updateData,
      });

      return apiSuccess({ entry: data });
    },
    { requiredRole: "slt" },
  );

  return wrappedHandler(req);
}

/**
 * DELETE /api/compliance/scr/[id]
 * Soft delete an SCR entry by setting status to 'leaver'
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const wrappedHandler = protectedRoute(
    async (auth, request) => {
      const { id } = await params;
      const supabase = createServiceRoleClient();

      const { data, error } = await supabase
        .from("compliance_scr_entries")
        .update({ status: "leaver", updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error archiving SCR entry:", error);
        return apiError("Failed to archive SCR entry", 500);
      }

      // Audit log
      await supabase.from("compliance_audit_log").insert({
        organization_id: data.organization_id,
        entity_type: "scr_entry",
        entity_id: id,
        action: "archived",
        actor_user_id: auth.userId,
        metadata: { status: "leaver" },
      });

      return apiSuccess({ entry: data });
    },
    { requiredRole: "slt" },
  );

  return wrappedHandler(req);
}
