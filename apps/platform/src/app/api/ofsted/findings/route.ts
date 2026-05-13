import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const FINDING_STATUSES = new Set([
  "identified",
  "acknowledged",
  "assigned",
  "in_progress",
  "completed",
  "verification_required",
  "verified",
  "recurring",
  "dismissed",
]);

const FINDING_SEVERITIES = new Set(["critical", "high", "medium", "low"]);

function isFindingsSchemaUnavailable(error: { code?: string } | null) {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const sourceType = searchParams.get("source_type");
  const actionLevel = searchParams.get("action_level");
  const unassignedOnly = searchParams.get("unassigned") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 250);

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("ofsted_findings")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    const statuses = status.split(",").filter((value) => FINDING_STATUSES.has(value));
    if (statuses.length > 0) query = query.in("status", statuses);
  }

  if (severity && FINDING_SEVERITIES.has(severity)) {
    query = query.eq("severity", severity);
  }

  if (sourceType) {
    query = query.eq("source_type", sourceType);
  }

  if (actionLevel) {
    query = query.eq("action_level", actionLevel);
  }

  if (unassignedOnly) {
    query = query.is("assigned_task_id", null);
  }

  const { data, error } = await query;

  if (error) {
    if (isFindingsSchemaUnavailable(error)) {
      return apiSuccess({
        findings: [],
        total: 0,
        setup_required: true,
        message:
          "Ofsted findings migration has not been applied yet; returning an empty findings list.",
      });
    }

    console.error("[Ofsted Findings] Fetch failed:", error);
    return apiError("Failed to fetch Ofsted findings", 500);
  }

  return apiSuccess({
    findings: data || [],
    total: data?.length || 0,
  });
});

export const POST = protectedRoute(
  async (auth, request: NextRequest) => {
    const body = await request.json();
    const findings = Array.isArray(body.findings)
      ? body.findings
      : body.finding
        ? [body.finding]
        : [];

    if (findings.length === 0) {
      return apiError("Missing findings payload", 400);
    }

    const supabase = createServiceRoleClient();
    const now = new Date().toISOString();

    const rows = findings.map((finding: any) => ({
      organization_id: auth.organizationId,
      source_key: finding.source_key,
      source_type: finding.source_type,
      source_scan_id: finding.source_scan_id || null,
      source_record_id: finding.source_record_id || null,
      source_url: finding.source_url || finding.evidence_url || null,
      framework_type: finding.framework_type || "ofsted",
      category_id: finding.category_id || null,
      subcategory_id: finding.subcategory_id || null,
      rule_key: finding.rule_key,
      rule_version: finding.rule_version,
      rule_source: finding.rule_source || [],
      title: finding.title,
      summary: finding.summary || null,
      finding_type: finding.finding_type,
      severity: finding.severity,
      action_level: finding.action_level,
      status: finding.status || "identified",
      score: finding.score ?? null,
      confidence: finding.confidence ?? null,
      evidence_url: finding.evidence_url || null,
      evidence_quotes: finding.evidence_quotes || [],
      gaps: finding.gaps || [],
      recommendations: finding.recommendations || [],
      red_flags: finding.red_flags || [],
      checklist: finding.checklist || [],
      recommended_task_title: finding.recommended_task_title || null,
      recommended_task_description:
        finding.recommended_task_description || null,
      metadata: finding.metadata || {},
      updated_at: now,
    }));

    const invalid = rows.find(
      (row: {
        source_key?: string;
        source_type?: string;
        rule_key?: string;
        rule_version?: string;
        title?: string;
        finding_type?: string;
        severity?: string;
        action_level?: string;
      }) =>
        !row.source_key ||
        !row.source_type ||
        !row.rule_key ||
        !row.rule_version ||
        !row.title ||
        !row.finding_type ||
        !row.severity ||
        !row.action_level,
    );

    if (invalid) {
      return apiError("Each finding requires source, rule and classification fields", 400);
    }

    const { data, error } = await supabase
      .from("ofsted_findings")
      .upsert(rows, {
        onConflict: "organization_id,source_key",
      })
      .select();

    if (error) {
      console.error("[Ofsted Findings] Upsert failed:", error);
      return apiError("Failed to save Ofsted findings", 500);
    }

    if (data && data.length > 0) {
      await supabase.from("ofsted_finding_events").insert(
        data.map((finding: any) => ({
          organization_id: auth.organizationId,
          finding_id: finding.id,
          event_type: "scan_upserted",
          actor_user_id: auth.userId,
          new_status: finding.status,
          metadata: {
            source_type: finding.source_type,
            source_key: finding.source_key,
          },
        })),
      );
    }

    return apiSuccess({ findings: data || [], total: data?.length || 0 }, 201);
  },
  { requiredRole: "teacher" },
);
