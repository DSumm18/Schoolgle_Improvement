"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { getSchemeProgression, type SchemeUnit } from "@/lib/lesson-studio/scheme-registry";
import { BookOpen, ChevronDown, ChevronRight, ArrowRight, CheckCircle2, Circle } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopicContext {
  unitName: string;
  keyTopics: string[];
  ncCodes: string[];
  weekRange: string;
}

interface CurriculumProgressionViewProps {
  classId: string;
  subject: string;
  yearGroup: string;
  schemeName: string;
  onSelectTopic: (topic: TopicContext) => void;
}

type UnitStatus = "taught" | "in_progress" | "not_started";

interface UnitWithStatus extends SchemeUnit {
  status: UnitStatus;
  lessonCount: number;
  taughtCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrentTerm(): string {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 9 && month <= 12) return "Autumn";
  if (month >= 1 && month <= 3) return "Spring";
  return "Summer";
}

function normaliseUnitName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CurriculumProgressionView({
  classId,
  subject,
  yearGroup,
  schemeName,
  onSelectTopic,
}: CurriculumProgressionViewProps) {
  const currentTerm = useMemo(() => getCurrentTerm(), []);
  const [term, setTerm] = useState<string>(currentTerm);
  const [taughtUnits, setTaughtUnits] = useState<Record<string, number>>({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  // Fetch lessons to determine what's been covered
  useEffect(() => {
    if (!classId) return;
    setLoadingPlans(true);
    supabase
      .from("ls_lesson_plans")
      .select("unit_name, scheme_step, status")
      .eq("class_id", classId)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        for (const plan of data || []) {
          const rawName = plan.unit_name || plan.scheme_step || "";
          const key = normaliseUnitName(rawName);
          if (key) {
            counts[key] = (counts[key] || 0) + 1;
          }
        }
        setTaughtUnits(counts);
        setLoadingPlans(false);
      })
      .catch(() => setLoadingPlans(false));
  }, [classId]);

  // Get scheme units for selected term
  const schemeUnits = useMemo(
    () => getSchemeProgression(schemeName, yearGroup, term),
    [schemeName, yearGroup, term]
  );

  // Enrich units with status
  const unitsWithStatus = useMemo((): UnitWithStatus[] => {
    let foundCurrent = false;
    return schemeUnits.map((unit) => {
      const key = normaliseUnitName(unit.unitName);
      const lessonCount = Math.round(unit.suggestedHours / 1); // estimate 1 lesson per hour roughly
      const taughtCount = taughtUnits[key] || 0;

      let status: UnitStatus;
      if (taughtCount >= 2) {
        status = "taught";
      } else if (taughtCount > 0 && !foundCurrent) {
        status = "in_progress";
        foundCurrent = true;
      } else if (!foundCurrent) {
        // First unit with no lessons is "in_progress" (current)
        status = "in_progress";
        foundCurrent = true;
      } else {
        status = "not_started";
      }

      return { ...unit, status, lessonCount, taughtCount };
    });
  }, [schemeUnits, taughtUnits]);

  // Calculate overall coverage
  const taughtUnitCount = unitsWithStatus.filter((u) => u.status === "taught").length;
  const totalUnits = unitsWithStatus.length;
  const coveragePercent = totalUnits > 0 ? Math.round((taughtUnitCount / totalUnits) * 100) : 0;

  // Find the current/next unit to act on
  const currentUnit = unitsWithStatus.find(
    (u) => u.status === "in_progress" || u.status === "not_started"
  );

  const TERMS = ["Autumn", "Spring", "Summer"];

  if (schemeUnits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Curriculum Progression</h2>
            <p className="text-xs text-slate-500">{schemeName} — {yearGroup}</p>
          </div>
        </div>
        <div className="text-center py-8 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No scheme data available</p>
          <p className="text-xs mt-1">
            Progression data is currently available for White Rose Maths Year 6.
            More year groups coming soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Curriculum Progression</h2>
              <p className="text-xs text-slate-500">White Rose Maths — Year 6</p>
            </div>
          </div>

          {/* Term selector */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
            {TERMS.map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                  term === t
                    ? "bg-white shadow-sm text-slate-800"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Coverage bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">
              {term} Term: {taughtUnitCount} of {totalUnits} units covered
            </span>
            <span className="text-xs font-bold text-slate-700">{coveragePercent}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${coveragePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Units list */}
      <div className="p-4 space-y-2">
        {loadingPlans ? (
          <div className="text-center py-6 text-slate-400 text-sm">Loading progress...</div>
        ) : (
          unitsWithStatus.map((unit, idx) => (
            <UnitCard
              key={unit.unitName}
              unit={unit}
              isLast={idx === unitsWithStatus.length - 1}
              isExpanded={expandedUnit === unit.unitName}
              onToggle={() =>
                setExpandedUnit((prev) =>
                  prev === unit.unitName ? null : unit.unitName
                )
              }
              onSelectTopic={onSelectTopic}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UnitCard sub-component
// ---------------------------------------------------------------------------

function UnitCard({
  unit,
  isLast,
  isExpanded,
  onToggle,
  onSelectTopic,
}: {
  unit: UnitWithStatus;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectTopic: (topic: TopicContext) => void;
}) {
  const statusConfig = {
    taught: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
      border: "border-emerald-100",
      bg: "bg-emerald-50/40",
      badge: "bg-emerald-100 text-emerald-700",
      badgeLabel: "Taught",
      dotColor: "bg-emerald-400",
    },
    in_progress: {
      icon: (
        <div className="w-5 h-5 flex-shrink-0 relative">
          <div className="w-5 h-5 rounded-full border-2 border-amber-400 bg-amber-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
        </div>
      ),
      border: "border-amber-200",
      bg: "bg-amber-50/60",
      badge: "bg-amber-100 text-amber-700",
      badgeLabel: "Current",
      dotColor: "bg-amber-400",
    },
    not_started: {
      icon: <Circle className="w-5 h-5 text-slate-300 flex-shrink-0" />,
      border: "border-slate-100",
      bg: "bg-white",
      badge: "bg-slate-100 text-slate-500",
      badgeLabel: "Not started",
      dotColor: "bg-slate-200",
    },
  };

  const cfg = statusConfig[unit.status];

  return (
    <div className="relative">
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-[18px] top-[40px] bottom-[-12px] w-0.5 bg-slate-100 z-0" />
      )}

      <div
        className={`relative z-10 rounded-xl border ${cfg.border} ${cfg.bg} transition-all duration-200 ${
          unit.status === "in_progress" ? "shadow-sm shadow-amber-100" : ""
        }`}
      >
        {/* Main row */}
        <div
          className="flex items-center gap-3 p-3 cursor-pointer"
          onClick={onToggle}
        >
          {/* Status icon */}
          {cfg.icon}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-sm font-semibold ${
                  unit.status === "not_started" ? "text-slate-500" : "text-slate-800"
                }`}
              >
                {unit.unitName}
              </span>
              <span className="text-[10px] text-slate-400">{unit.weekRange}</span>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.badgeLabel}
              </span>
            </div>
            {/* Key topics preview */}
            <div className="flex gap-1 flex-wrap mt-1">
              {unit.keyTopics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full"
                >
                  {topic}
                </span>
              ))}
              {unit.keyTopics.length > 3 && (
                <span className="text-[10px] text-slate-400">
                  +{unit.keyTopics.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Lesson count + expand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {unit.taughtCount > 0 && (
              <span className="text-[10px] text-slate-500">
                {unit.taughtCount} lesson{unit.taughtCount !== 1 ? "s" : ""} planned
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* Expanded detail */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-1 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* All key topics */}
              <div>
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  Key Topics
                </h4>
                <ul className="space-y-1">
                  {unit.keyTopics.map((t) => (
                    <li key={t} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="text-slate-300 mt-0.5">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* NC codes */}
              <div>
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                  NC Codes
                </h4>
                <div className="flex flex-wrap gap-1">
                  {unit.ncCodes.map((code) => (
                    <span
                      key={code}
                      className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded"
                    >
                      {code}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Suggested: ~{unit.suggestedHours} hours
                </p>
              </div>
            </div>

            {/* Plan next lesson CTA */}
            {unit.status !== "taught" && (
              <button
                onClick={() =>
                  onSelectTopic({
                    unitName: unit.unitName,
                    keyTopics: unit.keyTopics,
                    ncCodes: unit.ncCodes,
                    weekRange: unit.weekRange,
                  })
                }
                className="inline-flex items-center gap-2 px-3 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                Plan Next Lesson
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
