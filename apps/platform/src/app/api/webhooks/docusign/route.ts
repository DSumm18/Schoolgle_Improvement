/**
 * DocuSign Webhook Handler
 *
 * Receives webhook callbacks from DocuSign when contracts are signed.
 * Updates contract and signer status in database.
 *
 * POST /api/webhooks/docusign
 *
 * DocuSign sends POST with XML/JSON body containing:
 * {
 *   envelopeId: string,
 *   status: "completed" | "signed" | "declined",
 *   eventDate: string,
 *   signers: [
 *     {
 *       email: string,
 *       status: "signed" | "declined",
 *       signedAt: string
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { handleDocuSignWebhook } from "@/lib/docusign";

export const POST = async (req: NextRequest) => {
  try {
    // Parse DocuSign webhook body
    const body = await req.json();

    // Validate envelope ID exists
    if (!body.envelopeId) {
      return NextResponse.json(
        { error: "Missing envelopeId" },
        { status: 400 }
      );
    }

    console.log("DocuSign webhook received:", {
      envelopeId: body.envelopeId,
      status: body.status
    });

    // Process webhook
    const result = await handleDocuSignWebhook(body);

    if (!result.success) {
      console.error("DocuSign webhook processing failed:", result.error);
      // Still return 200 to DocuSign (don't retry indefinitely)
      return NextResponse.json({
        received: true,
        error: result.error
      });
    }

    return NextResponse.json({
      received: true,
      processed: true
    });

  } catch (error) {
    console.error("DocuSign webhook error:", error);
    // Return 200 to avoid retries
    return NextResponse.json({
      received: true,
      error: "Webhook processing failed"
    });
  }
};
