/**
 * Compliance Consent API Routes
 *
 * CRITICAL DATA SAFETY RULE:
 * This route MUST NOT store pupil_name, parent_guardian_name, or parent_guardian_email
 * in Supabase. Pupil identity is stored as pupil_hash (HMAC-SHA256 pseudonymised).
 * Guardian contact info must be resolved LIVE from Google Drive — never persisted.
 * See: /lib/pupil-pseudonymiser.ts and /api/pupils/route.ts for the pattern.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { createHmac } from "crypto";

/**
 * GET /api/compliance/consent
 * List consent records for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const consent_type = searchParams.get("consent_type");
  const academic_year = searchParams.get("academic_year");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("compliance_consent_records")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (consent_type) {
    query = query.eq("consent_type", consent_type);
  }
  if (academic_year) {
    query = query.eq("academic_year", academic_year);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching consent records:", error);
    return apiError("Failed to fetch consent records", 500);
  }

  return apiSuccess({ records: data || [] });
});

/**
 * POST /api/compliance/consent
 * Create a new consent record
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      pupil_id,
      consent_type,
      consent_given,
      consent_date,
      academic_year,
      expiry_date,
      notes,
      // PII fields accepted from client but NEVER persisted:
      // pupil_name, parent_guardian_name, parent_guardian_email
    } = body;

    if (!pupil_id || !consent_type) {
      return apiError("Missing required fields: pupil_id, consent_type", 400);
    }

    // Pseudonymise pupil_id → pupil_hash (SHA-256)
    const hashSalt = process.env.PUPIL_HASH_SALT;
    if (!hashSalt) {
      return apiError("Server configuration error: PUPIL_HASH_SALT is required", 500);
    }
    const pupil_hash = createHmac("sha256", hashSalt)
      .update(`${pupil_id}`.toLowerCase().trim())
      .digest("hex");

    const supabase = createServiceRoleClient();

    const { data: record, error } = await supabase
      .from("compliance_consent_records")
      .insert({
        organization_id: organizationId,
        pupil_hash,
        // NEVER stored: pupil_name, parent_guardian_name, parent_guardian_email
        consent_type,
        consent_given: consent_given ?? true,
        consent_date: consent_date || new Date().toISOString().split("T")[0],
        academic_year,
        expiry_date,
        withdrawn_date: null,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating consent record:", error);
      return apiError("Failed to create consent record", 500);
    }

    // Audit log — no PII in metadata
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "consent_record",
      entity_id: record.id,
      action: "created",
      actor_user_id: userId,
      metadata: {
        pupil_hash,
        consent_type,
        consent_given: consent_given ?? true,
      },
    });

    return apiSuccess({ record }, 201);
  },
  { requiredRole: "slt" },
);

/**
 * PUT /api/compliance/consent
 * Update a consent record (e.g., withdraw consent by setting withdrawn_date)
 */
export const PUT = protectedRoute(
  async (auth, request) => {
    const { userId } = auth;
    const body = await request.json();
    const { id, ...fields } = body;

    if (!id) {
      return apiError("Missing required field: id", 400);
    }

    const supabase = createServiceRoleClient();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // PII fields explicitly excluded: pupil_name, parent_guardian_name, parent_guardian_email
    const allowedFields = [
      "consent_type",
      "consent_given",
      "consent_date",
      "academic_year",
      "expiry_date",
      "withdrawn_date",
      "notes",
    ];

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        updateData[field] = fields[field];
      }
    }

    const { data, error } = await supabase
      .from("compliance_consent_records")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating consent record:", error);
      return apiError("Failed to update consent record", 500);
    }

    // Audit log
    const action = fields.withdrawn_date ? "withdrawn" : "updated";
    await supabase.from("compliance_audit_log").insert({
      organization_id: data.organization_id,
      entity_type: "consent_record",
      entity_id: id,
      action,
      actor_user_id: userId,
      metadata: updateData,
    });

    return apiSuccess({ record: data });
  },
  { requiredRole: "slt" },
);
