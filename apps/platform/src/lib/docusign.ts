/**
 * DocuSign Integration Service
 *
 * Handles DocuSign envelope creation, signer management,
 * and webhook callbacks for contract signing.
 *
 * Requirements:
 * - DOCUSIGN_BASE_URL (e.g., https://demo.docusign.net/restapi)
 * - DOCUSIGN_ACCOUNT_ID
 * - DOCUSIGN_CLIENT_ID (Integration Key)
 * - DOCUSIGN_USER_ID (Guid)
 * - DOCUSIGN_PRIVATE_KEY (RSA key for JWT auth)
 */

import { createClient } from "./supabase-server";

// DocuSign API configuration
const DOCUSIGN_BASE_URL = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi";
const DOCUSIGN_API_VERSION = "v2.1";
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;

export interface DocuSignSigner {
  name: string;
  email: string;
  role: string;
  routingOrder?: number;
}

export interface DocuSignTemplate {
  contractId: string;
  documentName: string;
  documentUrl: string; // PDF URL
  signers: DocuSignSigner[];
  subject: string;
  message?: string;
}

/**
 * Create DocuSign envelope from contract PDF
 */
export async function createDocuSignEnvelope(template: DocuSignTemplate) {
  if (!process.env.DOCUSIGN_ACCESS_TOKEN) {
    console.warn("DocuSign not configured - skipping envelope creation");
    return {
      success: false,
      error: "DOCUSIGN_ACCESS_TOKEN not set"
    };
  }

  try {
    // Prepare signers for DocuSign
    const signers = template.signers.map((signer, index) => ({
      email: signer.email,
      name: signer.name,
      recipientId: `${index + 1}`,
      routingOrder: signer.routingOrder || (index + 1),
      tabs: {
        signHereTabs: [{
          documentId: "1",
          pageNumber: "1",
          recipientId: `${index + 1}`,
          xPosition: "400",
          yPosition: "500",
        }]
      }
    }));

    // Create envelope
    const envelopePayload = {
      documents: [{
        documentId: "1",
        name: template.documentName,
        fileExtension: "pdf",
        uri: template.documentUrl // Direct URL to PDF
      }],
      recipients: {
        signers
      },
      emailSubject: template.subject || "Please sign your Schoolgle contract",
      emailBlurb: template.message || "Please review and sign the attached contract.",
      status: "sent"
    };

    // Call DocuSign API
    const response = await fetch(
      `${DOCUSIGN_BASE_URL}/${DOCUSIGN_API_VERSION}/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DOCUSIGN_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(envelopePayload)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DocuSign API error: ${error}`);
    }

    const envelope = await response.json();

    // Save to database
    const supabase = createClient();
    await supabase.from("contracts").update({
      docusign_envelope_id: envelope.envelopeId,
      docusign_status: "sent",
      sent_for_signature_at: new Date().toISOString(),
      status: "awaiting_signature"
    }).eq("id", template.contractId);

    // Track signers
    for (const signer of template.signers) {
      await supabase.from("docusign_signers").insert({
        contract_id: template.contractId,
        name: signer.name,
        email: signer.email,
        role: signer.role,
        routing_order: signer.routingOrder || 1,
        status: "sent",
        sent_at: new Date().toISOString()
      });
    }

    return {
      success: true,
      envelopeId: envelope.envelopeId,
      url: envelope.url || `${DOCUSIGN_BASE_URL}/static/automatic.html?envelopeId=${envelope.envelopeId}`
    };

  } catch (error) {
    console.error("DocuSign envelope creation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create envelope"
    };
  }
}

/**
 * Handle DocuSign webhook callback
 * Updates contract and signer status in database
 */
export async function handleDocuSignWebhook(webhookData: any) {
  const supabase = createClient();

  try {
    const { envelopeId, status, eventDate } = webhookData;

    // Find contract by envelope ID
    const { data: contract } = await supabase
      .from("contracts")
      .select("*")
      .eq("docusign_envelope_id", envelopeId)
      .single();

    if (!contract) {
      return { success: false, error: "Contract not found" };
    }

    // Update contract status
    const updateData: any = {
      docusign_status: status
    };

    if (status === "completed") {
      updateData.status = "signed";
      updateData.signed_at = eventDate;

      // Activate contract if start date has passed
      if (new Date() >= new Date(contract.start_date)) {
        updateData.status = "active";
        updateData.activated_at = new Date().toISOString();
      }
    }

    await supabase
      .from("contracts")
      .update(updateData)
      .eq("id", contract.id);

    // Update signers if webhook includes signer info
    if (webhookData.signers) {
      for (const signerData of webhookData.signers) {
        await supabase
          .from("docusign_signers")
          .update({
            status: signerData.status,
            signed_at: signerData.signedAt || eventDate
          })
          .eq("contract_id", contract.id)
          .eq("email", signerData.email);
      }
    }

    return { success: true };

  } catch (error) {
    console.error("DocuSign webhook handler failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Webhook processing failed"
    };
  }
}

/**
 * Get DocuSign signing URL for a specific signer
 * Use this to redirect user to DocuSign signing page
 */
export async function getSigningUrl(envelopeId: string, signerEmail: string, returnUrl: string) {
  if (!process.env.DOCUSIGN_ACCESS_TOKEN) {
    return {
      success: false,
      error: "DocuSign not configured"
    };
  }

  try {
    // Get recipient view
    const response = await fetch(
      `${DOCUSIGN_BASE_URL}/${DOCUSIGN_API_VERSION}/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/views/recipient`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DOCUSIGN_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          returnUrl, // Where to redirect after signing
          authenticationMethod: "email",
          email: signerEmail,
          userName: signerEmail.split("@")[0], // Fallback, should get from DB
          recipientId: "1" // First signer
        })
      }
    );

    if (!response.ok) {
      throw new Error(`DocuSign API error: ${await response.text()}`);
    }

    const data = await response.json();

    return {
      success: true,
      url: data.url
    };

  } catch (error) {
    console.error("Failed to get signing URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get signing URL"
    };
  }
}
