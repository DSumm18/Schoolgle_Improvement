"use client";

import React, { useState } from "react";
import {
  X, BookOpen, Target, Sparkles, Users, Brain, FileText,
  Zap, Pencil, ClipboardList, Presentation, Download,
} from "lucide-react";
import type { LSLessonPlan, LSTimetableSlot, LSPupil, PlanSection, DifferentiationGroup, SENDAdaptation, VocabularyItem } from "@/types/lesson-studio";
import { AssessmentPanel } from "./AssessmentPanel";
import { LessonVisualisation } from "./LessonVisualisation";
import { SUBJECT_COLORS, STATUS_CONFIG, DAY_NAMES } from "@/types/lesson-studio";

interface LessonPlanPanelProps {
  plan: LSLessonPlan;
  slot: LSTimetableSlot;
  pupils: LSPupil[];
  onClose: () => void;
  onTeach: (planId: string) => void;
  onMarkTaught: (planId: string) => void;
}

const PHASE_ICONS: Record<string, React.ReactNode> = {
  Starter: <Zap className="w-4 h-4 text-amber-500" />,
  Teach: <BookOpen className="w-4 h-4 text-blue-500" />,
  Practice: <Pencil className="w-4 h-4 text-green-500" />,
  Plenary: <Target className="w-4 h-4 text-purple-500" />,
};

const DIFF_COLORS: Record<string, string> = {
  Deeper: "border-blue-400 bg-blue-50 dark:bg-blue-900/20",
  Core: "border-green-400 bg-green-50 dark:bg-green-900/20",
  Scaffold: "border-amber-400 bg-amber-50 dark:bg-amber-900/20",
  Guided: "border-red-400 bg-red-50 dark:bg-red-900/20",
};

export function LessonPlanPanel({ plan, slot, pupils, onClose, onTeach, onMarkTaught }: LessonPlanPanelProps) {
  const [activeTab, setActiveTab] = useState<"plan" | "assessment" | "visualisation">("plan");
  const sc = STATUS_CONFIG[plan.status];
  const subjectColor = SUBJECT_COLORS[plan.subject] ?? SUBJECT_COLORS.English;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className={`sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 ${subjectColor.bg}`}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
                  {sc.label}
                </span>
                <span className="text-xs text-slate-500">
                  {DAY_NAMES[plan.day_of_week]} {slot.start_time.slice(0, 5)}–{slot.end_time.slice(0, 5)}
                </span>
              </div>
              <h2 className={`text-lg font-bold ${subjectColor.text}`}>{plan.title}</h2>
              {plan.scheme_name && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {plan.scheme_name} {plan.scheme_step && `• ${plan.scheme_step}`}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-200/50 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onTeach(plan.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Presentation className="w-3.5 h-3.5" />
              Teach Mode
            </button>
            {plan.status !== "taught" && (
              <button
                onClick={() => onMarkTaught(plan.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-green-300 text-green-700 bg-green-50 text-xs font-medium rounded-lg hover:bg-green-100 transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Lesson Complete
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("plan")}
            className={`flex-1 text-sm py-2.5 px-4 border-b-2 transition-colors ${
              activeTab === "plan"
                ? "font-semibold text-indigo-600 border-indigo-500"
                : "font-medium text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Lesson Plan
          </button>
          <button
            onClick={() => setActiveTab("visualisation")}
            className={`flex-1 text-sm py-2.5 px-4 border-b-2 transition-colors ${
              activeTab === "visualisation"
                ? "font-semibold text-indigo-600 border-indigo-500"
                : "font-medium text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Visualisation
          </button>
          <button
            onClick={() => setActiveTab("assessment")}
            className={`flex-1 text-sm py-2.5 px-4 border-b-2 transition-colors ${
              activeTab === "assessment"
                ? "font-semibold text-indigo-600 border-indigo-500"
                : "font-medium text-gray-500 border-transparent hover:text-gray-700"
            }`}
          >
            Assessment
          </button>
        </div>
      </div>

      {activeTab === "visualisation" ? (
        <div className="p-4">
          <LessonVisualisation plan={plan} />
        </div>
      ) : activeTab === "assessment" ? (
        <div className="p-4">
          <AssessmentPanel lessonPlanId={plan.id} pupils={pupils} />
        </div>
      ) : (
      <div className="p-4 space-y-6">
        {/* Learning Objective */}
        <Section title="Learning Objective" icon={<Target className="w-4 h-4 text-teal-500" />}>
          <p className="text-sm text-slate-700 dark:text-slate-300">{plan.learning_objective}</p>
          {plan.success_criteria?.length > 0 && (
            <ul className="mt-2 space-y-1">
              {plan.success_criteria.map((sc, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="text-teal-500 mt-0.5">✓</span>
                  {sc}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Key Vocabulary */}
        {plan.key_vocabulary?.length > 0 && (
          <Section title="Key Vocabulary" icon={<BookOpen className="w-4 h-4 text-indigo-500" />}>
            <div className="flex flex-wrap gap-2">
              {(plan.key_vocabulary as VocabularyItem[]).map((v, i) => (
                <div key={i} className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{v.word}</span>
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400 block">{v.definition}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Lesson Flow */}
        <Section title="Lesson Flow" icon={<Sparkles className="w-4 h-4 text-amber-500" />}>
          <div className="space-y-3">
            {(plan.plan_sections as PlanSection[]).map((section, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {PHASE_ICONS[section.phase] ?? <FileText className="w-4 h-4 text-slate-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-white">{section.phase}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{section.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Differentiation */}
        {(plan.differentiation_groups as DifferentiationGroup[])?.length > 0 && (
          <Section title="Differentiation Groups" icon={<Users className="w-4 h-4 text-green-500" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(plan.differentiation_groups as DifferentiationGroup[]).map((g, i) => (
                <div key={i} className={`rounded-xl border-l-4 p-3 ${DIFF_COLORS[g.name] ?? "border-slate-300 bg-slate-50 dark:bg-slate-800"}`}>
                  <div className="text-xs font-bold text-slate-800 dark:text-white">{g.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{g.pupils}</div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{g.description}</p>
                  {g.resourceNotes && (
                    <div className="text-[10px] text-slate-400 mt-1 italic">{g.resourceNotes}</div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* SEND Adaptations */}
        {(plan.send_adaptations as SENDAdaptation[])?.length > 0 && (
          <Section title="SEND Adaptations" icon={<Brain className="w-4 h-4 text-purple-500" />}>
            <div className="space-y-2">
              {(plan.send_adaptations as SENDAdaptation[]).map((a, i) => (
                <div key={i} className="flex gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300 whitespace-nowrap">{a.pupilName}:</span>
                  <span className="text-xs text-purple-600 dark:text-purple-400">{a.adaptation}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Supply Brief */}
        {plan.supply_brief && (
          <Section title="Supply Teacher Brief" icon={<FileText className="w-4 h-4 text-rose-500" />}>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{plan.supply_brief}</p>
          </Section>
        )}

        {/* AI metadata */}
        {plan.ai_model && (
          <div className="text-[10px] text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-3">
            Generated by {plan.ai_model} in {((plan.generation_time_ms ?? 0) / 1000).toFixed(1)}s
          </div>
        )}
      </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}
