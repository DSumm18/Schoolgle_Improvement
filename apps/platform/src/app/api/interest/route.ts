import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/email-service";
import { apiSuccess, apiError } from "@/lib/api-utils";

/**
 * Public API endpoint for submitting interest form
 * Creates a lead in onboarding_leads table and sends notification emails
 * No authentication required
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate required fields
        const {
            name,
            contact_name,
            contact_email,
            interested_modules,
        } = body;

        if (!name || !contact_name || !contact_email) {
            return apiError("Missing required fields", 400, "MISSING_FIELDS");
        }

        if (!interested_modules || !Array.isArray(interested_modules) || interested_modules.length === 0) {
            return apiError("Please select at least one module", 400, "NO_MODULES");
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact_email)) {
            return apiError("Invalid email address", 400, "INVALID_EMAIL");
        }

        const supabase = createServiceRoleClient();

        // Check if lead with this URN or email already exists
        const { data: existingLead } = await supabase
            .from("onboarding_leads")
            .select("id, status, created_at")
            .or(`urn.eq.${body.urn || null},contact_email.eq.${contact_email}`)
            .single();

        // If lead exists and is recent (last 30 days), update instead of create
        if (existingLead) {
            const createdAt = new Date(existingLead.created_at);
            const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceCreation < 30 && existingLead.status !== 'converted') {
                // Get full lead data including notes
                const { data: fullLead } = await supabase
                    .from("onboarding_leads")
                    .select("*")
                    .eq("id", existingLead.id)
                    .single();

                // Update existing lead
                const { data: updatedLead, error: updateError } = await supabase
                    .from("onboarding_leads")
                    .update({
                        contact_name,
                        contact_email,
                        contact_phone: body.contact_phone || null,
                        contact_role: body.contact_role || null,
                        interested_modules,
                        plan_interest: body.plan_interest || 'not_sure',
                        timeline: body.timeline || null,
                        notes: body.message ? [
                            fullLead?.notes || '',
                            `--- Update on ${new Date().toISOString()} ---`,
                            body.message
                        ].filter(Boolean).join('\n\n') : (fullLead?.notes || null),
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", existingLead.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error("[Interest] Update error:", updateError);
                    return apiError("Failed to update existing lead", 500, "UPDATE_FAILED");
                }

                // Send admin notification about update
                await sendAdminNotification(updatedLead, true);

                return apiSuccess({
                    success: true,
                    message: "Thanks for your continued interest! We've updated your details.",
                    leadId: updatedLead.id,
                });
            }
        }

        // Create new lead
        const { data: lead, error: insertError } = await supabase
            .from("onboarding_leads")
            .insert({
                urn: body.urn || null,
                name,
                la_name: body.la_name || null,
                la_code: body.la_code || null,
                phase: body.phase || null,
                school_type: body.school_type || null,
                address: body.address || null,
                postcode: body.postcode || null,
                website: body.website || null,
                contact_name,
                contact_email,
                contact_phone: body.contact_phone || null,
                contact_role: body.contact_role || null,
                interested_modules,
                plan_interest: body.plan_interest || 'not_sure',
                timeline: body.timeline || null,
                notes: body.message || null,
                status: 'new',
            })
            .select()
            .single();

        if (insertError) {
            console.error("[Interest] Insert error:", insertError);
            return apiError("Failed to create lead", 500, "INSERT_FAILED");
        }

        // Send notification emails
        await Promise.all([
            sendSchoolConfirmation(lead),
            sendAdminNotification(lead, false),
        ]);

        return apiSuccess({
            success: true,
            message: "Thanks for your interest! We'll be in touch soon.",
            leadId: lead.id,
        });

    } catch (error: any) {
        console.error("[Interest] Error:", error);
        return apiError(
            process.env.NODE_ENV === "development" ? error.message : "Internal server error",
            500,
            "INTERNAL_ERROR"
        );
    }
}

/**
 * Send confirmation email to the school
 */
async function sendSchoolConfirmation(lead: any): Promise<void> {
    const moduleNames: Record<string, string> = {
        'ofsted-readiness': 'Ofsted Readiness',
        'estates-compliance': 'Estates Compliance',
        'hr-people': 'HR & People',
        'governance': 'Governance',
        'actions-hub': 'Actions Hub',
        'school-intelligence': 'School Intelligence',
        'ed-ai': 'Ed AI Chat',
        'communications': 'Communications',
        'calendar': 'Calendar',
    };

    const selectedModules = (lead.interested_modules || [])
        .map((id: string) => moduleNames[id] || id)
        .join(', ');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#00D4D4,#0ea5e9);padding:24px 32px;">
      <h1 style="margin:0;color:white;font-size:20px;">Schoolgle</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#0f172a;font-size:24px;font-weight:bold;margin:0 0 16px;">Thanks for your interest!</h2>
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:16px 0;">
        Hi ${lead.contact_name},
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:16px 0;">
        Thanks for expressing interest in Schoolgle for <strong>${lead.name}</strong>. We've received your request and a member of our team will be in touch within 1-2 working days.
      </p>
      <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0f172a;">Your selected modules:</p>
        <p style="margin:0;color:#64748b;font-size:14px;">${selectedModules}</p>
      </div>
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:16px 0;">
        In the meantime, feel free to explore our website at <a href="https://schoolgle.co.uk" style="color:#0ea5e9;text-decoration:none;">schoolgle.co.uk</a>
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Sent by Schoolgle - AI-powered school improvement</p>
    </div>
  </div>
</div>
</body></html>`;

    await sendEmail({
        to: lead.contact_email,
        subject: `Thanks for your interest in Schoolgle`,
        html,
        tags: [{ name: 'type', value: 'interest-confirmation' }],
    });
}

/**
 * Send notification email to admin
 */
async function sendAdminNotification(lead: any, isUpdate: boolean): Promise<void> {
    const moduleNames: Record<string, string> = {
        'ofsted-readiness': 'Ofsted Readiness',
        'estates-compliance': 'Estates Compliance',
        'hr-people': 'HR & People',
        'governance': 'Governance',
        'actions-hub': 'Actions Hub',
        'school-intelligence': 'School Intelligence',
        'ed-ai': 'Ed AI Chat',
        'communications': 'Communications',
        'calendar': 'Calendar',
    };

    const selectedModules = (lead.interested_modules || [])
        .map((id: string) => moduleNames[id] || id)
        .join(', ');

    const title = isUpdate ? 'Updated Interest' : 'New Interest';
    const subject = isUpdate
        ? `${title}: ${lead.name} (updated)`
        : `${title}: ${lead.name}`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#00D4D4,#0ea5e9);padding:24px 32px;">
      <h1 style="margin:0;color:white;font-size:20px;">Schoolgle Admin</h1>
    </div>
    <div style="padding:32px;">
      <div style="display:inline-block;background:${isUpdate ? '#d97706' : '#16a34a'};color:white;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;margin-bottom:16px;">
        ${isUpdate ? 'UPDATED LEAD' : 'NEW LEAD'}
      </div>
      <h2 style="color:#0f172a;font-size:24px;font-weight:bold;margin:8px 0 16px;">${lead.name}</h2>

      <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0f172a;">School Details</p>
        ${lead.urn ? `<p style="margin:4px 0;color:#64748b;font-size:14px;">URN: ${lead.urn}</p>` : ''}
        ${lead.la_name ? `<p style="margin:4px 0;color:#64748b;font-size:14px;">LA: ${lead.la_name}</p>` : ''}
        ${lead.phase ? `<p style="margin:4px 0;color:#64748b;font-size:14px;">Phase: ${lead.phase}</p>` : ''}
        ${lead.address ? `<p style="margin:4px 0;color:#64748b;font-size:14px;">Address: ${lead.address}</p>` : ''}
      </div>

      <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0f172a;">Contact</p>
        <p style="margin:4px 0;color:#64748b;font-size:14px;">Name: ${lead.contact_name}</p>
        <p style="margin:4px 0;color:#64748b;font-size:14px;">Email: <a href="mailto:${lead.contact_email}" style="color:#0ea5e9;">${lead.contact_email}</a></p>
        ${lead.contact_phone ? `<p style="margin:4px 0;color:#64748b;font-size:14px;">Phone: ${lead.contact_phone}</p>` : ''}
        ${lead.contact_role ? `<p style="margin:4px 0;color:#64748b;font-size:14px;">Role: ${lead.contact_role}</p>` : ''}
      </div>

      <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0f172a;">Interested In</p>
        <p style="margin:4px 0;color:#64748b;font-size:14px;">${selectedModules}</p>
        ${lead.timeline ? `<p style="margin:4px 0;color:#64748b;font-size:14px;">Timeline: ${lead.timeline}</p>` : ''}
      </div>

      <div style="margin:24px 0;">
        <a href="https://schoolgle.co.uk/admin/onboarding" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View in Admin</a>
      </div>

      <p style="margin:8px 0;color:#94a3b8;font-size:12px;">Lead ID: ${lead.id}</p>
      <p style="margin:8px 0;color:#94a3b8;font-size:12px;">Created: ${new Date(lead.created_at).toLocaleString()}</p>
    </div>
  </div>
</div>
</body></html>`;

    await sendEmail({
        to: "admin@schoolgle.co.uk",
        subject,
        html,
        tags: [{ name: 'type', value: isUpdate ? 'interest-update' : 'new-lead' }],
    });
}
