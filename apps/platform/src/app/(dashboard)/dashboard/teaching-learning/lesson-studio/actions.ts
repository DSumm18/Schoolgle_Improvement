"use server";

import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  LSClass,
  LSPupil,
  LSTimetableSlot,
  LSLessonPlan,
  LSSchemeMapping,
  LSSchemeProgression,
  LSAssessment,
} from "@/types/lesson-studio";

function db() {
  return createServiceRoleClient();
}

// ─── Classes ──────────────────────────────────────────────────────────

export async function getClasses(orgId: string): Promise<LSClass[]> {
  const { data, error } = await db()
    .from("ls_classes")
    .select("*")
    .eq("organization_id", orgId)
    .order("year_group");
  if (error) throw new Error(error.message);
  return (data ?? []) as LSClass[];
}

export async function getClass(classId: string): Promise<LSClass | null> {
  const { data, error } = await db()
    .from("ls_classes")
    .select("*")
    .eq("id", classId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as LSClass | null;
}

// ─── Pupils ───────────────────────────────────────────────────────────

export async function getPupilsByClass(classId: string): Promise<LSPupil[]> {
  const { data, error } = await db()
    .from("ls_pupils")
    .select("*")
    .eq("class_id", classId)
    .order("display_name_encrypted");
  if (error) throw new Error(error.message);
  return (data ?? []) as LSPupil[];
}

/** Decode "enc:Name" test format or return pupil_ref as fallback. */
export function decodePupilName(pupil: LSPupil): string {
  const enc = pupil.display_name_encrypted;
  if (enc?.startsWith("enc:")) return enc.slice(4);
  return pupil.pupil_ref;
}

// ─── Timetable ────────────────────────────────────────────────────────

export async function getTimetable(classId: string): Promise<LSTimetableSlot[]> {
  const { data, error } = await db()
    .from("ls_timetable_slots")
    .select("*")
    .eq("class_id", classId)
    .order("day_of_week")
    .order("start_time");
  if (error) throw new Error(error.message);
  return (data ?? []) as LSTimetableSlot[];
}

// ─── Scheme Mappings ──────────────────────────────────────────────────

export async function getSchemeMappings(classId: string): Promise<LSSchemeMapping[]> {
  const { data, error } = await db()
    .from("ls_scheme_mappings")
    .select("*")
    .eq("class_id", classId);
  if (error) throw new Error(error.message);
  return (data ?? []) as LSSchemeMapping[];
}

export async function getSchemeProgression(
  schemeName: string,
  subject: string,
  yearGroup: string,
  term: string,
): Promise<LSSchemeProgression | null> {
  const { data, error } = await db()
    .from("ls_scheme_progressions")
    .select("*")
    .eq("scheme_name", schemeName)
    .eq("subject", subject)
    .eq("year_group", yearGroup)
    .eq("term", term)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as LSSchemeProgression | null;
}

// ─── Lesson Plans ─────────────────────────────────────────────────────

export async function getLessonPlansForWeek(
  classId: string,
  weekCommencing: string,
): Promise<LSLessonPlan[]> {
  const { data, error } = await db()
    .from("ls_lesson_plans")
    .select("*")
    .eq("class_id", classId)
    .eq("week_commencing", weekCommencing)
    .order("day_of_week")
    .order("subject");
  if (error) throw new Error(error.message);
  return (data ?? []) as LSLessonPlan[];
}

export async function getLessonPlan(planId: string): Promise<LSLessonPlan | null> {
  const { data, error } = await db()
    .from("ls_lesson_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as LSLessonPlan | null;
}

export async function upsertLessonPlan(
  plan: Partial<LSLessonPlan> & { organization_id: string; class_id: string; week_commencing: string; day_of_week: number; subject: string },
): Promise<LSLessonPlan> {
  const { data, error } = await db()
    .from("ls_lesson_plans")
    .upsert(plan, { onConflict: "class_id,week_commencing,day_of_week,subject" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LSLessonPlan;
}

export async function updateLessonPlanStatus(
  planId: string,
  status: string,
): Promise<void> {
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "taught") updates.taught_at = new Date().toISOString();
  const { error } = await db()
    .from("ls_lesson_plans")
    .update(updates)
    .eq("id", planId);
  if (error) throw new Error(error.message);
}

// ─── Assessments ──────────────────────────────────────────────────────

export async function getAssessmentsForLesson(planId: string): Promise<LSAssessment[]> {
  const { data, error } = await db()
    .from("ls_assessments")
    .select("*")
    .eq("lesson_plan_id", planId);
  if (error) throw new Error(error.message);
  return (data ?? []) as LSAssessment[];
}

export async function upsertAssessment(
  assessment: Partial<LSAssessment> & { organization_id: string; pupil_id: string; subject: string },
): Promise<LSAssessment> {
  const { data, error } = await db()
    .from("ls_assessments")
    .upsert(assessment)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LSAssessment;
}
