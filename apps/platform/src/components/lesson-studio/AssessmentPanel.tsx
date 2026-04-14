"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2, ClipboardList, Users, AlertTriangle } from "lucide-react";
import { WorkUploadZone } from "./WorkUploadZone";
import { PupilAssessmentCard } from "./PupilAssessmentCard";
import type { LSPupil, AssessmentWithSubmission, AttainmentLevel } from "@/types/lesson-studio";
import { supabase } from "@/lib/supabase";
import { syncAssessmentToIntelligence } from "@/lib/lesson-studio/intelligence-bridge";

// Subject → pupil attainment field mapping
const SUBJECT_ATTAINMENT_FIELD: Record<string, keyof LSPupil> = {
  Maths: "attainment_maths",
  Mathematics: "attainment_maths",
  English: "attainment_reading",
  "English Reading": "attainment_reading",
  Reading: "attainment_reading",
  "English Writing": "attainment_writing",
  Writing: "attainment_writing",
  Science: "attainment_science",
};

function getTeacherGradeForSubject(pupil: LSPupil, subject: string): AttainmentLevel | null {
  const field = SUBJECT_ATTAINMENT_FIELD[subject] ?? "attainment_maths";
  return (pupil[field] as AttainmentLevel | null) ?? null;
}

const GRADE_ORDER: Record<AttainmentLevel, number> = {
  PKF: 0,
  PKE: 1,
  WTS: 2,
  EXS: 3,
  GDS: 4,
};

function classAverage(grades: (AttainmentLevel | null)[]): string {
  const valid = grades.filter((g): g is AttainmentLevel => g !== null);
  if (valid.length === 0) return "—";
  const avg = valid.reduce((sum, g) => sum + GRADE_ORDER[g], 0) / valid.length;
  // Map numeric average back to nearest grade
  const rounded = Math.round(avg);
  const labels: AttainmentLevel[] = ["PKF", "PKE", "WTS", "EXS", "GDS"];
  return labels[Math.min(Math.max(rounded, 0), 4)];
}

interface AssessmentPanelProps {
  lessonPlanId: string;
  pupils: LSPupil[];
  subject?: string;
}

export function AssessmentPanel({ lessonPlanId, pupils, subject = "Maths" }: AssessmentPanelProps) {
  const [assessments, setAssessments] = useState<AssessmentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [agreeingAll, setAgreeingAll] = useState(false);

  const loadAssessments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ls_assessments")
        .select(`
          *,
          work_submission:ls_work_submissions(*),
          pupil:ls_pupils(id, display_name_encrypted, pupil_ref, has_ehcp, has_send_support, is_pupil_premium, is_eal, is_looked_after, attainment_maths, attainment_reading, attainment_writing, attainment_science)
        `)
        .eq("lesson_plan_id", lessonPlanId)
        .order("created_at", { ascending: true });

      if (!error) {
        setAssessments((data ?? []) as AssessmentWithSubmission[]);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [lessonPlanId]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  const handleReview = async (
    assessmentId: string,
    action: "agree" | "override" | "flag",
    data?: Record<string, string>,
  ) => {
    // Find the assessment record before the update so we have its data
    const assessment = assessments.find((a) => a.id === assessmentId);

    await fetch("/api/lesson-studio/assess/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId, action, ...data }),
    });

    // Fire-and-forget sync to Intelligence module for agree and override actions
    if (assessment && (action === "agree" || action === "override")) {
      const wasOverridden = action === "override";
      const verifiedGrade = wasOverridden
        ? (data?.teacherGrade ?? assessment.ai_suggested_grade ?? "")
        : (assessment.ai_suggested_grade ?? "");

      void syncAssessmentToIntelligence({
        organizationId: assessment.organization_id,
        pupilId: assessment.pupil_id,
        lessonPlanId: assessment.lesson_plan_id ?? lessonPlanId,
        subject: assessment.subject ?? subject,
        verifiedGrade,
        aiSuggestedGrade: assessment.ai_suggested_grade ?? "",
        wasOverridden,
        misconceptions: (assessment.misconceptions ?? []).map((m) => ({
          description: typeof m === "object" && m !== null && "description" in m
            ? String((m as { description: unknown }).description)
            : String(m),
          severity: typeof m === "object" && m !== null && "severity" in m
            ? String((m as { severity: unknown }).severity)
            : "medium",
        })),
        assessedAt: new Date().toISOString(),
      });
    }

    await loadAssessments();
  };

  const handleAgreeAll = async () => {
    const noDiscrepancy = assessments.filter((a) => {
      if (a.teacher_agreed != null) return false;
      const teacherGrade = a.pupil ? getTeacherGradeForSubject(a.pupil as LSPupil, subject) : null;
      return !teacherGrade || !a.ai_suggested_grade || teacherGrade === a.ai_suggested_grade;
    });
    if (noDiscrepancy.length === 0) return;
    setAgreeingAll(true);
    try {
      for (const a of noDiscrepancy) {
        await fetch("/api/lesson-studio/assess/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentId: a.id,
            action: "agree",
            grade: a.ai_suggested_grade ?? "",
          }),
        });

        // Fire-and-forget sync to Intelligence module
        void syncAssessmentToIntelligence({
          organizationId: a.organization_id,
          pupilId: a.pupil_id,
          lessonPlanId: a.lesson_plan_id ?? lessonPlanId,
          subject: a.subject ?? subject,
          verifiedGrade: a.ai_suggested_grade ?? "",
          aiSuggestedGrade: a.ai_suggested_grade ?? "",
          wasOverridden: false,
          misconceptions: (a.misconceptions ?? []).map((m) => ({
            description: typeof m === "object" && m !== null && "description" in m
              ? String((m as { description: unknown }).description)
              : String(m),
            severity: typeof m === "object" && m !== null && "severity" in m
              ? String((m as { severity: unknown }).severity)
              : "medium",
          })),
          assessedAt: new Date().toISOString(),
        });
      }
      await loadAssessments();
    } finally {
      setAgreeingAll(false);
    }
  };

  // Derive summary stats
  const reviewed = assessments.filter((a) => a.teacher_agreed != null);
  const pending = assessments.filter((a) => a.teacher_agreed == null);

  const discrepancies = assessments.filter((a) => {
    if (a.teacher_agreed != null) return false;
    const teacherGrade = a.pupil ? getTeacherGradeForSubject(a.pupil as LSPupil, subject) : null;
    return teacherGrade && a.ai_suggested_grade && teacherGrade !== a.ai_suggested_grade;
  });

  const aiGrades = assessments
    .map((a) => a.ai_suggested_grade)
    .filter((g): g is AttainmentLevel => g !== null);

  const classAvg = classAverage(aiGrades);

  const uploadPupils = pupils.map((p) => ({
    id: p.id,
    display_name_encrypted: p.display_name_encrypted ?? "",
    pupil_ref: p.pupil_ref,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Upload Work</h3>
        <WorkUploadZone
          lessonPlanId={lessonPlanId}
          pupils={uploadPupils}
          onUploadComplete={loadAssessments}
        />
      </div>

      {/* Summary bar */}
      {assessments.length > 0 && (
        <div
          className={`rounded-xl px-4 py-3 border ${
            reviewed.length === assessments.length
              ? "bg-emerald-50 border-emerald-100"
              : discrepancies.length > 0
              ? "bg-amber-50 border-amber-100"
              : "bg-gray-50 border-gray-100"
          }`}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-gray-600">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-semibold text-gray-900">{pupils.length}</span> pupils
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{assessments.length}</span> submitted
              </span>
              {discrepancies.length > 0 && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-semibold">{discrepancies.length}</span> discrepancies
                  </span>
                </>
              )}
              {classAvg !== "—" && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">
                    Class avg: <span className="font-semibold text-gray-900">{classAvg}</span>
                  </span>
                </>
              )}
              {reviewed.length > 0 && (
                <>
                  <span className="text-gray-400">·</span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="font-semibold">{reviewed.length}</span> reviewed
                  </span>
                </>
              )}
            </div>

            {/* Agree All button — only for pupils without discrepancies */}
            {pending.length > 0 && (
              <button
                onClick={handleAgreeAll}
                disabled={agreeingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 rounded-lg transition-colors"
              >
                {agreeingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3 h-3" />
                )}
                Agree All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Assessment cards */}
      {assessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Discrepancies first, then matching, then reviewed */}
          {[
            ...discrepancies,
            ...pending.filter((a) => !discrepancies.includes(a)),
            ...reviewed,
          ].map((a) => {
            const teacherGrade = a.pupil
              ? getTeacherGradeForSubject(a.pupil as LSPupil, subject)
              : null;
            const hasDiscrepancy =
              teacherGrade &&
              a.ai_suggested_grade &&
              teacherGrade !== a.ai_suggested_grade &&
              a.teacher_agreed == null;

            return (
              <PupilAssessmentCard
                key={a.id}
                assessment={a}
                teacherGrade={teacherGrade}
                hasDiscrepancy={!!hasDiscrepancy}
                onReview={handleReview}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">No assessments yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Upload pupil worksheets above to generate AI-assisted assessments.
          </p>
        </div>
      )}
    </div>
  );
}
