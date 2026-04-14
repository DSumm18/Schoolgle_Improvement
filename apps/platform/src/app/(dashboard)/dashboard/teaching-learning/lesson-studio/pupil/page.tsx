"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import { Loader2, ChevronLeft, Star } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────

interface PupilListItem {
  id: string;
  name: string;
  group: "deeper" | "core" | "scaffold" | "guided";
}

interface Question {
  q: string;
  type: "open" | "fill" | "yesno" | "multiple_choice";
  parts?: string[];
  hint?: string;
  marks: number;
}

interface PupilWorkData {
  lessonTitle: string;
  subject: string;
  group: "deeper" | "core" | "scaffold" | "guided";
  groupLabel: string;
  pupilName: string;
  questions: Question[];
  adaptations: string | null;
  totalMarks: number;
}

interface ClassListData {
  lessonTitle: string;
  subject: string;
  pupils: PupilListItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────

const GROUP_COLOURS: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  deeper:   { border: "border-blue-400",  bg: "bg-blue-50",  text: "text-blue-800",  badge: "bg-blue-100 text-blue-800 border border-blue-300" },
  core:     { border: "border-green-400", bg: "bg-green-50", text: "text-green-800", badge: "bg-green-100 text-green-800 border border-green-300" },
  scaffold: { border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-800", badge: "bg-amber-100 text-amber-800 border border-amber-300" },
  guided:   { border: "border-red-400",   bg: "bg-red-50",   text: "text-red-800",   badge: "bg-red-100 text-red-800 border border-red-300" },
};

const GROUP_PICKER_COLOURS: Record<string, string> = {
  deeper:   "bg-blue-100 hover:bg-blue-200 text-blue-900 border-2 border-blue-300",
  core:     "bg-green-100 hover:bg-green-200 text-green-900 border-2 border-green-300",
  scaffold: "bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300",
  guided:   "bg-red-100 hover:bg-red-200 text-red-900 border-2 border-red-300",
};

// ─── Pupil Work Page ──────────────────────────────────────────────────────

export default function PupilWorkPage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const { session, organizationId } = useAuth();

  const [classList, setClassList] = useState<ClassListData | null>(null);
  const [pupilWork, setPupilWork] = useState<PupilWorkData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingPupil, setLoadingPupil] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders: HeadersInit = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  // Load class list on mount
  const loadClassList = useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ lessonPlanId: planId });
      if (organizationId) params.set("organizationId", organizationId);
      const res = await fetch(`/api/lesson-studio/pupil-work?${params}`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Could not load class list");
      const data = await res.json();
      setClassList(data);
    } catch (e: any) {
      setError(e.message ?? "Error loading lesson");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, organizationId, session?.access_token]);

  useEffect(() => {
    loadClassList();
  }, [loadClassList]);

  // Load pupil-specific questions
  const selectPupil = async (pupilId: string) => {
    if (!planId) return;
    setLoadingPupil(true);
    setError(null);
    try {
      const params = new URLSearchParams({ lessonPlanId: planId, pupilId });
      if (organizationId) params.set("organizationId", organizationId);
      const res = await fetch(`/api/lesson-studio/pupil-work?${params}`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error("Could not load questions");
      const data = await res.json();
      setPupilWork(data);
      setAnswers({});
      setSubmitted(false);
    } catch (e: any) {
      setError(e.message ?? "Error loading questions");
    } finally {
      setLoadingPupil(false);
    }
  };

  const handleBack = () => {
    setPupilWork(null);
    setAnswers({});
    setSubmitted(false);
  };

  const handleSubmit = () => {
    alert("Well done! Your answers have been submitted.");
    setSubmitted(true);
  };

  // ─── Loading state ───────────────────────────────────────────────
  if (!planId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <p className="text-slate-500 font-poppins text-lg">No lesson plan selected.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500 text-lg font-medium" style={{ fontFamily: "Poppins, sans-serif" }}>
          Loading lesson...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-500 text-lg font-medium mb-2">{error}</p>
          <button
            onClick={loadClassList}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ─── Pupil Question View ─────────────────────────────────────────
  if (loadingPupil) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-500 text-lg font-medium" style={{ fontFamily: "Poppins, sans-serif" }}>
          Loading your questions...
        </p>
      </div>
    );
  }

  if (pupilWork) {
    const gc = GROUP_COLOURS[pupilWork.group] ?? GROUP_COLOURS.core;
    const allAnswered = pupilWork.questions.length > 0 &&
      pupilWork.questions.every((_, i) => (answers[i] ?? "").trim().length > 0);

    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: "Poppins, sans-serif" }}>
        {/* Header */}
        <div className={`sticky top-0 z-10 border-b-4 ${gc.border} bg-white px-4 pt-4 pb-3 shadow-sm`}>
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-slate-400 text-sm mb-2 hover:text-slate-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to class
          </button>
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">
                {pupilWork.pupilName}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {pupilWork.subject} — {pupilWork.lessonTitle}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${gc.badge}`}>
              {pupilWork.groupLabel}
            </span>
          </div>
          {/* Total marks */}
          <div className="mt-2 text-xs text-slate-400">
            {pupilWork.questions.length} question{pupilWork.questions.length !== 1 ? "s" : ""} &bull; {pupilWork.totalMarks} mark{pupilWork.totalMarks !== 1 ? "s" : ""} total
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* SEND adaptation note */}
          {pupilWork.adaptations && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3">
              <p className="text-sm font-semibold text-purple-700 mb-0.5">Support note</p>
              <p className="text-sm text-purple-600">{pupilWork.adaptations}</p>
            </div>
          )}

          {/* Questions */}
          {pupilWork.questions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">No questions yet for this group.</p>
              <p className="text-sm mt-1">Ask your teacher for help.</p>
            </div>
          ) : (
            pupilWork.questions.map((q, i) => (
              <QuestionCard
                key={i}
                index={i}
                question={q}
                answer={answers[i] ?? ""}
                submitted={submitted}
                onChange={(val) => setAnswers((prev) => ({ ...prev, [i]: val }))}
              />
            ))
          )}

          {/* Submit button */}
          {!submitted && pupilWork.questions.length > 0 && (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className={`w-full py-4 rounded-2xl text-lg font-bold transition-all ${
                allAnswered
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl active:scale-95"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {allAnswered ? "Submit my answers" : "Answer all questions to submit"}
            </button>
          )}

          {submitted && (
            <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
              <div className="flex justify-center mb-3">
                <Star className="w-10 h-10 text-green-500 fill-green-400" />
              </div>
              <p className="text-xl font-bold text-green-700">Great work!</p>
              <p className="text-sm text-green-600 mt-1">Your answers have been submitted.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Pupil Picker ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Poppins, sans-serif" }}>
      {/* Header */}
      <div className="bg-indigo-600 px-4 pt-6 pb-5">
        <h1 className="text-2xl font-bold text-white leading-tight">
          {classList?.lessonTitle ?? "Lesson"}
        </h1>
        <p className="text-indigo-200 text-sm mt-1">
          {classList?.subject} &mdash; Tap your name to start
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Group legend */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(["deeper", "core", "scaffold", "guided"] as const).map((g) => (
            <span key={g} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${GROUP_COLOURS[g].badge}`}>
              {g === "deeper" ? "Deeper Thinkers" : g === "core" ? "Core" : g === "scaffold" ? "Scaffold" : "Guided"}
            </span>
          ))}
        </div>

        {/* Pupil grid */}
        {!classList?.pupils.length ? (
          <p className="text-center text-slate-400 py-12">No pupils found for this lesson.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {classList.pupils.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPupil(p.id)}
                className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl font-semibold text-base transition-all active:scale-95 ${
                  GROUP_PICKER_COLOURS[p.group] ?? GROUP_PICKER_COLOURS.core
                }`}
              >
                <span className="text-2xl">
                  {p.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-center leading-tight">
                  {p.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Question Card ────────────────────────────────────────────────────────

interface QuestionCardProps {
  index: number;
  question: Question;
  answer: string;
  submitted: boolean;
  onChange: (val: string) => void;
}

function QuestionCard({ index, question, answer, submitted, onChange }: QuestionCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Question header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <p className="text-base font-medium text-slate-800 leading-snug flex-1">
            {question.q}
          </p>
        </div>
        {question.hint && (
          <p className="text-sm text-slate-400 mt-2 pl-9 italic">Hint: {question.hint}</p>
        )}
        <p className="text-xs text-slate-400 mt-1 pl-9">{question.marks} mark{question.marks !== 1 ? "s" : ""}</p>
      </div>

      {/* Answer area */}
      <div className="px-4 pb-4">
        {question.type === "open" && (
          <textarea
            disabled={submitted}
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your answer here..."
            rows={3}
            className="w-full mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none disabled:opacity-60"
          />
        )}

        {question.type === "fill" && (
          <div className="mt-2 space-y-2">
            {(question.parts ?? []).map((part, pi) => (
              <div key={pi} className="flex items-center gap-2 text-base text-slate-700">
                <span>{part}</span>
                <input
                  disabled={submitted}
                  type="text"
                  placeholder="______"
                  className="flex-1 min-w-0 border-b-2 border-indigo-300 bg-transparent text-base text-slate-800 placeholder-slate-300 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                  value={answer.split("||")[pi] ?? ""}
                  onChange={(e) => {
                    const parts = answer.split("||");
                    parts[pi] = e.target.value;
                    onChange(parts.join("||"));
                  }}
                />
              </div>
            ))}
            {(!question.parts || question.parts.length === 0) && (
              <input
                disabled={submitted}
                type="text"
                placeholder="Fill in the blank..."
                className="w-full border-b-2 border-indigo-300 bg-transparent text-base text-slate-800 focus:outline-none focus:border-indigo-500 py-1 disabled:opacity-60"
                value={answer}
                onChange={(e) => onChange(e.target.value)}
              />
            )}
          </div>
        )}

        {question.type === "yesno" && (
          <div className="flex gap-3 mt-3">
            {["Yes", "No"].map((opt) => (
              <button
                key={opt}
                disabled={submitted}
                onClick={() => onChange(opt)}
                className={`flex-1 py-3 rounded-xl text-base font-bold transition-all ${
                  answer === opt
                    ? opt === "Yes"
                      ? "bg-green-500 text-white shadow"
                      : "bg-red-400 text-white shadow"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                } disabled:opacity-60`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {question.type === "multiple_choice" && (
          <div className="mt-3 space-y-2">
            {(question.parts ?? []).map((opt, oi) => (
              <button
                key={oi}
                disabled={submitted}
                onClick={() => onChange(opt)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-base font-medium transition-all ${
                  answer === opt
                    ? "border-indigo-500 bg-indigo-50 text-indigo-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/30"
                } disabled:opacity-60`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
