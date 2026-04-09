import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  GovernancePolicyReview,
  GovernancePolicyReviewForm,
  PolicyCategory,
  PolicyReviewStatus,
} from "@/lib/governance";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/governance/policies
 * Get policy review records for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const reviewStatus = searchParams.get(
    "reviewStatus",
  ) as PolicyReviewStatus | null;
  const policyCategory = searchParams.get(
    "policyCategory",
  ) as PolicyCategory | null;
  const includeOverdue = searchParams.get("includeOverdue") === "true";

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("governance_policy_reviews")
    .select(
      `
            *,
            policy_owner:governors (
                id,
                full_name,
                email
            )
        `,
    )
    .eq("organization_id", organizationId)
    .order("next_review_date", { ascending: true });

  if (reviewStatus) {
    query = query.eq("review_status", reviewStatus);
  }
  if (policyCategory) {
    query = query.eq("policy_category", policyCategory);
  }

  const { data: policies, error } = await query;

  if (error) {
    console.error("Error fetching policy reviews:", error);
    return apiError("Failed to fetch policy reviews", 500);
  }

  const today = new Date();
  const enrichedPolicies =
    policies?.map((policy: any) => {
      const nextReview = new Date(policy.next_review_date);
      const daysUntil = Math.ceil(
        (nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const daysOverdue = Math.floor(
        (today.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24),
      );

      return {
        ...policy,
        policy_owner_name: policy.policy_owner?.full_name || null,
        days_until_review: daysUntil,
        days_overdue: daysOverdue > 0 ? daysOverdue : 0,
        is_overdue: nextReview < today,
      };
    }) || [];

  // Filter by overdue if requested
  const filteredPolicies = includeOverdue
    ? enrichedPolicies.filter((p: any) => p.is_overdue)
    : enrichedPolicies;

  const current = filteredPolicies.filter(
    (p: any) => p.review_status === "current",
  ).length;
  const needReview = filteredPolicies.filter(
    (p: any) => p.review_status === "under_review" || p.is_overdue,
  ).length;
  const overdue = filteredPolicies.filter((p: any) => p.is_overdue).length;

  return apiSuccess({
    policies: filteredPolicies,
    total: filteredPolicies.length,
    current,
    need_review: needReview,
    overdue,
  });
});

/**
 * POST /api/governance/policies
 * Create a new policy review record
 */
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const {
    organizationId,
    policy_name,
    policy_category,
    document_id,
    last_review_date,
    next_review_date,
    review_frequency_months,
    policy_owner_id,
    review_committee,
    is_statutory,
    statutory_reference,
  } = body as {
    organizationId: string;
    policy_name: string;
    policy_category: PolicyCategory;
    document_id?: string;
    last_review_date?: string;
    next_review_date: string;
    review_frequency_months?: number;
    policy_owner_id?: string;
    review_committee?: string;
    is_statutory?: boolean;
    statutory_reference?: string;
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !policy_name || !policy_category || !next_review_date) {
    return apiError(
      "Missing required fields: organizationId, policy_name, policy_category, next_review_date",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const { data: policy, error } = await supabase
    .from("governance_policy_reviews")
    .insert({
      id: uuidv4(),
      organization_id: orgId,
      policy_name,
      policy_category,
      document_id: document_id || null,
      last_review_date: last_review_date || null,
      next_review_date,
      review_frequency_months: review_frequency_months || 36,
      policy_owner_id: policy_owner_id || null,
      review_committee: review_committee || null,
      review_status: "current",
      is_statutory: is_statutory || false,
      statutory_reference: statutory_reference || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating policy review:", error);
    return apiError("Failed to create policy review", 500);
  }

  return apiSuccess({ policy }, 201);
});

/**
 * PATCH /api/governance/policies
 * Bulk update policy reviews
 */
export const PATCH = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const { organizationId, updates } = body as {
    organizationId: string;
    updates: Array<{
      id: string;
      changes: Partial<GovernancePolicyReviewForm>;
    }>;
  };

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !updates || !Array.isArray(updates)) {
    return apiError(
      "Missing required fields: organizationId, updates (array)",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const results = await Promise.all(
    updates.map(async ({ id, changes }) => {
      // Auto-update review status if next_review_date is being changed
      let updateData: any = { ...changes };
      if (changes.next_review_date) {
        const today = new Date();
        const nextReview = new Date(changes.next_review_date);
        updateData.review_status = nextReview < today ? "outdated" : "current";
      }

      const { data, error } = await supabase
        .from("governance_policy_reviews")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", orgId)
        .select()
        .single();

      return { policy: data, error };
    }),
  );

  const successCount = results.filter((r) => !r.error).length;
  const errors = results.filter((r) => r.error).map((r) => r.error);

  return apiSuccess({
    updated: successCount,
    failed: results.length - successCount,
    errors: errors.length > 0 ? errors : undefined,
  });
});

/**
 * DELETE /api/governance/policies
 * Delete policy review records
 */
export const DELETE = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const ids = searchParams.get("ids")?.split(",");

  if (!organizationId || !ids || ids.length === 0) {
    return apiError("Missing required parameters: organizationId, ids", 400);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("governance_policy_reviews")
    .delete()
    .in("id", ids)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error deleting policy reviews:", error);
    return apiError("Failed to delete policy reviews", 500);
  }

  return apiSuccess({ success: true, deleted: ids.length });
});
