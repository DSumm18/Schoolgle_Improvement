import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

/**
 * GET /api/admin/onboarding/[id] - Get single lead details
 */
export const GET = protectedRoute(async (auth, req) => {
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

    // Extract ID from URL pathname
    const id = req.nextUrl.pathname.split('/').pop();

    const { data: lead, error } = await supabase
        .from("onboarding_leads")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !lead) {
        return apiError("Lead not found", 404, "NOT_FOUND");
    }

    return apiSuccess({ data: lead });
}, { requiredRole: 'admin' });

/**
 * PATCH /api/admin/onboarding/[id] - Update lead status/notes
 */
export const PATCH = protectedRoute(async (auth, req) => {
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

    // Extract ID from URL pathname
    const id = req.nextUrl.pathname.split('/').pop();

    const body = await req.json();
    const { status, notes } = body;

    let updateData: any = {};

    if (status) {
        // Validate status
        const validStatuses = ['new', 'contacted', 'trial_started', 'trial_active', 'quote_sent', 'negotiating', 'converted', 'not_interested', 'unresponsive'];
        if (!validStatuses.includes(status)) {
            return apiError("Invalid status", 400, "INVALID_STATUS");
        }
        updateData.status = status;
    }

    if (notes !== undefined) {
        updateData.notes = notes;
    }

    updateData.last_contacted_at = new Date().toISOString();
    updateData.updated_at = new Date().toISOString();

    const { data: lead, error } = await supabase
        .from("onboarding_leads")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error || !lead) {
        return apiError("Failed to update lead", 500, "UPDATE_FAILED");
    }

    return apiSuccess({ data: lead });
}, { requiredRole: 'admin' });
