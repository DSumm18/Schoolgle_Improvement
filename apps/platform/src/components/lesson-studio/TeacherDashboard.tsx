"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  ChevronRight,
  Loader2,
  BarChart3,
  Target,
  Award,
  Search,
} from "lucide-react";
import type { AttainmentLevel, LSPupil } from "@/types/lesson-studio";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";

/* ── Types ───────────────────────────────────────────────────────── */

interface DashboardAlert {
  id: string;
  type: "gap" | "inconsistency" | "progress";
  severity: "high" | "medium" | "low";
  pupilId: string;
  pupilName: string;
  title: string;
  description: string;
  subject?: string;
}

interface DashboardStats {
  total: number;
  atExpectedPlus: number;
  greaterDepth: number;
  belowExpected: number;
  prerequisiteGaps: number;
}

interface PupilWithAssessments extends LSPupil {
  latestAssessments: Record<string, {
    teacher_grade: AttainmentLevel | null;
    ai_suggested_grade: AttainmentLevel | null;
    assessment_date: string;
  }>;
}

interface TeacherDashboardProps {
  classId: string;
  className: string;
  onViewPupil: (pupilId: string) => void;
}

/* ── Grade colour mapping ────────────────────────────────────────── */

const GRADE_TEXT_COLORS: Record<string, string> = {
  GDS: "text-blue-600",
  EXS: "text-emerald-600",
  WTS: "text-amber-600",
  PKE: "text-red-500",
  PKF: "text-red-500",
};

const GRADE_BG_COLORS: Record<string, string> = {
  GDS: "bg-blue-50",
  EXS: "bg-emerald-50",
  WTS: "bg-amber-50",
  PKE: "bg-red-50",
  PKF: "bg-red-50",
};

/* ── Helpers ─────────────────────────────────────────────────────── */

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function effectiveGrade(
  pupil: PupilWithAssessments,
  subject: string,
): string | null {
  const fieldMap: Record<string, keyof LSPupil> = {
    reading: "attainment_reading",
    writing: "attainment_writing",
    maths: "attainment_maths",
    science: "attainment_science",
  };
  const field = fieldMap[subject.toLowerCase()];
  if (field && pupil[field]) return pupil[field] as string;

  const assessment = pupil.latestAssessments?.[subject];
  return assessment?.teacher_grade ?? assessment?.ai_suggested_grade ?? null;
}

function hasPupilAlert(
  alerts: DashboardAlert[],
  pupilId: string,
  type: "gap" | "inconsistency",
): boolean {
  return alerts.some((a) => a.pupilId === pupilId && a.type === type);
}

/* ── PupilTag ────────────────────────────────────────────────────── */

function PupilTag({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium uppercase tracking-wider ${className}`}
    >
      {label}
    </span>
  );
}

/* ── StatCard ────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  total,
  color,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  total?: number;
  color: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  const percentage = total && total > 0 ? Math.round((value / total) * 100) : 0;
  const colorMap: Record<string, { bg: string; text: string; bar: string; border: string }> = {
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      bar: "bg-emerald-400",
      border: "border-emerald-100",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      bar: "bg-blue-400",
      border: "border-blue-100",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      bar: "bg-amber-400",
      border: "border-amber-100",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-700",
      bar: "bg-red-400",
      border: "border-red-100",
    },
  };

  const c = colorMap[color] ?? colorMap.emerald;

  return (
    <button
      onClick={onClick}
      className={`rounded-xl border bg-white p-5 text-left transition-colors duration-150 hover:shadow-sm ${c.border}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
          <span className={c.text}>{icon}</span>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${c.text}`}>{value}</span>
        {total != null && total > 0 && (
          <span className="text-sm text-gray-400 mb-0.5">
            / {total} ({percentage}%)
          </span>
        )}
      </div>
      {total != null && total > 0 && (
        <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${c.bar} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </button>
  );
}

/* ── AlertCard ───────────────────────────────────────────────────── */

function AlertCard({
  alert,
  onView,
}: {
  alert: DashboardAlert;
  onView: () => void;
}) {
  const config: Record<
    string,
    { borderColor: string; icon: string; iconColor: string }
  > = {
    gap: {
      borderColor: "border-l-red-400",
      icon: "!",
      iconColor: "text-red-500 bg-red-50",
    },
    inconsistency: {
      borderColor: "border-l-amber-400",
      icon: "?",
      iconColor: "text-amber-500 bg-amber-50",
    },
    progress: {
      borderColor: "border-l-emerald-400",
      icon: "+",
      iconColor: "text-emerald-500 bg-emerald-50",
    },
  };

  const c = config[alert.type] ?? config.gap;

  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white p-4 border-l-[3px] ${c.borderColor} transition-colors duration-150`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-7 h-7 rounded-lg ${c.iconColor} flex items-center justify-center flex-shrink-0 mt-0.5`}
        >
          <span className="text-sm font-bold">{c.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{alert.title}</p>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            {alert.description}
          </p>
        </div>
        <button
          onClick={onView}
          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150 flex-shrink-0"
        >
          View
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ── GradeCell ───────────────────────────────────────────────────── */

function GradeCell({ grade }: { grade: string | null }) {
  if (!grade) {
    return <span className="text-xs text-gray-300">--</span>;
  }
  const textColor = GRADE_TEXT_COLORS[grade] ?? "text-gray-500";
  const bgColor = GRADE_BG_COLORS[grade] ?? "bg-gray-50";

  return (
    <span
      className={`inline-flex items-center justify-center w-10 h-7 rounded-md text-xs font-bold ${textColor} ${bgColor}`}
    >
      {grade}
    </span>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */

export function TeacherDashboard({
  classId,
  className,
  onViewPupil,
}: TeacherDashboardProps) {
  const { session } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [pupils, setPupils] = useState<PupilWithAssessments[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!classId) return;
    setLoading(true);

    (async () => {
      try {
        // Load pupils for this class
        const { data: pupilRows, error: pupilError } = await supabase
          .from("ls_pupils")
          .select("*")
          .eq("class_id", classId)
          .eq("is_active", true);

        if (pupilError) {
          console.error("Pupils fetch error:", pupilError.message);
          return;
        }

        const pupilList = pupilRows ?? [];
        const pupilIds = pupilList.map((p) => p.id);

        // Load latest assessments for those pupils
        let assessmentRows: Array<{
          pupil_id: string;
          subject: string;
          teacher_grade: AttainmentLevel | null;
          ai_suggested_grade: AttainmentLevel | null;
          assessment_date: string;
        }> = [];

        if (pupilIds.length > 0) {
          const { data: aRows } = await supabase
            .from("ls_assessments")
            .select("pupil_id, subject, teacher_grade, ai_suggested_grade, assessment_date")
            .in("pupil_id", pupilIds)
            .order("assessment_date", { ascending: false });

          assessmentRows = aRows ?? [];
        }

        // Build a map of pupil → latestAssessments (one per subject, most recent)
        const assessmentMap: Record<string, Record<string, {
          teacher_grade: AttainmentLevel | null;
          ai_suggested_grade: AttainmentLevel | null;
          assessment_date: string;
        }>> = {};

        for (const a of assessmentRows) {
          if (!assessmentMap[a.pupil_id]) assessmentMap[a.pupil_id] = {};
          if (!assessmentMap[a.pupil_id][a.subject]) {
            assessmentMap[a.pupil_id][a.subject] = {
              teacher_grade: a.teacher_grade,
              ai_suggested_grade: a.ai_suggested_grade,
              assessment_date: a.assessment_date,
            };
          }
        }

        const enrichedPupils: PupilWithAssessments[] = pupilList.map((p) => ({
          ...p,
          latestAssessments: assessmentMap[p.id] ?? {},
        }));

        // Compute stats locally
        const SUBJECTS = ["reading", "writing", "maths", "science"];
        const ATTAINMENT_FIELDS: Record<string, keyof LSPupil> = {
          reading: "attainment_reading",
          writing: "attainment_writing",
          maths: "attainment_maths",
          science: "attainment_science",
        };

        let atExpectedPlus = 0;
        let greaterDepth = 0;
        let belowExpected = 0;
        let prerequisiteGaps = 0;

        for (const pupil of enrichedPupils) {
          let hasGD = false;
          let hasBelow = false;

          for (const subj of SUBJECTS) {
            const field = ATTAINMENT_FIELDS[subj];
            const grade =
              (field && (pupil[field] as string | null)) ??
              pupil.latestAssessments?.[subj]?.teacher_grade ??
              pupil.latestAssessments?.[subj]?.ai_suggested_grade ??
              null;

            if (grade === "GDS") hasGD = true;
            if (grade === "WTS" || grade === "PKE" || grade === "PKF") hasBelow = true;
          }

          if (hasGD) greaterDepth++;
          if (hasBelow) {
            belowExpected++;
            prerequisiteGaps++;
          }
          if (!hasBelow) atExpectedPlus++;
        }

        const computedStats: DashboardStats = {
          total: enrichedPupils.length,
          atExpectedPlus,
          greaterDepth,
          belowExpected,
          prerequisiteGaps,
        };

        // Generate alerts locally
        const generatedAlerts: DashboardAlert[] = [];
        for (const pupil of enrichedPupils) {
          const name = pupil.display_name_encrypted ?? "Unknown";
          for (const subj of SUBJECTS) {
            const assessmentEntry = pupil.latestAssessments?.[subj];
            if (assessmentEntry) {
              const teacherGrade = assessmentEntry.teacher_grade;
              const aiGrade = assessmentEntry.ai_suggested_grade;
              if (
                teacherGrade &&
                aiGrade &&
                teacherGrade !== aiGrade
              ) {
                generatedAlerts.push({
                  id: `${pupil.id}-${subj}-inconsistency`,
                  type: "inconsistency",
                  severity: "medium",
                  pupilId: pupil.id,
                  pupilName: name,
                  title: `Grade inconsistency: ${name}`,
                  description: `Teacher marked ${teacherGrade} but AI suggested ${aiGrade} for ${subj}.`,
                  subject: subj,
                });
              }

              const grade =
                teacherGrade ?? aiGrade;
              if (grade === "WTS" || grade === "PKE" || grade === "PKF") {
                generatedAlerts.push({
                  id: `${pupil.id}-${subj}-gap`,
                  type: "gap",
                  severity: "high",
                  pupilId: pupil.id,
                  pupilName: name,
                  title: `Below expected: ${name}`,
                  description: `${name} is below expected standard in ${subj} (${grade}).`,
                  subject: subj,
                });
              }
            }
          }
        }

        setStats(computedStats);
        setAlerts(generatedAlerts);
        setPupils(enrichedPupils);
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [classId]);

  const filteredPupils = searchQuery
    ? pupils.filter((p) =>
        (p.display_name_encrypted ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : pupils;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mb-3" />
        <p className="text-sm text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="w-10 h-10 mx-auto text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No pupil data available for this class.</p>
        <p className="text-xs text-gray-400 mt-1">
          Import pupils from your MIS or add them manually to see assessment insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="At Expected+"
          value={stats.atExpectedPlus}
          total={stats.total}
          color="emerald"
          icon={<Target className="w-4 h-4" />}
        />
        <StatCard
          label="Greater Depth"
          value={stats.greaterDepth}
          total={stats.total}
          color="blue"
          icon={<Award className="w-4 h-4" />}
        />
        <StatCard
          label="Below Expected"
          value={stats.belowExpected}
          total={stats.total}
          color="amber"
          icon={<TrendingDown className="w-4 h-4" />}
        />
        <StatCard
          label="Prerequisite Gaps"
          value={stats.prerequisiteGaps}
          color="red"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Smart Alerts
          </h3>
          <div className="space-y-2">
            {alerts.slice(0, 8).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onView={() => onViewPupil(alert.pupilId)}
              />
            ))}
            {alerts.length > 8 && (
              <p className="text-xs text-gray-400 text-center pt-1">
                +{alerts.length - 8} more alerts
              </p>
            )}
          </div>
        </div>
      )}

      {/* Class Assessment Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Class Assessment Overview
          </h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search pupils..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200 transition-colors w-48"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide w-[240px]">
                    Pupil
                  </th>
                  <th className="text-center px-3 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                    Reading
                  </th>
                  <th className="text-center px-3 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                    Writing
                  </th>
                  <th className="text-center px-3 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                    Maths
                  </th>
                  <th className="text-center px-3 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                    Science
                  </th>
                  <th className="text-center px-3 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                    Flags
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wide w-[80px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPupils.map((pupil) => {
                  const hasGap = hasPupilAlert(alerts, pupil.id, "gap");
                  const hasInconsistency = hasPupilAlert(
                    alerts,
                    pupil.id,
                    "inconsistency",
                  );
                  const rowBg = hasGap
                    ? "bg-red-50/50"
                    : hasInconsistency
                      ? "bg-amber-50/50"
                      : "";

                  return (
                    <tr
                      key={pupil.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-150 ${rowBg}`}
                    >
                      {/* Pupil name + tags */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-[9px] font-bold text-gray-500">
                              {getInitials(pupil.display_name_encrypted)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {pupil.display_name_encrypted ?? "Unknown"}
                            </p>
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {pupil.has_ehcp && (
                                <PupilTag
                                  label="EHCP"
                                  className="bg-pink-50 text-pink-600"
                                />
                              )}
                              {pupil.has_send_support && !pupil.has_ehcp && (
                                <PupilTag
                                  label="SEN"
                                  className="bg-pink-50 text-pink-500"
                                />
                              )}
                              {pupil.is_pupil_premium && (
                                <PupilTag
                                  label="PP"
                                  className="bg-amber-50 text-amber-600"
                                />
                              )}
                              {pupil.is_eal && (
                                <PupilTag
                                  label="EAL"
                                  className="bg-blue-50 text-blue-500"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subject grades */}
                      <td className="px-3 py-3 text-center">
                        <GradeCell grade={effectiveGrade(pupil, "reading")} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <GradeCell grade={effectiveGrade(pupil, "writing")} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <GradeCell grade={effectiveGrade(pupil, "maths")} />
                      </td>
                      <td className="px-3 py-3 text-center">
                        <GradeCell grade={effectiveGrade(pupil, "science")} />
                      </td>

                      {/* Flags */}
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {hasGap && (
                            <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-red-500">
                                !
                              </span>
                            </span>
                          )}
                          {hasInconsistency && (
                            <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-amber-500">
                                ?
                              </span>
                            </span>
                          )}
                          {!hasGap && !hasInconsistency && (
                            <Minus className="w-3.5 h-3.5 text-gray-300" />
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onViewPupil(pupil.id)}
                          className="text-[11px] font-medium text-teal-600 hover:text-teal-700 transition-colors duration-150"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredPupils.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">
              No pupils match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
