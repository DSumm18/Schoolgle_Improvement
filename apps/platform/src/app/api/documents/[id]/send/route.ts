import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email-service";

/**
 * POST /api/documents/[id]/send
 * Send a finalised document via email
 *
 * Body: { email?: string (override), delivery_method?: string }
 */
export const POST = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();

  // Extract ID from URL path: /api/documents/[id]/send
  const segments = request.nextUrl.pathname.split("/");
  const sendIdx = segments.indexOf("send");
  const id = sendIdx > 0 ? segments[sendIdx - 1] : null;

  if (!id) {
    return apiError("Document ID is required", 400, "MISSING_ID");
  }

  const body = await request.json();
  const emailOverride = body.email;
  const deliveryMethod = body.delivery_method || "email";

  // Fetch the document
  const { data: document, error: fetchError } = await supabase
    .from("generated_documents")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (fetchError || !document) {
    return apiError("Document not found", 404, "NOT_FOUND");
  }

  if (document.status !== "finalised") {
    return apiError(
      "Document must be finalised before sending. Call /api/documents/[id]/finalise first.",
      400,
      "NOT_FINALISED",
    );
  }

  const recipientEmail = emailOverride || document.recipient_email;

  if (deliveryMethod === "email" && !recipientEmail) {
    return apiError(
      "No email address available. Provide an email in the request body or ensure the document has a recipient_email.",
      400,
      "MISSING_EMAIL",
    );
  }

  // Send the email
  if (deliveryMethod === "email") {
    const result = await sendEmail({
      to: recipientEmail,
      subject: document.subject || "Document from Schoolgle",
      html: document.body_html || "",
      tags: [
        { name: "type", value: "document" },
        { name: "document_id", value: id },
      ],
    });

    if (!result.success) {
      console.error("Error sending document email:", result.error);
      return apiError(
        `Failed to send email: ${result.error}`,
        500,
        "EMAIL_FAILED",
      );
    }

    // Update document status to sent
    const { error: updateError } = await supabase
      .from("generated_documents")
      .update({
        status: "sent",
        delivery_method: deliveryMethod,
        sent_at: new Date().toISOString(),
        sent_to_email: recipientEmail,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating document status:", updateError);
    }

    // Record in delivery log
    const { error: logError } = await supabase
      .from("document_delivery_log")
      .insert({
        document_id: id,
        method: deliveryMethod,
        recipient_email: recipientEmail,
        status: "sent",
        provider_id: result.id || null,
      });

    if (logError) {
      console.error("Error recording delivery log:", logError);
    }

    return apiSuccess({
      success: true,
      status: "sent",
      email_id: result.id,
      recipient_email: recipientEmail,
    });
  }

  // For non-email delivery methods, just mark as sent
  const { error: updateError } = await supabase
    .from("generated_documents")
    .update({
      status: "sent",
      delivery_method: deliveryMethod,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) {
    console.error("Error updating document status:", updateError);
    return apiError(updateError.message, 500);
  }

  // Record in delivery log
  await supabase.from("document_delivery_log").insert({
    document_id: id,
    method: deliveryMethod,
    status: "sent",
  });

  return apiSuccess({
    success: true,
    status: "sent",
    delivery_method: deliveryMethod,
  });
});
