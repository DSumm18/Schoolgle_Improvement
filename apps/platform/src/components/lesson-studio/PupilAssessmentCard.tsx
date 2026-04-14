"use client";

import React, { useState } from "react";
import { Check, ChevronDown, Flag, AlertTriangle } from "lucide-react";
import type { AssessmentWithSubmission, AttainmentLevel } from "@/types/lesson-studio";

interface PupilAssessmentCardProps {
  assessment: AssessmentWithSubmission;
  /** Teacher's grade for this pupil's subject attainment (pre-computed by parent) */
  teacherGrade?: AttainmentLevel | null;
  /** Whether AI grade differs from teacher's existing grade */
  hasDiscrepancy?: boolean;
  onReview: (
    assessmentId: string,
    action: "agree" | "override" | "flag",
    data?: Record<string, string>,
  ) => Promise<void>;
}

const GRADE_COLORS: Record<AttainmentLevel, string> = {
  GDS: "bg-blue-50 text-blue-600 border-blue-200",
  EXS: "bg-emerald-50 text-emerald-600 border-emerald-200",
  WTS: "bg-amber-50 text-amber-600 border-amber-200",
  PKE: "bg-red-50 text-red-500 border-red-200",
  PKF: "bg-red-50 text-red-700 border-red-200",
};

const GRADE_OPTIONS: AttainmentLevel[] = ["GDS", "EXS", "WTS", "PKE", "PKF"];

function GradeBox({
  label,
  grade,
  confidence,
  muted,
}: {
  label: string;
  grade: AttainmentLevel | string | null | undefined;
  confidence?: number | null;
  muted?: boolean;
}) {
  const colorClass =
    grade && grade in GRADE_COLORS
      ? GRADE_COLORS[grade as AttainmentLevel]
      : "bg-gray-50 text-gray-400 border-gray-100";

  return (
    <div
      className={`flex-1 rounded-lg border px-3 py-2 text-center ${muted ? "bg-gray-50 text-gray-400 border-gray-100" : colorClass}`}
    >
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm font-bold">{grade ?? "--"}</p>
      {confidence != null && (
        <p className="text-[9px] text-gray-400 mt-0.5">{Math.round(confidence * 100)}%</p>
      )}
    </div>
  );
}

function PupilTag({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium uppercase tracking-wider ${className}`}>
      {label}
    </span>
  );
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function PupilAssessmentCard({ assessment, teacherGrade, hasDiscrepancy, onReview }: PupilAssessmentCardProps) {
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideGrade, setOverrideGrade] = useState<AttainmentLevel | "">(
    assessment.teacher_grade ?? "",
  );
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const pupil = assessment.pupil;
  // Strip "enc:" prefix from display name if present
  const rawName = pupil?.display_name_encrypted ?? `Pupil ${assessment.pupil_id.slice(0, 6)}`;
  const displayName = rawName.startsWith("enc:") ? rawName.slice(4) : rawName;
  const isReviewed = assessment.teacher_agreed != null;

  // Use the pre-computed teacherGrade from subject attainment if available,
  // otherwise fall back to assessment.teacher_grade
  const resolvedTeacherGrade = teacherGrade ?? assessment.teacher_grade ?? null;

  // Discrepancy: teacher grade differs from AI grade and not yet reviewed
  const disagrees = hasDiscrepancy ?? (
    !isReviewed &&
    assessment.ai_suggested_grade &&
    resolvedTeacherGrade &&
    assessment.ai_suggested_grade !== resolvedTeacherGrade
  );

  const misconceptions = assessment.misconceptions ?? [];
  const nextSteps = assessment.next_steps;

  // Raw scores from work submission grading result
  const gradingResult = assessment.work_submission?.grading_result;
  const rawScore = gradingResult?.score ?? null;
  const rawTotal = gradingResult?.total ?? null;

  const handleAction = async (action: "agree" | "override" | "flag", data?: Record<string, string>) => {
    setSubmitting(true);
    try {
      await onReview(assessment.id, action, data);
    } finally {
      setSubmitting(false);
      setOverrideMode(false);
    }
  };

  // Colour coding: amber left border for discrepancy, green for aligned, neutral for pending/reviewed
  const cardBorder = isReviewed
    ? "border-gray-100"
    : disagrees
    ? "border-amber-200 border-l-4 border-l-amber-400"
    : resolvedTeacherGrade && assessment.ai_suggested_grade
    ? "border-emerald-100 border-l-4 border-l-emerald-400"
    : "border-gray-100";

  return (
    <div
      className={`rounded-xl border bg-white p-4 transition-colors duration-150 ${cardBorder}`}
    >
      {/* Header: avatar + name + tags */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-gray-500">
            {getInitials(displayName)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {pupil?.has_ehcp && <PupilTag label="EHCP" className="bg-pink-50 text-pink-600" />}
            {pupil?.has_send_support && !pupil.has_ehcp && (
              <PupilTag label="SEN" className="bg-pink-50 text-pink-500" />
            )}
            {pupil?.is_pupil_premium && (
              <PupilTag label="PP" className="bg-amber-50 text-amber-600" />
            )}
            {pupil?.is_eal && <PupilTag label="EAL" className="bg-blue-50 text-blue-500" />}
            {pupil?.is_looked_after && (
              <PupilTag label="LAC" className="bg-purple-50 text-purple-500" />
            )}
          </div>
        </div>
        {isReviewed ? (
          <div className="flex items-center gap-1 text-emerald-500">
            <Check className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium">Reviewed</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-gray-400">
            <span className="text-[10px]">Pending</span>
          </div>
        )}
      </div>

      {/* Grade boxes */}
      <div className="flex gap-2 mb-3">
        <GradeBox label="Teacher" grade={resolvedTeacherGrade} />
        <GradeBox
          label="AI Grade"
          grade={assessment.ai_suggested_grade}
          confidence={assessment.ai_confidence}
        />
        <GradeBox
          label="Status"
          grade={
            isReviewed
              ? assessment.teacher_agreed
                ? "Agreed"
                : "Overridden"
              : disagrees
              ? "Differs"
              : resolvedTeacherGrade && assessment.ai_suggested_grade
              ? "Match"
              : "Pending"
          }
          muted={!isReviewed && !disagrees && !(resolvedTeacherGrade && assessment.ai_suggested_grade)}
        />
      </div>

      {/* Raw score */}
      {rawScore != null && rawTotal != null && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Score</span>
          <span className="text-xs font-semibold text-gray-700">
            {rawScore}/{rawTotal}{" "}
            <span className="font-normal text-gray-400">
              ({Math.round((rawScore / rawTotal) * 100)}%)
            </span>
          </span>
        </div>
      )}

      {/* Misconceptions */}
      {misconceptions.length > 0 && (
        <div className="rounded-lg bg-red-50 p-3 mb-3">
          <p className="text-[10px] font-medium text-red-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Misconceptions
          </p>
          <ul className="space-y-1">
            {misconceptions.map((m, i) => (
              <li key={i} className="text-xs text-red-600 leading-relaxed">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 relative top-[-1px] ${
                    m.severity === "fundamental"
                      ? "bg-red-500"
                      : m.severity === "significant"
                        ? "bg-red-400"
                        : "bg-red-300"
                  }`}
                />
                {m.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      {nextSteps && (
        <div className="rounded-lg bg-emerald-50 p-3 mb-3">
          <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wide mb-1">
            Next Steps
          </p>
          <p className="text-xs text-emerald-600 leading-relaxed">{nextSteps}</p>
        </div>
      )}

      {/* Action buttons (only when not reviewed) */}
      {!isReviewed && !overrideMode && (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() =>
              handleAction("agree", {
                grade: assessment.ai_suggested_grade ?? "",
              })
            }
            disabled={submitting}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Check className="w-3 h-3" />
            Agree{assessment.ai_suggested_grade ? ` (${assessment.ai_suggested_grade})` : ""}
          </button>
          <button
            onClick={() => setOverrideMode(true)}
            disabled={submitting}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
          >
            Override
          </button>
          <button
            onClick={() => handleAction("flag")}
            disabled={submitting}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Flag className="w-3 h-3" />
            Flag
          </button>
        </div>
      )}

      {/* Override mode */}
      {!isReviewed && overrideMode && (
        <div className="pt-1 space-y-2">
          <div className="flex gap-2">
            {/* Grade selector */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors min-w-[80px]"
              >
                <span className={overrideGrade ? "text-gray-900" : "text-gray-400"}>
                  {overrideGrade || "Grade"}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {dropdownOpen && (
                <div className="absolute z-10 mt-1 w-20 rounded-lg border border-gray-100 bg-white shadow-sm py-1">
                  {GRADE_OPTIONS.map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        setOverrideGrade(g);
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Reason */}
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Reason (optional)"
              className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200 transition-colors"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setOverrideMode(false);
                setOverrideGrade("");
                setOverrideReason("");
              }}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                handleAction("override", {
                  grade: overrideGrade,
                  reason: overrideReason,
                })
              }
              disabled={!overrideGrade || submitting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
