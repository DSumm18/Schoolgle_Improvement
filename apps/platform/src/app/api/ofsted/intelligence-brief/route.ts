import { NextRequest } from "next/server";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  buildOfstedInspectionIntelligenceBrief,
  type OfstedBriefCensusRow,
  type OfstedBriefKs2Row,
  type OfstedBriefSchoolRow,
} from "@/lib/ofsted-readiness/intelligence-brief";

type OrganizationRow = {
  id: string;
  name: string | null;
  urn: string | number | null;
};

export const GET = protectedRoute(async (auth, _request: NextRequest) => {
  if (!auth.organizationId) {
    return apiError("Organization context is required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: organizations, error: orgError } = await supabase
    .from("organizations")
    .select("id,name,urn")
    .or(`id.eq.${auth.organizationId},parent_organization_id.eq.${auth.organizationId}`);

  if (orgError) {
    console.error("[Ofsted Intelligence Brief] Organization scope failed:", orgError);
    return apiError("Failed to resolve organization scope", 500);
  }

  const organizationRows = (organizations || []) as OrganizationRow[];
  const organizationName =
    organizationRows.find((row) => row.id === auth.organizationId)?.name ||
    "This school";
  const scopedUrns = organizationRows
    .map((row) => normalizeUrn(row.urn))
    .filter((urn): urn is number => urn !== null);

  const [ks2, census, connections, findings, latestAnalysis] =
    await Promise.all([
      fetchKs2Rows(supabase, scopedUrns),
      fetchCensusRows(supabase, scopedUrns),
      fetchConnections(supabase, auth.organizationId),
      fetchFindings(supabase, auth.organizationId),
      fetchLatestAnalysis(supabase, auth.organizationId),
    ]);

  const schoolRows = organizationRows
    .map((organization): OfstedBriefSchoolRow | null => {
      const urn = normalizeUrn(organization.urn);
      if (urn === null) return null;
      return {
        urn,
        name: organization.name || `URN ${urn}`,
        ks2: ks2.filter((row) => Number((row as any).urn) === urn),
        census: census.filter((row) => Number((row as any).urn) === urn),
      };
    })
    .filter((row): row is OfstedBriefSchoolRow => row !== null);

  const brief = buildOfstedInspectionIntelligenceBrief({
    organizationName,
    schoolRows,
    dataConnections: connections,
    ofstedFindings: findings,
    latestAnalysis,
  });

  return apiSuccess({
    brief,
    scope: {
      organizationId: auth.organizationId,
      schoolCount: schoolRows.length,
      urns: scopedUrns,
    },
  });
});

function normalizeUrn(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  const urn = typeof value === "number" ? value : parseInt(value, 10);
  return Number.isFinite(urn) ? urn : null;
}

async function fetchKs2Rows(
  supabase: ReturnType<typeof createServiceRoleClient>,
  urns: number[],
): Promise<Array<OfstedBriefKs2Row & { urn: number }>> {
  if (urns.length === 0) return [];

  const { data, error } = await supabase
    .from("ks2_results")
    .select(
      "urn,academic_year_end,subject,breakdown_topic,breakdown,expected_standard_pct,higher_standard_pct,progress_measure_score",
    )
    .in("urn", urns)
    .in("subject", ["Reading, writing and maths", "Reading", "Writing", "Maths"])
    .in("breakdown_topic", ["All pupils", "Disadvantaged status"])
    .order("academic_year_end", { ascending: false })
    .limit(500);

  if (error) {
    console.error("[Ofsted Intelligence Brief] KS2 fetch failed:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    urn: Number(row.urn),
    academic_year_end: Number(row.academic_year_end),
    subject: row.subject,
    breakdown_topic: row.breakdown_topic,
    breakdown: row.breakdown,
    expected_standard_pct:
      row.expected_standard_pct === null
        ? null
        : Number(row.expected_standard_pct),
    higher_standard_pct:
      row.higher_standard_pct === null ? null : Number(row.higher_standard_pct),
    progress_measure_score:
      row.progress_measure_score === null
        ? null
        : Number(row.progress_measure_score),
  }));
}

async function fetchCensusRows(
  supabase: ReturnType<typeof createServiceRoleClient>,
  urns: number[],
): Promise<Array<OfstedBriefCensusRow & { urn: number }>> {
  if (urns.length === 0) return [];

  const { data, error } = await supabase
    .from("census")
    .select("urn,academic_year_end,number_on_roll,fsm_pct,eal_pct,sen_pct")
    .in("urn", urns)
    .order("academic_year_end", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[Ofsted Intelligence Brief] Census fetch failed:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    urn: Number(row.urn),
    academic_year_end: Number(row.academic_year_end),
    number_on_roll:
      row.number_on_roll === null ? null : Number(row.number_on_roll),
    fsm_pct: row.fsm_pct === null ? null : Number(row.fsm_pct),
    eal_pct: row.eal_pct === null ? null : Number(row.eal_pct),
    sen_pct: row.sen_pct === null ? null : Number(row.sen_pct),
  }));
}

async function fetchConnections(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("school_data_connections")
    .select("provider,folder_name")
    .eq("organization_id", organizationId)
    .eq("is_active", true);

  if (error) {
    console.error("[Ofsted Intelligence Brief] Connections fetch failed:", error);
    return [];
  }

  return data || [];
}

async function fetchFindings(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("ofsted_findings")
    .select("severity,status,title")
    .eq("organization_id", organizationId)
    .limit(100);

  if (error) {
    console.error("[Ofsted Intelligence Brief] Findings fetch failed:", error);
    return [];
  }

  return data || [];
}

async function fetchLatestAnalysis(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("school_intelligence_analyses")
    .select("title,executive_summary,confidence_score,data_sources_used")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[Ofsted Intelligence Brief] Analysis fetch failed:", error);
    return null;
  }

  return data || null;
}
