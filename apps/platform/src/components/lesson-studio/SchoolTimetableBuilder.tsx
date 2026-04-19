"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Lock,
  Plus,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getDefaultSchoolDay,
  getPeriodsForKeyStage,
  getLunchSlot,
  getKeyStageForYearGroup,
} from "@/lib/lesson-studio/timetable-config";
import {
  detectClashes,
  validatePPA,
} from "@/lib/lesson-studio/timetable-constraints";
import type { TimetableSlotInput } from "@/lib/lesson-studio/timetable-constraints";
import { SUBJECT_COLORS, DAY_NAMES } from "@/types/lesson-studio";
import type { LSClass } from "@/types/lesson-studio";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SchoolTimetableBuilderProps {
  classes: LSClass[];
  organizationId: string;
  onComplete: () => void;
  onCancel: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECTS = [
  "Maths",
  "English",
  "Science",
  "History",
  "Geography",
  "Art",
  "DT",
  "Music",
  "RE",
  "PE",
  "PSHE",
  "Computing",
  "French",
  "Spanish",
  "Phonics",
  "PPA",
];

const PE_RESOURCES = ["Main Hall", "Playground", "Swimming Pool"];

const ROTATING_SUBJECTS = [
  "History",
  "Geography",
  "Art",
  "DT",
  "Music",
  "RE",
  "PSHE",
  "Computing",
];

// Key: "classId|day|periodId", Value: subject
type SlotMap = Map<string, string>;
// Resource: "classId|day|periodId" -> resource name (for PE etc.)
type ResourceMap = Map<string, string>;

// ─── Key stage ordering ───────────────────────────────────────────────────────

const YEAR_ORDER = [
  "Nursery",
  "Reception",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
];

function yearSortKey(yg: string): number {
  const idx = YEAR_ORDER.findIndex((y) => yg.startsWith(y) || yg === y);
  return idx === -1 ? 99 : idx;
}

function getKeyStageLabel(yearGroup: string): string | null {
  if (yearGroup === "Nursery" || yearGroup === "Reception") return "EYFS";
  if (yearGroup.startsWith("Year 1") || yearGroup.startsWith("Year 2"))
    return "KS1";
  if (yearGroup.startsWith("Year 3") || yearGroup.startsWith("Year 4"))
    return "Lower KS2";
  if (yearGroup.startsWith("Year 5") || yearGroup.startsWith("Year 6"))
    return "Upper KS2";
  return null;
}

// ─── Cell key helpers ─────────────────────────────────────────────────────────

function cellKey(classId: string, day: number, periodId: string): string {
  return `${classId}|${day}|${periodId}`;
}

// ─── Auto-fill algorithm ──────────────────────────────────────────────────────

function autoFillTimetable(
  currentSlots: SlotMap,
  currentResources: ResourceMap,
  classes: LSClass[],
): { slots: SlotMap; resources: ResourceMap } {
  const schoolDay = getDefaultSchoolDay();
  const newSlots = new Map(currentSlots);
  const newResources = new Map(currentResources);

  // Track how many times each subject has been used per class per week
  const classCounts: Map<string, Record<string, number>> = new Map();
  // Track resource usage: "resource|day|periodId" -> classId[]
  const resourceUsage: Map<string, string[]> = new Map();

  // Helper to check resource availability
  function isResourceAvailable(
    resource: string,
    day: number,
    periodId: string,
    classId: string,
  ): boolean {
    const key = `${resource}|${day}|${periodId}`;
    const users = resourceUsage.get(key) || [];
    return users.length === 0 || users.every((c) => c === classId);
  }

  function claimResource(
    resource: string,
    day: number,
    periodId: string,
    classId: string,
  ) {
    const key = `${resource}|${day}|${periodId}`;
    const users = resourceUsage.get(key) || [];
    if (!users.includes(classId)) {
      resourceUsage.set(key, [...users, classId]);
    }
  }

  // Pre-populate resource usage from existing slots
  for (const [k, subject] of newSlots.entries()) {
    const resource = newResources.get(k);
    if (resource) {
      const [classId, dayStr, periodId] = k.split("|");
      claimResource(resource, parseInt(dayStr), periodId, classId);
    }
    // Count existing subject usage per class
    const [classId, , ] = k.split("|");
    if (!classCounts.has(classId)) classCounts.set(classId, {});
    const counts = classCounts.get(classId)!;
    counts[subject] = (counts[subject] || 0) + 1;
  }

  // Sort classes for deterministic fill
  const sortedClasses = [...classes].sort(
    (a, b) => yearSortKey(a.year_group) - yearSortKey(b.year_group),
  );

  for (const cls of sortedClasses) {
    const ks = getKeyStageForYearGroup(cls.year_group);
    const periods = getPeriodsForKeyStage(schoolDay, ks === "unknown" ? "KS2" : ks);
    if (!classCounts.has(cls.id)) classCounts.set(cls.id, {});
    const counts = classCounts.get(cls.id)!;

    let rotatingIdx = 0;

    // First pass: assign required subjects
    for (let day = 1; day <= 5; day++) {
      for (const period of periods) {
        const k = cellKey(cls.id, day, period.id);

        // Skip if already filled
        if (newSlots.has(k)) continue;

        // Friday period-1 = Assembly (fixed, locked)
        if (day === 5 && period.id === "period-1") {
          newSlots.set(k, "Assembly");
          continue;
        }

        // Wednesday PM period-4 = PPA (one per class max)
        if (day === 3 && period.id === "period-4" && !counts["PPA"]) {
          newSlots.set(k, "PPA");
          counts["PPA"] = 1;
          continue;
        }

        // Assign required subjects based on key stage targets
        // Maths: 5/week
        if ((counts["Maths"] || 0) < 5) {
          newSlots.set(k, "Maths");
          counts["Maths"] = (counts["Maths"] || 0) + 1;
          continue;
        }

        // English: 5/week
        if ((counts["English"] || 0) < 5) {
          newSlots.set(k, "English");
          counts["English"] = (counts["English"] || 0) + 1;
          continue;
        }

        // Phonics: KS1 only, 5/week
        if (ks === "KS1" && (counts["Phonics"] || 0) < 5) {
          newSlots.set(k, "Phonics");
          counts["Phonics"] = (counts["Phonics"] || 0) + 1;
          continue;
        }

        // Science: KS2 only, 2/week
        if (ks === "KS2" && (counts["Science"] || 0) < 2) {
          newSlots.set(k, "Science");
          counts["Science"] = (counts["Science"] || 0) + 1;
          continue;
        }

        // PE: 2/week with resource
        if ((counts["PE"] || 0) < 2) {
          // Find available PE resource
          const peResource = PE_RESOURCES.find((r) =>
            isResourceAvailable(r, day, period.id, cls.id),
          );
          if (peResource) {
            newSlots.set(k, "PE");
            newResources.set(k, peResource);
            claimResource(peResource, day, period.id, cls.id);
            counts["PE"] = (counts["PE"] || 0) + 1;
            continue;
          }
        }

        // Rotating subjects for remaining slots
        const subject = ROTATING_SUBJECTS[rotatingIdx % ROTATING_SUBJECTS.length];
        rotatingIdx++;
        newSlots.set(k, subject);
        counts[subject] = (counts[subject] || 0) + 1;
      }
    }
  }

  return { slots: newSlots, resources: newResources };
}

// ─── Subject picker dropdown ──────────────────────────────────────────────────

interface SubjectPickerProps {
  value: string;
  onChange: (subject: string, resource?: string) => void;
  onClose: () => void;
}

function SubjectPicker({ value, onChange, onClose }: SubjectPickerProps) {
  const [selectedSubject, setSelectedSubject] = useState(value || "");
  const [selectedResource, setSelectedResource] = useState("");
  const needsResource =
    selectedSubject === "PE" || selectedSubject === "Swimming";

  return (
    <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl p-2 w-48">
      <div className="grid grid-cols-2 gap-1 mb-2">
        {SUBJECTS.map((s) => {
          const colors = SUBJECT_COLORS[s];
          const isSelected = selectedSubject === s;
          return (
            <button
              key={s}
              onClick={() => {
                setSelectedSubject(s);
                if (s !== "PE" && s !== "Swimming") {
                  onChange(s);
                  onClose();
                }
              }}
              className={`text-[10px] px-2 py-1 rounded-lg font-medium transition-all text-left truncate ${
                isSelected
                  ? (colors
                    ? `${colors.bg} ${colors.text} ${colors.border} border`
                    : "bg-teal-100 text-teal-700 border border-teal-300")
                  : "hover:bg-slate-100 text-slate-600"
              }`}
            >
              {s}
            </button>
          );
        })}
        <button
          onClick={() => {
            onChange("", undefined);
            onClose();
          }}
          className="text-[10px] px-2 py-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 text-left col-span-2"
        >
          Clear
        </button>
      </div>
      {needsResource && (
        <div className="border-t border-slate-100 pt-2">
          <div className="text-[9px] text-slate-400 mb-1 font-semibold uppercase tracking-wide">
            Resource
          </div>
          {PE_RESOURCES.map((r) => (
            <button
              key={r}
              onClick={() => {
                setSelectedResource(r);
                onChange(selectedSubject, r);
                onClose();
              }}
              className={`block w-full text-left text-[10px] px-2 py-1 rounded-lg hover:bg-orange-50 hover:text-orange-700 transition-colors ${
                selectedResource === r
                  ? "bg-orange-100 text-orange-700"
                  : "text-slate-600"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cell component ───────────────────────────────────────────────────────────

interface TimetableCellProps {
  subject: string;
  resource?: string;
  isFixed: boolean;
  isLunch: boolean;
  lunchTime?: { start: string; end: string };
  hasClash: boolean;
  isEYFS?: boolean;
  colSpan?: number;
  onChange: (subject: string, resource?: string) => void;
}

function TimetableCell({
  subject,
  resource,
  isFixed,
  isLunch,
  lunchTime,
  hasClash,
  isEYFS,
  onChange,
}: TimetableCellProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (isLunch && lunchTime) {
    return (
      <td className="px-1 py-1 text-center bg-amber-50 border border-amber-100">
        <div className="text-[9px] font-medium text-amber-600">
          {lunchTime.start}–{lunchTime.end}
        </div>
        <div className="text-[8px] text-amber-400">Lunch</div>
      </td>
    );
  }

  if (isFixed) {
    return (
      <td className="px-1 py-1 bg-violet-50 border border-violet-100">
        <div className="flex items-center gap-1 px-1">
          <Lock className="w-2.5 h-2.5 text-violet-400 flex-shrink-0" />
          <span className="text-[9px] font-medium text-violet-700 truncate">
            {subject || "Assembly"}
          </span>
        </div>
      </td>
    );
  }

  const colors = subject
    ? SUBJECT_COLORS[subject] ?? {
        bg: "bg-slate-50",
        text: "text-slate-600",
        border: "border-slate-200",
      }
    : null;

  return (
    <td className={`px-0.5 py-0.5 relative ${isEYFS ? "w-28" : "w-20"}`}>
      <button
        onClick={() => setPickerOpen((v) => !v)}
        className={`w-full h-full min-h-[36px] rounded-lg border transition-all text-left px-1.5 py-1 ${
          hasClash
            ? "bg-red-50 border-red-400 border-2"
            : subject && colors
            ? `${colors.bg} ${colors.border} border`
            : "border-dashed border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50"
        }`}
        title={subject || "Click to assign subject"}
      >
        {subject ? (
          <div className="flex items-center gap-0.5">
            {hasClash && (
              <AlertTriangle className="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
            )}
            <span
              className={`text-[9px] font-semibold truncate ${colors ? colors.text : "text-slate-700"}`}
            >
              {subject}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center opacity-30">
            <Plus className="w-3 h-3 text-slate-400" />
          </div>
        )}
        {resource && (
          <div className="text-[8px] text-slate-400 truncate mt-0.5">
            {resource}
          </div>
        )}
      </button>
      {pickerOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setPickerOpen(false)}
          />
          <SubjectPicker
            value={subject}
            onChange={(s, r) => {
              onChange(s, r);
              setPickerOpen(false);
            }}
            onClose={() => setPickerOpen(false)}
          />
        </>
      )}
    </td>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SchoolTimetableBuilder({
  classes,
  organizationId,
  onComplete,
  onCancel,
}: SchoolTimetableBuilderProps) {
  const [step, setStep] = useState<"grid" | "review">("grid");
  const [selectedDay, setSelectedDay] = useState(1);
  const [slots, setSlots] = useState<SlotMap>(new Map());
  const [resources, setResources] = useState<ResourceMap>(new Map());
  const [saving, setSaving] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);

  const schoolDay = useMemo(() => getDefaultSchoolDay(), []);

  // Sort classes by year group
  const sortedClasses = useMemo(
    () =>
      [...classes].sort(
        (a, b) => yearSortKey(a.year_group) - yearSortKey(b.year_group),
      ),
    [classes],
  );

  // Build periods columns for KS2 (used as the reference)
  const ks2Periods = useMemo(
    () => getPeriodsForKeyStage(schoolDay, "KS2"),
    [schoolDay],
  );

  // Build all TimetableSlotInputs for clash detection
  const allSlotInputs = useMemo((): TimetableSlotInput[] => {
    const inputs: TimetableSlotInput[] = [];
    for (const [k, subject] of slots.entries()) {
      if (!subject) continue;
      const [classId, dayStr, periodId] = k.split("|");
      // Find period times
      const allPeriods = [
        ...getPeriodsForKeyStage(schoolDay, "KS2"),
        ...getPeriodsForKeyStage(schoolDay, "EYFS"),
      ];
      const period = allPeriods.find((p) => p.id === periodId);
      if (!period) continue;
      inputs.push({
        classId,
        day: parseInt(dayStr),
        start: period.start,
        end: period.end,
        subject,
        resource: resources.get(k),
      });
    }
    return inputs;
  }, [slots, resources, schoolDay]);

  const clashes = useMemo(
    () => detectClashes(allSlotInputs),
    [allSlotInputs],
  );

  const ppaIssues = useMemo(
    () => validatePPA(allSlotInputs, sortedClasses.map((c) => c.id)),
    [allSlotInputs, sortedClasses],
  );

  // Build clash set for quick cell lookup: "classId|day|periodId"
  const clashSet = useMemo(() => {
    const set = new Set<string>();
    for (const clash of clashes) {
      for (const classId of clash.classIds) {
        // Find period by start time
        const period = ks2Periods.find((p) => p.start === clash.start);
        if (period) {
          set.add(cellKey(classId, clash.day, period.id));
        }
      }
    }
    return set;
  }, [clashes, ks2Periods]);

  // Progress tracking
  const { totalSlots, filledSlots } = useMemo(() => {
    let total = 0;
    let filled = 0;
    for (const cls of sortedClasses) {
      const ks = getKeyStageForYearGroup(cls.year_group);
      const periods = getPeriodsForKeyStage(
        schoolDay,
        ks === "unknown" ? "KS2" : ks,
      );
      for (let day = 1; day <= 5; day++) {
        total += periods.length;
        for (const period of periods) {
          const k = cellKey(cls.id, day, period.id);
          if (slots.has(k) && slots.get(k)) filled++;
        }
      }
    }
    return { totalSlots: total, filledSlots: filled };
  }, [slots, sortedClasses, schoolDay]);

  // Per-class slot count
  function getClassProgress(classId: string) {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return { filled: 0, total: 0 };
    const ks = getKeyStageForYearGroup(cls.year_group);
    const periods = getPeriodsForKeyStage(
      schoolDay,
      ks === "unknown" ? "KS2" : ks,
    );
    let filled = 0;
    const total = periods.length * 5;
    for (let day = 1; day <= 5; day++) {
      for (const period of periods) {
        const k = cellKey(classId, day, period.id);
        if (slots.has(k) && slots.get(k)) filled++;
      }
    }
    return { filled, total };
  }

  // Handle cell change
  const handleCellChange = useCallback(
    (classId: string, day: number, periodId: string, subject: string, resource?: string) => {
      setSlots((prev) => {
        const next = new Map(prev);
        const k = cellKey(classId, day, periodId);
        if (subject) {
          next.set(k, subject);
        } else {
          next.delete(k);
        }
        return next;
      });
      setResources((prev) => {
        const next = new Map(prev);
        const k = cellKey(classId, day, periodId);
        if (resource) {
          next.set(k, resource);
        } else {
          next.delete(k);
        }
        return next;
      });
    },
    [],
  );

  // Auto-fill
  const handleAutoFill = useCallback(() => {
    setAutoFilling(true);
    setTimeout(() => {
      const { slots: newSlots, resources: newResources } = autoFillTimetable(
        slots,
        resources,
        sortedClasses,
      );
      setSlots(newSlots);
      setResources(newResources);
      setAutoFilling(false);
    }, 300);
  }, [slots, resources, sortedClasses]);

  // Save timetable
  const handleSave = useCallback(async () => {
    if (clashes.length > 0) return;
    setSaving(true);
    try {
      // Build all slot objects to insert
      const toInsert: Array<{
        organization_id: string;
        class_id: string;
        day_of_week: number;
        start_time: string;
        end_time: string;
        subject: string;
        room: string | null;
      }> = [];

      for (const cls of sortedClasses) {
        // Delete existing slots for this class
        await supabase
          .from("ls_timetable_slots")
          .delete()
          .eq("organization_id", organizationId)
          .eq("class_id", cls.id);

        const ks = getKeyStageForYearGroup(cls.year_group);
        const periods = getPeriodsForKeyStage(
          schoolDay,
          ks === "unknown" ? "KS2" : ks,
        );

        for (let day = 1; day <= 5; day++) {
          for (const period of periods) {
            const k = cellKey(cls.id, day, period.id);
            const subject = slots.get(k);
            if (!subject) continue;
            toInsert.push({
              organization_id: organizationId,
              class_id: cls.id,
              day_of_week: day,
              start_time: period.start,
              end_time: period.end,
              subject,
              room: resources.get(k) || null,
            });
          }
        }
      }

      if (toInsert.length > 0) {
        const { error } = await supabase
          .from("ls_timetable_slots")
          .insert(toInsert);
        if (error) throw error;
      }

      onComplete();
    } catch (err) {
      console.error("Failed to save timetable:", err);
    } finally {
      setSaving(false);
    }
  }, [slots, resources, sortedClasses, organizationId, schoolDay, clashes, onComplete]);

  // ─── Step 1: Grid ───────────────────────────────────────────────────────────

  if (step === "grid") {
    let lastKS: string | null = null;

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              School Timetable Builder
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {filledSlots} / {totalSlots} slots filled across {sortedClasses.length} classes
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Clash warning */}
            {clashes.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {clashes.length} clash{clashes.length > 1 ? "es" : ""}
              </div>
            )}
            {/* PPA warning */}
            {ppaIssues.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {ppaIssues.length} class{ppaIssues.length > 1 ? "es" : ""} missing PPA
              </div>
            )}
            {/* Auto-fill */}
            <button
              onClick={handleAutoFill}
              disabled={autoFilling}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {autoFilling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              AI Auto-Fill
            </button>
            {/* Review */}
            <button
              onClick={() => setStep("review")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Review & Save
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex items-center gap-1 px-6 py-2 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <span className="text-xs font-semibold text-slate-500 mr-2">Day:</span>
          {([1, 2, 3, 4, 5] as const).map((dow) => (
            <button
              key={dow}
              onClick={() => setSelectedDay(dow)}
              className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                selectedDay === dow
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {DAY_NAMES[dow].slice(0, 3)}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-slate-400">
            Click any cell to assign a subject
          </span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs border-collapse min-w-[900px]">
            <thead className="sticky top-0 z-20 bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="text-left px-3 py-2.5 font-semibold text-slate-600 w-40 sticky left-0 bg-slate-50 z-30 border-r border-slate-200">
                  Class
                </th>
                {/* Period columns for the selected day */}
                {ks2Periods.map((period) => (
                  <th
                    key={period.id}
                    className="text-center px-2 py-2 font-semibold text-slate-600 text-[10px] w-24"
                  >
                    <div>{period.label}</div>
                    <div className="text-[9px] text-slate-400 font-normal">
                      {period.start}–{period.end}
                    </div>
                  </th>
                ))}
                <th className="text-center px-2 py-2 font-semibold text-slate-400 text-[10px] w-20 bg-amber-50">
                  Lunch
                </th>
                <th className="text-center px-2 py-2 font-semibold text-slate-500 text-[10px] w-20 border-l border-slate-200">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedClasses.map((cls) => {
                const ks = getKeyStageForYearGroup(cls.year_group);
                const isEYFS = ks === "EYFS";
                const periods = getPeriodsForKeyStage(
                  schoolDay,
                  ks === "unknown" ? "KS2" : ks,
                );
                const lunchSlot = getLunchSlot(schoolDay, cls.year_group);
                const { filled, total } = getClassProgress(cls.id);

                // Key stage separator
                const ksLabel = getKeyStageLabel(cls.year_group);
                let separatorRow: React.ReactNode = null;
                if (ksLabel && ksLabel !== lastKS) {
                  lastKS = ksLabel;
                  separatorRow = (
                    <tr
                      key={`ks-${ksLabel}`}
                      className="bg-slate-100 border-t-2 border-slate-200"
                    >
                      <td
                        colSpan={ks2Periods.length + 3}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500"
                      >
                        {ksLabel}
                      </td>
                    </tr>
                  );
                }

                // Assembly check: Friday period-1
                const assemblyPeriodId = "period-1";
                const isAssemblyDay = selectedDay === 5;

                return (
                  <React.Fragment key={cls.id}>
                    {separatorRow}
                    <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                      {/* Class name */}
                      <td className="px-3 py-2 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 border-r border-slate-200 transition-colors">
                        <div className="font-semibold text-slate-800 text-[11px] leading-tight truncate max-w-[140px]">
                          {cls.class_name}
                        </div>
                        <div className="text-[9px] text-slate-400 leading-tight mt-0.5">
                          {cls.year_group}
                          {isEYFS && (
                            <span className="ml-1 text-teal-600 font-medium">
                              EYFS
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Period cells */}
                      {isEYFS ? (
                        // EYFS: 3 wider columns (morning + 2 afternoon)
                        <>
                          {/* Morning block spans first 3 KS2 columns */}
                          {periods.map((period, pIdx) => {
                            const k = cellKey(cls.id, selectedDay, period.id);
                            const subject = slots.get(k) || "";
                            const resource = resources.get(k);
                            const hasClash = clashSet.has(k);
                            const isFixed = false; // EYFS doesn't have assembly

                            return (
                              <td
                                key={period.id}
                                colSpan={
                                  pIdx === 0
                                    ? Math.max(1, ks2Periods.length - 2)
                                    : 1
                                }
                                className="px-0.5 py-0.5 relative"
                              >
                                <TimetableCell
                                  subject={subject}
                                  resource={resource}
                                  isFixed={isFixed}
                                  isLunch={false}
                                  hasClash={hasClash}
                                  isEYFS={true}
                                  onChange={(s, r) =>
                                    handleCellChange(cls.id, selectedDay, period.id, s, r)
                                  }
                                />
                              </td>
                            );
                          })}
                          {/* Fill remaining columns if EYFS has fewer periods */}
                          {periods.length < ks2Periods.length &&
                            Array.from({
                              length: ks2Periods.length - periods.length,
                            }).map((_, i) => <td key={`pad-${i}`} />)}
                        </>
                      ) : (
                        // KS1/KS2: standard 5 periods
                        ks2Periods.map((period) => {
                          const k = cellKey(cls.id, selectedDay, period.id);
                          const subject = slots.get(k) || "";
                          const resource = resources.get(k);
                          const hasClash = clashSet.has(k);
                          const isFixed =
                            isAssemblyDay && period.id === assemblyPeriodId;

                          return (
                            <TimetableCell
                              key={period.id}
                              subject={isFixed ? "Assembly" : subject}
                              resource={resource}
                              isFixed={isFixed}
                              isLunch={false}
                              hasClash={hasClash}
                              onChange={(s, r) =>
                                handleCellChange(cls.id, selectedDay, period.id, s, r)
                              }
                            />
                          );
                        })
                      )}

                      {/* Lunch cell */}
                      <TimetableCell
                        subject=""
                        isFixed={false}
                        isLunch={true}
                        lunchTime={lunchSlot}
                        hasClash={false}
                        onChange={() => {}}
                      />

                      {/* Progress cell */}
                      <td className="px-2 py-1.5 text-center border-l border-slate-200">
                        <div
                          className={`text-[10px] font-bold ${
                            filled === total
                              ? "text-green-600"
                              : filled > total * 0.7
                              ? "text-amber-600"
                              : "text-slate-400"
                          }`}
                        >
                          {filled}/{total}
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1 mt-1">
                          <div
                            className={`h-1 rounded-full transition-all ${
                              filled === total
                                ? "bg-green-500"
                                : "bg-teal-400"
                            }`}
                            style={{
                              width: `${Math.min(100, (filled / (total || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom bar */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-4 text-[10px] text-slate-400 flex-shrink-0">
          <span>
            <span className="font-semibold text-teal-600">{filledSlots}</span> /{" "}
            {totalSlots} slots filled
          </span>
          {clashes.length > 0 && (
            <span className="text-red-500 font-medium">
              {clashes.length} resource clash{clashes.length > 1 ? "es" : ""} — fix before saving
            </span>
          )}
          {ppaIssues.length > 0 && (
            <span className="text-amber-600">
              {ppaIssues.length} class{ppaIssues.length > 1 ? "es" : ""} need PPA
            </span>
          )}
          <span className="ml-auto">
            Violet cells = locked (Assembly). Amber cells = Lunch.
          </span>
        </div>
      </div>
    );
  }

  // ─── Step 2: Review & Save ──────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-800">
            Review & Save Timetable
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Check coverage before saving to all classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStep("grid")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Back to Grid
          </button>
          <button
            onClick={handleSave}
            disabled={saving || clashes.length > 0}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            {saving ? "Saving..." : "Save Timetable"}
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {/* Overall stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-teal-600">{filledSlots}</div>
            <div className="text-xs text-slate-500 mt-1">
              Slots filled of {totalSlots}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-teal-500 h-1.5 rounded-full"
                style={{
                  width: `${Math.min(100, (filledSlots / (totalSlots || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div
            className={`rounded-xl p-4 text-center ${
              clashes.length === 0
                ? "bg-green-50"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                clashes.length === 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {clashes.length}
            </div>
            <div
              className={`text-xs mt-1 ${
                clashes.length === 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              Resource clashes
              {clashes.length > 0 && " — must fix"}
            </div>
          </div>
          <div
            className={`rounded-xl p-4 text-center ${
              ppaIssues.length === 0 ? "bg-green-50" : "bg-amber-50"
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                ppaIssues.length === 0 ? "text-green-600" : "text-amber-600"
              }`}
            >
              {sortedClasses.length - ppaIssues.length}/{sortedClasses.length}
            </div>
            <div
              className={`text-xs mt-1 ${
                ppaIssues.length === 0 ? "text-green-600" : "text-amber-600"
              }`}
            >
              Classes with PPA
            </div>
          </div>
        </div>

        {/* Clash details */}
        {clashes.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-red-700 mb-2">
              Resource Clashes (must resolve before saving)
            </h3>
            <ul className="space-y-1">
              {clashes.map((clash, i) => (
                <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {clash.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Per-class PPA coverage */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">
              Class Coverage
            </h3>
          </div>
          <div className="divide-y divide-slate-100">
            {sortedClasses.map((cls) => {
              const { filled, total } = getClassProgress(cls.id);
              const hasPPA = !ppaIssues.find((i) => i.classId === cls.id);
              const pct = Math.round((filled / (total || 1)) * 100);
              return (
                <div
                  key={cls.id}
                  className="flex items-center gap-4 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-32 flex-shrink-0">
                    <div className="text-xs font-semibold text-slate-700 truncate">
                      {cls.class_name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {cls.year_group}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-500">
                        {filled}/{total} slots
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          pct === 100 ? "text-green-600" : "text-amber-600"
                        }`}
                      >
                        {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          pct === 100 ? "bg-green-500" : "bg-teal-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {hasPPA ? (
                      <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        PPA
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        No PPA
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      {clashes.length > 0 && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200 text-xs text-red-700 flex-shrink-0">
          You must resolve all resource clashes before saving. Go back to the grid and fix the highlighted cells.
        </div>
      )}
    </div>
  );
}
