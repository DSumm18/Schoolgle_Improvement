"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GraduationCap, ChevronLeft, ChevronRight, Calendar,
  Users, BookOpen, Sparkles, BarChart3, Loader2,
} from "lucide-react";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { TimetableGrid } from "./TimetableGrid";
import { LessonPlanPanel } from "./LessonPlanPanel";
import { TeachMode } from "./TeachMode";
import type { LSClass, LSPupil, LSTimetableSlot, LSLessonPlan } from "@/types/lesson-studio";

function getMonday(d: Date): string {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().split("T")[0];
}

function formatWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const end = new Date(d);
  end.setDate(end.getDate() + 4);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${d.toLocaleDateString("en-GB", opts)} – ${end.toLocaleDateString("en-GB", opts)} ${d.getFullYear()}`;
}

export function LessonStudio() {
  // State
  const [classes, setClasses] = useState<LSClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<LSClass | null>(null);
  const [pupils, setPupils] = useState<LSPupil[]>([]);
  const [slots, setSlots] = useState<LSTimetableSlot[]>([]);
  const [plans, setPlans] = useState<LSLessonPlan[]>([]);
  const [weekCommencing, setWeekCommencing] = useState(getMonday(new Date()));
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  // Panel state
  const [selectedPlan, setSelectedPlan] = useState<LSLessonPlan | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<LSTimetableSlot | null>(null);
  const [teachMode, setTeachMode] = useState<LSLessonPlan | null>(null);

  // Load classes on mount
  useEffect(() => {
    fetch("/api/lesson-studio/classes")
      .then((r) => r.json())
      .then((res) => {
        const data = res.data ?? [];
        setClasses(data);
        if (data.length > 0) setSelectedClass(data[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load timetable + pupils when class changes
  useEffect(() => {
    if (!selectedClass) return;
    Promise.all([
      fetch(`/api/lesson-studio/timetable?classId=${selectedClass.id}`).then((r) => r.json()),
      fetch(`/api/lesson-studio/pupils?classId=${selectedClass.id}`).then((r) => r.json()),
    ]).then(([timetableRes, pupilsRes]) => {
      setSlots(timetableRes.data ?? []);
      setPupils(pupilsRes.data ?? []);
    });
  }, [selectedClass]);

  // Load plans when class or week changes
  useEffect(() => {
    if (!selectedClass) return;
    fetch(`/api/lesson-studio/plans?classId=${selectedClass.id}&week=${weekCommencing}`)
      .then((r) => r.json())
      .then((res) => setPlans(res.data ?? []));
  }, [selectedClass, weekCommencing]);

  // Week navigation
  const prevWeek = () => {
    const d = new Date(weekCommencing);
    d.setDate(d.getDate() - 7);
    setWeekCommencing(d.toISOString().split("T")[0]);
  };
  const nextWeek = () => {
    const d = new Date(weekCommencing);
    d.setDate(d.getDate() + 7);
    setWeekCommencing(d.toISOString().split("T")[0]);
  };
  const thisWeek = () => setWeekCommencing(getMonday(new Date()));

  // Generate lesson plan
  const handleGenerate = async (slot: LSTimetableSlot) => {
    if (!selectedClass || generating) return;
    setGenerating(slot.id);
    try {
      const res = await fetch("/api/lesson-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: selectedClass.id,
          slotId: slot.id,
          weekCommencing,
        }),
      });
      const result = await res.json();
      if (result.data) {
        setPlans((prev) => [...prev.filter((p) => !(p.day_of_week === slot.day_of_week && p.subject === slot.subject)), result.data]);
      }
    } finally {
      setGenerating(null);
    }
  };

  // Slot click
  const handleSlotClick = (slot: LSTimetableSlot, plan: LSLessonPlan | null) => {
    setSelectedSlot(slot);
    setSelectedPlan(plan);
  };

  // Mark taught
  const handleMarkTaught = async (planId: string) => {
    await fetch("/api/lesson-studio/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: planId, status: "taught", taught_at: new Date().toISOString() }),
    });
    setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status: "taught" as const, taught_at: new Date().toISOString() } : p)));
    setSelectedPlan((prev) => (prev?.id === planId ? { ...prev, status: "taught" as const } : prev));
  };

  // Stats
  const plannedCount = plans.filter((p) => p.status === "planned" || p.status === "taught").length;
  const taughtCount = plans.filter((p) => p.status === "taught").length;
  const sendCount = pupils.filter((p) => p.has_ehcp || p.has_send_support).length;
  const ppCount = pupils.filter((p) => p.is_pupil_premium).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      {/* Header */}
      <ModulePageHeader
        moduleId="teaching-learning"
        icon={GraduationCap}
        label="Teaching & Learning"
        title="Lesson Studio"
        description="AI-powered connected lesson planning. Every plan knows your pupils, your scheme, and your timetable."
      />

      {/* Class selector + stats */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Class picker */}
        <div className="flex-1">
          <div className="flex gap-2 flex-wrap">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedClass?.id === cls.id
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-300"
                }`}
              >
                <span className="font-bold">{cls.class_name}</span>
                <span className="text-xs ml-1 opacity-70">{cls.year_group}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        {selectedClass && (
          <div className="flex gap-3">
            <StatPill icon={<Users className="w-3.5 h-3.5" />} label="Pupils" value={pupils.length} />
            <StatPill icon={<BookOpen className="w-3.5 h-3.5" />} label="Planned" value={`${plannedCount}/${slots.length}`} />
            <StatPill icon={<Sparkles className="w-3.5 h-3.5" />} label="SEND" value={sendCount} />
            <StatPill icon={<BarChart3 className="w-3.5 h-3.5" />} label="PP" value={ppCount} />
          </div>
        )}
      </div>

      {/* Week navigator */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2">
        <button onClick={prevWeek} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div className="flex-1 text-center">
          <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-teal-500" />
            {formatWeek(weekCommencing)}
          </div>
        </div>
        <button onClick={thisWeek} className="px-2 py-1 text-xs text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors font-medium">
          Today
        </button>
        <button onClick={nextWeek} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Timetable Grid */}
      {selectedClass && slots.length > 0 ? (
        <TimetableGrid
          slots={slots}
          plans={plans}
          onSlotClick={handleSlotClick}
          onGenerate={handleGenerate}
          generating={generating}
        />
      ) : selectedClass ? (
        <div className="text-center py-12 text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No timetable found for {selectedClass.class_name}.</p>
          <p className="text-xs mt-1">Import your timetable from your MIS or create one manually.</p>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a class to get started.</p>
        </div>
      )}

      {/* Lesson Plan Panel (slide-over) */}
      {selectedPlan && selectedSlot && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => { setSelectedPlan(null); setSelectedSlot(null); }} />
          <LessonPlanPanel
            plan={selectedPlan}
            slot={selectedSlot}
            onClose={() => { setSelectedPlan(null); setSelectedSlot(null); }}
            onTeach={(id) => {
              const plan = plans.find((p) => p.id === id);
              if (plan) setTeachMode(plan);
            }}
            onMarkTaught={handleMarkTaught}
          />
        </>
      )}

      {/* Teach Mode (full screen) */}
      {teachMode && (
        <TeachMode
          plan={teachMode}
          onExit={() => setTeachMode(null)}
        />
      )}
    </div>
  );
}

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <span className="text-teal-500">{icon}</span>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-800 dark:text-white">{value}</span>
    </div>
  );
}
