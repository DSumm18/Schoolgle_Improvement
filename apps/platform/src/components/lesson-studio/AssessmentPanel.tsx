"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Loader2, CheckCircle2, ClipboardList } from "lucide-react";
import { WorkUploadZone } from "./WorkUploadZone";
import { PupilAssessmentCard } from "./PupilAssessmentCard";
import type { LSPupil, AssessmentWithSubmission } from "@/types/lesson-studio";

interface AssessmentPanelProps {
  lessonPlanId: string;
  pupils: LSPupil[];
}

export function AssessmentPanel({ lessonPlanId, pupils }: AssessmentPanelProps) {
  const [assessments, setAssessments] = useState<AssessmentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [agreeingAll, setAgreeingAll] = useState(false);

  const loadAssessments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/lesson-studio/assess?lessonPlanId=${encodeURIComponent(lessonPlanId)}`,
      );
      if (res.ok) {
        const body = await res.json();
        setAssessments(body.data ?? []);
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
    await fetch("/api/lesson-studio/assess/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId, action, ...data }),
    });
    await loadAssessments();
  };

  const handleAgreeAll = async () => {
    const pending = assessments.filter((a) => a.teacher_agreed == null);
    if (pending.length === 0) return;
    setAgreeingAll(true);
    try {
      for (const a of pending) {
        await fetch("/api/lesson-studio/assess/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentId: a.id,
            action: "agree",
            grade: a.ai_suggested_grade ?? "",
          }),
        });
      }
      await loadAssessments();
    } finally {
      setAgreeingAll(false);
    }
  };

  const reviewed = assessments.filter((a) => a.teacher_agreed != null);
  const pending = assessments.filter((a) => a.teacher_agreed == null);

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

      {/* Summary + bulk action */}
      {assessments.length > 0 && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 ${
            reviewed.length === assessments.length && assessments.length > 0
              ? "bg-emerald-50 border border-emerald-100"
              : "bg-gray-50 border border-gray-100"
          }`}
        >
          <div className="flex items-center gap-3">
            {reviewed.length === assessments.length && assessments.length > 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <ClipboardList className="w-4 h-4 text-gray-400" />
            )}
            <p className="text-xs text-gray-600">
              <span className="font-medium text-gray-900">{reviewed.length}</span> reviewed
              {pending.length > 0 && (
                <>
                  {" "}&middot;{" "}
                  <span className="font-medium text-gray-900">{pending.length}</span> pending
                </>
              )}
            </p>
          </div>
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
      )}

      {/* Assessment cards */}
      {assessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Pending first, then reviewed */}
          {[...pending, ...reviewed].map((a) => (
            <PupilAssessmentCard key={a.id} assessment={a} onReview={handleReview} />
          ))}
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
