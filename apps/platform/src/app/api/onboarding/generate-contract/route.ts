/**
 * Contract Generation API
 *
 * Generates contract PDF and sets up DocuSign envelope.
 * Stores contract details in database.
 *
 * POST /api/onboarding/generate-contract
 *
 * Body:
 * {
 *   organizationId: string,
 *   selectedSchools: [{ urn, name, modules[] }],
 *   pricing: { subtotal, total, discount },
 *   invoicingOption: "trust" | "individual" | "split",
 *   startDate: "2026-09-01",
 *   endDate: "2027-08-31",
 *   signers: [{ name, email, role }]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute } from "@/lib/api-utils";
import { createClient, createServiceRoleClient } from "@/lib/supabase-server";
import { createDocuSignEnvelope } from "@/lib/docusign";
import { generateContractPDF } from "@/lib/contract-generator";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createClient();
  const serviceSupabase = createServiceRoleClient();
  const body = await req.json();

  const {
    organizationId,
    selectedSchools,
    pricing,
    invoicingOption,
    startDate,
    endDate,
    signers
  } = body;

  if (!organizationId || !selectedSchools || !pricing || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // 1. Get organization details
    const { data: organization } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // 2. Generate contract PDF
    const contractData = {
      organization,
      selectedSchools,
      pricing,
      invoicingOption,
      startDate,
      endDate,
      contractNumber: await generateContractNumber(),
      createdDate: new Date().toISOString()
    };

    const pdfResult = await generateContractPDF(contractData);

    if (!pdfResult.success) {
      return NextResponse.json(
        { error: "Failed to generate contract PDF" },
        { status: 500 }
      );
    }

    // 3. Create contract record
    const { data: contract, error: contractError } = await serviceSupabase
      .from("contracts")
      .insert({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        contract_number: contractData.contractNumber,
        contract_type: invoicingOption,
        trust_name: organization.name,
        total_value: pricing.total,
        start_date: startDate,
        end_date: endDate,
        selected_modules: selectedSchools,
        invoicing_option: invoicingOption,
        contract_pdf_url: pdfResult.url,
        status: "draft",
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (contractError || !contract) {
      throw contractError || new Error("Failed to create contract");
    }

    // 4. Setup DocuSign if signers provided
    let docusignResult = null;

    if (signers && signers.length > 0 && process.env.DOCUSIGN_ACCESS_TOKEN) {
      docusignResult = await createDocuSignEnvelope({
        contractId: contract.id,
        documentName: `Schoolgle Contract - ${organization.name}`,
        documentUrl: pdfResult.url,
        signers: signers.map((s: any) => ({
          name: s.name,
          email: s.email,
          role: s.role,
          routingOrder: s.routingOrder || 1
        })),
        subject: "Schoolgle Contract Signature Required",
        message: `Please review and sign the Schoolgle contract for ${organization.name}.`
      });
    }

    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        contractNumber: contract.contract_number,
        pdfUrl: pdfResult.url,
        status: contract.status
      },
      docusign: docusignResult ? {
        envelopeId: docusignResult.envelopeId,
        signingUrl: docusignResult.url
      } : null
    });

  } catch (error) {
    console.error("Contract generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate contract" },
      { status: 500 }
    );
  }
});

async function generateContractNumber(): Promise<string> {
  // Simple version - could be more sophisticated
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
  return `SG-${year}-${random}`;
}
