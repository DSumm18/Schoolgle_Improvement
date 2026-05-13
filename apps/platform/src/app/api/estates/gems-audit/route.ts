import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

type AuditStatus = "in_place" | "partial" | "missing";

interface EvidenceMetric {
  key: string;
  label: string;
  table: string;
  count: number;
  available: boolean;
  error?: string;
}

interface AuditAssessment {
  name: string;
  score: number;
  status: AuditStatus;
  evidenceCount: number;
  evidence: EvidenceMetric[];
}

interface AuditCategory {
  categoryName: string;
  average: number;
  assessments: AuditAssessment[];
}

interface AuditSchool {
  id: string;
  name: string;
  urn?: string | null;
  organizationType?: string | null;
  overallScore: number;
  categories: AuditCategory[];
  logoUrl: string | null;
  gaps: string[];
}

interface OrganizationRow {
  id: string;
  name: string;
  urn?: string | null;
  organization_type?: string | null;
  parent_organization_id?: string | null;
}

interface CountFilter {
  column: string;
  value: string | number | boolean;
}

const DOMAIN_DEFINITIONS = [
  {
    categoryName: "Compliance Tracker",
    assessments: [
      {
        name: "Statutory compliance checks are recorded",
        metrics: [
          {
            key: "compliance_tasks",
            label: "Compliance tasks",
            table: "estates_compliance_tasks",
          },
          {
            key: "statutory_completions",
            label: "Statutory completions",
            table: "estates_statutory_completions",
          },
        ],
      },
      {
        name: "Evidence is attached to compliance checks",
        metrics: [
          {
            key: "estates_evidence",
            label: "Estates evidence files",
            table: "estates_evidence",
          },
        ],
      },
    ],
  },
  {
    categoryName: "Asset & Contractor Intelligence",
    assessments: [
      {
        name: "Asset register is populated",
        metrics: [
          {
            key: "assets",
            label: "Assets",
            table: "estates_assets",
          },
          {
            key: "asset_locations",
            label: "Asset locations",
            table: "asset_locations",
          },
        ],
      },
      {
        name: "Contractors and contracts are recorded",
        metrics: [
          {
            key: "contractors",
            label: "Contractors",
            table: "estates_contractors",
          },
          {
            key: "contracts",
            label: "Contracts",
            table: "estates_contracts",
          },
        ],
      },
    ],
  },
  {
    categoryName: "Condition, Maintenance & Service History",
    assessments: [
      {
        name: "Maintenance issues are tracked",
        metrics: [
          {
            key: "helpdesk",
            label: "Helpdesk tickets",
            table: "estates_helpdesk_tickets",
          },
          {
            key: "diary",
            label: "Daily diary entries",
            table: "estates_daily_diary",
          },
        ],
      },
      {
        name: "Service and inspection evidence exists",
        metrics: [
          {
            key: "evidence",
            label: "Evidence files",
            table: "estates_evidence",
          },
          {
            key: "audit_log",
            label: "Audit log entries",
            table: "estates_audit_log",
          },
        ],
      },
    ],
  },
  {
    categoryName: "Risk, Strategy & Governance",
    assessments: [
      {
        name: "Estate risks are visible",
        metrics: [
          {
            key: "risk_register",
            label: "Risk register entries",
            table: "risk_register",
          },
        ],
      },
      {
        name: "Estate strategy is in place",
        metrics: [
          {
            key: "estate_strategy",
            label: "Estate strategy plans",
            table: "strategic_plans",
            filters: [{ column: "plan_type", value: "estates" }],
          },
          {
            key: "strategy_items",
            label: "Strategy items",
            table: "strategic_plan_items",
          },
        ],
      },
    ],
  },
] satisfies Array<{
  categoryName: string;
  assessments: Array<{
    name: string;
    metrics: Array<{
      key: string;
      label: string;
      table: string;
      filters?: CountFilter[];
    }>;
  }>;
}>;

function scoreFromEvidence(total: number): {
  score: number;
  status: AuditStatus;
} {
  if (total >= 5) return { score: 100, status: "in_place" };
  if (total > 0) return { score: 50, status: "partial" };
  return { score: 0, status: "missing" };
}

async function countRows(
  supabase: ReturnType<typeof createServiceRoleClient>,
  table: string,
  organizationId: string,
  filters: CountFilter[] = [],
): Promise<EvidenceMetric> {
  try {
    let query = supabase
      .from(table)
      .select("*", { count: "planned", head: true })
      .eq("organization_id", organizationId);

    for (const filter of filters) {
      query = query.eq(filter.column, filter.value);
    }

    const { count, error } = await query;

    if (error) {
      return {
        key: table,
        label: table,
        table,
        count: 0,
        available: false,
        error: error.message,
      };
    }

    return {
      key: table,
      label: table,
      table,
      count: count ?? 0,
      available: true,
    };
  } catch (error) {
    return {
      key: table,
      label: table,
      table,
      count: 0,
      available: false,
      error: error instanceof Error ? error.message : "Unknown count error",
    };
  }
}

async function buildSchoolAudit(
  school: OrganizationRow,
  supabase: ReturnType<typeof createServiceRoleClient>,
): Promise<AuditSchool> {
  const gaps: string[] = [];

  const categories = await Promise.all(
    DOMAIN_DEFINITIONS.map(async (domain) => {
      const assessments = await Promise.all(
        domain.assessments.map(async (assessmentDefinition) => {
          const metrics = await Promise.all(
            assessmentDefinition.metrics.map(async (metric) => {
              const evidence = await countRows(
                supabase,
                metric.table,
                school.id,
                metric.filters,
              );

              return {
                ...evidence,
                key: metric.key,
                label: metric.label,
              };
            }),
          );
          const evidenceCount = metrics.reduce(
            (sum, metric) => sum + metric.count,
            0,
          );
          const { score, status } = scoreFromEvidence(evidenceCount);

          if (status === "missing") {
            gaps.push(`${assessmentDefinition.name} is missing.`);
          } else if (status === "partial") {
            gaps.push(
              `${assessmentDefinition.name} is only partially evidenced.`,
            );
          }

          return {
            name: assessmentDefinition.name,
            score,
            status,
            evidenceCount,
            evidence: metrics,
          };
        }),
      );

      const average =
        assessments.length > 0
          ? Math.round(
              assessments.reduce(
                (sum, assessment) => sum + assessment.score,
                0,
              ) / assessments.length,
            )
          : 0;

      return {
        categoryName: domain.categoryName,
        average,
        assessments,
      };
    }),
  );

  const overallScore =
    categories.length > 0
      ? Math.round(
          categories.reduce((sum, category) => sum + category.average, 0) /
            categories.length,
        )
      : 0;

  return {
    id: school.id,
    name: school.name,
    urn: school.urn ?? null,
    organizationType: school.organization_type ?? null,
    overallScore,
    categories,
    logoUrl: null,
    gaps,
  };
}

export const GET = protectedRoute(async (auth) => {
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("organizationId is required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name, urn, organization_type, parent_organization_id")
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationError || !organization) {
    return apiError("Organization not found", 404);
  }

  const { data: childOrganizations } = await supabase
    .from("organizations")
    .select("id, name, urn, organization_type, parent_organization_id")
    .eq("parent_organization_id", organizationId)
    .order("name");

  const schools =
    childOrganizations && childOrganizations.length > 0
      ? (childOrganizations as OrganizationRow[])
      : [organization as OrganizationRow];

  const auditSchools = await Promise.all(
    schools.map((school) => buildSchoolAudit(school, supabase)),
  );

  const averageScore =
    auditSchools.length > 0
      ? Math.round(
          auditSchools.reduce((sum, school) => sum + school.overallScore, 0) /
            auditSchools.length,
        )
      : 0;

  const gaps = auditSchools.reduce(
    (sum, school) => sum + school.gaps.length,
    0,
  );

  return apiSuccess({
    source: "live",
    organization: {
      id: organization.id,
      name: organization.name,
      organizationType: organization.organization_type ?? null,
    },
    schools: auditSchools,
    summary: {
      schoolCount: auditSchools.length,
      averageScore,
      gaps,
      domainCount: DOMAIN_DEFINITIONS.length,
    },
  });
});
