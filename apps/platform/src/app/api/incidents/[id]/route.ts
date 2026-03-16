/**
 * Single Incident API
 *
 * GET   /api/incidents/[id] — Get incident detail + RIDDOR detection
 * PATCH /api/incidents/[id] — Update incident, re-runs RIDDOR detection if injury fields change
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { detectRIDDOR, generateF2508FormData } from "@/lib/riddor-engine";

function getIncidentId(req: NextRequest): string {
  const segments = req.nextUrl.pathname.split("/");
  const idx = segments.indexOf("incidents");
  return segments[idx + 1];
}

export const GET = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();
  const incidentId = getIncidentId(req);

  const { data, error } = await supabase
    .from("incident_reports")
    .select("*")
    .eq("id", incidentId)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error || !data) {
    return apiError("Incident not found", 404);
  }

  // Re-run detection to provide live guidance
  const detection = detectRIDDOR(data);

  return apiSuccess({ incident: data, riddor_detection: detection });
});

export const PATCH = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const incidentId = getIncidentId(req);
    const body = await req.json();

    // Fetch full existing record for RIDDOR re-detection
    const { data: existing, error: fetchErr } = await supabase
      .from("incident_reports")
      .select("*")
      .eq("id", incidentId)
      .eq("organization_id", auth.organizationId)
      .single();

    if (fetchErr || !existing) {
      return apiError("Incident not found", 404);
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      "status",
      "severity",
      "incident_type",
      "location",
      "location_detail",
      "title",
      "description",
      "immediate_actions",
      "first_aid_given",
      "first_aid_details",
      "first_aider_name",
      "hospital_attendance",
      "hospital_details",
      "hospital_admission_type",
      "hospital_name",
      "hospital_admission_date",
      "witnesses",
      "injury_type",
      "injury_body_part",
      "injury_is_fracture_excluded",
      "days_off_work",
      "dangerous_occurrence_type",
      "occupational_disease_type",
      "medical_diagnosis_date",
      "is_work_related",
      "injured_person_dob",
      "injured_person_address",
      "injured_person_phone",
      "is_riddor_reportable",
      "riddor_category",
      "riddor_reference",
      "riddor_reported_date",
      "riddor_reported_by",
      "investigation_required",
      "investigation_lead",
      "investigation_notes",
      "root_cause",
      "contributing_factors",
      "evidence_photos",
      "evidence_documents",
      "corrective_actions",
      "closure_notes",
      "linked_risk_id",
      "linked_helpdesk_ticket_id",
      "linked_asset_id",
      "linked_workflow_id",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Re-run RIDDOR detection if injury-related fields changed
    const riddorTriggerFields = [
      "injury_type",
      "injury_body_part",
      "injury_is_fracture_excluded",
      "hospital_admission_type",
      "days_off_work",
      "dangerous_occurrence_type",
      "incident_type",
      "severity",
      "hospital_attendance",
      "injured_person_type",
      "occupational_disease_type",
      "is_work_related",
    ];

    const riddorFieldsChanged = riddorTriggerFields.some(
      (f) => body[f] !== undefined,
    );

    if (riddorFieldsChanged) {
      // Merge existing + updates for detection
      const merged = { ...existing, ...updateData };
      const detection = detectRIDDOR(merged);

      // Only auto-update RIDDOR fields if user hasn't explicitly set them
      if (body.is_riddor_reportable === undefined) {
        updateData.is_riddor_reportable = detection.is_reportable;
      }
      if (body.riddor_category === undefined && detection.category) {
        updateData.riddor_category = detection.category;
      }
      updateData.riddor_auto_detected = detection.is_reportable;
      updateData.riddor_detection_reason = detection.reason;

      if (detection.is_reportable && detection.deadline) {
        updateData.riddor_deadline = detection.deadline;
      }

      // Update status if newly detected as RIDDOR
      if (
        detection.is_reportable &&
        !existing.is_riddor_reportable &&
        existing.status === "open"
      ) {
        updateData.status = "awaiting_riddor";
      }

      // Regenerate F2508 form data
      if (detection.is_reportable) {
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", auth.organizationId)
          .single();

        updateData.riddor_form_data = generateF2508FormData(merged, detection, {
          name: org?.name || "",
          address: "",
          phone: "",
          email: auth.email || "",
          headteacher_name: "",
        });
      }
    }

    // Handle status transitions
    if (body.status === "closed" || body.status === "closed_no_action") {
      updateData.closed_by_id = auth.userId;
      updateData.closed_by_name = body.closed_by_name || auth.email;
      updateData.closed_at = new Date().toISOString();
    }

    if (body.reviewed === true) {
      updateData.reviewed_by_id = auth.userId;
      updateData.reviewed_by_name = body.reviewed_by_name || auth.email;
      updateData.reviewed_at = new Date().toISOString();
    }

    const { data: incident, error } = await supabase
      .from("incident_reports")
      .update(updateData)
      .eq("id", incidentId)
      .select()
      .single();

    if (error) {
      return apiError(`Failed to update incident: ${error.message}`, 500);
    }

    // Return updated detection
    const latestDetection = detectRIDDOR(incident);

    return apiSuccess({ incident, riddor_detection: latestDetection });
  },
  { requiredRole: "slt" },
);
