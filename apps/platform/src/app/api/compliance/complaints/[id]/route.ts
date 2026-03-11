import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/compliance/complaints/[id]
 * Get a single complaint
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const wrappedHandler = protectedRoute(async (auth, request) => {
    const { id } = await params;
    const supabase = createServiceRoleClient();

    const { data: complaint, error } = await supabase
      .from("compliance_complaints")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !complaint) {
      return apiError("Complaint not found", 404);
    }

    return apiSuccess({ complaint });
  });

  return wrappedHandler(req);
}

/**
 * PUT /api/compliance/complaints/[id]
 * Update a complaint (including stage progression)
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
        "complainant_name",
        "complainant_relationship",
        "complainant_contact",
        "date_received",
        "summary",
        "category",
        "stage",
        "status",
        "assigned_to",
        "deadline_date",
        "desired_outcome",
        "resolution_summary",
        "resolution_date",
        "outcome",
        "lessons_learned",
        "notes",
      ];

      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }

      const { data, error } = await supabase
        .from("compliance_complaints")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating complaint:", error);
        return apiError("Failed to update complaint", 500);
      }

      // Audit log
      await supabase.from("compliance_audit_log").insert({
        organization_id: data.organization_id,
        entity_type: "complaint",
        entity_id: id,
        action: "updated",
        actor_user_id: auth.userId,
        metadata: updateData,
      });

      return apiSuccess({ complaint: data });
    },
    { requiredRole: "slt" },
  );

  return wrappedHandler(req);
}
