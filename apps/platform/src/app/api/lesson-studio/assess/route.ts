import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import {
  extractTextFromImage,
  gradeWork,
} from "@/lib/lesson-studio/grading-pipeline";
import type { LSLessonPlan, LSPupil } from "@/types/lesson-studio";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "application/pdf",
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/* ── GET: Fetch assessments for a lesson plan ──────────────────── */

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const lessonPlanId = req.nextUrl.searchParams.get("lessonPlanId");
  if (!lessonPlanId) return apiError("lessonPlanId required", 400);

  const { data, error } = await supabase
    .from("ls_assessments")
    .select(
      "*, work_submission:ls_work_submissions(*), pupil:ls_pupils(id, pupil_ref, display_name_encrypted, has_send_support, has_ehcp, send_primary_need, is_eal, eal_stage, is_pupil_premium, accessibility_needs)",
    )
    .eq("lesson_plan_id", lessonPlanId)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiSuccess({ assessments: data });
});

/* ── POST: Upload work submission and trigger AI grading ────────── */

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  // Parse FormData
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError("Invalid form data", 400);
  }

  const lessonPlanId = formData.get("lessonPlanId") as string | null;
  const pupilId = formData.get("pupilId") as string | null;
  const file = formData.get("file") as File | null;

  if (!lessonPlanId) return apiError("lessonPlanId required", 400);
  if (!pupilId) return apiError("pupilId required", 400);
  if (!file) return apiError("file required", 400);

  // Validate file
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError(
      `Unsupported file type: ${file.type}. Allowed: JPEG, PNG, HEIC, PDF`,
      400,
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return apiError("File exceeds 10 MB limit", 400);
  }

  // Determine file extension
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/heic": "heic",
    "application/pdf": "pdf",
  };
  const ext = extMap[file.type] ?? "bin";
  const timestamp = Date.now();
  const storagePath = `${orgId}/${lessonPlanId}/${pupilId}-${timestamp}.${ext}`;

  // Upload to Supabase Storage
  const fileBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("lesson-studio-work")
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return apiError(`Storage upload failed: ${uploadError.message}`, 500);
  }

  // Get public URL for OCR
  const { data: urlData } = supabase.storage
    .from("lesson-studio-work")
    .getPublicUrl(storagePath);
  const filePublicUrl = urlData.publicUrl;

  // Create ls_work_submissions record with status 'processing'
  const { data: submission, error: submissionError } = await supabase
    .from("ls_work_submissions")
    .insert({
      organization_id: orgId,
      lesson_plan_id: lessonPlanId,
      pupil_id: pupilId,
      storage_path: storagePath,
      file_type: file.type,
      file_size_bytes: file.size,
      status: "processing",
      uploaded_by: auth.userId,
    })
    .select()
    .single();

  if (submissionError || !submission) {
    return apiError(
      `Failed to create submission record: ${submissionError?.message}`,
      500,
    );
  }

  // Load lesson plan
  const { data: lessonPlan, error: planError } = await supabase
    .from("ls_lesson_plans")
    .select(
      "subject, learning_objective, success_criteria, differentiation_groups, class_id",
    )
    .eq("id", lessonPlanId)
    .eq("organization_id", orgId)
    .single();

  if (planError || !lessonPlan) {
    await supabase
      .from("ls_work_submissions")
      .update({ status: "error", error_message: "Lesson plan not found" })
      .eq("id", submission.id);
    return apiError("Lesson plan not found", 404);
  }

  // Load pupil for SEND context
  const { data: pupil } = await supabase
    .from("ls_pupils")
    .select(
      "has_send_support, has_ehcp, send_primary_need, is_eal, eal_stage, accessibility_needs, year_group",
    )
    .eq("id", pupilId)
    .eq("organization_id", orgId)
    .single();

  // Load class for year group
  let yearGroup = "Unknown";
  if (lessonPlan.class_id) {
    const { data: classRow } = await supabase
      .from("ls_classes")
      .select("year_group")
      .eq("id", lessonPlan.class_id)
      .single();
    if (classRow?.year_group) yearGroup = classRow.year_group;
  }
  if (pupil?.year_group) yearGroup = pupil.year_group;

  // Build pupil context string for grading
  const pupilContextParts: string[] = [];
  if (pupil) {
    const p = pupil as Partial<LSPupil>;
    if (p.has_ehcp) pupilContextParts.push("Has EHCP");
    if (p.has_send_support) pupilContextParts.push("SEND support");
    if (p.send_primary_need) pupilContextParts.push(`Primary need: ${p.send_primary_need}`);
    if (p.is_eal) pupilContextParts.push(`EAL stage ${p.eal_stage ?? "unknown"}`);
    if (Array.isArray(p.accessibility_needs) && p.accessibility_needs.length > 0) {
      pupilContextParts.push(`Accessibility: ${p.accessibility_needs.join(", ")}`);
    }
  }
  const pupilContext =
    pupilContextParts.length > 0 ? pupilContextParts.join("; ") : "No additional context";

  // Build differentiation group label
  const plan = lessonPlan as Partial<LSLessonPlan>;
  const diffGroups = Array.isArray(plan.differentiation_groups)
    ? (plan.differentiation_groups as Array<{ name: string }>)
    : [];
  const diffGroup =
    diffGroups.length > 0 ? diffGroups.map((g) => g.name).join(", ") : "core";

  // OCR extraction
  let ocrText = "";
  let ocrConfidence = 0;
  let gradingResult;

  try {
    // Only run Vision OCR for images; for PDF use empty text (future enhancement)
    if (file.type !== "application/pdf") {
      const ocr = await extractTextFromImage(filePublicUrl);
      ocrText = ocr.text;
      ocrConfidence = ocr.confidence;
    } else {
      ocrText = "[PDF submitted — OCR not yet supported for PDF files]";
      ocrConfidence = 0;
    }

    // AI grading
    gradingResult = await gradeWork(ocrText, {
      subject: plan.subject ?? "Unknown",
      yearGroup,
      learningObjective: plan.learning_objective ?? "",
      successCriteria: Array.isArray(plan.success_criteria)
        ? (plan.success_criteria as string[])
        : [],
      diffGroup,
      pupilContext,
    });

    // Update submission with OCR + grading results
    await supabase
      .from("ls_work_submissions")
      .update({
        ocr_text: ocrText,
        ocr_confidence: ocrConfidence,
        ocr_model: "google-cloud-vision",
        grading_result: gradingResult,
        grading_model: "google/gemini-2.5-flash",
        grading_confidence: gradingResult.confidence,
        status: "graded",
      })
      .eq("id", submission.id);

    // Upsert ls_assessments record
    const { data: assessment, error: assessError } = await supabase
      .from("ls_assessments")
      .upsert(
        {
          organization_id: orgId,
          lesson_plan_id: lessonPlanId,
          pupil_id: pupilId,
          subject: plan.subject ?? "Unknown",
          nc_objective_codes: [],
          ai_suggested_grade: gradingResult.grade,
          ai_confidence: gradingResult.confidence,
          ai_reasoning: gradingResult.feedback,
          teacher_grade: null,
          teacher_agreed: null,
          assessment_date: new Date().toISOString().split("T")[0],
          // Extended fields (triangulation pipeline)
          misconceptions: gradingResult.misconceptions,
          next_steps: gradingResult.next_steps,
          feedback_text: gradingResult.feedback,
          triangulation_status: "pending",
          work_submission_id: submission.id,
        },
        { onConflict: "lesson_plan_id,pupil_id" },
      )
      .select()
      .single();

    if (assessError) {
      console.error("[assess] Assessment upsert error:", assessError);
    }

    return apiSuccess({
      submission: { ...submission, status: "graded" },
      assessment,
      gradingResult,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[assess] Grading error:", message);

    // Update submission to error state
    await supabase
      .from("ls_work_submissions")
      .update({ status: "error", error_message: message })
      .eq("id", submission.id);

    return apiError(`Grading failed: ${message}`, 500);
  }
});
