import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ComplianceDashboardStats } from "@/lib/compliance/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/dashboard
 * Return dashboard statistics for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split("T")[0];
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in30Str = in30Days.toISOString().split("T")[0];

    // Policies
    const { data: items } = await supabase
      .from("compliance_items")
      .select("id, type, status")
      .eq("organization_id", organizationId)
      .neq("status", "archived");

    const policies = items?.filter((i) => i.type === "policy") || [];
    const totalPolicies = policies.length;
    const publishedPolicies = policies.filter(
      (p) => p.status === "published",
    ).length;

    // Pending approvals
    const { count: pendingApprovals } = await supabase
      .from("compliance_approvals")
      .select("id", { count: "exact", head: true })
      .in(
        "compliance_item_id",
        (items || []).map((i) => i.id),
      )
      .eq("decision", "pending");

    // Review schedules
    const { data: schedules } = await supabase
      .from("compliance_review_schedule")
      .select("compliance_item_id, next_review_date")
      .in(
        "compliance_item_id",
        policies.map((p) => p.id),
      );

    const overdueReviews =
      schedules?.filter((s) => s.next_review_date && s.next_review_date < today)
        .length || 0;
    const upcomingReviews =
      schedules?.filter(
        (s) =>
          s.next_review_date &&
          s.next_review_date >= today &&
          s.next_review_date <= in30Str,
      ).length || 0;

    // Training
    const { data: completions } = await supabase
      .from("compliance_training_completions")
      .select("expires_at")
      .eq("organization_id", organizationId);

    const totalCompletions = completions?.length || 0;
    const expiredTraining =
      completions?.filter((c) => c.expires_at && c.expires_at < today).length ||
      0;
    const trainingComplianceRate =
      totalCompletions > 0
        ? Math.round(
            ((totalCompletions - expiredTraining) / totalCompletions) * 100,
          )
        : 100;

    // GDPR
    const openSars =
      items?.filter((i) => i.type === "sar" && i.status !== "archived")
        .length || 0;
    const openBreaches =
      items?.filter((i) => i.type === "breach" && i.status !== "archived")
        .length || 0;
    const dpiaItems =
      items?.filter((i) => i.type === "dpia" && i.status !== "archived") || [];

    let dpiasRequiringReview = 0;
    if (dpiaItems.length > 0) {
      const { data: dpias } = await supabase
        .from("compliance_dpia_records")
        .select("review_date")
        .in(
          "compliance_item_id",
          dpiaItems.map((d) => d.id),
        );
      dpiasRequiringReview =
        dpias?.filter((d) => d.review_date && d.review_date < today).length ||
        0;
    }

    // Recent activity
    const { data: recentActivity } = await supabase
      .from("compliance_audit_log")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Health scores (0-100)
    const policyHealth =
      totalPolicies > 0
        ? Math.round(((totalPolicies - overdueReviews) / totalPolicies) * 100)
        : 100;
    const trainingHealth = trainingComplianceRate;
    const gdprHealth =
      openBreaches === 0 && dpiasRequiringReview === 0
        ? 100
        : Math.max(0, 100 - openBreaches * 20 - dpiasRequiringReview * 10);
    const overallHealth = Math.round(
      (policyHealth + trainingHealth + gdprHealth) / 3,
    );

    const stats: ComplianceDashboardStats = {
      total_policies: totalPolicies,
      published_policies: publishedPolicies,
      overdue_reviews: overdueReviews,
      upcoming_reviews: upcomingReviews,
      pending_approvals: pendingApprovals || 0,
      training_compliance_rate: trainingComplianceRate,
      training_overdue: expiredTraining,
      open_sars: openSars,
      open_breaches: openBreaches,
      dpias_requiring_review: dpiasRequiringReview,
      recent_activity: recentActivity || [],
      health_scores: {
        policies: policyHealth,
        training: trainingHealth,
        gdpr: gdprHealth,
        overall: overallHealth,
      },
    };

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
