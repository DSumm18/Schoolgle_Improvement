import { NextRequest } from "next/server";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const RISK_SCORES: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

type ChronologyRow = {
  id: string;
  incident_id: string;
  organization_id: string;
  actor_user_id?: string | null;
  actor_name?: string | null;
  action: string;
  detail?: string | null;
  created_at: string;
  metadata?: Record<string, unknown>;
};

function normaliseRisk(value: unknown) {
  const risk = String(value || "medium").toLowerCase();
  return ["low", "medium", "high", "critical"].includes(risk)
    ? risk
    : "medium";
}

function displayName(email: string) {
  return email || "Signed-in user";
}

function dueAtFromLabel(label: string | undefined) {
  const now = new Date();
  if (!label || label === "Today") return now.toISOString();
  const days = parseInt(label, 10);
  if (Number.isFinite(days)) {
    now.setDate(now.getDate() + days);
    return now.toISOString();
  }
  return null;
}

async function nextReference(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
) {
  const year = new Date().getFullYear();
  const prefix = `INC-${year}-`;
  const { count } = await supabase
    .from("incidents")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .like("reference", `${prefix}%`);

  return `${prefix}${String((count || 0) + 1).padStart(4, "0")}`;
}

async function getChronology(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
  incidentIds: string[],
) {
  if (incidentIds.length === 0) return new Map<string, ChronologyRow[]>();

  const { data, error } = await supabase
    .from("incident_chronology")
    .select("*")
    .eq("organization_id", organizationId)
    .in("incident_id", incidentIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const grouped = new Map<string, ChronologyRow[]>();
  for (const entry of (data || []) as ChronologyRow[]) {
    const list = grouped.get(entry.incident_id) || [];
    list.push(entry);
    grouped.set(entry.incident_id, list);
  }
  return grouped;
}

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  let query = supabase
    .from("incidents")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);
  if (search) {
    query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%,type.ilike.%${search}%`);
  }

  const { data: incidents, error } = await query;
  if (error) return apiError(error.message, 500);

  const chronology = await getChronology(
    supabase,
    auth.organizationId,
    (incidents || []).map((incident) => incident.id),
  );

  return apiSuccess({
    incidents: (incidents || []).map((incident) => ({
      ...incident,
      chronology: chronology.get(incident.id) || [],
    })),
  });
});

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();
  const riskLevel = normaliseRisk(body.risk_level || body.risk || body.severity);
  const reference = await nextReference(supabase, auth.organizationId);
  const reporter = body.reported_by_name || displayName(auth.email);

  if (!body.title || !body.type) {
    return apiError("title and type are required", 400, "MISSING_FIELDS");
  }

  const { data: incident, error } = await supabase
    .from("incidents")
    .insert({
      organization_id: auth.organizationId,
      reference,
      title: body.title,
      summary: body.summary || null,
      type: body.type,
      status: riskLevel === "critical" ? "trust_visible" : "new",
      risk_level: riskLevel,
      risk_score: RISK_SCORES[riskLevel],
      owner_label: body.owner_label || body.owner || null,
      reported_by_user_id: auth.userId,
      reported_by_name: reporter,
      due_at: dueAtFromLabel(body.due_label || body.due),
      waiting_for: body.waiting_for || body.owner_label || body.owner || null,
      next_action: body.next_action || null,
      escalation_level: riskLevel === "critical" ? "trust_visible" : "school",
      recommended_document_slug: body.recommended_document_slug || null,
      recommended_document_name: body.recommended_document_name || null,
      metadata: body.metadata || {},
    })
    .select()
    .single();

  if (error || !incident) return apiError(error?.message || "Failed to create incident", 500);

  const chronologyRows = [
    {
      incident_id: incident.id,
      organization_id: auth.organizationId,
      actor_user_id: auth.userId,
      actor_name: reporter,
      action: "Incident logged",
      detail: body.summary || "Initial incident record created.",
    },
    {
      incident_id: incident.id,
      organization_id: auth.organizationId,
      actor_user_id: null,
      actor_name: "System",
      action: "Owner assigned",
      detail: body.owner_label || body.owner
        ? `Assigned to ${body.owner_label || body.owner}.`
        : "Owner to be confirmed.",
    },
  ];

  if (body.recommended_document_name) {
    chronologyRows.push({
      incident_id: incident.id,
      organization_id: auth.organizationId,
      actor_user_id: null,
      actor_name: "System",
      action: "Document recommended",
      detail: `${body.recommended_document_name} should be completed from Document Hub.`,
    });

    await supabase.from("incident_documents").insert({
      incident_id: incident.id,
      organization_id: auth.organizationId,
      template_slug: body.recommended_document_slug || null,
      template_name: body.recommended_document_name,
      status: "recommended",
    });
  }

  const { data: chronology, error: chronologyError } = await supabase
    .from("incident_chronology")
    .insert(chronologyRows)
    .select()
    .order("created_at", { ascending: false });

  if (chronologyError) return apiError(chronologyError.message, 500);

  return apiSuccess({ incident: { ...incident, chronology: chronology || [] } }, 201);
});
