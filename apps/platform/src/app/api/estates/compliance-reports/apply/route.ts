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
import { createServiceRecord } from "@/lib/estates-compliance/database/service-records";

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

  // 2. Create a service_record + junction rows in one coordinated write.
  // This replaces the old per-asset maintenance_history append and gives us
  // a proper first-class record of the visit with cost allocation.
  const results = {
    service_record_id: null as string | null,
    assets_serviced: 0,
    total_cost_allocated: 0,
    tickets_created: [] as Array<{ id: string; ticket_number: string; asset_id: string; title: string }>,
    compliance_checks_marked_complete: 0,
    errors: [] as Array<{ action: string; error: string }>,
  };

  const approvedActions = payload.proposed_actions.filter(
    (a) => a.approved !== false && a.type !== "no_match" && a.asset_id,
  );

  // Prefer invoice line items if any asset has line_item_cost set, otherwise
  // fall back to equal split across assets.
  const hasLineItems = approvedActions.some(
    (a) => typeof (a as { extracted?: { line_item_cost?: number } }).extracted?.line_item_cost === "number",
  );
  const allocationStrategy = hasLineItems ? "invoice_line_item" : "equal_split";

  if (approvedActions.length > 0) {
    try {
      const created = await createServiceRecord({
        organization_id: organizationId,
        service_date: payload.extracted_report.service_date || new Date().toISOString().split("T")[0],
        service_type: payload.extracted_report.service_type || "Contractor service",
        compliance_domain: payload.extracted_report.compliance_domain || null,
        // No contractor_id yet — the extractor returns a name but we'd need a
        // fuzzy match to estates_contractors to get the UUID. Leave null for now.
        contractor_id: null,
        engineer_name: payload.extracted_report.contractor_name || null,
        invoice_reference: payload.extracted_report.certificate_reference || null,
        invoice_evidence_id: evidence.id,
        certificate_reference: payload.extracted_report.certificate_reference || null,
        total_cost: payload.extracted_report.total_cost || null,
        notes: payload.extracted_report.overall_summary,
        source: "ai_extracted",
        allocation_strategy: allocationStrategy,
        created_by: userId,
        assets: approvedActions.map((action) => {
          const extracted = (action as { extracted?: { result?: string; findings?: string; line_item_cost?: number | null; remedial_cost_estimate?: number | null; remedial_actions?: string[] } }).extracted || {};
          return {
            asset_id: action.asset_id!,
            result: (extracted.result as "pass" | "fail" | "advisory" | "not_assessed") || "not_assessed",
            findings: extracted.findings || null,
            cost_allocated: typeof extracted.line_item_cost === "number" ? extracted.line_item_cost : undefined,
            allocation_method: typeof extracted.line_item_cost === "number" ? "invoice_line_item" : undefined,
            next_service_due: action.new_next_inspection_due || payload.extracted_report.next_service_due || null,
            remedial_cost_estimate: extracted.remedial_cost_estimate || null,
            remedial_actions: extracted.remedial_actions || [],
          };
        }),
      });

      results.service_record_id = created.record.id;
      results.assets_serviced = created.assets.length;
      results.total_cost_allocated = created.assets.reduce(
        (s, a) => s + (Number(a.cost_allocated) || 0),
        0,
      );
    } catch (err: unknown) {
      results.errors.push({
        action: "create service record",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Link evidence to each asset (secondary rows with parent_evidence_id
  // pointing back to the original upload)
  for (const action of approvedActions) {
    if (!action.asset_id) continue;
    await supabase.from("estates_evidence").insert({
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

    // Create ticket for failed assets
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
