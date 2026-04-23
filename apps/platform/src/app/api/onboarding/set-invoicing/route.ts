/**
 * Set Invoicing Options API
 *
 * POST /api/onboarding/set-invoicing
 *
 * Saves invoicing preferences and contract dates.
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createClient();
  const body = await req.json();
  const { invoicingOption, startDate, endDate } = body;

  if (!invoicingOption || !startDate || !endDate) {
    return NextResponse.json(
      { error: "invoicingOption, startDate, and endDate are required" },
      { status: 400 }
    );
  }

  try {
    await supabase
      .from("onboarding_leads")
      .update({
        invoicing_option: invoicingOption,
        contract_start_date: startDate,
        contract_end_date: endDate,
        current_step: 6,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", auth.userId);

    return NextResponse.json({
      success: true,
      invoicingOption,
      contractDates: { startDate, endDate }
    });

  } catch (error) {
    console.error("Failed to save invoicing options:", error);
    return NextResponse.json(
      { error: "Failed to save invoicing options" },
      { status: 500 }
    );
  }
});
