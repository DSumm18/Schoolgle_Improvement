import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

/**
 * GET /api/admin/onboarding - List all onboarding leads
 * Super admin only
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
        .from("onboarding_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
        query = query.eq("status", status);
    }

    const { data: leads, error } = await query;

    if (error) {
        console.error("[Admin Onboarding] Fetch error:", error);
        return apiError("Failed to fetch leads", 500, "FETCH_FAILED");
    }

    // Get count
    let countQuery = supabase
        .from("onboarding_leads")
        .select("*", { count: 'exact', head: true });

    if (status && status !== 'all') {
        countQuery = countQuery.eq("status", status);
    }

    const { count } = await countQuery;

    return apiSuccess({
        data: leads || [],
        count,
        limit,
        offset,
    });
}, { requiredRole: 'admin' });
