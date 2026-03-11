import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET /api/safeguarding/concerns/[id]
 * Get a single concern with its chronology and referrals
 */
export const GET = protectedRoute(
  async (auth, request, { params }: { params: Promise<{ id: string }> }) => {
    const { organizationId } = auth;
    const { id } = await params;
    const supabase = createServiceRoleClient();

    // Fetch concern
    const { data: concern, error: concernError } = await supabase
      .from("safeguarding_concerns")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (concernError || !concern) {
      return apiError("Concern not found", 404);
    }

    // Fetch chronology
    const { data: chronology } = await supabase
      .from("safeguarding_chronology")
      .select("*")
      .eq("concern_id", id)
      .eq("organization_id", organizationId)
      .order("entry_date", { ascending: true });

    // Fetch referrals
    const { data: referrals } = await supabase
      .from("safeguarding_referrals")
      .select("*")
      .eq("concern_id", id)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    return apiSuccess({
      concern,
      chronology: chronology || [],
      referrals: referrals || [],
    });
  },
  { requiredRole: "teacher" },
);

/**
 * PUT /api/safeguarding/concerns/[id]
 * Update a concern (triage, status change, etc.)
 * Auto-creates chronology entry on status change
 */
export const PUT = protectedRoute(
  async (auth, request, { params }: { params: Promise<{ id: string }> }) => {
    const { organizationId, userId } = auth;
    const { id } = await params;
    const body = await request.json();
    const supabase = createServiceRoleClient();

    // Fetch current state
    const { data: existing, error: fetchError } = await supabase
      .from("safeguarding_concerns")
      .select("*")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .single();

    if (fetchError || !existing) {
      return apiError("Concern not found", 404);
    }

    const {
      status,
      severity,
      triage_outcome,
      triage_notes,
      assigned_to,
      follow_up_date,
      category,
      description,
      body_map_data,
    } = body;

    const updates: Record<string, unknown> = {};

    if (status) updates.status = status;
    if (severity) updates.severity = severity;
    if (triage_outcome) updates.triage_outcome = triage_outcome;
    if (triage_notes !== undefined) updates.triage_notes = triage_notes;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to;
    if (follow_up_date !== undefined) updates.follow_up_date = follow_up_date;
    if (category) updates.category = category;
    if (description) updates.description = description;
    if (body_map_data !== undefined) updates.body_map_data = body_map_data;

    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length <= 1) {
      return apiError("No fields to update", 400);
    }

    const { data: updated, error: updateError } = await supabase
      .from("safeguarding_concerns")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", organizationId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating safeguarding concern:", updateError);
      return apiError("Failed to update concern", 500);
    }

    // Auto-create chronology entries for key changes
    const chronologyEntries: Array<{
      concern_id: string;
      organization_id: string;
      entry_type: string;
      description: string;
      recorded_by: string;
      entry_date: string;
      metadata: Record<string, unknown>;
    }> = [];

    if (status && status !== existing.status) {
      chronologyEntries.push({
        concern_id: id,
        organization_id: organizationId,
        entry_type: "status_change",
        description: `Status changed from "${existing.status}" to "${status}"`,
        recorded_by: userId,
        entry_date: new Date().toISOString(),
        metadata: { from: existing.status, to: status },
      });
    }

    if (severity && severity !== existing.severity) {
      chronologyEntries.push({
        concern_id: id,
        organization_id: organizationId,
        entry_type: "severity_change",
        description: `Severity changed from "${existing.severity}" to "${severity}"`,
        recorded_by: userId,
        entry_date: new Date().toISOString(),
        metadata: { from: existing.severity, to: severity },
      });
    }

    if (triage_outcome && triage_outcome !== existing.triage_outcome) {
      const outcomeLabels: Record<string, string> = {
        monitor: "Monitor",
        early_help: "Early Help",
        referral_cscs: "Referral to CSCS",
        referral_police: "Referral to Police",
        referral_lado: "Referral to LADO",
        referral_mash: "Referral to MASH",
        internal_support: "Internal Support",
        no_further_action: "No Further Action",
        escalate_dsl: "Escalate to DSL",
      };
      chronologyEntries.push({
        concern_id: id,
        organization_id: organizationId,
        entry_type: "triage",
        description: `Triaged: ${outcomeLabels[triage_outcome] || triage_outcome}${triage_notes ? ` - ${triage_notes}` : ""}`,
        recorded_by: userId,
        entry_date: new Date().toISOString(),
        metadata: { triage_outcome, triage_notes },
      });
    }

    if (chronologyEntries.length > 0) {
      await supabase.from("safeguarding_chronology").insert(chronologyEntries);
    }

    return apiSuccess({ concern: updated });
  },
  { requiredRole: "slt" },
);
