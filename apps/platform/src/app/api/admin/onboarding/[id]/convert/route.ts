import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

/**
 * POST /api/admin/onboarding/[id]/convert
 * Converts a lead to a paid subscription
 * Creates/updates subscription with proper pricing
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

    const body = await req.json();
    const {
        plan = 'core',
        discountPercent = 0,
        paymentMethod = 'invoice',
        userLimit = 3,
        storageLimitGb = 50,
    } = body;

    // Pricing configuration
    const prices = {
        core: 149900, // £1,499 in pence
        professional: 249900, // £2,499
        enterprise: 399900, // £3,999
    };

    const basePrice = prices[plan as keyof typeof prices] || prices.core;
    const finalPrice = Math.round(basePrice * (1 - discountPercent / 100));

    // Calculate period end (1 year from now)
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    try {
        let organizationId = lead.trial_organization_id;
        let userId: string | null = null;

        // If no organization exists yet, create one
        if (!organizationId) {
            // Check if user already exists
            const { data: existingUser } = await supabase.auth.admin.listUsers();
            userId = existingUser.users.find(u => u.email === lead.contact_email)?.id || null;

            // Create user if doesn't exist
            if (!userId) {
                const crypto = await import('crypto');
                const tempPassword = crypto.randomBytes(16).toString('base64').slice(0, 20);

                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: lead.contact_email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name: lead.contact_name,
                    },
                });

                if (authError || !authData.user) {
                    return apiError("Failed to create user", 500, "AUTH_FAILED");
                }

                userId = authData.user.id;
            }

            // Create organization
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
                })
                .select()
                .single();

            if (orgError || !org) {
                return apiError("Failed to create organization", 500, "ORG_FAILED");
            }

            organizationId = org.id;

            // Add user to organization
            if (userId) {
                await supabase.from("users").upsert({
                    id: userId,
                    auth_id: userId,
                    email: lead.contact_email,
                    display_name: lead.contact_name,
                });

                await supabase.from("organization_members").insert({
                    organization_id: organizationId,
                    user_id: userId,
                    auth_id: userId,
                    role: "admin",
                });
            }
        }

        // Check if subscription exists for this organization
        const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("*")
            .eq("organization_id", organizationId)
            .maybeSingle();

        let subscription;

        if (existingSub) {
            // Update existing subscription
            const { data: updatedSub, error: subError } = await supabase
                .from("subscriptions")
                .update({
                    plan,
                    status: "active",
                    base_price_annual: basePrice,
                    discount_percent: discountPercent,
                    final_price_annual: finalPrice,
                    payment_method: paymentMethod,
                    user_limit: userLimit,
                    storage_limit_gb: storageLimitGb,
                    current_period_end: periodEnd.toISOString(),
                    cancel_at_period_end: false,
                    cancelled_at: null,
                })
                .eq("id", existingSub.id)
                .select()
                .single();

            if (subError) {
                return apiError("Failed to update subscription", 500, "SUB_UPDATE_FAILED");
            }

            subscription = updatedSub;
        } else {
            // Create new subscription
            const { data: newSub, error: subError } = await supabase
                .from("subscriptions")
                .insert({
                    organization_id: organizationId,
                    plan,
                    status: "active",
                    base_price_annual: basePrice,
                    discount_percent: discountPercent,
                    final_price_annual: finalPrice,
                    payment_method: paymentMethod,
                    user_limit: userLimit,
                    storage_limit_gb: storageLimitGb,
                    current_period_end: periodEnd.toISOString(),
                })
                .select()
                .single();

            if (subError || !newSub) {
                return apiError("Failed to create subscription", 500, "SUB_CREATE_FAILED");
            }

            subscription = newSub;
        }

        // Update lead status
        await supabase
            .from("onboarding_leads")
            .update({
                status: "converted",
                converted_to_subscription_id: subscription.id,
                converted_at: new Date().toISOString(),
                trial_organization_id: organizationId,
                updated_at: new Date().toISOString(),
            })
            .eq("id", leadId);

        // Log to subscription history
        await supabase.from("subscription_history").insert({
            subscription_id: subscription.id,
            change_type: "created",
            new_plan: plan,
            new_price: finalPrice,
        });

        // Generate invoice if payment method is invoice
        if (paymentMethod === "invoice") {
            const { data: invoiceNum } = await supabase.rpc("generate_invoice_number");
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            await supabase.from("invoices").insert({
                subscription_id: subscription.id,
                organization_id: organizationId,
                invoice_number: invoiceNum || `INV-${Date.now()}`,
                status: "sent",
                subtotal: finalPrice,
                tax: 0,
                total: finalPrice,
                amount_due: finalPrice,
                description: `Schoolgle ${plan} - Annual Subscription`,
                invoice_date: new Date().toISOString().split("T")[0],
                due_date: dueDate.toISOString().split("T")[0],
                sent_at: new Date().toISOString(),
                line_items: JSON.stringify([
                    {
                        description: `Schoolgle ${plan} Plan - Annual Subscription`,
                        quantity: 1,
                        unit_price: finalPrice,
                        total: finalPrice,
                    },
                ]),
            });
        }

        return apiSuccess({
            message: "Converted to paid subscription",
            subscription,
            organizationId,
        });

    } catch (error: any) {
        console.error("[ConvertLead] Error:", error);
        return apiError(
            process.env.NODE_ENV === "development" ? error.message : "Failed to convert lead",
            500,
            "CONVERT_FAILED"
        );
    }
}, { requiredRole: 'admin' });
