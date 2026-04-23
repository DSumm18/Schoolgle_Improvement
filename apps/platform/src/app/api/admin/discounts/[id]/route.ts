import { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";

/**
 * PATCH /api/admin/discounts/[id] - Update discount code
 */
export const PATCH = protectedRoute(async (auth, req) => {
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

    const id = req.nextUrl.pathname.split('/').slice(-2)[0];
    const body = await req.json();

    const { description, discountValue, maxUses, validUntil, active, archived } = body;

    let updateData: any = {};

    if (description !== undefined) updateData.description = description;
    if (discountValue !== undefined) updateData.discount_value = discountValue;
    if (maxUses !== undefined) updateData.max_uses = maxUses;
    if (validUntil !== undefined) updateData.valid_until = validUntil;
    if (active !== undefined) updateData.active = active;
    if (archived !== undefined) updateData.archived = archived;

    const { data, error } = await supabase
        .from("discount_codes")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return apiError("Failed to update discount code", 500, "UPDATE_FAILED");
    }

    return apiSuccess({ data });
}, { requiredRole: 'admin' });

/**
 * DELETE /api/admin/discounts/[id] - Delete (archive) discount code
 */
export const DELETE = protectedRoute(async (auth, req) => {
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

    const id = req.nextUrl.pathname.split('/').slice(-2)[0];

    // Soft delete by archiving
    const { data, error } = await supabase
        .from("discount_codes")
        .update({ archived: true, active: false })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return apiError("Failed to delete discount code", 500, "DELETE_FAILED");
    }

    return apiSuccess({ data });
}, { requiredRole: 'admin' });

/**
 * GET /api/admin/discounts/[id] - Get single discount code with usage
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

    const id = req.nextUrl.pathname.split('/').slice(-2)[0];

    const { data: discount, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !discount) {
        return apiError("Discount code not found", 404, "NOT_FOUND");
    }

    // Get usage details
    const { data: usage } = await supabase
        .from("discount_usage")
        .select(`
            *,
            organization:organizations(id, name),
            subscription:subscriptions(id, plan)
        `)
        .eq("discount_id", id)
        .order("applied_at", { ascending: false })
        .limit(50);

    return apiSuccess({
        data: {
            ...discount,
            is_expired: discount.valid_until ? new Date(discount.valid_until) < new Date() : false,
            usage: usage || [],
        },
    });
}, { requiredRole: 'admin' });
