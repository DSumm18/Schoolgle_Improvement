"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Loader2,
  BookOpen,
  Calendar,
  Hash,
  ClipboardCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────

type ObjectiveStatus =
  | "not_started"
  | "introduced"
  | "taught"
  | "assessed"
  | "evidenced";

interface CurriculumObjective {
  id: string;
  objective_code: string;
  objective_text: string;
  strand: string | null;
  sub_strand: string | null;
  display_order: number;
  status: ObjectiveStatus;
  first_taught_date: string | null;
  times_taught: number;
  times_assessed: number;
  coverage_depth: string | null;
}

interface StrandGroup {
  strand: string;
  objectives: CurriculumObjective[];
  taught_count: number;
  evidenced_count: number;
  total: number;
}

interface SubjectGroup {
  subject: string;
  strands: StrandGroup[];
  taught_count: number;
  evidenced_count: number;
  total: number;
}

interface CurriculumChecklistProps {
  classId: string;
  yearGroup: string;
  /**
   * Optional — when provided, the checklist is locked to this subject and the
   * internal "All subjects / Maths / English / Science" filter chips are hidden.
   * Parent becomes the source of truth for subject scoping.
   */
  subject?: string;
}

// ─── Status Config ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ObjectiveStatus,
  { label: string; ringColor: string; fillColor: string; textColor: string }
> = {
  not_started: {
    label: "Not started",
    ringColor: "border-gray-300",
    fillColor: "bg-white",
    textColor: "text-gray-400",
  },
  introduced: {
    label: "Introduced",
    ringColor: "border-amber-400",
    fillColor: "bg-amber-100",
    textColor: "text-amber-600",
  },
  taught: {
    label: "Taught",
    ringColor: "border-blue-400",
    fillColor: "bg-blue-400",
    textColor: "text-blue-600",
  },
  assessed: {
    label: "Assessed",
    ringColor: "border-emerald-400",
    fillColor: "bg-emerald-400",
    textColor: "text-emerald-600",
  },
  evidenced: {
    label: "Evidenced",
    ringColor: "border-emerald-600",
    fillColor: "bg-emerald-600",
    textColor: "text-emerald-700",
  },
};

const SUBJECT_FILTER_COLORS: Record<string, { active: string; idle: string }> = {
  Mathematics: {
    active: "bg-blue-600 text-white shadow-sm",
    idle: "bg-white text-gray-600 hover:bg-blue-50 hover:text-blue-700 border border-gray-200",
  },
  "English Reading": {
    active: "bg-rose-600 text-white shadow-sm",
    idle: "bg-white text-gray-600 hover:bg-rose-50 hover:text-rose-700 border border-gray-200",
  },
  "English Writing": {
    active: "bg-red-600 text-white shadow-sm",
    idle: "bg-white text-gray-600 hover:bg-red-50 hover:text-red-700 border border-gray-200",
  },
  Science: {
    active: "bg-green-600 text-white shadow-sm",
    idle: "bg-white text-gray-600 hover:bg-green-50 hover:text-green-700 border border-gray-200",
  },
};

const SUBJECT_HEADER_COLORS: Record<string, string> = {
  Mathematics: "text-blue-700",
  "English Reading": "text-rose-700",
  "English Writing": "text-red-700",
  Science: "text-green-700",
};

const SUBJECT_BAR_COLORS: Record<string, { taught: string; evidenced: string }> = {
  Mathematics: { taught: "bg-blue-400", evidenced: "bg-blue-600" },
  "English Reading": { taught: "bg-rose-400", evidenced: "bg-rose-600" },
  "English Writing": { taught: "bg-red-400", evidenced: "bg-red-600" },
  Science: { taught: "bg-green-400", evidenced: "bg-green-600" },
};

// ─── Status Indicator ────────────────────────────────────────────────────

function StatusIndicator({ status }: { status: ObjectiveStatus }) {
  const cfg = STATUS_CONFIG[status];

  if (status === "not_started") {
    return (
      <div
        className={`w-5 h-5 rounded-full border-2 ${cfg.ringColor} ${cfg.fillColor} flex-shrink-0`}
      />
    );
  }

  if (status === "introduced") {
    return (
      <div
        className={`w-5 h-5 rounded-full border-2 ${cfg.ringColor} flex-shrink-0 overflow-hidden relative`}
      >
        <div className={`absolute bottom-0 left-0 right-0 h-1/2 ${cfg.fillColor}`} />
      </div>
    );
  }

  if (status === "taught") {
    return (
      <div
        className={`w-5 h-5 rounded-full ${cfg.fillColor} flex-shrink-0`}
      />
    );
  }

  // assessed or evidenced — filled with check
  return (
    <div
      className={`w-5 h-5 rounded-full ${cfg.fillColor} flex-shrink-0 flex items-center justify-center`}
    >
      <Check className="w-3 h-3 text-white" strokeWidth={3} />
    </div>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────

function ProgressBar({
  taught,
  evidenced,
  total,
  subject,
}: {
  taught: number;
  evidenced: number;
  total: number;
  subject: string;
}) {
  const taughtPct = total > 0 ? Math.round((taught / total) * 100) : 0;
  const evidencedPct = total > 0 ? Math.round((evidenced / total) * 100) : 0;
  const colors = SUBJECT_BAR_COLORS[subject] ?? {
    taught: "bg-gray-400",
    evidenced: "bg-gray-600",
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>
          <span className="font-semibold text-gray-700">{taughtPct}%</span> taught
        </span>
        <span>
          <span className="font-semibold text-gray-700">{evidencedPct}%</span> evidenced
        </span>
        <span className="ml-auto text-gray-400">
          {taught}/{total} objectives
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full flex">
          <div
            className={`${colors.evidenced} transition-all duration-500 ease-out`}
            style={{ width: `${evidencedPct}%` }}
          />
          <div
            className={`${colors.taught} transition-all duration-500 ease-out`}
            style={{ width: `${taughtPct - evidencedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Strand Section ──────────────────────────────────────────────────────

function StrandSection({
  strand,
  subject,
  defaultExpanded,
}: {
  strand: StrandGroup;
  subject: string;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const taughtPct =
    strand.total > 0
      ? Math.round((strand.taught_count / strand.total) * 100)
      : 0;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        )}
        <span className="text-sm font-semibold text-gray-700 flex-1 text-left">
          {strand.strand}
        </span>
        <span className="text-xs text-gray-400">
          {strand.taught_count}/{strand.total}
        </span>
        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${SUBJECT_BAR_COLORS[subject]?.taught ?? "bg-gray-400"} transition-all duration-300`}
            style={{ width: `${taughtPct}%` }}
          />
        </div>
      </button>

      {expanded && (
        <div className="ml-3 pl-3 border-l border-gray-100 space-y-0.5 pb-2">
          {strand.objectives.map((obj) => (
            <ObjectiveRow key={obj.id} objective={obj} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Objective Row ───────────────────────────────────────────────────────

function ObjectiveRow({ objective }: { objective: CurriculumObjective }) {
  const [hovered, setHovered] = useState(false);
  const statusCfg = STATUS_CONFIG[objective.status];

  return (
    <div
      className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="mt-0.5">
        <StatusIndicator status={objective.status} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 leading-relaxed">
          {objective.objective_text}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-mono text-gray-400">
            {objective.objective_code}
          </span>
          {objective.sub_strand && (
            <span className="text-[11px] text-gray-400 px-1.5 py-0.5 bg-gray-50 rounded">
              {objective.sub_strand}
            </span>
          )}
        </div>
      </div>

      {/* Right-side metadata — only show when data exists */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {objective.times_taught > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400" title="Times taught">
            <Hash className="w-3 h-3" />
            <span>{objective.times_taught}</span>
          </div>
        )}
        {objective.times_assessed > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400" title="Times assessed">
            <ClipboardCheck className="w-3 h-3" />
            <span>{objective.times_assessed}</span>
          </div>
        )}
        {objective.first_taught_date && (
          <div className="flex items-center gap-1 text-xs text-gray-400" title="First taught">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(objective.first_taught_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Hover tooltip with status label */}
      {hovered && (
        <div className="absolute right-2 -top-7 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap">
          {statusCfg.label}
        </div>
      )}
    </div>
  );
}

// ─── Subject Section ─────────────────────────────────────────────────────

function SubjectSection({
  subject,
  defaultAllExpanded,
}: {
  subject: SubjectGroup;
  defaultAllExpanded: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const headerColor = SUBJECT_HEADER_COLORS[subject.subject] ?? "text-gray-700";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Subject Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 p-5 hover:bg-gray-50/50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
        <BookOpen className={`w-5 h-5 ${headerColor}`} />
        <h3 className={`text-base font-bold ${headerColor} flex-1 text-left`}>
          {subject.subject}
        </h3>
        <span className="text-sm text-gray-400 font-medium">
          {subject.total} objectives
        </span>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 space-y-4">
          <ProgressBar
            taught={subject.taught_count}
            evidenced={subject.evidenced_count}
            total={subject.total}
            subject={subject.subject}
          />

          <div className="space-y-1">
            {subject.strands.map((strand) => (
              <StrandSection
                key={strand.strand}
                strand={strand}
                subject={subject.subject}
                defaultExpanded={defaultAllExpanded}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────

function StatusLegend() {
  const statuses: ObjectiveStatus[] = [
    "not_started",
    "introduced",
    "taught",
    "assessed",
    "evidenced",
  ];

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {statuses.map((s) => (
        <div key={s} className="flex items-center gap-1.5">
          <StatusIndicator status={s} />
          <span className="text-xs text-gray-500">{STATUS_CONFIG[s].label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

export function CurriculumChecklist({ classId, yearGroup, subject }: CurriculumChecklistProps) {
  const [subjects, setSubjects] = useState<SubjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(subject ?? null);
  const [totalObjectives, setTotalObjectives] = useState(0);

  // Keep internal filter in sync when parent drives the subject
  useEffect(() => {
    if (subject !== undefined) setActiveFilter(subject);
  }, [subject]);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Load curriculum objectives (shared reference data, no org filter)
        let objectivesQuery = supabase
          .from("ls_curriculum_objectives")
          .select("*")
          .eq("year_group", yearGroup)
          .order("display_order", { ascending: true });

        if (activeFilter) {
          objectivesQuery = objectivesQuery.eq("subject", activeFilter);
        }

        const { data: objectiveRows, error: objError } = await objectivesQuery;
        if (objError) throw new Error(objError.message);

        // Load coverage for this class
        const { data: coverageRows, error: covError } = await supabase
          .from("ls_curriculum_coverage")
          .select("*")
          .eq("class_id", classId);

        if (covError) throw new Error(covError.message);

        // Build a map of objective_id → coverage
        const coverageMap: Record<string, {
          status: ObjectiveStatus;
          first_taught_date: string | null;
          times_taught: number;
          times_assessed: number;
          coverage_depth: string | null;
        }> = {};

        for (const cov of (coverageRows ?? [])) {
          coverageMap[cov.objective_id] = {
            status: cov.status ?? "not_started",
            first_taught_date: cov.first_taught_date ?? null,
            times_taught: cov.times_taught ?? 0,
            times_assessed: cov.times_assessed ?? 0,
            coverage_depth: cov.coverage_depth ?? null,
          };
        }

        // Enrich objectives with coverage data
        const enrichedObjectives: CurriculumObjective[] = (objectiveRows ?? []).map((obj) => {
          const cov = coverageMap[obj.id];
          return {
            id: obj.id,
            objective_code: obj.objective_code,
            objective_text: obj.objective_text,
            strand: obj.strand ?? null,
            sub_strand: obj.sub_strand ?? null,
            display_order: obj.display_order ?? 0,
            status: cov?.status ?? "not_started",
            first_taught_date: cov?.first_taught_date ?? null,
            times_taught: cov?.times_taught ?? 0,
            times_assessed: cov?.times_assessed ?? 0,
            coverage_depth: cov?.coverage_depth ?? null,
          };
        });

        // Group by subject → strand
        const subjectMap: Record<string, Record<string, CurriculumObjective[]>> = {};
        for (const obj of enrichedObjectives) {
          const subj = obj.strand ? (objectiveRows?.find((r) => r.id === obj.id)?.subject ?? "Unknown") : "Unknown";
          const subjectName = (objectiveRows?.find((r) => r.id === obj.id) as Record<string, string> | undefined)?.subject ?? "Unknown";
          if (!subjectMap[subjectName]) subjectMap[subjectName] = {};
          const strandKey = obj.strand ?? "General";
          if (!subjectMap[subjectName][strandKey]) subjectMap[subjectName][strandKey] = [];
          subjectMap[subjectName][strandKey].push(obj);
        }

        const subjectGroups: SubjectGroup[] = Object.entries(subjectMap).map(([subjectName, strands]) => {
          const strandGroups: StrandGroup[] = Object.entries(strands).map(([strandName, objs]) => {
            const taughtCount = objs.filter((o) => ["taught", "assessed", "evidenced"].includes(o.status)).length;
            const evidencedCount = objs.filter((o) => o.status === "evidenced").length;
            return {
              strand: strandName,
              objectives: objs,
              taught_count: taughtCount,
              evidenced_count: evidencedCount,
              total: objs.length,
            };
          });

          const taught = strandGroups.reduce((s, g) => s + g.taught_count, 0);
          const evidenced = strandGroups.reduce((s, g) => s + g.evidenced_count, 0);
          const total = strandGroups.reduce((s, g) => s + g.total, 0);

          return {
            subject: subjectName,
            strands: strandGroups,
            taught_count: taught,
            evidenced_count: evidenced,
            total,
          };
        });

        setSubjects(subjectGroups);
        setTotalObjectives(enrichedObjectives.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load curriculum");
      } finally {
        setLoading(false);
      }
    })();
  }, [classId, yearGroup, activeFilter]);

  // Compute overall stats
  const overallTaught = subjects.reduce((sum, s) => sum + s.taught_count, 0);
  const overallEvidenced = subjects.reduce((sum, s) => sum + s.evidenced_count, 0);
  const overallTotal = subjects.reduce((sum, s) => sum + s.total, 0);
  const overallTaughtPct = overallTotal > 0 ? Math.round((overallTaught / overallTotal) * 100) : 0;
  const overallEvidencedPct = overallTotal > 0 ? Math.round((overallEvidenced / overallTotal) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        <span className="ml-2 text-sm text-gray-500">Loading curriculum objectives...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  // Available subjects for filter pills
  const availableSubjects = [
    "Mathematics",
    "English Reading",
    "English Writing",
    "Science",
  ];

  return (
    <div className="space-y-6">
      {/* Top bar: year group label + filter pills + legend */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-[Poppins]">
              Curriculum Objectives
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {yearGroup} — NC2014 statutory requirements
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-gray-500">Taught: </span>
              <span className="font-bold text-gray-800">{overallTaughtPct}%</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-gray-500">Evidenced: </span>
              <span className="font-bold text-gray-800">{overallEvidencedPct}%</span>
            </div>
          </div>
        </div>

        {/* Subject filter pills — hidden when parent is driving subject scope */}
        {subject === undefined && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveFilter(null)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeFilter === null
                  ? "bg-gray-800 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              All Subjects
            </button>
            {availableSubjects.map((s) => {
              const colors = SUBJECT_FILTER_COLORS[s] ?? {
                active: "bg-gray-800 text-white",
                idle: "bg-white text-gray-600 border border-gray-200",
              };
              return (
                <button
                  key={s}
                  onClick={() => setActiveFilter(activeFilter === s ? null : s)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    activeFilter === s ? colors.active : colors.idle
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}

        <StatusLegend />

        {/* Overall progress */}
        {overallTotal > 0 && (
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-emerald-600 transition-all duration-500 ease-out"
                style={{ width: `${overallEvidencedPct}%` }}
              />
              <div
                className="bg-teal-400 transition-all duration-500 ease-out"
                style={{ width: `${overallTaughtPct - overallEvidencedPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Subject sections */}
      {subjects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">
            No curriculum objectives found for {yearGroup}.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Run the NC2014 seed migration to populate objectives.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => (
            <SubjectSection
              key={subject.subject}
              subject={subject}
              defaultAllExpanded={subjects.length === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
