import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { sendEmail } from "@/lib/email-service";
import crypto from "crypto";

/**
 * POST /api/admin/onboarding/[id]/start-trial
 * Converts a lead to a trial organization
 * - Creates Supabase user for contact
 * - Creates organization
 * - Enables selected modules
 * - Updates lead status
 * - Sends welcome email
 */
export const POST = protectedRoute(async (auth, req) => {
    const supabase = createServiceRoleClient();

    // Check if user is super admin
    const { data: superAdminCheck } = await supabase
        .from("super_admins")
        .select("access_level")
        .eq("user_id", auth.userId)
        .maybeSingle();

    if (!superAdminCheck) {
        return apiError("Access denied. Super admin only.", 403, "FORBIDDEN");
    }

    // Extract lead ID from URL pathname
    const leadId = req.nextUrl.pathname.split('/').slice(-2)[0];

    // Fetch lead details
    const { data: lead, error: leadError } = await supabase
        .from("onboarding_leads")
        .select("*")
        .eq("id", leadId)
        .single();

    if (leadError || !lead) {
        return apiError("Lead not found", 404, "LEAD_NOT_FOUND");
    }

    // Check if trial already started
    if (lead.trial_organization_id) {
        // Return existing org details
        const { data: org } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", lead.trial_organization_id)
            .single();

        return apiSuccess({
            message: "Trial already started for this lead",
            organization: org,
            lead,
        });
    }

    try {
        // 1. Generate temporary password
        const tempPassword = crypto.randomBytes(16).toString('base64').slice(0, 20);

        // 2. Create Supabase user for contact email
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: lead.contact_email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                full_name: lead.contact_name,
            },
        });

        if (authError || !authData.user) {
            console.error("[StartTrial] Auth error:", authError);
            return apiError("Failed to create user account", 500, "AUTH_FAILED");
        }

        const userId = authData.user.id;

        // 3. Create organization
        const { data: org, error: orgError } = await supabase
            .from("organizations")
            .insert({
                name: lead.name,
                urn: lead.urn,
                school_type: lead.school_type,
                local_authority: lead.la_name,
                phase: lead.phase,
                address: lead.address,
                postcode: lead.postcode,
                website: lead.website,
                phone: lead.phone,
                // Mark as trial
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            })
            .select()
            .single();

        if (orgError || !org) {
            console.error("[StartTrial] Org error:", orgError);
            // Cleanup user
            await supabase.auth.admin.deleteUser(userId);
            return apiError("Failed to create organization", 500, "ORG_FAILED");
        }

        // 4. Add user to users table
        await supabase.from("users").upsert({
            id: userId,
            auth_id: userId,
            email: lead.contact_email,
            display_name: lead.contact_name,
        });

        // 5. Add user as admin of organization
        const { error: memberError } = await supabase
            .from("organization_members")
            .insert({
                organization_id: org.id,
                user_id: userId,
                auth_id: userId,
                role: "admin",
            });

        if (memberError) {
            console.error("[StartTrial] Member error:", memberError);
        }

        // 6. Create trial subscription record
        const { data: subscription, error: subError } = await supabase
            .from("subscriptions")
            .insert({
                organization_id: org.id,
                plan: "trial",
                status: "trialing",
                payment_method: "invoice",
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .select()
            .single();

        if (subError) {
            console.error("[StartTrial] Subscription error:", subError);
        }

        // 7. Update lead with trial details
        const { data: updatedLead, error: updateError } = await supabase
            .from("onboarding_leads")
            .update({
                status: "trial_started",
                trial_start: new Date().toISOString(),
                trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                trial_organization_id: org.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", leadId)
            .select()
            .single();

        if (updateError) {
            console.error("[StartTrial] Lead update error:", updateError);
        }

        // 8. Send welcome email
        await sendWelcomeEmail({
            email: lead.contact_email,
            name: lead.contact_name,
            schoolName: lead.name,
            tempPassword,
            loginUrl: "https://schoolgle.co.uk/login",
            trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric'
            }),
        });

        return apiSuccess({
            message: "Trial started successfully",
            organization: org,
            subscription,
            lead: updatedLead,
            user: {
                id: userId,
                email: lead.contact_email,
            },
        });

    } catch (error: any) {
        console.error("[StartTrial] Error:", error);
        return apiError(
            process.env.NODE_ENV === "development" ? error.message : "Failed to start trial",
            500,
            "TRIAL_FAILED"
        );
    }
}, { requiredRole: 'admin' });

/**
 * Send welcome email to trial user
 */
async function sendWelcomeEmail(params: {
    email: string;
    name: string;
    schoolName: string;
    tempPassword: string;
    loginUrl: string;
    trialEndsAt: string;
}): Promise<void> {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<div style="max-width:600px;margin:0 auto;padding:24px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#00D4D4,#0ea5e9);padding:24px 32px;">
      <h1 style="margin:0;color:white;font-size:20px;">Welcome to Schoolgle!</h1>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#0f172a;font-size:24px;font-weight:bold;margin:0 0 16px;">Hi ${params.name},</h2>
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:16px 0;">
        Your 30-day trial for <strong>${params.schoolName}</strong> is now active!
      </p>
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:16px 0;">
        Here are your login details:
      </p>

      <div style="background:#f1f5f9;border-radius:8px;padding:20px;margin:16px 0;">
        <p style="margin:0 0 8px;font-weight:600;color:#0f172a;">Email</p>
        <p style="margin:0 0 16px;color:#64748b;font-size:14px;">${params.email}</p>
        <p style="margin:0 0 8px;font-weight:600;color:#0f172a;">Password</p>
        <p style="margin:0;color:#64748b;font-size:14px;font-family:monospace;background:white;padding:8px;border-radius:4px;">${params.tempPassword}</p>
      </div>

      <p style="color:#334155;font-size:15px;line-height:1.6;margin:16px 0;">
        Please <a href="${params.loginUrl}" style="color:#0ea5e9;text-decoration:none;font-weight:600;">log in</a> and change your password to something secure.
      </p>

      <p style="color:#334155;font-size:15px;line-height:1.6;margin:16px 0;">
        Your trial ends on <strong>${params.trialEndsAt}</strong>. We'll be in touch before then to discuss your experience and next steps.
      </p>

      <a href="${params.loginUrl}" style="display:inline-block;background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px;">Log In to Schoolgle</a>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        Questions? Just reply to this email. We're here to help!
      </p>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">
        Sent by Schoolgle - AI-powered school improvement
      </p>
    </div>
  </div>
</div>
</body></html>`;

    await sendEmail({
        to: params.email,
        subject: `Welcome to Schoolgle - Your Trial is Active!`,
        html,
        tags: [{ name: 'type', value: 'trial-welcome' }],
    });
}
