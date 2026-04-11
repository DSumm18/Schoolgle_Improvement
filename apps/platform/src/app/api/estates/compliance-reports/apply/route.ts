/**
 * Compliance Report Apply
 *
 * POST /api/estates/compliance-reports/apply
 *
 * Applies an approved proposal from /analyse. Expects the same payload
 * returned by /analyse with optional user edits (e.g. override asset
 * matches, adjust costs, exclude tickets).
 *
 * Writes:
 *  - Creates estates_evidence row for the uploaded file (linked to check)
 *  - Appends maintenance_history entries on each matched asset
 *  - Updates last_inspection_date and next_inspection_due on each asset
 *  - Creates estates_helpdesk_tickets for each asset with result=fail
 *  - Marks the compliance check (statutory_completion) as completed
 *  - Stamps attachments: evidence linked to both check and each asset
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { appendMaintenanceHistory } from "@/lib/estates-compliance/database/assets";

interface ApplyPayload {
  organizationId?: string;
  check_id?: string | null;
  file_reference: {
    bucket: string;
    path: string;
    signed_url?: string;
    size_bytes: number;
    mime_type: string;
    original_name: string;
  };
  extracted_report: {
    contractor_name?: string | null;
    service_date?: string | null;
    service_type?: string | null;
    compliance_domain?: string | null;
    certificate_reference?: string | null;
    total_cost?: number | null;
    next_service_due?: string | null;
    overall_summary: string;
  };
  proposed_actions: Array<{
    type: "update_asset" | "create_ticket" | "update_and_create_ticket" | "no_match";
    asset_id?: string;
    asset_name?: string;
    maintenance_history_entry?: {
      date: string;
      action: string;
      performed_by: string;
      cost: number | null;
      notes: string;
    };
    new_next_inspection_due?: string | null;
    new_last_inspection_date?: string | null;
    should_create_ticket?: boolean;
    ticket_draft?: {
      title: string;
      description: string;
      priority: "critical" | "high" | "medium" | "low";
      asset_id: string;
    };
    /** User flag — if false, skip this action */
    approved?: boolean;
  }>;
}

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const { organizationId, userId } = auth;
  const payload = (await request.json()) as ApplyPayload;

  if (!payload.file_reference || !payload.proposed_actions) {
    return apiError("Invalid payload: missing file_reference or proposed_actions", 400);
  }

  const supabase = createServiceRoleClient();

  // 1. Create evidence row for the uploaded file
  const { data: evidence, error: evidenceError } = await supabase
    .from("estates_evidence")
    .insert({
      organization_id: organizationId,
      uploaded_by: userId,
      title: `${payload.extracted_report.service_type || "Contractor report"} — ${payload.extracted_report.contractor_name || "Unknown"}`,
      description: payload.extracted_report.overall_summary,
      evidence_type: "report",
      source_type: "upload",
      status: "verified",
      ai_verified: true,
      ai_confidence_score: 0.9,
      file_url: payload.file_reference.signed_url,
      file_name: payload.file_reference.original_name,
      file_type: payload.file_reference.mime_type,
      file_size_bytes: payload.file_reference.size_bytes,
      compliance_domain: payload.extracted_report.compliance_domain,
      document_number: payload.extracted_report.certificate_reference,
      issued_date: payload.extracted_report.service_date,
      issuing_body: payload.extracted_report.contractor_name,
      tags: ["contractor_report", "ai_extracted"],
    })
    .select()
    .single();

  if (evidenceError) {
    return apiError(`Failed to create evidence record: ${evidenceError.message}`, 500);
  }

  // 2. Process each approved action
  const results = {
    assets_updated: 0,
    maintenance_history_entries: 0,
    tickets_created: [] as Array<{ id: string; ticket_number: string; asset_id: string; title: string }>,
    compliance_checks_marked_complete: 0,
    errors: [] as Array<{ action: string; error: string }>,
  };

  const approvedActions = payload.proposed_actions.filter(
    (a) => a.approved !== false && a.type !== "no_match",
  );

  for (const action of approvedActions) {
    if (!action.asset_id) continue;

    // 2a. Append maintenance history
    if (action.maintenance_history_entry) {
      try {
        await appendMaintenanceHistory(action.asset_id, {
          ...action.maintenance_history_entry,
          evidence_ids: [evidence.id],
        });
        results.maintenance_history_entries++;
      } catch (err: unknown) {
        results.errors.push({
          action: `maintenance_history for ${action.asset_name}`,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // 2b. Update asset inspection dates
    const assetUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (action.new_last_inspection_date) {
      assetUpdates.last_inspection_date = action.new_last_inspection_date;
    }
    if (action.new_next_inspection_due) {
      assetUpdates.next_inspection_due = action.new_next_inspection_due;
    }

    if (Object.keys(assetUpdates).length > 1) {
      const { error: updateError } = await supabase
        .from("estates_assets")
        .update(assetUpdates)
        .eq("id", action.asset_id);

      if (updateError) {
        results.errors.push({
          action: `asset update ${action.asset_name}`,
          error: updateError.message,
        });
      } else {
        results.assets_updated++;
      }
    }

    // 2c. Link evidence to asset via a secondary evidence row (or update asset's)
    // For simplicity, we'll create a lightweight link record — the asset_id on
    // estates_evidence only supports one, so we create additional evidence rows
    // pointing to the same file for each linked asset.
    await supabase
      .from("estates_evidence")
      .insert({
        organization_id: organizationId,
        uploaded_by: userId,
        title: `${payload.extracted_report.service_type || "Service"} — ${action.asset_name}`,
        description: action.maintenance_history_entry?.notes || null,
        evidence_type: "report",
        source_type: "existing",
        status: "verified",
        parent_evidence_id: evidence.id,
        file_url: payload.file_reference.signed_url,
        file_name: payload.file_reference.original_name,
        file_type: payload.file_reference.mime_type,
        file_size_bytes: payload.file_reference.size_bytes,
        asset_id: action.asset_id,
        compliance_domain: payload.extracted_report.compliance_domain,
        tags: ["contractor_report", "asset_linked"],
      });

    // 2d. Create ticket for failed assets
    if (action.should_create_ticket && action.ticket_draft) {
      const { data: ticket, error: ticketError } = await supabase
        .from("estates_helpdesk_tickets")
        .insert({
          organization_id: organizationId,
          title: action.ticket_draft.title,
          description: action.ticket_draft.description,
          category: payload.extracted_report.compliance_domain || "general",
          priority: action.ticket_draft.priority,
          status: "open",
          module: "estates",
          raised_by: userId,
          asset_id: action.ticket_draft.asset_id,
          ticket_type: "compliance_scheduled",
          created_via: "auto_generated",
          safeguarding_flag: false,
        })
        .select("id, ticket_number")
        .single();

      if (ticketError) {
        results.errors.push({
          action: `ticket creation for ${action.asset_name}`,
          error: ticketError.message,
        });
      } else {
        results.tickets_created.push({
          id: ticket.id,
          ticket_number: ticket.ticket_number,
          asset_id: action.ticket_draft.asset_id,
          title: action.ticket_draft.title,
        });
      }
    }
  }

  // 3. Mark compliance check as completed if one was linked
  if (payload.check_id) {
    const { error: checkError } = await supabase
      .from("estates_statutory_completions")
      .update({
        status: "completed",
        completed_at: payload.extracted_report.service_date
          ? new Date(payload.extracted_report.service_date).toISOString()
          : new Date().toISOString(),
        completed_by: userId,
        completion_notes: payload.extracted_report.overall_summary,
        evidence_ids: [evidence.id],
        documents_received: true,
        rag_status: results.tickets_created.length > 0 ? "amber" : "green",
        findings: payload.proposed_actions.map((a) => ({
          asset_id: a.asset_id,
          result: a.type,
          notes: a.maintenance_history_entry?.notes,
        })),
        next_due_date: payload.extracted_report.next_service_due,
      })
      .eq("organization_id", organizationId)
      .eq("check_id", payload.check_id);

    if (checkError) {
      results.errors.push({
        action: "mark compliance check complete",
        error: checkError.message,
      });
    } else {
      results.compliance_checks_marked_complete = 1;
    }
  }

  return apiSuccess({
    success: true,
    message: `Processed ${approvedActions.length} actions from the report.`,
    evidence_id: evidence.id,
    ...results,
  });
});
