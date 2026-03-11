"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Thermometer,
  Calendar,
  Clock,
  Plus,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  X,
  Sparkles,
  User,
  Heart,
  Phone,
  ArrowUpRight,
  Stethoscope,
  CalendarCheck,
  Shield,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  REASON_CATEGORIES,
  FORMAL_STAGES,
  getBradfordLevel,
  getReasonLabel,
  getReasonColor,
  type AbsenceReasonCategory,
  type FormalStage,
} from "@/lib/hr/sickness-types";

// Wellbeing resources for UK schools
const WELLBEING_RESOURCES = [
  {
    name: "Education Support",
    description: "Free confidential helpline for education staff",
    phone: "08000 562 561",
    url: "https://www.educationsupport.org.uk",
    available: "24/7",
  },
  {
    name: "Employee Assistance Programme",
    description: "Contact your school's EAP provider",
    phone: "Check HR records",
    url: null,
    available: "Usually 24/7",
  },
  {
    name: "Mind",
    description: "Mental health support and information",
    phone: "0300 123 3393",
    url: "https://www.mind.org.uk",
    available: "Mon-Fri 9am-6pm",
  },
  {
    name: "Samaritans",
    description: "Emotional support for anyone in distress",
    phone: "116 123",
    url: "https://www.samaritans.org",
    available: "24/7",
  },
];

export default function StaffSicknessDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const staffId = params.staffId as string;
  const { organization } = useAuth();
  const organizationId =
    searchParams.get("organizationId") || organization?.id || "";

  const [records, setRecords] = useState<any[]>([]);
  const [bradford, setBradford] = useState<any>(null);
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Record absence modal
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    reasonCategory: "cold_flu" as AbsenceReasonCategory,
    reasonDetail: "",
    notes: "",
    reportedBy: "",
    selfCertified: true,
  });

  // Edit modal
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    endDate: "",
    formalStage: "none" as FormalStage,
    notes: "",
    workingDaysLost: "",
  });

  // Phased return modal
  const [showPhasedReturn, setShowPhasedReturn] = useState(false);
  const [phasedReturnPlan, setPhasedReturnPlan] = useState({
    startDate: new Date().toISOString().split("T")[0],
    weeks: 4,
    adjustments: "",
    ohRecommended: false,
  });

  // Wellbeing panel toggle
  const [showWellbeing, setShowWellbeing] = useState(false);

  const loadData = useCallback(async () => {
    if (!organizationId || !staffId) return;
    setLoading(true);
    try {
      const [recordsRes, triggersRes] = await Promise.all([
        fetch(
          `/api/hr/sickness?organizationId=${organizationId}&staffId=${staffId}&limit=200`,
        ),
        fetch(`/api/hr/sickness/triggers?organizationId=${organizationId}`),
      ]);

      const recordsData = await recordsRes.json();
      const triggersData = await triggersRes.json();

      const recs = recordsData.records || [];
      setRecords(recs);
      setBradford(recordsData.bradford?.[staffId] || null);
      setTriggers(triggersData.triggers || []);

      // Get staff info from first record
      if (recs.length > 0) {
        setStaffInfo({
          name: recs[0].staff_name,
          role: recs[0].staff_role,
          department: recs[0].staff_department,
        });
      } else {
        // Fetch staff info directly
        const staffRes = await fetch(
          `/api/staff?organizationId=${organizationId}&staffId=${staffId}`,
        );
        const staffData = await staffRes.json();
        const s = staffData.staff?.[0] || staffData.data?.[0];
        if (s) {
          setStaffInfo({
            name: s.full_name || s.display_name,
            role: s.role || s.job_title,
            department: s.department || s.role_category,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load staff sickness data:", err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, staffId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Summary calculations
  const totalAbsences = records.length;
  const totalDays = records.reduce(
    (sum, r) => sum + (Number(r.working_days_lost) || 0),
    0,
  );
  const avgDuration =
    totalAbsences > 0 ? Math.round((totalDays / totalAbsences) * 10) / 10 : 0;
  const bradfordScore = bradford ? Number(bradford.bradford_score) : 0;
  const bradfordLevel = getBradfordLevel(bradfordScore);
  const isCurrentlyAbsent = records.some((r) => !r.end_date);
  const currentAbsence = records.find((r) => !r.end_date);

  // Calculate days absent for current absence
  const currentAbsenceDays = currentAbsence
    ? Math.ceil(
        (Date.now() - new Date(currentAbsence.start_date).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  // Determine if fit note is needed (> 7 calendar days)
  const needsFitNote =
    isCurrentlyAbsent &&
    currentAbsenceDays > 7 &&
    !currentAbsence?.fit_note_received;

  // Check if OH referral might be appropriate
  const ohReferralAdvised =
    bradfordScore >= 200 ||
    totalAbsences >= 3 ||
    (isCurrentlyAbsent && currentAbsenceDays > 14) ||
    records.some((r) => r.reason_category === "mental_health") ||
    records.some((r) => r.reason_category === "musculoskeletal");

  // Trigger breaches
  const triggersBreached = triggers.filter((t) => {
    if (!t.is_active) return false;
    if (t.trigger_name === "bradford_threshold")
      return bradfordScore >= t.trigger_value;
    if (t.trigger_name === "occasions_threshold")
      return totalAbsences >= t.trigger_value;
    if (t.trigger_name === "days_threshold")
      return totalDays >= t.trigger_value;
    return false;
  });

  // Most common reason
  const reasonCounts: Record<string, number> = {};
  for (const r of records) {
    reasonCounts[r.reason_category] =
      (reasonCounts[r.reason_category] || 0) + 1;
  }
  const topReason = Object.entries(reasonCounts).sort(
    ([, a], [, b]) => b - a,
  )[0];

  const handleNewAbsence = async () => {
    if (!form.startDate || !form.reasonCategory) return;
    setSaving(true);
    try {
      const res = await fetch("/api/hr/sickness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          staffMemberId: staffId,
          startDate: form.startDate,
          endDate: form.endDate || null,
          reasonCategory: form.reasonCategory,
          reasonDetail: form.reasonDetail || null,
          notes: form.notes || null,
          reportedBy: form.reportedBy || null,
          selfCertified: form.selfCertified,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setForm({
          startDate: new Date().toISOString().split("T")[0],
          endDate: "",
          reasonCategory: "cold_flu",
          reasonDetail: "",
          notes: "",
          reportedBy: "",
          selfCertified: true,
        });
        loadData();
      }
    } catch (err) {
      console.error("Failed to save absence:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/hr/sickness/${editingRecord.id}?organizationId=${organizationId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            endDate: editForm.endDate || null,
            formalStage: editForm.formalStage,
            notes: editForm.notes || null,
            workingDaysLost: editForm.workingDaysLost
              ? Number(editForm.workingDaysLost)
              : null,
          }),
        },
      );
      if (res.ok) {
        setEditingRecord(null);
        loadData();
      }
    } catch (err) {
      console.error("Failed to update record:", err);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    setEditForm({
      endDate: record.end_date || "",
      formalStage: record.formal_stage || "none",
      notes: record.notes || "",
      workingDaysLost: record.working_days_lost?.toString() || "",
    });
  };

  // Build phased return schedule
  const phasedReturnSchedule = (() => {
    const weeks = [];
    const startDate = new Date(phasedReturnPlan.startDate);
    for (let i = 0; i < phasedReturnPlan.weeks; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 4);

      // Gradually increase hours: start at 50%, increase each week
      const hoursPercent = Math.min(
        50 + Math.round((50 / phasedReturnPlan.weeks) * (i + 1)),
        100,
      );
      const hoursPerDay = Math.round((hoursPercent / 100) * 6.5 * 10) / 10; // 6.5h school day

      weeks.push({
        week: i + 1,
        start: weekStart.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        end: weekEnd.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
        hoursPercent,
        hoursPerDay,
      });
    }
    return weeks;
  })();

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1200px] mx-auto">
      {/* Back link + Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link
          href={`/dashboard/hr/sickness`}
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-blue-400 mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Sickness Tracker
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
              <Sparkles size={14} className="animate-pulse" />
              Staff Sickness Profile
            </div>
            {loading ? (
              <div className="h-10 w-60 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            ) : (
              <>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                  <User size={28} className="text-blue-400" />
                  {staffInfo?.name || "Staff Member"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  {staffInfo?.role}
                  {staffInfo?.department && ` — ${staffInfo.department}`}
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setShowWellbeing(!showWellbeing)}
              variant="outline"
              className="rounded-xl gap-2 border-pink-500/30 text-pink-500 hover:bg-pink-500/5"
            >
              <Heart size={16} />
              Wellbeing
            </Button>
            <Button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2"
            >
              <Plus size={16} />
              Record Absence
            </Button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <>
          {/* Wellbeing Resources Panel */}
          <AnimatePresence>
            {showWellbeing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-pink-50 dark:bg-pink-900/10 rounded-2xl border border-pink-200 dark:border-pink-800/30 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-pink-700 dark:text-pink-300 flex items-center gap-2">
                      <Heart size={14} />
                      Wellbeing & Support Resources
                    </h3>
                    <button
                      onClick={() => setShowWellbeing(false)}
                      className="text-pink-400 hover:text-pink-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {WELLBEING_RESOURCES.map((resource) => (
                      <div
                        key={resource.name}
                        className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-pink-100 dark:border-pink-800/20"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {resource.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {resource.description}
                            </p>
                          </div>
                          {resource.url && (
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink-400 hover:text-pink-600 shrink-0"
                            >
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 flex items-center gap-1">
                            <Phone size={10} />
                            {resource.phone}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {resource.available}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-pink-400 mt-3">
                    Share these resources confidentially with the staff member
                    as appropriate. All calls are confidential.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bradford Factor + Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Bradford Factor Ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center"
            >
              <div
                className="relative w-28 h-28 rounded-full flex items-center justify-center"
                style={{
                  background: `conic-gradient(${bradfordLevel.color} ${Math.min(bradfordScore / 10, 100)}%, transparent 0%)`,
                }}
              >
                <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
                  <div className="text-center">
                    <p
                      className="text-2xl font-black"
                      style={{ color: bradfordLevel.color }}
                    >
                      {Math.round(bradfordScore)}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">
                      Bradford
                    </p>
                  </div>
                </div>
              </div>
              <p
                className="mt-3 text-sm font-bold"
                style={{ color: bradfordLevel.color }}
              >
                {bradfordLevel.label} Risk
              </p>
              <p className="text-xs text-slate-400 mt-1">
                S x S x D = {bradford?.occasions || 0}
                <sup>2</sup> x {bradford?.total_days || 0}
              </p>
            </motion.div>

            {/* Summary stats */}
            {[
              {
                label: "Total Absences",
                value: totalAbsences,
                icon: Calendar,
                accent: "text-blue-400",
              },
              {
                label: "Days Lost",
                value: totalDays,
                icon: Clock,
                accent: "text-cyan-400",
              },
              {
                label: "Avg Duration",
                value: `${avgDuration}d`,
                icon: Thermometer,
                accent: "text-amber-400",
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon size={16} className={stat.accent} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Current status banner */}
          {isCurrentlyAbsent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-semibold text-red-400">
                  Currently absent since{" "}
                  {new Date(currentAbsence?.start_date).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}{" "}
                  ({currentAbsenceDays} day{currentAbsenceDays !== 1 && "s"})
                </span>
              </div>

              {/* Status indicators */}
              <div className="flex flex-wrap gap-2">
                {currentAbsenceDays <= 7 && (
                  <span className="text-[10px] px-2 py-1 rounded-lg bg-green-500/10 text-green-400 font-semibold border border-green-500/20">
                    Self-certification period (days 1-7)
                  </span>
                )}
                {needsFitNote && (
                  <span className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    Fit note required (day 8+)
                  </span>
                )}
                {currentAbsenceDays > 7 &&
                  currentAbsence?.fit_note_received && (
                    <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                      Fit note received
                    </span>
                  )}
                {currentAbsenceDays >= 1 && (
                  <span className="text-[10px] px-2 py-1 rounded-lg bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20">
                    SSP eligible from day 1 (April 2026)
                  </span>
                )}
              </div>

              {/* Quick actions for current absence */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() =>
                    currentAbsence && openEditModal(currentAbsence)
                  }
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  Close absence (set end date)
                </button>
                <button
                  onClick={() => setShowPhasedReturn(true)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                >
                  Plan phased return
                </button>
                <Link
                  href={`/dashboard/documents/new?staffId=${staffId}`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                >
                  Generate letter
                </Link>
              </div>
            </motion.div>
          )}

          {/* OH Referral & Top Reason Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OH Referral Recommendation */}
            {ohReferralAdvised && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-teal-500/30 p-5"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <Stethoscope size={14} className="text-teal-400" />
                  Occupational Health Consideration
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Based on absence patterns, an OH referral may be appropriate.
                  Consider:
                </p>
                <ul className="space-y-2">
                  {bradfordScore >= 200 && (
                    <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <ArrowUpRight
                        size={12}
                        className="text-amber-400 mt-0.5 shrink-0"
                      />
                      Bradford Factor ({Math.round(bradfordScore)}) indicates
                      high frequency pattern
                    </li>
                  )}
                  {records.some(
                    (r) => r.reason_category === "mental_health",
                  ) && (
                    <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Heart
                        size={12}
                        className="text-pink-400 mt-0.5 shrink-0"
                      />
                      Mental health-related absences recorded
                    </li>
                  )}
                  {records.some(
                    (r) => r.reason_category === "musculoskeletal",
                  ) && (
                    <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <ArrowUpRight
                        size={12}
                        className="text-orange-400 mt-0.5 shrink-0"
                      />
                      Musculoskeletal issues — workplace adjustments may help
                    </li>
                  )}
                  {isCurrentlyAbsent && currentAbsenceDays > 14 && (
                    <li className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Clock
                        size={12}
                        className="text-red-400 mt-0.5 shrink-0"
                      />
                      Extended absence ({currentAbsenceDays} days) — OH report
                      advisable before return
                    </li>
                  )}
                </ul>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/dashboard/documents/new?staffId=${staffId}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-500 hover:bg-teal-500/20 transition-colors"
                  >
                    Generate OH referral letter
                  </Link>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Equality Act 2010: Consider reasonable adjustments for
                  disabilities under the Act
                </p>
              </motion.div>
            )}

            {/* Top Reason & Pattern Summary */}
            {topReason && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
              >
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-blue-400" />
                  Absence Profile
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: getReasonColor(
                          topReason[0] as AbsenceReasonCategory,
                        ),
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Most common:{" "}
                        {getReasonLabel(topReason[0] as AbsenceReasonCategory)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {topReason[1]} of {totalAbsences} absences (
                        {Math.round((topReason[1] / totalAbsences) * 100)}%)
                      </p>
                    </div>
                  </div>
                  {/* All reasons breakdown */}
                  <div className="space-y-1.5">
                    {Object.entries(reasonCounts)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, count]) => (
                        <div key={cat} className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor: getReasonColor(
                                cat as AbsenceReasonCategory,
                              ),
                            }}
                          />
                          <span className="text-xs text-slate-500 flex-1">
                            {getReasonLabel(cat as AbsenceReasonCategory)}
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(count / totalAbsences) * 100}%`,
                                backgroundColor: getReasonColor(
                                  cat as AbsenceReasonCategory,
                                ),
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-400 w-4 text-right">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Trigger status */}
          {triggersBreached.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-500/30 p-5"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-400" />
                Trigger Thresholds Breached
              </h3>
              <div className="space-y-2">
                {triggersBreached.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {t.trigger_name
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </p>
                      <p className="text-xs text-slate-400">
                        Threshold: {t.trigger_value} over{" "}
                        {t.review_period_months} months
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {t.action_required.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Absence Timeline */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-blue-400" />
                Absence History
              </h2>
              <span className="text-sm text-slate-400">
                {records.length} record{records.length !== 1 && "s"}
              </span>
            </div>

            {records.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2
                  size={48}
                  className="mx-auto text-green-400 mb-4"
                />
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">
                  No absence records
                </h3>
                <p className="text-sm text-slate-500">
                  This staff member has no recorded sickness absences
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {records.map((r: any, idx: number) => {
                  const stage = FORMAL_STAGES.find(
                    (s) => s.value === r.formal_stage,
                  );
                  const daysLost = r.working_days_lost
                    ? Number(r.working_days_lost)
                    : null;

                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      {/* Timeline dot + line */}
                      <div className="flex flex-col items-center pt-1">
                        <div
                          className="w-3 h-3 rounded-full shrink-0 ring-4 ring-white dark:ring-slate-800"
                          style={{
                            backgroundColor: getReasonColor(r.reason_category),
                          }}
                        />
                        {idx < records.length - 1 && (
                          <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mt-2" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {getReasonLabel(r.reason_category)}
                          </span>
                          {!r.end_date && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold border border-red-500/20">
                              ONGOING
                            </span>
                          )}
                          {stage && stage.value !== "none" && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                              style={{
                                color: stage.color,
                                backgroundColor: `${stage.color}15`,
                                border: `1px solid ${stage.color}30`,
                              }}
                            >
                              {stage.label}
                            </span>
                          )}
                          {r.self_certified && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 font-semibold">
                              Self-certified
                            </span>
                          )}
                          {r.fit_note_received && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-semibold">
                              Fit note
                            </span>
                          )}
                          {r.occupational_health_referral && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 font-semibold">
                              OH referral
                            </span>
                          )}
                          {r.phased_return && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-semibold">
                              Phased return
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(r.start_date).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                          {r.end_date
                            ? ` — ${new Date(r.end_date).toLocaleDateString(
                                "en-GB",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )}`
                            : " — present"}
                          {daysLost != null && (
                            <span className="ml-2 font-semibold text-slate-500 dark:text-slate-300">
                              ({daysLost} working day
                              {daysLost !== 1 && "s"})
                            </span>
                          )}
                        </p>

                        {r.reason_detail && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                            {r.reason_detail}
                          </p>
                        )}

                        {r.notes && (
                          <p className="text-xs text-slate-500 mt-1 italic">
                            {r.notes}
                          </p>
                        )}

                        {r.trigger_hit && r.trigger_hit !== "none" && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                            <AlertTriangle size={12} />
                            Trigger: {r.trigger_hit.replace(/_/g, " ")}
                          </div>
                        )}

                        <button
                          onClick={() => openEditModal(r)}
                          className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          Edit record
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* New Absence Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Record Absence for {staffInfo?.name}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm({ ...form, startDate: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm({ ...form, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Reason Category *
                  </label>
                  <select
                    value={form.reasonCategory}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        reasonCategory: e.target.value as AbsenceReasonCategory,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                  >
                    {REASON_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Details
                  </label>
                  <input
                    type="text"
                    value={form.reasonDetail}
                    onChange={(e) =>
                      setForm({ ...form, reasonDetail: e.target.value })
                    }
                    placeholder="Additional details..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Reported By
                  </label>
                  <input
                    type="text"
                    value={form.reportedBy}
                    onChange={(e) =>
                      setForm({ ...form, reportedBy: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.selfCertified}
                    onChange={(e) =>
                      setForm({ ...form, selfCertified: e.target.checked })
                    }
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Self-certified
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleNewAbsence}
                  disabled={saving || !form.startDate}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl gap-2"
                >
                  {saving ? "Saving..." : "Record Absence"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Record Modal */}
      <AnimatePresence>
        {editingRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setEditingRecord(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Update Absence Record
                </h2>
                <button
                  onClick={() => setEditingRecord(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    End Date (close this absence)
                  </label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Working Days Lost
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editForm.workingDaysLost}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        workingDaysLost: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Formal Stage
                  </label>
                  <select
                    value={editForm.formalStage}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        formalStage: e.target.value as FormalStage,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                  >
                    {FORMAL_STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setEditingRecord(null)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateRecord}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
                >
                  {saving ? "Saving..." : "Update Record"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phased Return Planner Modal */}
      <AnimatePresence>
        {showPhasedReturn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowPhasedReturn(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarCheck size={18} className="text-purple-400" />
                  Phased Return Planner
                </h2>
                <button
                  onClick={() => setShowPhasedReturn(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                <p className="text-sm text-slate-500">
                  Plan a gradual return to work for {staffInfo?.name}. Hours
                  increase each week from 50% to full timetable.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Return Start Date
                    </label>
                    <input
                      type="date"
                      value={phasedReturnPlan.startDate}
                      onChange={(e) =>
                        setPhasedReturnPlan({
                          ...phasedReturnPlan,
                          startDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Duration (weeks)
                    </label>
                    <select
                      value={phasedReturnPlan.weeks}
                      onChange={(e) =>
                        setPhasedReturnPlan({
                          ...phasedReturnPlan,
                          weeks: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 appearance-none cursor-pointer"
                    >
                      {[2, 3, 4, 6, 8].map((w) => (
                        <option key={w} value={w}>
                          {w} weeks
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={phasedReturnPlan.ohRecommended}
                    onChange={(e) =>
                      setPhasedReturnPlan({
                        ...phasedReturnPlan,
                        ohRecommended: e.target.checked,
                      })
                    }
                    className="rounded border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Recommended by Occupational Health
                  </span>
                </label>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Adjustments / Notes
                  </label>
                  <textarea
                    value={phasedReturnPlan.adjustments}
                    onChange={(e) =>
                      setPhasedReturnPlan({
                        ...phasedReturnPlan,
                        adjustments: e.target.value,
                      })
                    }
                    rows={2}
                    placeholder="e.g. No playground duty, reduced timetable, avoid stairs..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                  />
                </div>

                {/* Schedule Preview */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Proposed Schedule
                  </h4>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-4 gap-0 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <div className="px-3 py-2">Week</div>
                      <div className="px-3 py-2">Dates</div>
                      <div className="px-3 py-2 text-center">Hours/Day</div>
                      <div className="px-3 py-2 text-center">Timetable</div>
                    </div>
                    {phasedReturnSchedule.map((week) => (
                      <div
                        key={week.week}
                        className="grid grid-cols-4 gap-0 border-b border-slate-100 dark:border-slate-700 last:border-0"
                      >
                        <div className="px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-white">
                          Week {week.week}
                        </div>
                        <div className="px-3 py-2.5 text-xs text-slate-500">
                          {week.start} — {week.end}
                        </div>
                        <div className="px-3 py-2.5 text-center text-sm font-semibold text-slate-900 dark:text-white">
                          {week.hoursPerDay}h
                        </div>
                        <div className="px-3 py-2.5 text-center">
                          <div className="relative h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="absolute h-full rounded-full bg-purple-500/60 transition-all duration-500"
                              style={{ width: `${week.hoursPercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {week.hoursPercent}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-200 dark:border-purple-800/30 p-3">
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    <strong>Note:</strong> A phased return is typically funded
                    for 4 weeks. Discuss with your HR provider and OH if a
                    longer period is needed. The employee remains on full pay
                    during a phased return.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setShowPhasedReturn(false)}
                  className="rounded-xl"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // Print the phased return plan
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      const rows = phasedReturnSchedule
                        .map(
                          (w) =>
                            `<tr><td style="padding:8px;border:1px solid #e2e8f0;">Week ${w.week}</td><td style="padding:8px;border:1px solid #e2e8f0;">${w.start} — ${w.end}</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${w.hoursPerDay}h</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${w.hoursPercent}%</td></tr>`,
                        )
                        .join("");
                      printWindow.document.write(
                        `<!DOCTYPE html><html><head><title>Phased Return Plan - ${staffInfo?.name}</title><style>body{font-family:-apple-system,sans-serif;padding:40px;color:#334155;}table{border-collapse:collapse;width:100%;margin:20px 0;}th{background:#f8fafc;padding:8px;border:1px solid #e2e8f0;text-align:left;font-size:12px;text-transform:uppercase;}</style></head><body><h1>Phased Return to Work Plan</h1><p><strong>Staff Member:</strong> ${staffInfo?.name || ""}</p><p><strong>Role:</strong> ${staffInfo?.role || ""}</p><p><strong>Start Date:</strong> ${new Date(phasedReturnPlan.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p><p><strong>Duration:</strong> ${phasedReturnPlan.weeks} weeks</p>${phasedReturnPlan.ohRecommended ? "<p><strong>OH Recommended:</strong> Yes</p>" : ""}${phasedReturnPlan.adjustments ? `<p><strong>Adjustments:</strong> ${phasedReturnPlan.adjustments}</p>` : ""}<table><tr><th>Week</th><th>Dates</th><th style="text-align:center;">Hours/Day</th><th style="text-align:center;">Timetable %</th></tr>${rows}</table><p style="color:#94a3b8;font-size:12px;margin-top:40px;">Generated by Schoolgle HR & People</p></body></html>`,
                      );
                      printWindow.document.close();
                      printWindow.print();
                    }
                    setShowPhasedReturn(false);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl gap-2"
                >
                  <FileText size={14} />
                  Print Plan
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
