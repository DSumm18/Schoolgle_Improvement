/**
 * Incidents API
 *
 * GET  /api/incidents — List incidents with optional filters + summary stats
 * POST /api/incidents — Report a new incident (auto-detects RIDDOR, auto-links risk)
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { createRiskFromIncident } from "@/lib/risk-integration";
import { detectRIDDOR, generateF2508FormData } from "@/lib/riddor-engine";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const params = request.nextUrl.searchParams;

  const status = params.get("status");
  const incidentType = params.get("type");
  const severity = params.get("severity");
  const isRiddor = params.get("riddor");
  const limit = parseInt(params.get("limit") || "50");
  const includeStats = params.get("stats") !== "false";

  let query = supabase
    .from("incident_reports")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("incident_date", { ascending: false })
    .limit(limit);

  if (status) query = query.eq("status", status);
  if (incidentType) query = query.eq("incident_type", incidentType);
  if (severity) query = query.eq("severity", severity);
  if (isRiddor === "true") query = query.eq("is_riddor_reportable", true);

  const { data: incidents, error, count } = await query;

  if (error) {
    return apiError(`Failed to fetch incidents: ${error.message}`, 500);
  }

  let stats = null;
  if (includeStats) {
    const all = incidents || [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const thisYear = all.filter(
      (i) => new Date(i.incident_date).getFullYear() === now.getFullYear(),
    );
    const last30 = all.filter(
      (i) => new Date(i.incident_date) >= thirtyDaysAgo,
    );

    stats = {
      total: all.length,
      open: all.filter(
        (i) => i.status === "open" || i.status === "investigating",
      ).length,
      closed: all.filter(
        (i) => i.status === "closed" || i.status === "closed_no_action",
      ).length,
      awaiting_riddor: all.filter((i) => i.status === "awaiting_riddor").length,
      riddor_reportable: all.filter((i) => i.is_riddor_reportable).length,
      by_severity: {
        critical: all.filter((i) => i.severity === "critical").length,
        major: all.filter((i) => i.severity === "major").length,
        moderate: all.filter((i) => i.severity === "moderate").length,
        minor: all.filter((i) => i.severity === "minor").length,
      },
      by_type: {
        accident: all.filter((i) => i.incident_type === "accident").length,
        near_miss: all.filter((i) => i.incident_type === "near_miss").length,
        dangerous_occurrence: all.filter(
          (i) => i.incident_type === "dangerous_occurrence",
        ).length,
        violence: all.filter((i) => i.incident_type === "violence").length,
        ill_health: all.filter((i) => i.incident_type === "ill_health").length,
        fire: all.filter((i) => i.incident_type === "fire").length,
        security: all.filter((i) => i.incident_type === "security").length,
        environmental: all.filter((i) => i.incident_type === "environmental")
          .length,
        other: all.filter((i) => i.incident_type === "other").length,
      },
      last_30_days: last30.length,
      this_year: thisYear.length,
    };
  }

  return apiSuccess({ incidents: incidents || [], total: count || 0, stats });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  // Validate required fields
  if (
    !body.incident_type ||
    !body.severity ||
    !body.incident_date ||
    !body.location ||
    !body.title ||
    !body.description
  ) {
    return apiError(
      "incident_type, severity, incident_date, location, title, and description are required",
      400,
    );
  }

  // Run RIDDOR auto-detection
  const detection = detectRIDDOR(body);

  // Use auto-detected values unless user explicitly set them
  const isRiddor =
    body.is_riddor_reportable === true || detection.is_reportable;
  const riddorCategory = body.riddor_category || detection.category;

  // Generate F2508 pre-fill if reportable
  let riddorFormData = {};
  if (isRiddor) {
    // Get school data for F2508
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();

    riddorFormData = generateF2508FormData(body, detection, {
      name: org?.name || "",
      address: "", // Will be populated from school profile
      phone: "",
      email: auth.email || "",
      headteacher_name: "",
    });
  }

  const { data: incident, error } = await supabase
    .from("incident_reports")
    .insert({
      organization_id: organizationId,
      incident_type: body.incident_type,
      severity: body.severity,
      incident_date: body.incident_date,
      incident_time: body.incident_time || null,
      location: body.location,
      location_detail: body.location_detail || null,
      injured_person_name: body.injured_person_name || null,
      injured_person_type: body.injured_person_type || null,
      injured_person_role: body.injured_person_role || null,
      injured_person_year_group: body.injured_person_year_group || null,
      injured_person_dob: body.injured_person_dob || null,
      injured_person_address: body.injured_person_address || null,
      injured_person_phone: body.injured_person_phone || null,
      title: body.title,
      description: body.description,
      immediate_actions: body.immediate_actions || null,
      first_aid_given: body.first_aid_given || false,
      first_aid_details: body.first_aid_details || null,
      first_aider_name: body.first_aider_name || null,
      hospital_attendance: body.hospital_attendance || false,
      hospital_details: body.hospital_details || null,
      hospital_admission_type: body.hospital_admission_type || null,
      hospital_name: body.hospital_name || null,
      hospital_admission_date: body.hospital_admission_date || null,
      witnesses: body.witnesses || [],
      // Injury detail
      injury_type: body.injury_type || null,
      injury_body_part: body.injury_body_part || null,
      injury_is_fracture_excluded: body.injury_is_fracture_excluded || false,
      days_off_work: body.days_off_work || null,
      dangerous_occurrence_type: body.dangerous_occurrence_type || null,
      occupational_disease_type: body.occupational_disease_type || null,
      medical_diagnosis_date: body.medical_diagnosis_date || null,
      is_work_related: body.is_work_related || false,
      // RIDDOR auto-detection results
      is_riddor_reportable: isRiddor,
      riddor_auto_detected: detection.is_reportable,
      riddor_detection_reason: detection.reason,
      riddor_category: riddorCategory,
      riddor_deadline: isRiddor
        ? detection.deadline || body.riddor_deadline || null
        : null,
      riddor_form_data: isRiddor ? riddorFormData : {},
      // Other
      investigation_required: body.investigation_required || false,
      investigation_lead: body.investigation_lead || null,
      evidence_photos: body.evidence_photos || [],
      evidence_documents: body.evidence_documents || [],
      linked_helpdesk_ticket_id: body.linked_helpdesk_ticket_id || null,
      linked_asset_id: body.linked_asset_id || null,
      status: isRiddor ? "awaiting_riddor" : "open",
      reported_by_id: userId,
      reported_by_name: body.reported_by_name || auth.email || "Unknown",
    })
    .select()
    .single();

  if (error) {
    return apiError(`Failed to create incident: ${error.message}`, 500);
  }

  // Auto-create risk for major/critical incidents
  let risk_result = null;
  if (body.severity === "major" || body.severity === "critical") {
    try {
      risk_result = await createRiskFromIncident({
        organization_id: organizationId,
        title: `Incident: ${body.title}`,
        description: body.description,
        severity: body.severity,
        source_module: "incidents",
        source_record_id: incident.id,
        reported_by_id: userId,
        reported_by_name: body.reported_by_name || auth.email,
        risk_categories:
          body.incident_type === "fire" ? ["h_and_s"] : ["operational"],
        has_safeguarding_impact: body.injured_person_type === "pupil",
      });

      if (risk_result?.risk_id) {
        await supabase
          .from("incident_reports")
          .update({ linked_risk_id: risk_result.risk_id })
          .eq("id", incident.id);
      }
    } catch {
      // Risk creation failure should not block incident creation
    }
  }

  // Auto-suggest SOPs based on incident characteristics
  const suggested_sops: string[] = [];
  if (body.incident_type === "near_miss") {
    suggested_sops.push("near_miss_recording");
  } else {
    suggested_sops.push("incident_response");
  }
  if (isRiddor) {
    suggested_sops.push("riddor_assessment");
  }
  if (
    body.investigation_required ||
    body.severity === "major" ||
    body.severity === "critical"
  ) {
    suggested_sops.push("incident_investigation");
  }
  if (body.incident_type === "violence") {
    suggested_sops.push("violence_response");
  }
  if (body.incident_type === "dangerous_occurrence") {
    suggested_sops.push("dangerous_occurrence");
  }

  // Auto-start primary SOP (first in the list) and link to incident
  let sop_run_id = null;
  try {
    const primarySop = suggested_sops[0];
    if (primarySop) {
      const { data: sopTemplate } = await supabase
        .from("sop_templates")
        .select("steps")
        .eq("template_id", primarySop)
        .single();

      if (sopTemplate) {
        const stepsData = (sopTemplate.steps as any[]).map((step: any) => ({
          ...step,
          status: "pending",
          completed_at: null,
          completed_by: null,
          notes: null,
          evidence: [],
        }));

        const { data: sopRun } = await supabase
          .from("sop_runs")
          .insert({
            organization_id: organizationId,
            template_id: primarySop,
            context: `Incident: ${body.title}`,
            status: "in_progress",
            steps_data: stepsData,
            started_by: userId,
            started_at: new Date().toISOString(),
            linked_incident_id: incident.id,
            linked_module: "incidents",
            linked_entity_id: incident.id,
          })
          .select("id")
          .single();

        if (sopRun) {
          sop_run_id = sopRun.id;
          // Link back to incident
          await supabase
            .from("incident_reports")
            .update({
              linked_sop_run_id: sopRun.id,
              linked_sop_template_id: primarySop,
            })
            .eq("id", incident.id);
        }
      }
    }
  } catch {
    // SOP auto-start failure should not block incident creation
  }

  return apiSuccess(
    {
      incident,
      riddor_detection: {
        is_reportable: detection.is_reportable,
        category: detection.category,
        reason: detection.reason,
        urgency: detection.urgency,
        deadline: detection.deadline,
        confidence: detection.confidence,
        guidance: detection.guidance,
      },
      risk_created: risk_result?.risk_id || null,
      sop_auto_started: sop_run_id,
      suggested_sops,
    },
    201,
  );
});
