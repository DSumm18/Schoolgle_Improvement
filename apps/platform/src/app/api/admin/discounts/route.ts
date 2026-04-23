import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

/**
 * GET /api/admin/discounts - List all discount codes
 */
export const GET = protectedRoute(async (auth, req) => {
    const supabase = createServiceRoleClient();

    // Check super admin
    const { data: superAdminCheck } = await supabase
        .from("super_admins")
        .select("access_level")
        .eq("user_id", auth.userId)
        .maybeSingle();

    if (!superAdminCheck) {
        return apiError("Access denied", 403, "FORBIDDEN");
    }

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';

    let query = supabase
        .from("discount_codes")
        .select("*")
        .order("created_at", { ascending: false });

    if (!includeArchived) {
        query = query.eq("archived", false);
    }

    const { data, error } = await query;

    if (error) {
        return apiError("Failed to fetch discount codes", 500, "FETCH_FAILED");
    }

    // Get usage stats for each code
    const codesWithStats = await Promise.all(
        (data || []).map(async (code) => {
            const { data: usageData } = await supabase
                .from("discount_usage")
                .select("id")
                .eq("discount_id", code.id);

            // Get unique organizations
            const { data: orgUsage } = await supabase
                .from("discount_usage")
                .select("organization_id")
                .eq("discount_id", code.id);

            const uniqueOrgs = new Set(orgUsage?.map(u => u.organization_id) || []);

            return {
                ...code,
                total_uses: usageData?.length || 0,
                unique_organizations: uniqueOrgs.size,
                is_expired: code.valid_until ? new Date(code.valid_until) < new Date() : false,
            };
        })
    );

    return apiSuccess({ data: codesWithStats });
}, { requiredRole: 'admin' });

/**
 * POST /api/admin/discounts - Create new discount code
 */
export const POST = protectedRoute(async (auth, req) => {
    const supabase = createServiceRoleClient();

    // Check super admin
    const { data: superAdminCheck } = await supabase
        .from("super_admins")
        .select("access_level")
        .eq("user_id", auth.userId)
        .maybeSingle();

    if (!superAdminCheck) {
        return apiError("Access denied", 403, "FORBIDDEN");
    }

    const body = await req.json();
    const {
        code,
        description,
        discountType = 'percent',
        discountValue = 0,
        maxDiscountAmount,
        appliesTo = ['core', 'professional', 'enterprise'],
        minPlanValue,
        maxUses,
        maxUsesPerUser = 1,
        validFrom,
        validUntil,
    } = body;

    // Validate
    if (!code || code.trim().length === 0) {
        return apiError("Code is required", 400, "MISSING_CODE");
    }

    if (discountType === 'percent' && (discountValue < 0 || discountValue > 100)) {
        return apiError("Percentage discount must be between 0 and 100", 400, "INVALID_PERCENT");
    }

    // Check if code already exists
    const { data: existing } = await supabase
        .from("discount_codes")
        .select("id")
        .ilike("code", code.trim())
        .maybeSingle();

    if (existing) {
        return apiError("Discount code already exists", 400, "CODE_EXISTS");
    }

    const { data, error } = await supabase
        .from("discount_codes")
        .insert({
            code: code.trim().toUpperCase(),
            description,
            discount_type: discountType,
            discount_value: discountValue,
            max_discount_amount: maxDiscountAmount,
            applies_to: appliesTo,
            min_plan_value: minPlanValue,
            max_uses: maxUses,
            max_uses_per_user: maxUsesPerUser,
            valid_from: validFrom || new Date().toISOString(),
            valid_until: validUntil,
            created_by: auth.email,
        })
        .select()
        .single();

    if (error) {
        return apiError("Failed to create discount code", 500, "CREATE_FAILED");
    }

    return apiSuccess({ data });
}, { requiredRole: 'admin' });
