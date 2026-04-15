"use client";

import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { SUBJECT_COLORS, DAY_NAMES } from "@/types/lesson-studio";
import { Plus, Check, Loader2, X } from "lucide-react";

interface TimetableSetupProps {
  classId: string;
  organizationId: string;
  onComplete: () => void;
}

const TIME_PERIODS = [
  { start: "09:00", end: "10:00", label: "9:00 – 10:00" },
  { start: "10:15", end: "11:15", label: "10:15 – 11:15" },
  { start: "11:30", end: "12:15", label: "11:30 – 12:15" },
  { start: "13:15", end: "14:15", label: "1:15 – 2:15" },
  { start: "14:30", end: "15:15", label: "2:30 – 3:15" },
];

const DAYS = [1, 2, 3, 4, 5] as const; // Monday–Friday

const SUBJECTS = [
  "Maths",
  "English",
  "Phonics",
  "Reading",
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
];

type CellKey = `${number}-${string}`; // dayOfWeek-startTime

interface CellData {
  subject: string;
}

interface Popover {
  key: CellKey;
  day: number;
  startTime: string;
  endTime: string;
  rect: DOMRect;
}

export function TimetableSetup({ classId, organizationId, onComplete }: TimetableSetupProps) {
  const [cells, setCells] = useState<Record<CellKey, CellData>>({});
  const [popover, setPopover] = useState<Popover | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    }
    if (popover) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [popover]);

  const totalSlots = TIME_PERIODS.length * DAYS.length;
  const filledCount = Object.keys(cells).length;

  function handleCellClick(e: React.MouseEvent<HTMLButtonElement>, day: number, period: typeof TIME_PERIODS[number]) {
    const key: CellKey = `${day}-${period.start}`;
    if (cells[key]) {
      // Already filled — open popover to allow remove
      const rect = e.currentTarget.getBoundingClientRect();
      setPopover({ key, day, startTime: period.start, endTime: period.end, rect });
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setPopover({ key, day, startTime: period.start, endTime: period.end, rect });
    }
  }

  function selectSubject(subject: string) {
    if (!popover) return;
    setCells((prev) => ({ ...prev, [popover.key]: { subject } }));
    setPopover(null);
  }

  function removeCell() {
    if (!popover) return;
    setCells((prev) => {
      const next = { ...prev };
      delete next[popover.key];
      return next;
    });
    setPopover(null);
  }

  async function handleSave() {
    if (filledCount === 0) {
      setError("Please add at least one lesson slot before saving.");
      return;
    }
    setSaving(true);
    setError(null);

    const slotsToInsert = Object.entries(cells).map(([key, data]) => {
      const [dayStr, startTime] = key.split("-") as [string, string];
      const period = TIME_PERIODS.find((p) => p.start === startTime)!;
      return {
        organization_id: organizationId,
        class_id: classId,
        day_of_week: parseInt(dayStr, 10),
        start_time: startTime,
        end_time: period.end,
        subject: data.subject,
      };
    });

    // Delete existing slots for this class first
    const { error: delError } = await supabase
      .from("ls_timetable_slots")
      .delete()
      .eq("class_id", classId)
      .eq("organization_id", organizationId);

    if (delError) {
      setError(delError.message);
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("ls_timetable_slots")
      .insert(slotsToInsert);

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onComplete();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 relative">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Set up your weekly timetable</h2>
        <p className="text-sm text-slate-500 mt-1">
          Click any empty slot to add a lesson. This is your weekly pattern — you can change it anytime.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5">
          <span className="text-sm font-medium text-teal-700">
            {filledCount} of {totalSlots} slots filled
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="w-28 text-left pb-3 pr-3 text-xs font-medium text-slate-400 uppercase tracking-wide">
                Time
              </th>
              {DAYS.map((day) => (
                <th key={day} className="pb-3 px-2 text-sm font-semibold text-slate-700 text-center">
                  {DAY_NAMES[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_PERIODS.map((period, periodIdx) => (
              <tr key={period.start} className={periodIdx < TIME_PERIODS.length - 1 ? "border-b border-slate-100" : ""}>
                <td className="py-2 pr-3 text-xs text-slate-400 font-medium whitespace-nowrap align-middle">
                  {period.label}
                </td>
                {DAYS.map((day) => {
                  const key: CellKey = `${day}-${period.start}`;
                  const cell = cells[key];
                  const colors = cell ? (SUBJECT_COLORS[cell.subject] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" }) : null;

                  return (
                    <td key={day} className="py-2 px-2 align-middle">
                      <button
                        onClick={(e) => handleCellClick(e, day, period)}
                        className={
                          cell
                            ? `w-full h-14 rounded-xl border-2 font-medium text-sm transition-all hover:opacity-80 ${colors!.bg} ${colors!.text} ${colors!.border}`
                            : "w-full h-14 rounded-xl border-2 border-dashed border-slate-200 text-slate-300 hover:border-teal-300 hover:text-teal-400 hover:bg-teal-50 transition-all flex items-center justify-center"
                        }
                      >
                        {cell ? (
                          <span className="px-2">{cell.subject}</span>
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Save */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Tip: You can always edit this timetable later from settings.
        </p>
        <button
          onClick={handleSave}
          disabled={saving || filledCount === 0}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Timetable
            </>
          )}
        </button>
      </div>

      {/* Subject Popover */}
      {popover && (
        <div
          ref={popoverRef}
          style={{
            position: "fixed",
            top: Math.min(popover.rect.bottom + 8, window.innerHeight - 320),
            left: Math.min(popover.rect.left, window.innerWidth - 220),
            zIndex: 50,
          }}
          className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-52"
        >
          {/* Remove option if cell is filled */}
          {cells[popover.key] && (
            <button
              onClick={removeCell}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg mb-2 font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove slot
            </button>
          )}
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">
            Pick a subject
          </p>
          <div className="space-y-0.5 max-h-60 overflow-y-auto">
            {SUBJECTS.map((subject) => {
              const colors = SUBJECT_COLORS[subject] || { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-100" };
              const isSelected = cells[popover.key]?.subject === subject;
              return (
                <button
                  key={subject}
                  onClick={() => selectSubject(subject)}
                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
                    isSelected
                      ? `${colors.bg} ${colors.text} ring-2 ring-inset ring-current`
                      : `hover:${colors.bg} hover:${colors.text} text-slate-600 hover:bg-slate-50`
                  }`}
                >
                  {subject}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
