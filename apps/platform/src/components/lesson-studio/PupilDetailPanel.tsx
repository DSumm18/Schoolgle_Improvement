"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ChevronDown,
  Check,
  AlertTriangle,
  Clock,
  FileText,
  Loader2,
  BookOpen,
  Lightbulb,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type {
  AttainmentLevel,
  LSPupil,
  LSAssessment,
  LSWorkSubmission,
} from "@/types/lesson-studio";
import { useAuth } from "@/context/SupabaseAuthContext";
import { getRelevantStrategies } from "@/lib/eef-toolkit";
import { InterventionPanel } from "./InterventionPanel";

/* ── Prerequisite skill mappings ─────────────────────────────────── */

const MATHS_PREREQUISITES: Record<string, string[]> = {
  "Y6: Compare & order fractions": ["Y5: Equivalent fractions"],
  "Y5: Equivalent fractions": [
    "Y4: Recognise fraction equivalents",
    "Y4: Add fractions (same denominator)",
  ],
  "Y4: Recognise fraction equivalents": ["Y3: Count in tenths"],
  "Y4: Add fractions (same denominator)": [
    "Y3: Count in tenths",
    "Y3: Recognise unit fractions",
  ],
  "Y3: Count in tenths": ["Y2: Recognise halves & quarters"],
  "Y3: Recognise unit fractions": ["Y2: Recognise halves & quarters"],
  "Y2: Recognise halves & quarters": ["Y1: Recognise half"],
  "Y6: Long division": ["Y5: Short division"],
  "Y5: Short division": ["Y4: Division facts", "Y4: Multiply 3-digit by 1-digit"],
  "Y4: Division facts": ["Y3: Multiplication & division facts (3, 4, 8)"],
  "Y4: Multiply 3-digit by 1-digit": [
    "Y3: Multiplication & division facts (3, 4, 8)",
  ],
  "Y3: Multiplication & division facts (3, 4, 8)": [
    "Y2: Multiplication & division facts (2, 5, 10)",
  ],
  "Y6: Algebra — find unknowns": ["Y5: Number sequences"],
  "Y5: Number sequences": ["Y4: Place value to 10,000"],
  "Y4: Place value to 10,000": ["Y3: Place value to 1,000"],
  "Y3: Place value to 1,000": ["Y2: Place value to 100"],
};

const READING_PREREQUISITES: Record<string, string[]> = {
  "Y6: Inference across texts": ["Y5: Deduce characters' feelings"],
  "Y5: Deduce characters' feelings": ["Y4: Draw inferences from text"],
  "Y4: Draw inferences from text": ["Y3: Make simple inferences"],
  "Y3: Make simple inferences": ["Y2: Make predictions from reading"],
  "Y6: Summarise main ideas": ["Y5: Distinguish fact from opinion"],
  "Y5: Distinguish fact from opinion": ["Y4: Retrieve and record information"],
  "Y4: Retrieve and record information": ["Y3: Retrieve information from non-fiction"],
};

const WRITING_PREREQUISITES: Record<string, string[]> = {
  "Y6: Use passive voice": ["Y5: Use relative clauses"],
  "Y5: Use relative clauses": ["Y4: Use fronted adverbials"],
  "Y4: Use fronted adverbials": ["Y3: Use conjunctions for subordination"],
  "Y3: Use conjunctions for subordination": ["Y2: Use coordination (and, but, or)"],
  "Y6: Use semicolons in lists": ["Y5: Use commas to clarify meaning"],
  "Y5: Use commas to clarify meaning": ["Y4: Use inverted commas"],
};

const SCIENCE_PREREQUISITES: Record<string, string[]> = {
  "Y6: Circulatory system": ["Y5: Life cycles", "Y4: Digestive system"],
  "Y5: Life cycles": ["Y4: Living things & habitats"],
  "Y4: Digestive system": ["Y3: Nutrition & skeletons"],
  "Y6: Evolution & inheritance": ["Y5: Life cycles"],
};

const SUBJECT_PREREQUISITES: Record<string, Record<string, string[]>> = {
  maths: MATHS_PREREQUISITES,
  reading: READING_PREREQUISITES,
  writing: WRITING_PREREQUISITES,
  science: SCIENCE_PREREQUISITES,
};

/* ── Types ───────────────────────────────────────────────────────── */

type TabId = "skills" | "history" | "work";

interface SkillNode {
  name: string;
  yearGroup: string;
  status: "secure" | "gap" | "current";
}

interface PupilDetailPanelProps {
  pupilId: string;
  classId: string;
  onClose: () => void;
}

/* ── Helpers ─────────────────────────────────────────────────────── */

const ATTAINMENT_ORDER: Record<string, number> = {
  PKF: 0,
  PKE: 1,
  WTS: 2,
  EXS: 3,
  GDS: 4,
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function gradeColor(grade: string | null): string {
  if (!grade) return "text-gray-400";
  const map: Record<string, string> = {
    GDS: "text-blue-600",
    EXS: "text-emerald-600",
    WTS: "text-amber-600",
    PKE: "text-red-500",
    PKF: "text-red-500",
  };
  return map[grade] ?? "text-gray-500";
}

function PupilTag({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-medium uppercase tracking-wider ${className}`}
    >
      {label}
    </span>
  );
}

function buildSkillChain(
  subject: string,
  pupilGrade: string | null,
): SkillNode[] {
  const prereqs = SUBJECT_PREREQUISITES[subject.toLowerCase()] ?? {};
  const allSkills = Object.keys(prereqs);
  if (allSkills.length === 0) return [];

  // Find the highest-level skill as the starting point
  const allChildren = new Set(Object.values(prereqs).flat());
  const roots = allSkills.filter((s) => !allChildren.has(s));
  if (roots.length === 0) return [];

  // Walk down from root building a linear chain (take first child at each level)
  const chain: SkillNode[] = [];
  let current = roots[0];
  const visited = new Set<string>();

  while (current && !visited.has(current)) {
    visited.add(current);
    const yearMatch = current.match(/^Y(\d)/);
    const yearNum = yearMatch ? parseInt(yearMatch[1]) : 0;

    // Determine status based on pupil grade and year proximity
    let status: "secure" | "gap" | "current" = "secure";
    if (chain.length === 0) {
      status = "current"; // Top skill is current topic
    } else if (pupilGrade && (pupilGrade === "WTS" || pupilGrade === "PKE" || pupilGrade === "PKF")) {
      // If pupil is below expected, lower year skills might be gaps
      // Skills 2+ levels down from current are likely secure
      // Skills 1 level down might be gaps
      if (chain.length <= 2) {
        status = "gap";
      } else {
        status = "secure";
      }
    }

    chain.push({
      name: current,
      yearGroup: yearMatch ? `Year ${yearMatch[1]}` : "",
      status,
    });

    const children = prereqs[current];
    if (children && children.length > 0) {
      current = children[0];
    } else {
      break;
    }
  }

  return chain;
}

/* ── SkillChainNode ──────────────────────────────────────────────── */

function SkillChainNode({
  node,
  isLast,
}: {
  node: SkillNode;
  isLast: boolean;
}) {
  const config = {
    secure: {
      border: "border-emerald-200",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      icon: <Check className="w-3.5 h-3.5 text-emerald-500" />,
    },
    gap: {
      border: "border-red-200",
      bg: "bg-red-50",
      text: "text-red-700",
      icon: <X className="w-3.5 h-3.5 text-red-500" />,
    },
    current: {
      border: "border-amber-200",
      bg: "bg-amber-50",
      text: "text-amber-700",
      icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
    },
  };

  const c = config[node.status];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-full rounded-lg border ${c.border} ${c.bg} px-4 py-3 flex items-center gap-3`}
      >
        <div className="flex-shrink-0">{c.icon}</div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${c.text}`}>{node.name}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
            {node.yearGroup}
            {node.status === "current" && " - In progress"}
            {node.status === "gap" && " - Gap identified"}
            {node.status === "secure" && " - Secure"}
          </p>
        </div>
      </div>
      {!isLast && (
        <div className="h-5 flex items-center">
          <div className="w-px h-full bg-gray-200" />
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */

export function PupilDetailPanel({
  pupilId,
  classId,
  onClose,
}: PupilDetailPanelProps) {
  const { session } = useAuth();
  const [pupil, setPupil] = useState<LSPupil | null>(null);
  const [assessments, setAssessments] = useState<LSAssessment[]>([]);
  const [workSubmissions, setWorkSubmissions] = useState<LSWorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("skills");
  const [selectedSubject, setSelectedSubject] = useState("maths");
  const [showIntervention, setShowIntervention] = useState(false);

  const headers: HeadersInit = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  useEffect(() => {
    if (!pupilId) return;
    setLoading(true);

    // Load pupil data from the dashboard endpoint or pupils endpoint
    const fetchData = async () => {
      try {
        // Get pupils for the class
        const pupilsRes = await fetch(
          `/api/lesson-studio/pupils?classId=${classId}`,
          { headers },
        );
        const pupilsData = await pupilsRes.json();
        const allPupils: LSPupil[] = pupilsData.data ?? pupilsData ?? [];
        const found = allPupils.find((p) => p.id === pupilId);
        if (found) setPupil(found);

        // Get assessments - try to load all for this pupil
        // The assess endpoint uses lessonPlanId, so we use dashboard data instead
        const dashRes = await fetch(
          `/api/lesson-studio/dashboard?classId=${classId}`,
          { headers },
        );
        const dashData = await dashRes.json();
        if (dashData.pupils) {
          const pupilDash = dashData.pupils.find(
            (p: LSPupil & { latestAssessments?: Record<string, LSAssessment> }) => p.id === pupilId,
          );
          if (pupilDash?.latestAssessments) {
            const assessmentsList = Object.values(
              pupilDash.latestAssessments,
            ) as LSAssessment[];
            setAssessments(assessmentsList);
          }
        }
      } catch (err) {
        console.error("Failed to load pupil details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pupilId, classId]);

  if (loading) {
    return (
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-xl z-50 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!pupil) {
    return (
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-xl z-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Pupil not found.</p>
      </div>
    );
  }

  const name = pupil.display_name_encrypted ?? "Unknown Pupil";
  const overallGrade =
    pupil.attainment_maths ?? pupil.attainment_reading ?? null;

  // Build skill chain for selected subject
  const skillChain = buildSkillChain(
    selectedSubject,
    (pupil as Record<string, unknown>)[
      `attainment_${selectedSubject}` as string
    ] as string | null,
  );

  // Get EEF recommendations
  const gapSubjects = ["reading", "writing", "maths", "science"].filter(
    (s) => {
      const grade = (pupil as Record<string, unknown>)[
        `attainment_${s}`
      ] as string | null;
      return grade === "WTS" || grade === "PKE" || grade === "PKF";
    },
  );

  const eefStrategies = getRelevantStrategies(
    gapSubjects.length > 0
      ? `${gapSubjects.join(" ")} intervention catch-up below expected`
      : "assessment feedback progress",
  ).slice(0, 3);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "skills", label: "Skill Analysis", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: "history", label: "Assessment History", icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "work", label: "Work Samples", icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-150"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
            <span className="text-[10px] text-gray-400 uppercase tracking-wide">
              Pupil Detail
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-gray-500">
                {getInitials(name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900">{name}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {pupil.has_ehcp && (
                  <PupilTag label="EHCP" className="bg-pink-50 text-pink-600" />
                )}
                {pupil.has_send_support && !pupil.has_ehcp && (
                  <PupilTag label="SEN" className="bg-pink-50 text-pink-500" />
                )}
                {pupil.is_pupil_premium && (
                  <PupilTag label="PP" className="bg-amber-50 text-amber-600" />
                )}
                {pupil.is_eal && (
                  <PupilTag label="EAL" className="bg-blue-50 text-blue-500" />
                )}
                {pupil.is_looked_after && (
                  <PupilTag label="LAC" className="bg-purple-50 text-purple-500" />
                )}
              </div>
            </div>
            {overallGrade && (
              <div className="text-right flex-shrink-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                  Overall
                </p>
                <p className={`text-lg font-bold ${gradeColor(overallGrade)}`}>
                  {overallGrade}
                </p>
              </div>
            )}
          </div>

          {/* Grade summary row */}
          <div className="flex gap-2 mt-4">
            {(["reading", "writing", "maths", "science"] as const).map((s) => {
              const grade = (pupil as Record<string, unknown>)[
                `attainment_${s}`
              ] as string | null;
              return (
                <div
                  key={s}
                  className="flex-1 rounded-lg border border-gray-100 px-3 py-2 text-center"
                >
                  <p className="text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </p>
                  <p className={`text-sm font-bold ${gradeColor(grade)}`}>
                    {grade ?? "--"}
                  </p>
                </div>
              );
            })}
          </div>
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
          {/* ── Skill Analysis Tab ─────────────────────────────── */}
          {activeTab === "skills" && (
            <div className="space-y-5">
              {/* Subject selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Subject:</span>
                <div className="relative">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-200 transition-colors cursor-pointer"
                  >
                    <option value="maths">Maths</option>
                    <option value="reading">Reading</option>
                    <option value="writing">Writing</option>
                    <option value="science">Science</option>
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Skill chain */}
              {skillChain.length > 0 ? (
                <div className="space-y-0">
                  {skillChain.map((node, i) => (
                    <SkillChainNode
                      key={node.name}
                      node={node}
                      isLast={i === skillChain.length - 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
                  <BookOpen className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    No prerequisite chain available for{" "}
                    {selectedSubject.charAt(0).toUpperCase() +
                      selectedSubject.slice(1)}
                    .
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Prerequisite mappings cover fractions, division, algebra
                    (maths), inference and summarisation (reading), grammar
                    (writing), and key science topics.
                  </p>
                </div>
              )}

              {/* What This Means card */}
              {skillChain.length > 0 && (
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <p className="text-sm font-semibold text-gray-900">
                      What This Means
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {skillChain.some((n) => n.status === "gap")
                      ? `${name} has gaps in prerequisite skills that are likely impacting their current learning. The red nodes above show skills from earlier year groups that need reinforcement before the current topic can be fully accessed.`
                      : `${name}'s prerequisite skills appear secure for the current topic. Continue to monitor progress and provide appropriate challenge.`}
                  </p>
                </div>
              )}

              {/* EEF Recommendation card */}
              {eefStrategies.length > 0 && (
                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-teal-500" />
                    <p className="text-sm font-semibold text-gray-900">
                      EEF Recommendations
                    </p>
                  </div>
                  <div className="space-y-3">
                    {eefStrategies.map((strategy) => (
                      <div
                        key={strategy.id}
                        className="flex items-start gap-3 rounded-lg bg-teal-50 px-3 py-2.5"
                      >
                        <div className="w-8 h-8 rounded-md bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-teal-700">
                            +{strategy.monthsProgress}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-teal-800">
                            {strategy.name}
                          </p>
                          <p className="text-[10px] text-teal-600 mt-0.5 leading-relaxed">
                            {strategy.description.slice(0, 120)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Assessment History Tab ────────────────────────── */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {/* Attainment fields as "baseline" entries */}
              {(["reading", "writing", "maths", "science"] as const).map(
                (subject) => {
                  const grade = (pupil as Record<string, unknown>)[
                    `attainment_${subject}`
                  ] as string | null;
                  if (!grade) return null;
                  return (
                    <div
                      key={`baseline-${subject}`}
                      className="rounded-xl border border-gray-100 bg-white p-4 flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {subject.charAt(0).toUpperCase() + subject.slice(1)}{" "}
                          Baseline
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          From census/import data
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold ${gradeColor(grade)}`}
                      >
                        {grade}
                      </span>
                      <span className="text-[8px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        Census
                      </span>
                    </div>
                  );
                },
              )}

              {/* Assessment entries */}
              {assessments.length > 0 ? (
                assessments.map((a) => {
                  const grade = a.teacher_grade ?? a.ai_suggested_grade;
                  return (
                    <div
                      key={a.id}
                      className="rounded-xl border border-gray-100 bg-white p-4 flex items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {a.subject}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(a.assessment_date).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold ${gradeColor(grade ?? null)}`}
                      >
                        {grade ?? "--"}
                      </span>
                      <span className="text-[8px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-50 text-teal-600">
                        Lesson
                      </span>
                      {a.teacher_agreed != null && (
                        <span
                          className={`text-[8px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            a.teacher_agreed
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {a.teacher_agreed ? "Verified" : "Overridden"}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-sm text-gray-400">
                  No lesson assessments recorded yet.
                </div>
              )}
            </div>
          )}

          {/* ── Work Samples Tab ──────────────────────────────── */}
          {activeTab === "work" && (
            <div>
              {workSubmissions.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {workSubmissions.map((ws) => (
                    <div
                      key={ws.id}
                      className="rounded-xl border border-gray-100 bg-white p-4 hover:shadow-sm transition-all duration-150 cursor-pointer"
                    >
                      <div className="w-full h-24 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
                        <FileText className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {ws.file_type ?? "Document"}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {new Date(ws.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      {ws.grading_result && (
                        <span
                          className={`inline-block mt-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            gradeColor(ws.grading_result.grade)
                          } bg-gray-50`}
                        >
                          {ws.grading_result.grade}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No work samples yet.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Upload worksheets from the assessment view to see them here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick actions footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
          <button
            onClick={() => setShowIntervention(true)}
            className="w-full px-4 py-2.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
          >
            Create intervention plan
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors duration-150">
              Generate catch-up resources
            </button>
            <button className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors duration-150">
              Flag for SENCO review
            </button>
          </div>
        </div>
      </div>

      {/* Intervention Panel overlay */}
      {showIntervention && pupil && (
        <InterventionPanel
          pupilId={pupilId}
          classId={classId}
          pupilName={name}
          subject={selectedSubject}
          currentGrade={
            ((pupil as Record<string, unknown>)[`attainment_${selectedSubject}`] as string) ?? "WTS"
          }
          onClose={() => setShowIntervention(false)}
        />
      )}
    </>
  );
}
