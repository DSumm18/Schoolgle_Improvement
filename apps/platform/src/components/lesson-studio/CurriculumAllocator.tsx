"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
  getSchemeProgression,
  type SchemeUnit,
} from "@/lib/lesson-studio/scheme-registry";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
  LayoutGrid,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CurriculumAllocatorProps {
  classId: string;
  subject: string;
  yearGroup: string;
  organizationId: string;
  schemeName: string;
}

interface TermAllocationMap {
  [unitName: string]: { startWeek: number; endWeek: number };
}

interface WeekSlot {
  weekNumber: number; // 1-based
  allocatedUnit: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrentTerm(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 9 && month <= 12) return "Autumn";
  if (month >= 1 && month <= 3) return "Spring";
  return "Summer";
}

/**
 * Parses "Weeks 1-3" → { start: 1, end: 3 }
 * Parses "Weeks 6-8" → { start: 6, end: 8 }
 */
function parseWeekRange(weekRange: string): { start: number; end: number } {
  const match = weekRange.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (match) {
    return { start: parseInt(match[1], 10), end: parseInt(match[2], 10) };
  }
  const single = weekRange.match(/(\d+)/);
  if (single) {
    const n = parseInt(single[1], 10);
    return { start: n, end: n };
  }
  return { start: 1, end: 1 };
}

/**
 * Build a list of week slots (1-based) with their allocated unit names.
 * We use the last week that any unit covers as the total number of weeks.
 */
function buildWeekSlots(
  units: SchemeUnit[],
  allocation: TermAllocationMap,
): WeekSlot[] {
  // Determine total weeks from unit data
  let maxWeek = 12; // default
  for (const u of units) {
    const r = parseWeekRange(u.weekRange);
    if (r.end > maxWeek) maxWeek = r.end;
  }

  const slots: WeekSlot[] = [];
  for (let w = 1; w <= maxWeek; w++) {
    let allocated: string | null = null;
    for (const [unitName, range] of Object.entries(allocation)) {
      if (w >= range.startWeek && w <= range.endWeek) {
        allocated = unitName;
        break;
      }
    }
    slots.push({ weekNumber: w, allocatedUnit: allocated });
  }
  return slots;
}

/**
 * Reads existing scheme_config.term_allocation from the ls_scheme_mappings table.
 */
async function loadAllocation(
  classId: string,
  subject: string,
  term: string,
): Promise<TermAllocationMap> {
  const { data } = await supabase
    .from("ls_scheme_mappings")
    .select("scheme_config")
    .eq("class_id", classId)
    .eq("subject", subject)
    .maybeSingle();

  if (!data?.scheme_config) return {};
  const cfg = data.scheme_config as Record<string, unknown>;
  const termAlloc = (cfg.term_allocation as Record<string, TermAllocationMap>)?.[term];
  return termAlloc ?? {};
}

/**
 * Persists the allocation back to scheme_config.term_allocation[term].
 */
async function saveAllocation(
  classId: string,
  subject: string,
  term: string,
  allocation: TermAllocationMap,
): Promise<void> {
  // Load existing config first to avoid clobbering other terms
  const { data: existing } = await supabase
    .from("ls_scheme_mappings")
    .select("id, scheme_config")
    .eq("class_id", classId)
    .eq("subject", subject)
    .maybeSingle();

  if (!existing) return; // No scheme mapping — nothing to save to

  const existingCfg = (existing.scheme_config as Record<string, unknown>) ?? {};
  const existingTermAlloc =
    (existingCfg.term_allocation as Record<string, TermAllocationMap>) ?? {};

  const updatedCfg = {
    ...existingCfg,
    term_allocation: {
      ...existingTermAlloc,
      [term]: allocation,
    },
  };

  await supabase
    .from("ls_scheme_mappings")
    .update({ scheme_config: updatedCfg })
    .eq("id", existing.id);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UnitCard({
  unit,
  isAllocated,
  allocationRange,
  onAllocate,
}: {
  unit: SchemeUnit;
  isAllocated: boolean;
  allocationRange: { startWeek: number; endWeek: number } | null;
  onAllocate: () => void;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isAllocated
          ? "border-teal-200 bg-teal-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {isAllocated ? (
            <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
          ) : (
            <Circle className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 leading-snug">
              {unit.unitName}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{unit.weekRange}</div>
            {isAllocated && allocationRange && (
              <div className="text-xs text-teal-600 mt-0.5 font-medium">
                Allocated: Weeks {allocationRange.startWeek}–{allocationRange.endWeek}
              </div>
            )}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {unit.ncCodes.slice(0, 4).map((code) => (
                <span
                  key={code}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={onAllocate}
          className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0 ${
            isAllocated
              ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
              : "bg-teal-500 text-white hover:bg-teal-600"
          }`}
        >
          {isAllocated ? "Reallocate" : "Allocate"}
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function WeekRow({
  slot,
  isHighlighted,
}: {
  slot: WeekSlot;
  isHighlighted: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
        isHighlighted
          ? "bg-teal-50 border border-teal-100"
          : slot.allocatedUnit
            ? "bg-slate-50 border border-slate-100"
            : "border border-dashed border-slate-200"
      }`}
    >
      <span className="text-xs text-slate-400 font-medium w-14 flex-shrink-0">
        Week {slot.weekNumber}
      </span>
      {slot.allocatedUnit ? (
        <span
          className={`text-xs font-medium truncate ${
            isHighlighted ? "text-teal-700" : "text-slate-600"
          }`}
        >
          {slot.allocatedUnit}
        </span>
      ) : (
        <span className="text-xs text-slate-300 italic">Unallocated</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CurriculumAllocator({
  classId,
  subject,
  yearGroup,
  organizationId,
  schemeName,
}: CurriculumAllocatorProps) {
  const term = useMemo(() => getCurrentTerm(), []);
  const units = useMemo(
    () => getSchemeProgression(schemeName, yearGroup, term),
    [schemeName, yearGroup, term],
  );

  const [allocation, setAllocation] = useState<TermAllocationMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);

  // Load existing allocation
  useEffect(() => {
    if (!classId || !subject) return;
    setLoading(true);
    loadAllocation(classId, subject, term).then((data) => {
      setAllocation(data);
      setLoading(false);
    });
  }, [classId, subject, term]);

  // Week slot list derived from units + allocation
  const weekSlots = useMemo(
    () => buildWeekSlots(units, allocation),
    [units, allocation],
  );

  // Stats
  const allocatedCount = Object.keys(allocation).length;
  const totalUnits = units.length;
  const allocatedWeeks = weekSlots.filter((w) => w.allocatedUnit !== null).length;
  const totalWeeks = weekSlots.length;
  const progressPct =
    totalWeeks > 0 ? Math.round((allocatedWeeks / totalWeeks) * 100) : 0;

  // Find the next unallocated start week
  const nextFreeWeek = useMemo(() => {
    const usedWeeks = new Set<number>();
    for (const r of Object.values(allocation)) {
      for (let w = r.startWeek; w <= r.endWeek; w++) {
        usedWeeks.add(w);
      }
    }
    for (let w = 1; w <= totalWeeks + 1; w++) {
      if (!usedWeeks.has(w)) return w;
    }
    return totalWeeks + 1;
  }, [allocation, totalWeeks]);

  const handleAllocate = useCallback(
    async (unit: SchemeUnit) => {
      const weekSpan = parseWeekRange(unit.weekRange);
      const numWeeks = weekSpan.end - weekSpan.start + 1;
      const startWeek = nextFreeWeek;
      const endWeek = startWeek + numWeeks - 1;

      const newAllocation: TermAllocationMap = {
        ...allocation,
        [unit.unitName]: { startWeek, endWeek },
      };
      setAllocation(newAllocation);

      setSaving(true);
      await saveAllocation(classId, subject, term, newAllocation);
      setSaving(false);
    },
    [allocation, nextFreeWeek, classId, subject, term],
  );

  const handleAutoAllocate = useCallback(async () => {
    const newAllocation: TermAllocationMap = {};
    let currentWeek = 1;

    for (const unit of units) {
      const weekSpan = parseWeekRange(unit.weekRange);
      const numWeeks = weekSpan.end - weekSpan.start + 1;
      newAllocation[unit.unitName] = {
        startWeek: currentWeek,
        endWeek: currentWeek + numWeeks - 1,
      };
      currentWeek += numWeeks;
    }

    setAllocation(newAllocation);
    setSaving(true);
    await saveAllocation(classId, subject, term, newAllocation);
    setSaving(false);
  }, [units, classId, subject, term]);

  if (units.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
            <LayoutGrid className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Allocate Curriculum to Timetable
            </h3>
            <p className="text-xs text-slate-400">
              {subject} &mdash; {term} Term &mdash; {yearGroup}
            </p>
          </div>
        </div>
        <button
          onClick={handleAutoAllocate}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Zap className="w-3.5 h-3.5" />
          Auto-Allocate All
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">
            {allocatedWeeks} of {totalWeeks} weeks allocated
          </span>
          <span className="text-xs font-semibold text-teal-600">{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {allocatedCount} of {totalUnits} units placed
          {saving && (
            <span className="ml-2 text-teal-500 italic">Saving&hellip;</span>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      {loading ? (
        <div className="p-6 text-center text-sm text-slate-400">
          Loading allocation&hellip;
        </div>
      ) : (
        <div className="flex divide-x divide-slate-100">
          {/* Left — curriculum units */}
          <div className="w-1/2 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Curriculum Units
              </span>
            </div>
            {units.map((unit) => {
              const isAllocated = !!allocation[unit.unitName];
              const range = allocation[unit.unitName] ?? null;
              return (
                <div
                  key={unit.unitName}
                  onMouseEnter={() => setHoveredUnit(unit.unitName)}
                  onMouseLeave={() => setHoveredUnit(null)}
                >
                  <UnitCard
                    unit={unit}
                    isAllocated={isAllocated}
                    allocationRange={range}
                    onAllocate={() => handleAllocate(unit)}
                  />
                </div>
              );
            })}
          </div>

          {/* Right — week planner */}
          <div className="w-1/2 p-4">
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {subject} Slots &mdash; {term} Term
              </span>
            </div>
            <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
              {weekSlots.map((slot) => (
                <WeekRow
                  key={slot.weekNumber}
                  slot={slot}
                  isHighlighted={
                    hoveredUnit !== null &&
                    slot.allocatedUnit === hoveredUnit
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
