import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { analysePupilAssessments } from "@/lib/pupil-assessment-analyser";

/**
 * POST /api/intelligence/pupil-assessments
 *
 * Receives PSEUDONYMISED pupil assessment data (already hashed client-side)
 * and stores it for analysis.
 *
 * CRITICAL: This endpoint NEVER receives real pupil names, DOBs, or UPNs.
 * All pupil identifiers are HMAC-SHA256 hashes created in the browser
 * using a school-specific salt that only the school holds.
 *
 * Body: {
 *   organization_id: string,
 *   source_system: string,      // 'arbor', 'sims', etc.
 *   academic_year_start: number, // e.g. 2025
 *   assessment_period: string,   // 'autumn', 'spring', 'summer'
 *   year_groups: number[],
 *   pupils: PseudonymisedPupil[] // Array of pseudonymised records
 *   auto_analyse: boolean        // If true, run analysis immediately
 * }
 */
export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    source_system,
    academic_year_start,
    assessment_period,
    year_groups,
    pupils,
    auto_analyse,
  } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !source_system || !academic_year_start || !assessment_period) {
    return apiError("Missing required fields", 400);
  }

  if (!pupils || !Array.isArray(pupils) || pupils.length === 0) {
    return apiError("No pupil data provided", 400);
  }

  // Verify all records have pupil_hash (proving pseudonymisation happened)
  const invalidRecords = pupils.filter(
    (p: { pupil_hash?: string }) => !p.pupil_hash || p.pupil_hash.length < 32,
  );
  if (invalidRecords.length > 0) {
    return apiError(
      `${invalidRecords.length} records missing valid pupil_hash. Data must be pseudonymised before upload.`,
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // 1. Create the import record
  const { data: importRecord, error: importError } = await supabase
    .from("school_assessment_imports")
    .insert({
      organization_id: orgId,
      file_name: `${source_system}_${assessment_period}_${academic_year_start}`,
      source_system,
      academic_year_start,
      assessment_period,
      year_groups_included: year_groups || [],
      total_pupils: new Set(
        pupils.map((p: { pupil_hash: string }) => p.pupil_hash),
      ).size,
      total_records: pupils.length,
      subjects_included: [
        ...new Set(pupils.map((p: { subject: string }) => p.subject)),
      ],
      status: "pseudonymised",
      pseudonymisation_method: "sha256_hmac",
      salt_hint: "School-generated, stored in browser localStorage",
    })
    .select()
    .single();

  if (importError) {
    console.error("[Pupil Assessments] Import creation error:", importError);
    return apiError("Failed to create import record", 500);
  }

  // 2. Insert pseudonymised pupil records in batches
  const BATCH_SIZE = 500;
  let insertedCount = 0;

  for (let i = 0; i < pupils.length; i += BATCH_SIZE) {
    const batch = pupils
      .slice(i, i + BATCH_SIZE)
      .map(
        (p: {
          pupil_hash: string;
          year_group: number;
          is_fsm: boolean | null;
          is_send: boolean | null;
          send_type: string | null;
          is_eal: boolean | null;
          is_pp: boolean | null;
          gender: string | null;
          subject: string;
          attainment_level: string | null;
          scaled_score: number | null;
          raw_score: number | null;
          teacher_assessment: string | null;
          progress_score: number | null;
          prior_attainment_band: string | null;
        }) => ({
          organization_id: orgId,
          import_id: importRecord.id,
          pupil_hash: p.pupil_hash,
          year_group: p.year_group,
          is_fsm: p.is_fsm,
          is_send: p.is_send,
          send_type: p.send_type,
          is_eal: p.is_eal,
          is_pp: p.is_pp,
          gender: p.gender,
          subject: p.subject,
          assessment_period,
          academic_year_start,
          attainment_level: p.attainment_level,
          scaled_score: p.scaled_score,
          raw_score: p.raw_score,
          teacher_assessment: p.teacher_assessment,
          progress_score: p.progress_score,
          prior_attainment_band: p.prior_attainment_band,
        }),
      );

    const { error: batchError } = await supabase
      .from("pupil_assessments_pseudo")
      .insert(batch);

    if (batchError) {
      console.error(
        `[Pupil Assessments] Batch insert error (batch ${i / BATCH_SIZE}):`,
        batchError,
      );
    } else {
      insertedCount += batch.length;
    }
  }

  // 3. Run analysis if requested
  let analysis = null;
  if (auto_analyse) {
    try {
      await supabase
        .from("school_assessment_imports")
        .update({ status: "analysing" })
        .eq("id", importRecord.id);

      analysis = await analysePupilAssessments(orgId, importRecord.id);
    } catch (analysisError) {
      console.error("[Pupil Assessments] Analysis error:", analysisError);
      await supabase
        .from("school_assessment_imports")
        .update({
          status: "error",
          error_message: `Analysis failed: ${analysisError instanceof Error ? analysisError.message : "Unknown error"}`,
        })
        .eq("id", importRecord.id);
    }
  }

  return apiSuccess({
    import: {
      id: importRecord.id,
      status: analysis ? "complete" : "pseudonymised",
      records_inserted: insertedCount,
      total_submitted: pupils.length,
    },
    analysis: analysis || null,
    privacy: {
      pseudonymisation: "HMAC-SHA256",
      pii_stored: false,
      salt_location: "Browser localStorage (school device only)",
      re_identification: "Only possible with school's local salt",
      gdpr_basis:
        "Article 25 (Data protection by design), Article 32 (Pseudonymisation as security measure)",
    },
  });
});

/**
 * GET /api/intelligence/pupil-assessments
 * Get import history and analysis results
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const importId = searchParams.get("importId");

  if (!organizationId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  if (importId) {
    // Get specific import with its insights
    const [importData, insights] = await Promise.all([
      supabase
        .from("school_assessment_imports")
        .select("*")
        .eq("id", importId)
        .eq("organization_id", organizationId)
        .single(),
      supabase
        .from("pupil_analysis_insights")
        .select("*")
        .eq("import_id", importId)
        .eq("organization_id", organizationId)
        .order("severity", { ascending: true }),
    ]);

    return apiSuccess({
      import: importData.data,
      insights: insights.data || [],
    });
  }

  // List all imports
  const { data, error } = await supabase
    .from("school_assessment_imports")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    return apiError("Failed to fetch imports", 500);
  }

  return apiSuccess({ imports: data || [] });
});
