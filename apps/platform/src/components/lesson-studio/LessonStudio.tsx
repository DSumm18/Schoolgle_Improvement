"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Users,
  BookOpen,
  Sparkles,
  BarChart3,
  Loader2,
  X,
} from "lucide-react";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { TimetableGrid } from "./TimetableGrid";
import { CalendarView } from "./CalendarView";
import { LessonPlanPanel } from "./LessonPlanPanel";
import { TeachMode } from "./TeachMode";
import { TeacherDashboard } from "./TeacherDashboard";
import { PupilDetailPanel } from "./PupilDetailPanel";
import { CurriculumChecklist } from "./CurriculumChecklist";
import { SchemeManager } from "./SchemeManager";
import { CurriculumProgressionView } from "./CurriculumProgressionView";
import { CurriculumAllocator } from "./CurriculumAllocator";
import { WholeSchoolView } from "./WholeSchoolView";
import { TimetableSetup } from "./TimetableSetup";
import type {
  LSClass,
  LSPupil,
  LSTimetableSlot,
  LSLessonPlan,
  CalendarEventWithPlan,
} from "@/types/lesson-studio";
import { DAY_NAMES } from "@/types/lesson-studio";
import { useAuth } from "@/context/SupabaseAuthContext";
import { ThemeCarousel } from "./ThemeCarousel";

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

function groupClassesByYear(classes: LSClass[]): Record<string, LSClass[]> {
  const groups: Record<string, LSClass[]> = {};
  for (const cls of classes) {
    const yg = cls.year_group || "Other";
    if (!groups[yg]) groups[yg] = [];
    groups[yg].push(cls);
  }
  return groups;
}

export function LessonStudio() {
  const { organizationId, session, organization } = useAuth();
  const authHeaders: HeadersInit = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
  // State
  const [classes, setClasses] = useState<LSClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<LSClass | null>(null);
  const [pupils, setPupils] = useState<LSPupil[]>([]);
  const [slots, setSlots] = useState<LSTimetableSlot[]>([]);
  const [plans, setPlans] = useState<LSLessonPlan[]>([]);
  const [weekCommencing, setWeekCommencing] = useState(getMonday(new Date()));
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  // Class picker
  const [classPickerOpen, setClassPickerOpen] = useState(false);

  // Panel state
  const [selectedPlan, setSelectedPlan] = useState<LSLessonPlan | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<LSTimetableSlot | null>(
    null,
  );
  const [teachMode, setTeachMode] = useState<LSLessonPlan | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "timetable">("calendar");
  const [mainView, setMainView] = useState<"lessons" | "dashboard" | "curriculum">("curriculum");
  const [selectedPupilId, setSelectedPupilId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<{
    unitName: string;
    keyTopics: string[];
    ncCodes: string[];
    weekRange: string;
  } | null>(null);
  const [selectedTheme, setSelectedTheme] = useState("none");
  const [teacherInput, setTeacherInput] = useState("");

  // Load classes directly from Supabase
  useEffect(() => {
    if (!organizationId) return;
    supabase
      .from("ls_classes")
      .select("*")
      .eq("organization_id", organizationId)
      .order("year_group")
      .then(({ data }) => {
        const classes = data || [];
        setClasses(classes);
        if (classes.length > 0) setSelectedClass(classes[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [organizationId]);

  // Load timetable + pupils when class changes
  useEffect(() => {
    if (!selectedClass || !organizationId) return;
    Promise.all([
      supabase
        .from("ls_timetable_slots")
        .select("*")
        .eq("class_id", selectedClass.id)
        .eq("organization_id", organizationId)
        .order("day_of_week")
        .order("start_time"),
      supabase
        .from("ls_pupils")
        .select("*")
        .eq("class_id", selectedClass.id)
        .eq("organization_id", organizationId),
    ]).then(([slotsRes, pupilsRes]) => {
      setSlots((slotsRes.data || []) as LSTimetableSlot[]);
      setPupils((pupilsRes.data || []) as LSPupil[]);
    });
  }, [selectedClass, organizationId]);

  // Load plans when class or week changes
  useEffect(() => {
    if (!selectedClass || !organizationId) return;
    supabase
      .from("ls_lesson_plans")
      .select("*")
      .eq("class_id", selectedClass.id)
      .eq("organization_id", organizationId)
      .eq("week_commencing", weekCommencing)
      .order("day_of_week")
      .order("subject")
      .then(({ data }) => setPlans((data || []) as LSLessonPlan[]));
  }, [selectedClass, weekCommencing, organizationId]);

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
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          classId: selectedClass.id,
          slotId: slot.id,
          weekCommencing,
          organizationId,
          teacherNote: (() => {
            const themeNote = selectedTheme !== "none"
              ? `Theme: ${selectedTheme}. Weave this theme into examples, word problems, and activities to make the lesson engaging. Use ${selectedTheme}-related contexts for mathematical concepts.`
              : "";
            const teacherIdeas = teacherInput.trim()
              ? `Teacher's ideas and preferences: ${teacherInput.trim()}. Build the lesson around these ideas — use the teacher's suggested approach, resources, and adaptations.`
              : "";
            const fullNote = [
              selectedTopic
                ? `Teach: ${selectedTopic.unitName}. Topics: ${selectedTopic.keyTopics.join(", ")}. NC codes: ${selectedTopic.ncCodes.join(", ")}.`
                : "",
              teacherIdeas,
              themeNote,
            ].filter(Boolean).join(" ");
            return fullNote || undefined;
          })(),
        }),
      });
      const result = await res.json();
      // API returns plan at root level (apiSuccess wraps directly)
      const planData = result.data ?? result;
      if (planData?.id) {
        const newPlan = planData as LSLessonPlan;
        setPlans((prev) => [
          ...prev.filter(
            (p) =>
              !(
                p.day_of_week === slot.day_of_week && p.subject === slot.subject
              ),
          ),
          newPlan,
        ]);
        // Auto-open the generated plan in the detail panel
        setSelectedPlan(newPlan);
        setSelectedSlot(slot);
      }
    } finally {
      setGenerating(null);
    }
  };

  // Slot click
  const handleSlotClick = (
    slot: LSTimetableSlot,
    plan: LSLessonPlan | null,
  ) => {
    setSelectedSlot(slot);
    setSelectedPlan(plan);
  };

  // Mark taught
  const handleMarkTaught = async (planId: string) => {
    await fetch("/api/lesson-studio/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        id: planId,
        status: "taught",
        taught_at: new Date().toISOString(),
        organizationId,
      }),
    });
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              status: "taught" as const,
              taught_at: new Date().toISOString(),
            }
          : p,
      ),
    );
    setSelectedPlan((prev) =>
      prev?.id === planId ? { ...prev, status: "taught" as const } : prev,
    );
  };

  // Stats
  const plannedCount = plans.filter(
    (p) => p.status === "planned" || p.status === "taught",
  ).length;
  const taughtCount = plans.filter((p) => p.status === "taught").length;
  const sendCount = pupils.filter(
    (p) => p.has_ehcp || p.has_send_support,
  ).length;
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
        {/* Class picker — grouped dropdown */}
        <div className="flex-1">
          <div className="relative inline-block">
            <button
              onClick={() => setClassPickerOpen(!classPickerOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 hover:border-teal-300 transition-colors shadow-sm min-w-[200px]"
            >
              <Users className="w-4 h-4 text-teal-500 flex-shrink-0" />
              <span className="flex-1 text-left">
                {selectedClass?.class_name || "All Classes"}
              </span>
              <span className="text-xs text-slate-400">
                {selectedClass
                  ? `${pupils.length} pupils`
                  : `${classes.length} classes`}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>

            {classPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setClassPickerOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-40 max-h-80 overflow-y-auto">
                  {/* All Classes option */}
                  <button
                    onClick={() => {
                      setSelectedClass(null);
                      setClassPickerOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 transition-colors ${
                      selectedClass === null
                        ? "bg-teal-50 text-teal-700 font-medium"
                        : "text-slate-700"
                    }`}
                  >
                    All Classes
                  </button>

                  {/* Grouped by year group */}
                  {Object.entries(groupClassesByYear(classes)).map(
                    ([yearGroup, yearClasses]) => (
                      <div key={yearGroup}>
                        <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                          {yearGroup}
                        </div>
                        {yearClasses.map((cls) => (
                          <button
                            key={cls.id}
                            onClick={() => {
                              setSelectedClass(cls);
                              setClassPickerOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-teal-50 transition-colors ${
                              selectedClass?.id === cls.id
                                ? "bg-teal-50 text-teal-700 font-medium"
                                : "text-slate-700"
                            }`}
                          >
                            <div>
                              <span>{cls.class_name}</span>
                              {(cls as LSClass & { teacher_name?: string }).teacher_name && (
                                <span className="text-xs text-slate-400 ml-1.5">
                                  {(cls as LSClass & { teacher_name?: string }).teacher_name}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400">
                              {(cls as LSClass & { pupil_count?: number }).pupil_count
                                ? `${(cls as LSClass & { pupil_count?: number }).pupil_count} pupils`
                                : ""}
                            </span>
                          </button>
                        ))}
                      </div>
                    ),
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick stats */}
        {selectedClass && (
          <div className="flex gap-3">
            <StatPill
              icon={<Users className="w-3.5 h-3.5" />}
              label="Pupils"
              value={pupils.length}
            />
            <StatPill
              icon={<BookOpen className="w-3.5 h-3.5" />}
              label="Planned"
              value={`${plannedCount}/${slots.length}`}
            />
            <StatPill
              icon={<Sparkles className="w-3.5 h-3.5" />}
              label="SEND"
              value={sendCount}
            />
            <StatPill
              icon={<BarChart3 className="w-3.5 h-3.5" />}
              label="PP"
              value={ppCount}
            />
          </div>
        )}
      </div>

      {/* Week navigator + view toggle */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2">
        <button
          onClick={prevWeek}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div className="flex-1 text-center">
          <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-center gap-2">
            <Calendar className="w-4 h-4 text-teal-500" />
            {formatWeek(weekCommencing)}
          </div>
        </div>
        <button
          onClick={thisWeek}
          className="px-2 py-1 text-xs text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors font-medium"
        >
          Today
        </button>
        <button
          onClick={nextWeek}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* View toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          <button
            onClick={() => setMainView("curriculum")}
            className={`px-2.5 py-1 text-xs rounded-md transition-all ${
              mainView === "curriculum"
                ? "bg-white shadow-sm font-semibold text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Curriculum
          </button>
          <button
            onClick={() => { setMainView("lessons"); setViewMode("timetable"); }}
            className={`px-2.5 py-1 text-xs rounded-md transition-all ${
              mainView === "lessons" && viewMode === "timetable"
                ? "bg-white shadow-sm font-semibold text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Timetable
          </button>
          <button
            onClick={() => { setMainView("lessons"); setViewMode("calendar"); }}
            className={`px-2.5 py-1 text-xs rounded-md transition-all ${
              mainView === "lessons" && viewMode === "calendar"
                ? "bg-white shadow-sm font-semibold text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setMainView("dashboard")}
            className={`px-2.5 py-1 text-xs rounded-md transition-all ${
              mainView === "dashboard"
                ? "bg-white shadow-sm font-semibold text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* Whole-school view when no class selected */}
      {!selectedClass && !loading && (
        <WholeSchoolView
          organizationId={organizationId || ""}
          weekCommencing={weekCommencing}
          onClassClick={(classId) => {
            const cls = classes.find((c) => c.id === classId);
            if (cls) {
              setSelectedClass(cls);
              setMainView("curriculum");
            }
          }}
        />
      )}

      {/* Dashboard view */}
      {mainView === "dashboard" && selectedClass && (
        <TeacherDashboard
          classId={selectedClass.id}
          className={selectedClass.class_name}
          onViewPupil={(pupilId) => setSelectedPupilId(pupilId)}
        />
      )}

      {/* Curriculum — scheme progression + NC objectives + scheme setup */}
      {mainView === "curriculum" && selectedClass && (
        <div className="space-y-6">
          <CurriculumProgressionView
            classId={selectedClass.id}
            subject={slots[0]?.subject || "Maths"}
            yearGroup={selectedClass.year_group}
            schemeName="white-rose-maths"
            onSelectTopic={(topic) => {
              setSelectedTopic(topic);
              setMainView("lessons");
              setViewMode("timetable");
            }}
          />
          {slots.some((s) => s.subject === "Maths") && (
            <CurriculumAllocator
              classId={selectedClass.id}
              subject="Maths"
              yearGroup={selectedClass.year_group}
              organizationId={organizationId || ""}
              schemeName="white-rose-maths"
            />
          )}
          <CurriculumChecklist
            classId={selectedClass.id}
            yearGroup={selectedClass.year_group}
          />
          <SchemeManager
            classId={selectedClass.id}
            yearGroup={selectedClass.year_group}
            onSchemeConnected={() => {
              // Refresh plans when scheme connected
            }}
          />
        </div>
      )}

      {/* Calendar or Timetable view */}
      {mainView === "lessons" && (
        viewMode === "calendar" ? (
          selectedClass ? (
            <CalendarView
              classes={classes}
              selectedClassId={selectedClass.id}
              weekStart={new Date(weekCommencing)}
              onWeekChange={(monday) => setWeekCommencing(monday.toISOString().split("T")[0])}
              onEventClick={(evt: CalendarEventWithPlan) => {
                // Find matching timetable slot for this event
                const eventDayOfWeek = new Date(evt.event_date).getDay();
                const matchingSlot = slots.find(
                  (s) =>
                    s.day_of_week === eventDayOfWeek &&
                    s.subject === evt.subject,
                );
                if (matchingSlot) {
                  setSelectedSlot(matchingSlot);
                  if (evt.lesson_plan) {
                    setSelectedPlan(evt.lesson_plan as LSLessonPlan);
                  } else {
                    // Open empty slot panel with generate option
                    setSelectedPlan(null);
                  }
                } else {
                  // No matching timetable slot — create a temporary one from event data
                  const tempSlot: LSTimetableSlot = {
                    id: evt.id,
                    organization_id: evt.organization_id,
                    class_id: evt.class_id,
                    day_of_week: eventDayOfWeek,
                    subject: evt.subject,
                    start_time: evt.start_time,
                    end_time: evt.end_time,
                    room: evt.room,
                    created_at: evt.created_at,
                  };
                  setSelectedSlot(tempSlot);
                  setSelectedPlan(evt.lesson_plan ? (evt.lesson_plan as LSLessonPlan) : null);
                }
              }}
            />
          ) : (
            <div className="text-center py-12 text-slate-400">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select a class to get started.</p>
            </div>
          )
        ) : selectedClass && slots.length > 0 ? (
          <>
            {selectedTopic && (
              <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3 mb-2">
                <BookOpen className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-teal-800">
                    Next lesson: {selectedTopic.unitName}
                  </div>
                  <div className="text-xs text-teal-600">
                    {selectedTopic.keyTopics.join(" · ")}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="text-xs text-teal-500 hover:text-teal-700 px-2 py-1 hover:bg-teal-100 rounded-lg"
                >
                  Clear
                </button>
              </div>
            )}
            <TimetableGrid
              slots={slots}
              plans={plans}
              onSlotClick={handleSlotClick}
              onGenerate={handleGenerate}
              generating={generating}
            />
          </>
        ) : selectedClass ? (
          <TimetableSetup
            classId={selectedClass.id}
            organizationId={organizationId || ""}
            onComplete={() => {
              supabase
                .from("ls_timetable_slots")
                .select("*")
                .eq("class_id", selectedClass.id)
                .eq("organization_id", organizationId)
                .order("day_of_week")
                .order("start_time")
                .then(({ data }) => setSlots((data || []) as LSTimetableSlot[]));
            }}
          />
        ) : (
          <div className="text-center py-12 text-slate-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Select a class to get started.</p>
          </div>
        )
      )}

      {/* Lesson Plan Panel (slide-over) — with existing plan */}
      {selectedPlan && selectedSlot && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => {
              setSelectedPlan(null);
              setSelectedSlot(null);
            }}
          />
          <LessonPlanPanel
            plan={selectedPlan}
            slot={selectedSlot}
            pupils={pupils}
            onClose={() => {
              setSelectedPlan(null);
              setSelectedSlot(null);
            }}
            onTeach={(id) => {
              const plan = plans.find((p) => p.id === id);
              if (plan) setTeachMode(plan);
            }}
            onMarkTaught={handleMarkTaught}
          />
        </>
      )}

      {/* Empty Slot Panel (slide-over) — no plan yet, show Generate */}
      {!selectedPlan && selectedSlot && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setSelectedSlot(null)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-500 mb-1">
                    {DAY_NAMES[selectedSlot.day_of_week]} {selectedSlot.start_time.slice(0, 5)}–{selectedSlot.end_time.slice(0, 5)}
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">{selectedSlot.subject}</h2>
                  {selectedSlot.room && (
                    <div className="text-xs text-slate-400 mt-0.5">{selectedSlot.room}</div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedSlot(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <ThemeCarousel
                selectedTheme={selectedTheme}
                onSelect={setSelectedTheme}
              />

              {/* Curriculum context */}
              {selectedTopic && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
                  <div className="text-[10px] text-teal-500 uppercase tracking-wide font-semibold mb-1">Curriculum</div>
                  <div className="text-sm font-semibold text-teal-800">{selectedTopic.unitName}</div>
                  <div className="text-xs text-teal-600 mt-0.5">{selectedTopic.keyTopics.join(" · ")}</div>
                </div>
              )}

              {/* Teacher input — their ideas for the lesson */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Your ideas for this lesson <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={teacherInput}
                  onChange={(e) => setTeacherInput(e.target.value)}
                  placeholder="How do you want to teach this? E.g.&#10;• Use pizza slices for fractions — worked well last year&#10;• More practical / hands-on activities&#10;• Jayden's group needs concrete manipulatives&#10;• Start with a recap of last week's equivalent fractions"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm text-slate-700 placeholder:text-slate-300 resize-none focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200"
                  rows={4}
                />
                <div className="text-[10px] text-slate-400 mt-1">
                  Tell us your approach, preferred resources, or anything specific. The AI builds around your ideas.
                </div>
              </div>

              <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center">
                <Sparkles className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 mb-3">
                  {teacherInput.trim()
                    ? "We'll build around your ideas with differentiated activities and SEND adaptations."
                    : "Generate a lesson plan tailored to your class. Add your ideas above for a more personalised plan."
                  }
                  {selectedTheme !== "none" && (
                    <span className="block mt-1 text-teal-600 font-medium">
                      Theme: {selectedTheme} will be woven in.
                    </span>
                  )}
                </p>
                <button
                  onClick={() => {
                    handleGenerate(selectedSlot);
                  }}
                  disabled={generating === selectedSlot.id}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  <Sparkles className={`w-4 h-4 ${generating === selectedSlot.id ? "animate-spin" : ""}`} />
                  {generating === selectedSlot.id ? "Generating..." : "Generate Lesson Plan"}
                </button>
              </div>

              {/* Class summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Class Profile</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-slate-800">{pupils.length}</div>
                    <div className="text-[10px] text-slate-500">Pupils</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-slate-800">
                      {pupils.filter((p) => p.has_ehcp || p.has_send_support).length}
                    </div>
                    <div className="text-[10px] text-slate-500">SEND</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-slate-800">
                      {pupils.filter((p) => p.is_pupil_premium).length}
                    </div>
                    <div className="text-[10px] text-slate-500">Pupil Premium</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-lg font-bold text-slate-800">
                      {pupils.filter((p) => p.is_eal).length}
                    </div>
                    <div className="text-[10px] text-slate-500">EAL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Teach Mode (full screen) */}
      {teachMode && (
        <TeachMode
          plan={teachMode}
          onExit={() => setTeachMode(null)}
          schoolName={organization?.name}
          schoolLogoUrl={(organization as Record<string, unknown>)?.logo_url as string | undefined}
        />
      )}

      {/* Pupil Detail Panel (slide-over) */}
      {selectedPupilId && selectedClass && (
        <PupilDetailPanel
          pupilId={selectedPupilId}
          classId={selectedClass.id}
          onClose={() => setSelectedPupilId(null)}
        />
      )}
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <span className="text-teal-500">{icon}</span>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-800 dark:text-white">
        {value}
      </span>
    </div>
  );
}
