/**
 * Send meter reading to energy supplier via email
 *
 * POST /api/estates/energy/send-reading
 *
 * Body: { meter_id, reading_value, reading_date, supplier_email? }
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email-service";

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();
  const { meter_id, reading_value, reading_date, supplier_email } = body;

  if (!meter_id || reading_value == null) {
    return apiError("meter_id and reading_value are required", 400);
  }

  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  // Get meter details
  const { data: meter } = await supabase
    .from("energy_meters")
    .select("*")
    .eq("id", meter_id)
    .eq("organization_id", orgId)
    .single();

  if (!meter) {
    return apiError("Meter not found", 404);
  }

  // Get the latest invoice for this meter's supplier
  const { data: latestInvoice } = await supabase
    .from("energy_invoices")
    .select("supplier_name, account_reference, contract_reference")
    .eq("organization_id", orgId)
    .eq("energy_type", meter.meter_type)
    .order("invoice_date", { ascending: false })
    .limit(1)
    .single();

  const supplierName = latestInvoice?.supplier_name ?? "Energy Supplier";
  const accountRef = latestInvoice?.account_reference ?? "N/A";
  const contractRef = latestInvoice?.contract_reference ?? "";

  // Get the previous reading for comparison
  const { data: prevReading } = await supabase
    .from("energy_invoice_readings")
    .select("current_reading, reading_date")
    .eq("meter_id", meter_id)
    .order("reading_date", { ascending: false })
    .limit(1)
    .single();

  const meterUnit = meter.meter_type === "gas" ? "m\u00b3" : "kWh";
  const readingDateFmt = new Date(
    reading_date ?? Date.now(),
  ).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #00D4D4; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Meter Reading Submission</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">Aurora Primary School</p>
      </div>
      <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Dear ${supplierName},</p>
        <p>Please find below the latest meter reading for our account:</p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr style="background: #f9fafb;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Account Reference</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${accountRef}</td>
          </tr>
          ${contractRef ? `<tr><td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Contract</td><td style="padding: 10px; border: 1px solid #e5e7eb;">${contractRef}</td></tr>` : ""}
          <tr style="background: #f9fafb;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Meter Reference</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${meter.meter_reference}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Meter Serial</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${meter.serial_number ?? "N/A"}</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Meter Location</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${meter.location}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Reading Date</td>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${readingDateFmt}</td>
          </tr>
          <tr style="background: #00D4D4; color: white;">
            <td style="padding: 12px; border: 1px solid #00bfbf; font-weight: bold; font-size: 16px;">Current Reading</td>
            <td style="padding: 12px; border: 1px solid #00bfbf; font-weight: bold; font-size: 18px;">${reading_value.toLocaleString("en-GB")} ${meterUnit}</td>
          </tr>
          ${prevReading ? `<tr style="background: #f9fafb;"><td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold;">Previous Reading</td><td style="padding: 10px; border: 1px solid #e5e7eb;">${Number(prevReading.current_reading).toLocaleString("en-GB")} ${meterUnit} (${prevReading.reading_date})</td></tr>` : ""}
        </table>

        <p>Kind regards,<br/>Aurora Primary School<br/>via Schoolgle Energy Management</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 11px; color: #9ca3af;">This reading was submitted via Schoolgle Energy Management. If you have questions, please contact the school directly.</p>
      </div>
    </div>
  `;

  const recipientEmail =
    supplier_email ??
    `readings@${supplierName.toLowerCase().replace(/\s+/g, "")}.co.uk`;

  const result = await sendEmail({
    to: recipientEmail,
    subject: `Meter Reading Submission - Account ${accountRef} - ${readingDateFmt}`,
    html: emailHtml,
    text: `Meter Reading for ${meter.meter_reference}: ${reading_value} ${meterUnit} on ${readingDateFmt}. Account: ${accountRef}.`,
    tags: [
      { name: "type", value: "meter-reading" },
      { name: "meter", value: meter.meter_reference },
    ],
  });

  return apiSuccess({
    message: result.success
      ? `Reading email sent to ${recipientEmail}`
      : "Email queued (dev mode)",
    email_id: result.id,
    recipient: recipientEmail,
    supplier: supplierName,
  });
});
