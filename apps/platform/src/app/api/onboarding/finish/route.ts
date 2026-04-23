/**
 * Complete Onboarding API
 *
 * POST /api/onboarding/complete
 *
 * Marks onboarding as complete and optionally activates access.
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute } from "@/lib/api-utils";
import { createClient, createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createClient();
  const serviceSupabase = createServiceRoleClient();

  try {
    // Mark onboarding as complete
    await supabase
      .from("onboarding_leads")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        current_step: 9
      })
      .eq("user_id", auth.userId);

    // Get onboarding data
    const { data: lead } = await supabase
      .from("onboarding_leads")
      .select("*")
      .eq("user_id", auth.userId)
      .single();

    // Activate subscription if start date has passed
    if (lead?.contract_start_date) {
      const startDate = new Date(lead.contract_start_date);
      if (startDate <= new Date()) {
        // Activate contract and subscription
        if (lead?.contract_id) {
          await serviceSupabase
            .from("contracts")
            .update({
              status: "active",
              activated_at: new Date().toISOString()
            })
            .eq("id", lead.contract_id);

          await serviceSupabase
            .from("subscriptions")
            .update({
              status: "active"
            })
            .eq("id", lead.subscription_id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
      activated: new Date(lead?.contract_start_date || "") <= new Date()
    });

  } catch (error) {
    console.error("Failed to complete onboarding:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
});
