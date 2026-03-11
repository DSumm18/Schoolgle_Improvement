import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { gdprLimiter } from "@/lib/rateLimit";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GDPR Data Export Endpoint
 * Returns all personal data for the authenticated user in JSON format
 * Satisfies Article 15 (Right of Access) and Article 20 (Data Portability)
 */
export const POST = protectedRoute(async (auth, req) => {
  try {
    // Rate limiting check
    const rateLimitResult = await gdprLimiter.check(req);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Use authenticated user ID (not from request body)
    const userId = auth.userId;

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return apiError("User not found", 404);
    }

    // Fetch organisation membership
    const { data: membershipData } = await supabase
      .from("organization_members")
      .select(
        `
                role,
                job_title,
                created_at,
                organization:organizations (
                    id,
                    name,
                    school_type
                )
            `,
      )
      .eq("user_id", userId);

    // Fetch user's assessments
    const { data: assessmentsData } = await supabase
      .from("ofsted_assessments")
      .select("*")
      .eq("assessed_by", userId);

    // Fetch user's actions
    const { data: actionsData } = await supabase
      .from("actions")
      .select("*")
      .or(`created_by.eq.${userId},assigned_to.eq.${userId}`);

    // Fetch user's observations
    const { data: observationsData } = await supabase
      .from("lesson_observations")
      .select("*")
      .eq("observer_id", userId);

    // Fetch invitations sent by user
    const { data: invitationsData } = await supabase
      .from("invitations")
      .select("*")
      .eq("invited_by", userId);

    // Fetch compliance data linked to user
    const { data: trainingData } = await supabase
      .from("compliance_training_completions")
      .select("*")
      .eq("user_id", userId);

    // Fetch staff directory entry
    const { data: staffData } = await supabase
      .from("staff_directory")
      .select("*")
      .eq("user_id", userId);

    // Build the export object
    const exportData = {
      export_metadata: {
        export_date: new Date().toISOString(),
        export_type: "GDPR Subject Access Request",
        format_version: "2.0",
        data_controller:
          (membershipData?.[0]?.organization as any)?.name || "Unknown",
        data_processor: "Schoolgle Ltd",
      },
      data_subject: {
        id: userData.id,
        email: userData.email,
        display_name: userData.display_name,
        avatar_url: userData.avatar_url,
        account_created: userData.created_at,
        account_updated: userData.updated_at,
      },
      organisation_memberships:
        membershipData?.map((m) => ({
          organisation_name: (m.organization as any)?.name,
          role: m.role,
          job_title: m.job_title,
          joined_date: m.created_at,
        })) || [],
      staff_profile: staffData || [],
      content_created: {
        assessments: {
          count: assessmentsData?.length || 0,
          items:
            assessmentsData?.map((a) => ({
              id: a.id,
              subcategory: a.subcategory_id,
              rating: a.rating,
              created_at: a.created_at,
            })) || [],
        },
        actions: {
          count: actionsData?.length || 0,
          items:
            actionsData?.map((a) => ({
              id: a.id,
              title: a.title,
              status: a.status,
              created_at: a.created_at,
            })) || [],
        },
        observations: {
          count: observationsData?.length || 0,
          items:
            observationsData?.map((o) => ({
              id: o.id,
              date: o.date,
              teacher_name: o.teacher_name,
              created_at: o.created_at,
            })) || [],
        },
      },
      training_completions: trainingData || [],
      invitations_sent:
        invitationsData?.map((i) => ({
          email: i.email,
          role: i.role,
          status: i.status,
          created_at: i.created_at,
        })) || [],
      data_retention_info: {
        account_data: "Retained until account deletion + 30 days",
        content_data: "Retained until deleted by organisation + 30 days",
        activity_logs: "Retained for 12 months then automatically deleted",
        backups: "Retained for 90 days then automatically deleted",
      },
      your_rights: {
        rectification: "You can update your data via Settings",
        erasure:
          "You can delete your account via Settings > Privacy > Delete Account",
        restriction: "Contact dpo@schoolgle.co.uk",
        portability: "This export satisfies your portability rights",
        complaint: "Contact the ICO at ico.org.uk",
      },
    };

    // Log the export for audit purposes
    await supabase.from("activity_log").insert({
      organization_id: (membershipData?.[0]?.organization as any)?.id,
      user_id: userId,
      event_type: "gdpr_data_export",
      event_data: { export_date: new Date().toISOString() },
    });

    return apiSuccess(exportData);
  } catch (error: any) {
    console.error("GDPR export error:", error);
    return apiError(error.message, 500);
  }
});
