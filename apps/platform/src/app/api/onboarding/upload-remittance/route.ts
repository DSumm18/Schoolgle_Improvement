/**
 * Upload Remittance API
 *
 * POST /api/onboarding/upload-remittance
 *
 * Handles remittance (payment evidence) file uploads.
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createClient();
  const formData = await req.formData();

  const contractId = formData.get("contractId") as string;
  const file = formData.get("file") as File;

  if (!contractId || !file) {
    return NextResponse.json(
      { error: "contractId and file are required" },
      { status: 400 }
    );
  }

  try {
    // Upload to Supabase Storage
    const fileName = `remittances/${contractId}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(fileName);

    // Update payment record
    const { data: contract } = await supabase
      .from("contracts")
      .select("organization_id")
      .eq("id", contractId)
      .single();

    await supabase
      .from("payments")
      .insert({
        contract_id: contractId,
        organization_id: contract?.organization_id,
        payment_reference: `REM-${contractId.substring(0, 8)}`,
        amount_due: 0, // Will be set from contract
        remittance_file_url: publicUrl,
        remittance_uploaded_at: new Date().toISOString(),
        status: "pending",
        due_date: new Date().toISOString().split("T")[0]
      });

    return NextResponse.json({
      success: true,
      remittanceUrl: publicUrl
    });

  } catch (error) {
    console.error("Failed to upload remittance:", error);
    return NextResponse.json(
      { error: "Failed to upload remittance" },
      { status: 500 }
    );
  }
});
