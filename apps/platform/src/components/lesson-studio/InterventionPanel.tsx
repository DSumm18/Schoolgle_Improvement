"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  ArrowLeft,
  Plus,
  Check,
  Copy,
  FileText,
  Clock,
  TrendingUp,
  BookOpen,
  Loader2,
  Calendar,
  User,
  Pause,
  Play,
  CheckCircle2,
} from "lucide-react";
import type {
  LSIntervention,
  LSInterventionSession,
  InterventionFormat,
  InterventionStatus,
  CPAStage,
  InterventionWithSessions,
} from "@/types/lesson-studio";
import { useAuth } from "@/context/SupabaseAuthContext";
import { getRelevantStrategies, type EEFStrategy } from "@/lib/eef-toolkit";
import { generateOfstedNarrative } from "@/lib/lesson-studio/ofsted-narrative";

/* ── Constants ──────────────────────────────────────────────────── */

const FORMAT_OPTIONS: { value: InterventionFormat; label: string; desc: string }[] = [
  { value: "one_to_one", label: "1:1 Tuition", desc: "Intensive individual support" },
  { value: "small_group", label: "Small Group", desc: "2-5 pupils targeted support" },
  { value: "in_class", label: "In-Class", desc: "Targeted within whole-class teaching" },
  { value: "catch_up", label: "Catch-Up", desc: "Before/after school catch-up sessions" },
  { value: "homework", label: "Homework", desc: "Structured home learning programme" },
];

const CPA_STAGES: { value: CPAStage; label: string }[] = [
  { value: "concrete", label: "Concrete" },
  { value: "pictorial", label: "Pictorial" },
  { value: "abstract", label: "Abstract" },
  { value: "fluency", label: "Fluency" },
  { value: "application", label: "Application" },
];

const STATUS_LABELS: Record<InterventionStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  active: { label: "Active", color: "bg-emerald-50 text-emerald-700" },
  paused: { label: "Paused", color: "bg-amber-50 text-amber-700" },
  completed: { label: "Completed", color: "bg-blue-50 text-blue-700" },
  cancelled: { label: "Cancelled", color: "bg-red-50 text-red-700" },
};

type TabId = "plan" | "sessions" | "impact" | "narrative";

/* ── Props ──────────────────────────────────────────────────────── */

interface InterventionPanelProps {
  pupilId: string;
  classId: string;
  pupilName: string;
  subject: string;
  currentGrade: string;
  onClose: () => void;
}

/* ── Component ──────────────────────────────────────────────────── */

export function InterventionPanel({
  pupilId,
  classId,
  pupilName,
  subject,
  currentGrade,
  onClose,
}: InterventionPanelProps) {
  const { session } = useAuth();
  const headers: HeadersInit = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intervention, setIntervention] = useState<InterventionWithSessions | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("plan");
  const [copied, setCopied] = useState(false);

  // Creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formFormat, setFormFormat] = useState<InterventionFormat>("small_group");
  const [formFrequency, setFormFrequency] = useState("3x per week, 20 minutes");
  const [formDurationWeeks, setFormDurationWeeks] = useState(6);
  const [formDeliveredBy, setFormDeliveredBy] = useState("");
  const [formSuccessCriteria, setFormSuccessCriteria] = useState("");
  const [formAdaptations, setFormAdaptations] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState<EEFStrategy | null>(null);

  // Session log form state
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionDuration, setSessionDuration] = useState(20);
  const [sessionFocus, setSessionFocus] = useState("");
  const [sessionObservation, setSessionObservation] = useState("");
  const [sessionStage, setSessionStage] = useState<CPAStage | "">("");
  const [sessionNextPlan, setSessionNextPlan] = useState("");
  const [sessionProgressNote, setSessionProgressNote] = useState("");
  const [savingSession, setSavingSession] = useState(false);

  // EEF strategies
  const eefStrategies = getRelevantStrategies(
    `${subject} intervention catch-up below expected ${currentGrade}`,
  ).slice(0, 4);

  // Pre-fill form defaults
  useEffect(() => {
    const gapDesc = currentGrade === "WTS" || currentGrade === "PKE" || currentGrade === "PKF"
      ? `below expected standard (${currentGrade})`
      : `at ${currentGrade}`;
    setFormTitle(`${subject} intervention - ${pupilName}`);
    setFormTarget(`Move ${pupilName} from ${currentGrade} towards EXS in ${subject}`);
    if (eefStrategies.length > 0) {
      setSelectedStrategy(eefStrategies[0]);
    }
  }, []);

  // Load existing interventions
  const loadIntervention = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/lesson-studio/interventions?pupilId=${pupilId}&status=active`,
        { headers: { Authorization: headers.Authorization as string } },
      );
      const json = await res.json();
      const interventions: InterventionWithSessions[] = json.data?.interventions ?? json.interventions ?? [];
      // Find one matching this subject
      const match = interventions.find(
        (i) => i.subject.toLowerCase() === subject.toLowerCase(),
      );
      if (match) {
        setIntervention(match);
        setShowCreateForm(false);
      } else {
        setShowCreateForm(true);
      }
    } catch (err) {
      console.error("Failed to load interventions:", err);
      setShowCreateForm(true);
    } finally {
      setLoading(false);
    }
  }, [pupilId, subject]);

  useEffect(() => {
    loadIntervention();
  }, [loadIntervention]);

  // Create intervention
  const handleCreate = async () => {
    setSaving(true);
    try {
      const body = {
        pupil_id: pupilId,
        class_id: classId,
        title: formTitle,
        target: formTarget,
        subject,
        format: formFormat,
        frequency: formFrequency,
        duration_weeks: formDurationWeeks,
        delivered_by: formDeliveredBy || null,
        eef_strategy_id: selectedStrategy?.id ?? null,
        eef_strategy_name: selectedStrategy?.name ?? null,
        eef_impact_months: selectedStrategy?.monthsProgress ?? null,
        success_criteria: formSuccessCriteria || null,
        lesson_adaptations: formAdaptations || null,
        status: "active",
        started_at: new Date().toISOString().split("T")[0],
        target_end_date: formDurationWeeks
          ? new Date(Date.now() + formDurationWeeks * 7 * 86400000).toISOString().split("T")[0]
          : null,
      };

      const res = await fetch("/api/lesson-studio/interventions", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const created = json.data?.intervention ?? json.intervention;
      if (created) {
        setIntervention({ ...created, sessions: [] });
        setShowCreateForm(false);
        setActiveTab("plan");
      }
    } catch (err) {
      console.error("Failed to create intervention:", err);
    } finally {
      setSaving(false);
    }
  };

  // Log session
  const handleLogSession = async () => {
    if (!intervention || !sessionFocus) return;
    setSavingSession(true);
    try {
      const body = {
        interventionId: intervention.id,
        session_date: sessionDate,
        durationMinutes: sessionDuration,
        focus: sessionFocus,
        observation: sessionObservation || null,
        stage: sessionStage || null,
        nextSessionPlan: sessionNextPlan || null,
        progressNote: sessionProgressNote || null,
      };
      const res = await fetch("/api/lesson-studio/interventions/sessions", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const newSession = json.data?.session ?? json.session;
      if (newSession && intervention) {
        setIntervention({
          ...intervention,
          sessions: [...(intervention.sessions ?? []), newSession],
        });
        // Reset form
        setSessionFocus("");
        setSessionObservation("");
        setSessionStage("");
        setSessionNextPlan("");
        setSessionProgressNote("");
        setShowSessionForm(false);
      }
    } catch (err) {
      console.error("Failed to log session:", err);
    } finally {
      setSavingSession(false);
    }
  };

  // Update status
  const handleStatusChange = async (newStatus: InterventionStatus) => {
    if (!intervention) return;
    try {
      const body: Record<string, unknown> = {
        id: intervention.id,
        pupil_id: intervention.pupil_id,
        title: intervention.title,
        target: intervention.target,
        subject: intervention.subject,
        format: intervention.format,
        status: newStatus,
      };
      if (newStatus === "completed") body.completed_at = new Date().toISOString().split("T")[0];

      const res = await fetch("/api/lesson-studio/interventions", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const updated = json.data?.intervention ?? json.intervention;
      if (updated) {
        setIntervention({ ...intervention, ...updated });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Copy narrative
  const handleCopyNarrative = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate narrative text
  const narrativeText = intervention
    ? generateOfstedNarrative({
        pupilName,
        subject,
        currentGrade,
        previousGrade: currentGrade, // Use current as previous for now
        intervention,
        sessions: intervention.sessions ?? [],
        assessmentHistory: [
          { date: intervention.started_at ?? intervention.created_at, grade: currentGrade, source: "Baseline" },
        ],
      })
    : "";

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
          <p className="text-sm text-gray-500 mt-3">Loading interventions...</p>
        </div>
      </div>
    );
  }

  /* ── Creation form ──────────────────────────────────────────── */

  if (showCreateForm && !intervention) {
    return (
      <>
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
        <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-150"
              >
                <ArrowLeft className="w-4 h-4 text-gray-400" />
              </button>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                New Intervention Plan
              </span>
            </div>
            <p className="text-base font-semibold text-gray-900 mt-2">
              {pupilName} - {subject}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Current attainment: {currentGrade}
            </p>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Intervention title
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200"
              />
            </div>

            {/* Target */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Target
              </label>
              <input
                type="text"
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200"
              />
            </div>

            {/* Format */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormFormat(opt.value)}
                    className={`text-left px-3 py-2.5 rounded-lg border transition-colors duration-150 ${
                      formFormat === opt.value
                        ? "border-teal-300 bg-teal-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <p className={`text-xs font-medium ${formFormat === opt.value ? "text-teal-700" : "text-gray-700"}`}>
                      {opt.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Frequency
                </label>
                <input
                  type="text"
                  value={formFrequency}
                  onChange={(e) => setFormFrequency(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Duration (weeks)
                </label>
                <input
                  type="number"
                  value={formDurationWeeks}
                  onChange={(e) => setFormDurationWeeks(parseInt(e.target.value) || 6)}
                  min={1}
                  max={52}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200"
                />
              </div>
            </div>

            {/* Delivered by */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Delivered by
              </label>
              <input
                type="text"
                value={formDeliveredBy}
                onChange={(e) => setFormDeliveredBy(e.target.value)}
                placeholder="e.g. Mrs Jones (TA), Class teacher"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200 placeholder:text-gray-300"
              />
            </div>

            {/* EEF Strategy Selection */}
            {eefStrategies.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  EEF Strategy
                </label>
                <div className="space-y-2">
                  {eefStrategies.map((strategy) => (
                    <button
                      key={strategy.id}
                      type="button"
                      onClick={() => setSelectedStrategy(strategy)}
                      className={`w-full text-left rounded-lg border px-4 py-3 transition-colors duration-150 ${
                        selectedStrategy?.id === strategy.id
                          ? "border-teal-300 bg-teal-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-teal-700">
                            +{strategy.monthsProgress}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-medium ${
                              selectedStrategy?.id === strategy.id ? "text-teal-800" : "text-gray-800"
                            }`}>
                              {strategy.name}
                            </p>
                            {selectedStrategy?.id === strategy.id && (
                              <Check className="w-3.5 h-3.5 text-teal-600" />
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                            {strategy.description.slice(0, 100)}...
                          </p>
                          <div className="flex gap-3 mt-1.5">
                            <span className="text-[9px] text-gray-400">
                              Evidence: {strategy.evidenceStrength}/5
                            </span>
                            <span className="text-[9px] text-gray-400">
                              Cost: {strategy.costRating}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Success Criteria */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Success criteria
              </label>
              <textarea
                value={formSuccessCriteria}
                onChange={(e) => setFormSuccessCriteria(e.target.value)}
                rows={3}
                placeholder="e.g. Pupil can independently add fractions with different denominators with 80% accuracy"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200 placeholder:text-gray-300 resize-none"
              />
            </div>

            {/* Lesson Adaptations */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Lesson adaptations
              </label>
              <textarea
                value={formAdaptations}
                onChange={(e) => setFormAdaptations(e.target.value)}
                rows={2}
                placeholder="e.g. Pre-teach vocabulary, provide concrete manipulatives, sentence stems"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200 placeholder:text-gray-300 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            <button
              onClick={handleCreate}
              disabled={saving || !formTitle || !formTarget}
              className="w-full px-4 py-2.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Create Plan
            </button>
          </div>
        </div>
      </>
    );
  }

  /* ── Active intervention view ───────────────────────────────── */

  if (!intervention) return null;

  const sessions = intervention.sessions ?? [];
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "plan", label: "Plan", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "sessions", label: `Sessions (${sessions.length})`, icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "impact", label: "Impact", icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: "narrative", label: "Narrative", icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  const statusConfig = STATUS_LABELS[intervention.status as InterventionStatus] ?? STATUS_LABELS.active;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-150"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400" />
            </button>
            <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-base font-semibold text-gray-900">{intervention.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{intervention.target}</p>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-gray-100">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors duration-150 ${
                  activeTab === tab.id
                    ? "text-gray-900 bg-white border border-gray-100 border-b-white -mb-px"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Plan Tab ──────────────────────────────────────── */}
          {activeTab === "plan" && (
            <div className="space-y-4">
              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                <DetailCard label="Subject" value={intervention.subject} />
                <DetailCard
                  label="Format"
                  value={FORMAT_OPTIONS.find((f) => f.value === intervention.format)?.label ?? intervention.format}
                />
                <DetailCard label="Frequency" value={intervention.frequency ?? "--"} />
                <DetailCard label="Duration" value={intervention.duration_weeks ? `${intervention.duration_weeks} weeks` : "--"} />
                <DetailCard label="Delivered by" value={intervention.delivered_by ?? "--"} />
                <DetailCard
                  label="Started"
                  value={intervention.started_at ? new Date(intervention.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "--"}
                />
              </div>

              {/* EEF Strategy */}
              {intervention.eef_strategy_name && (
                <div className="rounded-lg border border-gray-100 bg-teal-50 px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                    <p className="text-xs font-medium text-teal-800">EEF Strategy</p>
                  </div>
                  <p className="text-sm font-medium text-teal-700">{intervention.eef_strategy_name}</p>
                  {intervention.eef_impact_months != null && (
                    <p className="text-[10px] text-teal-600 mt-0.5">
                      +{intervention.eef_impact_months} months additional progress (average)
                    </p>
                  )}
                </div>
              )}

              {/* Success Criteria */}
              {intervention.success_criteria && (
                <div className="rounded-lg border border-gray-100 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Success Criteria</p>
                  <p className="text-sm text-gray-600">{intervention.success_criteria}</p>
                </div>
              )}

              {/* Lesson Adaptations */}
              {intervention.lesson_adaptations && (
                <div className="rounded-lg border border-gray-100 bg-white px-4 py-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Lesson Adaptations</p>
                  <p className="text-sm text-gray-600">{intervention.lesson_adaptations}</p>
                </div>
              )}

              {/* Status actions */}
              <div className="flex gap-2 pt-2">
                {intervention.status === "active" && (
                  <>
                    <button
                      onClick={() => handleStatusChange("paused")}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause
                    </button>
                    <button
                      onClick={() => handleStatusChange("completed")}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Complete
                    </button>
                  </>
                )}
                {intervention.status === "paused" && (
                  <button
                    onClick={() => handleStatusChange("active")}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Sessions Tab ──────────────────────────────────── */}
          {activeTab === "sessions" && (
            <div className="space-y-4">
              {/* Log new session button/form */}
              {!showSessionForm ? (
                <button
                  onClick={() => setShowSessionForm(true)}
                  className="w-full px-4 py-2.5 text-xs font-medium text-teal-700 border border-teal-200 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log New Session
                </button>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-900">Log Session</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">Date</label>
                      <input
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">Duration (min)</label>
                      <input
                        type="number"
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(parseInt(e.target.value) || 20)}
                        min={5}
                        max={120}
                        className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Focus area</label>
                    <input
                      type="text"
                      value={sessionFocus}
                      onChange={(e) => setSessionFocus(e.target.value)}
                      placeholder="What was the session focus?"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300 placeholder:text-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Observation</label>
                    <textarea
                      value={sessionObservation}
                      onChange={(e) => setSessionObservation(e.target.value)}
                      rows={2}
                      placeholder="What did you observe?"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300 placeholder:text-gray-300 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">CPA Stage</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {CPA_STAGES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSessionStage(sessionStage === s.value ? "" : s.value)}
                          className={`px-2 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                            sessionStage === s.value
                              ? "border-teal-300 bg-teal-50 text-teal-700"
                              : "border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Progress note</label>
                    <textarea
                      value={sessionProgressNote}
                      onChange={(e) => setSessionProgressNote(e.target.value)}
                      rows={2}
                      placeholder="How is the pupil progressing?"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300 placeholder:text-gray-300 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">Next session plan</label>
                    <input
                      type="text"
                      value={sessionNextPlan}
                      onChange={(e) => setSessionNextPlan(e.target.value)}
                      placeholder="What will the next session focus on?"
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-teal-300 placeholder:text-gray-300"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowSessionForm(false)}
                      className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogSession}
                      disabled={savingSession || !sessionFocus}
                      className="flex-1 px-3 py-2 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {savingSession ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      Log Session
                    </button>
                  </div>
                </div>
              )}

              {/* Session list */}
              {sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border border-gray-100 bg-white px-4 py-3"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {s.session_number}
                          </span>
                          <span className="text-xs font-medium text-gray-900">{s.focus}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.stage && (
                            <span className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-600">
                              {s.stage}
                            </span>
                          )}
                          {s.duration_minutes && (
                            <span className="text-[10px] text-gray-400">{s.duration_minutes}min</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(s.session_date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                        {s.delivered_by && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {s.delivered_by}
                          </span>
                        )}
                      </div>
                      {s.observation && (
                        <p className="text-xs text-gray-600 leading-relaxed">{s.observation}</p>
                      )}
                      {s.progress_note && (
                        <p className="text-[10px] text-gray-500 mt-1 italic">{s.progress_note}</p>
                      )}
                      {s.next_session_plan && (
                        <p className="text-[10px] text-teal-600 mt-1">
                          Next: {s.next_session_plan}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No sessions logged yet.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Log the first session to start tracking progress.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Impact Tab ────────────────────────────────────── */}
          {activeTab === "impact" && (
            <div className="space-y-5">
              {/* Before/After comparison */}
              <div className="rounded-lg border border-gray-100 bg-white p-5">
                <p className="text-xs font-semibold text-gray-900 mb-4">Attainment Progress</p>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Baseline</p>
                    <div className="w-16 h-16 rounded-xl border-2 border-gray-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-gray-500">{currentGrade}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-px bg-gray-200" />
                    <span className="text-[9px] text-gray-400">{sessions.length} sessions</span>
                    <div className="w-12 h-px bg-gray-200" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Current</p>
                    <div className="w-16 h-16 rounded-xl border-2 border-teal-200 bg-teal-50 flex items-center justify-center">
                      <span className="text-lg font-bold text-teal-700">{currentGrade}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session summary stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-gray-100 px-3 py-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{sessions.length}</p>
                  <p className="text-[10px] text-gray-400">Sessions</p>
                </div>
                <div className="rounded-lg border border-gray-100 px-3 py-3 text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {sessions.reduce((s, sess) => s + (sess.duration_minutes ?? 0), 0)}
                  </p>
                  <p className="text-[10px] text-gray-400">Minutes</p>
                </div>
                <div className="rounded-lg border border-gray-100 px-3 py-3 text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {intervention.duration_weeks ?? "--"}
                  </p>
                  <p className="text-[10px] text-gray-400">Weeks Planned</p>
                </div>
              </div>

              {/* CPA stage progression */}
              {sessions.some((s) => s.stage) && (
                <div className="rounded-lg border border-gray-100 bg-white p-4">
                  <p className="text-xs font-semibold text-gray-900 mb-3">CPA Progression</p>
                  <div className="flex gap-1">
                    {CPA_STAGES.map((stage) => {
                      const count = sessions.filter((s) => s.stage === stage.value).length;
                      return (
                        <div key={stage.value} className="flex-1 text-center">
                          <div
                            className={`h-2 rounded-full mb-1.5 ${
                              count > 0 ? "bg-teal-400" : "bg-gray-100"
                            }`}
                          />
                          <p className="text-[9px] font-medium text-gray-600">{stage.label}</p>
                          <p className="text-[9px] text-gray-400">{count} sessions</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* EEF strategy reminder */}
              {intervention.eef_strategy_name && (
                <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500">
                    This intervention uses the EEF strategy "{intervention.eef_strategy_name}"
                    which has an evidence base of{" "}
                    <span className="font-medium text-gray-700">
                      +{intervention.eef_impact_months} months
                    </span>{" "}
                    additional progress on average.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Narrative Tab ─────────────────────────────────── */}
          {activeTab === "narrative" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-100 bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-900">Ofsted-Ready Narrative</p>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wide">
                    Auto-generated
                  </span>
                </div>
                <div className="prose prose-sm max-w-none">
                  {narrativeText.split("\n\n").map((para, i) => (
                    <p key={i} className="text-xs text-gray-700 leading-relaxed mb-3 last:mb-0">
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleCopyNarrative(narrativeText)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy to Clipboard
                    </>
                  )}
                </button>
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-gray-400 border border-gray-100 bg-gray-50 rounded-lg cursor-not-allowed"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Export PDF (coming soon)
                </button>
              </div>

              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                This narrative is generated automatically from assessment data,
                intervention plans, and session logs. It can be used as a starting point
                for Ofsted evidence documentation, SEF writing, or pupil progress reports.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Helper component ───────────────────────────────────────────── */

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 px-3 py-2.5">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-xs font-medium text-gray-700">{value}</p>
    </div>
  );
}
