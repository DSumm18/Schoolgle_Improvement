import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { apiSuccess, apiError } from "@/lib/api-utils";

/**
 * POST /api/admin/discounts/validate
 * Validate a discount code without authentication (for interest form)
 * or with auth (for admin use)
 */
export async function POST(req: NextRequest) {
    const supabase = createServiceRoleClient();

    const body = await req.json();
    const { code, plan = 'core', organizationId } = body;

    if (!code) {
        return apiError("Discount code is required", 400, "MISSING_CODE");
    }

    try {
        // Use the SQL function to validate
        const { data, error } = await supabase.rpc('validate_discount_code', {
            p_code: code,
            p_plan: plan,
            p_org_id: organizationId,
        });

        if (error) {
            console.error("[ValidateDiscount] Error:", error);
            return apiError("Failed to validate discount code", 500, "VALIDATION_FAILED");
        }

        if (!data || data.length === 0) {
            return apiError("Invalid discount code", 404, "INVALID_CODE");
        }

        const result = Array.isArray(data) ? data[0] : data;

        if (!result.valid) {
            return apiError(result.error_message || "Invalid discount code", 400, "INVALID_CODE");
        }

        return apiSuccess({
            valid: true,
            discount: {
                id: result.discount_id,
                type: result.discount_type,
                value: result.discount_value,
                percent: result.discount_percent,
            },
        });

    } catch (error: any) {
        console.error("[ValidateDiscount] Error:", error);
        return apiError("Failed to validate discount code", 500, "INTERNAL_ERROR");
    }
}

// For authenticated admin use
import { protectedRoute } from "@/lib/api-utils";

export const GET = protectedRoute(async (auth, req) => {
    const supabase = createServiceRoleClient();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const plan = searchParams.get('plan') || 'core';
    const orgId = searchParams.get('organizationId');

    if (!code) {
        return apiError("Discount code is required", 400, "MISSING_CODE");
    }

    const { data, error } = await supabase.rpc('validate_discount_code', {
        p_code: code,
        p_plan: plan,
        p_org_id: orgId,
    });

    if (error) {
        return apiError("Failed to validate", 500, "VALIDATION_FAILED");
    }

    const result = Array.isArray(data) ? data[0] : data;

    return apiSuccess({
        valid: result?.valid || false,
        discount: result?.valid ? {
            id: result.discount_id,
            type: result.discount_type,
            value: result.discount_value,
            percent: result.discount_percent,
        } : null,
        error: result?.error_message,
    });
}, { requiredRole: 'admin' });
