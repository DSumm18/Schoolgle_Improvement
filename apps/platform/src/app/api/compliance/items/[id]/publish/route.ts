import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * POST /api/compliance/items/[id]/publish
 * Publish an approved compliance item — sets status to 'published' and updates review schedule
 */
export const POST = protectedRoute(
  async (auth, req: NextRequest) => {
    const supabase = createServiceRoleClient();
    const segments = req.nextUrl.pathname.split("/");
    const publishIdx = segments.indexOf("publish");
    const id = segments[publishIdx - 1];

    // Verify item exists and is approved
    const { data: item, error: fetchError } = await supabase
      .from("compliance_items")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !item) {
      return apiError("Compliance item not found", 404);
    }

    if (item.status !== "approved") {
      return apiError(
        "Only approved items can be published. Current status: " + item.status,
        400,
      );
    }

    // Update status to published
    const { data: updated, error: updateError } = await supabase
      .from("compliance_items")
      .update({
        status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return apiError("Failed to publish item", 500);
    }

    // Update review schedule — set last_review_date to now and calculate next
    const { data: schedule } = await supabase
      .from("compliance_review_schedule")
      .select("*")
      .eq("compliance_item_id", id)
      .maybeSingle();

    if (schedule) {
      const now = new Date();
      let nextReview: Date;

      switch (schedule.review_frequency) {
        case "quarterly":
          nextReview = new Date(now.getTime() + 90 * 86400000);
          break;
        case "termly":
          nextReview = new Date(now.getTime() + 120 * 86400000);
          break;
        case "annual":
          nextReview = new Date(
            now.getFullYear() + 1,
            now.getMonth(),
            now.getDate(),
          );
          break;
        default:
          nextReview = new Date(
            now.getFullYear() + 1,
            now.getMonth(),
            now.getDate(),
          );
      }

      await supabase
        .from("compliance_review_schedule")
        .update({
          last_review_date: now.toISOString(),
          next_review_date: nextReview.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("compliance_item_id", id);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: item.organization_id,
      entity_type: "compliance_item",
      entity_id: id,
      action: "published",
      actor_user_id: auth.userId,
      actor_name: auth.email,
      metadata: { previous_status: item.status },
    });

    return apiSuccess({ item: updated });
  },
  { requiredRole: "headteacher" },
);
