"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  FileText,
  ShieldCheck,
  BookOpen,
  Users,
  Heart,
  Crown,
  BarChart3,
  Clock,
  Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  OFSTED_FRAMEWORK_DATA,
  SAFEGUARDING_REQUIREMENTS,
} from "@/lib/ofsted/framework-data";

interface EvidenceChecklistProps {
  organizationId: string;
}

interface InspectionDetail {
  // New EIF 2025 5-point rating (preferred)
  rating?:
    | "exceptional"
    | "strong_standard"
    | "expected_standard"
    | "needs_attention"
    | "urgent_improvement";
  // Legacy format (backwards compat)
  verdict?:
    | "meets_requirements"
    | "partially_meets"
    | "does_not_meet"
    | "cannot_assess";
  confidence: "high" | "medium" | "low";
  summary: string;
  // New format: structured actions with priority and SEF impact
  actions_required?: Array<{
    action: string;
    priority: "urgent" | "high" | "medium" | "low";
    rationale: string;
    sef_impact: string;
  }>;
  // Legacy format
  actions?: string[];
  strengths?: string[];
  // New format: per-checkpoint results
  checkpoint_results?: Array<{
    checkpoint: string;
    met: boolean;
    evidence: string;
    severity: "critical" | "important" | "minor";
  }>;
  // Legacy format
  content_checks?: Array<{
    requirement: string;
    met: boolean;
    evidence: string;
  }>;
  red_flags?: string[];
  date_check?: {
    is_current: boolean;
    date_found: string | null;
    review_due_at?: string | null;
    reminder_due_at?: string | null;
    reminder_lead_months?: number | null;
    note: string;
  };
  legislation_check?: {
    references_current: boolean;
    legislation_found?: string[];
    missing_references?: string[];
  };
  sef_contribution?: string;
}

/** Get the normalised Ofsted rating from an inspection (handles both old and new format) */
function getOfstedRating(inspection: InspectionDetail): string {
  if (inspection.rating) return inspection.rating;
  // Map old verdict to new rating
  const map: Record<string, string> = {
    meets_requirements: "strong_standard",
    partially_meets: "expected_standard",
    does_not_meet: "needs_attention",
    cannot_assess: "needs_attention",
  };
  return map[inspection.verdict || ""] || "needs_attention";
}

/** Rating display config */
const RATING_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; textColor: string }
> = {
  exceptional: {
    label: "Exceptional",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    textColor: "text-emerald-700 dark:text-emerald-300",
  },
  strong_standard: {
    label: "Strong Standard",
    color: "text-green-700 dark:text-green-300",
    bg: "bg-green-100 dark:bg-green-900/40",
    textColor: "text-green-700 dark:text-green-300",
  },
  expected_standard: {
    label: "Expected Standard",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    textColor: "text-amber-700 dark:text-amber-300",
  },
  needs_attention: {
    label: "Needs Attention",
    color: "text-orange-700 dark:text-orange-300",
    bg: "bg-orange-100 dark:bg-orange-900/40",
    textColor: "text-orange-700 dark:text-orange-300",
  },
  urgent_improvement: {
    label: "Urgent Improvement",
    color: "text-red-700 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-900/40",
    textColor: "text-red-700 dark:text-red-300",
  },
};

interface DocumentCheck {
  id: string;
  evaluation_area: string;
  expected_document: string;
  found: boolean;
  found_filename: string | null;
  found_path: string | null; // Google Drive file/folder ID
  found_modified_at: string | null;
  priority: string | null;
  checked_at: string | null;
  inspection_verdict: string | null;
  inspection_summary: string | null;
  inspection_actions: string[] | null;
  inspection_detail: InspectionDetail | null;
  inspected_at: string | null;
}

/** Build a Google Drive link from a file/folder ID */
function driveLink(driveId: string | null, isFolder: boolean): string | null {
  if (!driveId) return null;
  if (/^https?:\/\//i.test(driveId)) return driveId;
  return isFolder
    ? `https://drive.google.com/drive/folders/${driveId}`
    : `https://drive.google.com/file/d/${driveId}/view`;
}

function isWebsiteEvidence(path: string | null): boolean {
  return Boolean(path && /^https?:\/\//i.test(path));
}

// Map framework category IDs to the evaluation_area strings used in the DB
const CATEGORY_ID_TO_AREA: Record<string, string> = {
  inclusion: "Inclusion",
  "curriculum-teaching": "Curriculum and Teaching",
  achievement: "Achievement",
  "attendance-behaviour": "Attendance and Behaviour",
  "personal-development": "Personal Development and Well-being",
  "leadership-governance": "Leadership and Governance",
};

const AREA_ALIASES: Record<string, string[]> = {
  Inclusion: ["Inclusion", "Inclusion & SEND"],
  "Curriculum and Teaching": [
    "Curriculum and Teaching",
    "Curriculum & Teaching",
  ],
  Achievement: ["Achievement", "Achievement & Assessment"],
  "Attendance and Behaviour": [
    "Attendance and Behaviour",
    "Attendance & Behaviour",
  ],
  "Personal Development and Well-being": [
    "Personal Development and Well-being",
    "Personal Development",
  ],
  "Leadership and Governance": [
    "Leadership and Governance",
    "Leadership & Management",
  ],
};

// EIF 2025: 6 Key Judgement Areas + Safeguarding
const AREA_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    color: string;
    bg: string;
    border: string;
  }
> = {
  Inclusion: {
    icon: Users,
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200 dark:border-teal-800/50",
  },
  "Curriculum and Teaching": {
    icon: BookOpen,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800/50",
  },
  Achievement: {
    icon: BarChart3,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800/50",
  },
  "Attendance and Behaviour": {
    icon: Crown,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800/50",
  },
  "Personal Development and Well-being": {
    icon: Heart,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800/50",
  },
  "Leadership and Governance": {
    icon: Crown,
    color: "text-slate-600",
    bg: "bg-slate-50 dark:bg-slate-800/30",
    border: "border-slate-200 dark:border-slate-700/50",
  },
  Safeguarding: {
    icon: ShieldCheck,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800/50",
  },
};

/** Check if a document date is stale (>12 months old) */
function isStale(dateStr: string | null): boolean {
  if (!dateStr) return false; // No date = can't assess
  const date = new Date(dateStr);
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return date < oneYearAgo;
}

function formatDateOnly(dateOnly: string | null | undefined): string | null {
  if (!dateOnly) return null;
  return new Date(`${dateOnly}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

interface EvidenceRequirement {
  id: string;
  name: string;
  description: string;
  subcategoryName: string;
  matchedFile: DocumentCheck | null;
  status:
    | "found"
    | "found_stale"
    | "missing"
    | "inspected_pass"
    | "inspected_action_needed";
}

/** Determine evidence status based on scan + inspection results */
function getEvidenceStatus(
  matchedFile: DocumentCheck | null,
): EvidenceRequirement["status"] {
  if (!matchedFile) return "missing";
  if (!matchedFile.found) return "missing";
  // If inspected, use the rating (supports both old verdict and new rating)
  if (matchedFile.inspection_verdict) {
    const v = matchedFile.inspection_verdict;
    // Pass: exceptional, strong_standard, expected_standard, or legacy meets_requirements
    const passing = [
      "exceptional",
      "strong_standard",
      "expected_standard",
      "meets_requirements",
    ];
    return passing.includes(v) ? "inspected_pass" : "inspected_action_needed";
  }
  // Not inspected yet — check date
  return isStale(matchedFile.found_modified_at) ? "found_stale" : "found";
}

export default function EvidenceChecklist({
  organizationId,
}: EvidenceChecklistProps) {
  const [checks, setChecks] = useState<DocumentCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [inspecting, setInspecting] = useState<string | null>(null); // evidenceId being inspected

  const fetchChecks = useCallback(async () => {
    if (!organizationId) return;
    const { data, error } = await supabase
      .from("ofsted_document_checks")
      .select("*")
      .eq("organization_id", organizationId)
      .order("evaluation_area")
      .order("found_filename");

    if (!error && data) {
      setChecks(data);
    }
    setLoading(false);
  }, [organizationId]);

  useEffect(() => {
    fetchChecks();
  }, [fetchChecks]);

  /** Trigger AI inspection of a specific document */
  const inspectDocument = async (
    check: DocumentCheck,
    requirementName: string,
  ) => {
    if (!check.found_path || inspecting || isWebsiteEvidence(check.found_path)) return;
    setInspecting(check.id);
    try {
      const res = await fetch("/api/ofsted/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          driveFileId: check.found_path,
          fileName: check.found_filename,
          evidenceId: check.id,
          requirementName,
        }),
      });
      if (res.ok) {
        // Refresh to pick up the inspection results
        await fetchChecks();
      }
    } catch (err) {
      console.error("[Inspect] Error:", err);
    } finally {
      setInspecting(null);
    }
  };

  if (loading) return null;
  if (checks.length === 0) return null;

  // Build a lookup: evaluation_area → array of scan results
  const scanByArea: Record<string, DocumentCheck[]> = {};
  for (const check of checks) {
    if (!scanByArea[check.evaluation_area])
      scanByArea[check.evaluation_area] = [];
    scanByArea[check.evaluation_area].push(check);
  }
  const getAreaScans = (areaName: string) =>
    (AREA_ALIASES[areaName] ?? [areaName]).flatMap(
      (alias) => scanByArea[alias] ?? [],
    );

  // Build framework-driven checklist: for each category, check each evidence requirement
  const frameworkChecklist: Array<{
    area: string;
    requirements: EvidenceRequirement[];
  }> = [];

  for (const category of OFSTED_FRAMEWORK_DATA) {
    const areaName = CATEGORY_ID_TO_AREA[category.id];
    if (!areaName) continue;

    const areaScans = getAreaScans(areaName);
    const requirements: EvidenceRequirement[] = [];

    for (const sub of category.subcategories) {
      // @ts-expect-error - Auto-masked during strict compilation enforcement
      for (const ev of sub.evidenceRequired) {
        // Try to find a matching scan result (real file, not folder)
        const matchedFile = findBestMatch(
          ev.name,
          ev.description,
          areaScans,
        );
        const status = getEvidenceStatus(matchedFile);

        requirements.push({
          id: ev.id,
          name: ev.name,
          description: ev.description,
          // @ts-expect-error - Auto-masked during strict compilation enforcement
          subcategoryName: sub.name,
          matchedFile,
          status,
        });
      }
    }

    frameworkChecklist.push({ area: areaName, requirements });
  }

  // Add Safeguarding
  const sgScans = scanByArea["Safeguarding"] || [];
  const sgRequirements: EvidenceRequirement[] = SAFEGUARDING_REQUIREMENTS.map(
    (req) => {
      const matchedFile = findBestMatch(
        req.name,
        req.description,
        sgScans,
      );
      return {
        id: req.id,
        name: req.name,
        description: req.description,
        subcategoryName: "Safeguarding",
        matchedFile,
        status: getEvidenceStatus(matchedFile),
      };
    },
  );
  frameworkChecklist.push({
    area: "Safeguarding",
    requirements: sgRequirements,
  });

  // Count totals
  const allReqs = frameworkChecklist.flatMap((c) => c.requirements);
  const totalRequired = allReqs.length;
  const totalFound = allReqs.filter(
    (r) => r.status === "found" || r.status === "inspected_pass",
  ).length;
  const totalStale = allReqs.filter((r) => r.status === "found_stale").length;
  const totalActionNeeded = allReqs.filter(
    (r) => r.status === "inspected_action_needed",
  ).length;
  const totalMissing = allReqs.filter((r) => r.status === "missing").length;

  return (
    <div className="space-y-4">
      {/* Header with summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">
            Evidence Audit — EIF 2025
          </h3>
          <p className="text-sm text-muted-foreground">
            {totalRequired} evidence requirements checked against website scans
            and connected evidence sources
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            {totalFound}
          </span>
          {totalStale > 0 && (
            <span className="flex items-center gap-1.5 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              {totalStale} stale
            </span>
          )}
          {totalActionNeeded > 0 && (
            <span className="flex items-center gap-1.5 text-orange-600">
              <AlertTriangle className="w-4 h-4" />
              {totalActionNeeded} actions
            </span>
          )}
          <span className="flex items-center gap-1.5 text-red-500">
            <XCircle className="w-4 h-4" />
            {totalMissing} missing
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${(totalFound / totalRequired) * 100}%` }}
        />
        <div
          className="h-full bg-amber-400 transition-all"
          style={{ width: `${(totalStale / totalRequired) * 100}%` }}
        />
      </div>

      {/* Per-category checklist */}
      <div className="grid gap-3">
        {frameworkChecklist.map(({ area, requirements }, idx) => {
          const config = AREA_CONFIG[area] || {
            icon: FileText,
            color: "text-slate-600",
            bg: "bg-slate-50 dark:bg-slate-800",
            border: "border-slate-200",
          };
          const Icon = config.icon;
          const isExpanded = expandedArea === area;
          const passed = requirements.filter(
            (r) => r.status === "inspected_pass",
          ).length;
          const found = requirements.filter(
            (r) => r.status === "found" || r.status === "found_stale",
          ).length;
          const actionNeeded = requirements.filter(
            (r) => r.status === "inspected_action_needed",
          ).length;
          const missing = requirements.filter(
            (r) => r.status === "missing",
          ).length;

          return (
            <motion.div
              key={area}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`rounded-xl border overflow-hidden ${config.bg} ${config.border}`}
            >
              <button
                onClick={() => setExpandedArea(isExpanded ? null : area)}
                className="w-full flex items-center justify-between p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <span className="font-semibold text-sm text-foreground">
                    {area}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Mini status pills */}
                  <div className="flex items-center gap-1.5">
                    {passed > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        {passed}
                      </span>
                    )}
                    {found > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        <FileText className="w-3 h-3" />
                        {found} to inspect
                      </span>
                    )}
                    {actionNeeded > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                        <AlertTriangle className="w-3 h-3" />
                        {actionNeeded}
                      </span>
                    )}
                    {missing > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                        <XCircle className="w-3 h-3" />
                        {missing} missing
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {passed}/{requirements.length}
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
                      {requirements.map((req) => {
                        const statusBg = {
                          found: "bg-blue-50/50 dark:bg-blue-950/20",
                          found_stale: "bg-amber-50/50 dark:bg-amber-950/20",
                          missing: "bg-red-50/50 dark:bg-red-950/20",
                          inspected_pass:
                            "bg-emerald-50/50 dark:bg-emerald-950/20",
                          inspected_action_needed:
                            "bg-orange-50/50 dark:bg-orange-950/20",
                        }[req.status];

                        const StatusIcon = {
                          found: (
                            <FileText className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          ),
                          found_stale: (
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          ),
                          missing: (
                            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          ),
                          inspected_pass: (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          ),
                          inspected_action_needed: (
                            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                          ),
                        }[req.status];

                        const inspection = req.matchedFile?.inspection_detail;
                        const isInspecting = inspecting === req.matchedFile?.id;

                        return (
                          <div
                            key={req.id}
                            className={`text-sm py-2 px-3 rounded-lg ${statusBg}`}
                          >
                            <div className="flex items-start gap-3">
                              {StatusIcon}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-foreground">
                                    {req.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">
                                    {req.subcategoryName}
                                  </span>
                                  {inspection &&
                                    (() => {
                                      const rating =
                                        getOfstedRating(inspection);
                                      const ratingConfig =
                                        RATING_CONFIG[rating] ||
                                        RATING_CONFIG.needs_attention;
                                      return (
                                        <span
                                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ratingConfig.bg} ${ratingConfig.textColor}`}
                                        >
                                          {ratingConfig.label.toUpperCase()}
                                        </span>
                                      );
                                    })()}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {req.description}
                                </p>

                                {/* File link */}
                                {req.matchedFile &&
                                  (() => {
                                    const link = driveLink(
                                      req.matchedFile.found_path,
                                      false,
                                    );
                                    return (
                                      <div className="mt-1.5 flex items-center gap-2 text-xs flex-wrap">
                                        <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                                        {link ? (
                                          <a
                                            href={link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                                          >
                                            {req.matchedFile.found_filename}
                                          </a>
                                        ) : (
                                          <span className="text-foreground/80 truncate">
                                            {req.matchedFile.found_filename}
                                          </span>
                                        )}
                                        {req.matchedFile.found_modified_at && (
                                          <span
                                            className={`flex items-center gap-1 whitespace-nowrap ${
                                              isStale(
                                                req.matchedFile
                                                  .found_modified_at,
                                              )
                                                ? "text-amber-600 font-medium"
                                                : "text-muted-foreground"
                                            }`}
                                          >
                                            <Calendar className="w-3 h-3" />
                                            {new Date(
                                              req.matchedFile.found_modified_at,
                                            ).toLocaleDateString()}
                                          </span>
                                        )}
                                        {/* Inspect button — only for Drive files without inspection */}
                                        {!inspection &&
                                          req.matchedFile.found_path && (
                                            <button
                                              onClick={() =>
                                                inspectDocument(
                                                  req.matchedFile!,
                                                  req.name,
                                                )
                                              }
                                              disabled={
                                                !!inspecting ||
                                                isWebsiteEvidence(
                                                  req.matchedFile.found_path,
                                                )
                                              }
                                              className="ml-auto text-[10px] font-bold px-2 py-1 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-80 disabled:opacity-50 flex items-center gap-1"
                                            >
                                              {isInspecting ? (
                                                <>
                                                  <Clock className="w-3 h-3 animate-spin" />{" "}
                                                  Inspecting...
                                                </>
                                              ) : (
                                                <>
                                                  <ShieldCheck className="w-3 h-3" />{" "}
                                                  {isWebsiteEvidence(
                                                    req.matchedFile.found_path,
                                                  )
                                                    ? "Website evidence"
                                                    : "Inspect"}
                                                </>
                                              )}
                                            </button>
                                          )}
                                      </div>
                                    );
                                  })()}

                                {/* Inspection results */}
                                {inspection && (
                                  <div className="mt-2 space-y-1.5">
                                    <p className="text-xs font-medium text-foreground">
                                      {inspection.summary}
                                    </p>

                                    {inspection.date_check?.review_due_at && (
                                      <div className="mt-1.5 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800/30">
                                        <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
                                          Policy Review
                                        </p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-800 dark:text-blue-200">
                                          <span className="inline-flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Review due:{" "}
                                            {inspection.date_check.date_found ||
                                              formatDateOnly(
                                                inspection.date_check
                                                  .review_due_at,
                                              )}
                                          </span>
                                          {inspection.date_check
                                            .reminder_due_at && (
                                            <span className="inline-flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              Reminder task:{" "}
                                              {formatDateOnly(
                                                inspection.date_check
                                                  .reminder_due_at,
                                              )}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Checkpoint results — what was checked and why */}
                                    {inspection.checkpoint_results &&
                                      inspection.checkpoint_results.length >
                                        0 && (
                                        <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-200 dark:border-slate-700/30">
                                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Inspection Checkpoints
                                          </p>
                                          <div className="space-y-1">
                                            {inspection.checkpoint_results.map(
                                              (cp, i) => (
                                                <div
                                                  key={i}
                                                  className="flex items-start gap-1.5 text-xs"
                                                >
                                                  <span
                                                    className={`shrink-0 mt-0.5 ${cp.met ? "text-emerald-500" : cp.severity === "critical" ? "text-red-500" : "text-amber-500"}`}
                                                  >
                                                    {cp.met
                                                      ? "✓"
                                                      : cp.severity ===
                                                          "critical"
                                                        ? "✗"
                                                        : "△"}
                                                  </span>
                                                  <div>
                                                    <span
                                                      className={`font-medium ${cp.met ? "text-foreground" : cp.severity === "critical" ? "text-red-700 dark:text-red-300" : "text-amber-700 dark:text-amber-300"}`}
                                                    >
                                                      {cp.checkpoint}
                                                    </span>
                                                    {cp.evidence && (
                                                      <p className="text-muted-foreground mt-0.5">
                                                        {cp.evidence}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {/* Legacy content_checks for backwards compat */}
                                    {!inspection.checkpoint_results &&
                                      inspection.content_checks &&
                                      inspection.content_checks.length > 0 && (
                                        <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-900/30 rounded border border-slate-200 dark:border-slate-700/30">
                                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                            Checks Performed
                                          </p>
                                          <div className="space-y-1">
                                            {inspection.content_checks.map(
                                              (cc, i) => (
                                                <div
                                                  key={i}
                                                  className="flex items-start gap-1.5 text-xs"
                                                >
                                                  <span
                                                    className={`shrink-0 mt-0.5 ${cc.met ? "text-emerald-500" : "text-red-500"}`}
                                                  >
                                                    {cc.met ? "✓" : "✗"}
                                                  </span>
                                                  <div>
                                                    <span className="font-medium text-foreground">
                                                      {cc.requirement}
                                                    </span>
                                                    {cc.evidence && (
                                                      <p className="text-muted-foreground mt-0.5">
                                                        {cc.evidence}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {/* Red flags */}
                                    {inspection.red_flags &&
                                      inspection.red_flags.length > 0 && (
                                        <div className="mt-1.5 p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-800/30">
                                          <p className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase tracking-wider mb-1">
                                            Red Flags
                                          </p>
                                          <ul className="text-xs text-red-800 dark:text-red-200 space-y-0.5">
                                            {inspection.red_flags.map(
                                              (flag, i) => (
                                                <li
                                                  key={i}
                                                  className="flex gap-1.5"
                                                >
                                                  <span className="shrink-0">
                                                    !
                                                  </span>
                                                  <span>{flag}</span>
                                                </li>
                                              ),
                                            )}
                                          </ul>
                                        </div>
                                      )}

                                    {/* Actions with SEF impact (new format) */}
                                    {inspection.actions_required &&
                                      inspection.actions_required.length >
                                        0 && (
                                        <div className="mt-1.5 p-2 bg-orange-50 dark:bg-orange-950/30 rounded border border-orange-200 dark:border-orange-800/30">
                                          <p className="text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider mb-1">
                                            Actions Required
                                          </p>
                                          <div className="space-y-1.5">
                                            {inspection.actions_required.map(
                                              (ar, i) => (
                                                <div
                                                  key={i}
                                                  className="text-xs"
                                                >
                                                  <div className="flex items-center gap-1.5">
                                                    <span
                                                      className={`text-[9px] font-bold px-1 py-0.5 rounded uppercase ${
                                                        ar.priority === "urgent"
                                                          ? "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                                                          : ar.priority ===
                                                              "high"
                                                            ? "bg-orange-200 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200"
                                                            : ar.priority ===
                                                                "medium"
                                                              ? "bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200"
                                                              : "bg-slate-200 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200"
                                                      }`}
                                                    >
                                                      {ar.priority}
                                                    </span>
                                                    <span className="font-medium text-foreground">
                                                      {ar.action}
                                                    </span>
                                                  </div>
                                                  {ar.rationale && (
                                                    <p className="text-muted-foreground mt-0.5 ml-6">
                                                      {ar.rationale}
                                                    </p>
                                                  )}
                                                  {ar.sef_impact && (
                                                    <p className="text-blue-600 dark:text-blue-400 mt-0.5 ml-6 italic">
                                                      SEF: {ar.sef_impact}
                                                    </p>
                                                  )}
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {/* Legacy actions (string array) */}
                                    {!inspection.actions_required &&
                                      inspection.actions &&
                                      inspection.actions.length > 0 && (
                                        <div className="mt-1.5 p-2 bg-orange-50 dark:bg-orange-950/30 rounded border border-orange-200 dark:border-orange-800/30">
                                          <p className="text-[10px] font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wider mb-1">
                                            Actions Required
                                          </p>
                                          <ul className="text-xs text-orange-800 dark:text-orange-200 space-y-0.5">
                                            {inspection.actions.map(
                                              (action: string, i: number) => (
                                                <li
                                                  key={i}
                                                  className="flex gap-1.5"
                                                >
                                                  <span className="shrink-0">
                                                    •
                                                  </span>
                                                  <span>{action}</span>
                                                </li>
                                              ),
                                            )}
                                          </ul>
                                        </div>
                                      )}

                                    {/* Strengths */}
                                    {inspection.strengths &&
                                      inspection.strengths.length > 0 && (
                                        <div className="mt-1 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-200 dark:border-emerald-800/30">
                                          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1">
                                            Strengths
                                          </p>
                                          <ul className="text-xs text-emerald-800 dark:text-emerald-200 space-y-0.5">
                                            {inspection.strengths.map(
                                              (s: string, i: number) => (
                                                <li
                                                  key={i}
                                                  className="flex gap-1.5"
                                                >
                                                  <span className="shrink-0">
                                                    ✓
                                                  </span>
                                                  <span>{s}</span>
                                                </li>
                                              ),
                                            )}
                                          </ul>
                                        </div>
                                      )}

                                    {/* SEF contribution */}
                                    {inspection.sef_contribution && (
                                      <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800/30">
                                        <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-1">
                                          SEF Contribution
                                        </p>
                                        <p className="text-xs text-blue-800 dark:text-blue-200">
                                          {inspection.sef_contribution}
                                        </p>
                                      </div>
                                    )}

                                    {/* Legislation check */}
                                    {inspection.legislation_check && (
                                      <div className="mt-1 text-[10px] text-muted-foreground">
                                        {inspection.legislation_check
                                          .missing_references &&
                                          inspection.legislation_check
                                            .missing_references.length > 0 && (
                                            <p className="text-amber-600 dark:text-amber-400">
                                              Missing legislation references:{" "}
                                              {inspection.legislation_check.missing_references.join(
                                                ", ",
                                              )}
                                            </p>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Status-based action prompts */}
                                {req.status === "missing" && (
                                  <p className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
                                    Action: add a website link or place this in
                                    the connected evidence folder
                                  </p>
                                )}
                                {req.status === "found_stale" &&
                                  !inspection && (
                                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                                      Document may be out of date — click
                                      Inspect to check against current
                                      requirements
                                    </p>
                                  )}
                                {req.status === "found" && !inspection && (
                                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                    Document found — verify it meets EIF 2025
                                    requirements
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const GENERIC_MATCH_WORDS = new Set([
  "evidence",
  "document",
  "documents",
  "policy",
  "policies",
  "current",
  "school",
  "pupils",
  "pupil",
  "provision",
  "support",
]);

/**
 * Find the best matching scan result for a framework evidence requirement.
 * Matches evidence requirement name/description keywords against scan filenames.
 */
function findBestMatch(
  reqName: string,
  reqDescription: string,
  scans: DocumentCheck[],
): DocumentCheck | null {
  return findBestWebsiteFirstMatch(reqName, reqDescription, scans);
}

function findBestWebsiteFirstMatch(
  reqName: string,
  reqDescription: string,
  scans: DocumentCheck[],
): DocumentCheck | null {
  const foundScans = scans.filter((scan) => scan.found);
  if (foundScans.length === 0) return null;

  const normalizedReqName = normalizeMatchText(reqName);
  const reqWords = normalizeMatchText(`${reqName} ${reqDescription}`)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !GENERIC_MATCH_WORDS.has(word));

  let bestMatch: DocumentCheck | null = null;
  let bestScore = 0;

  for (const scan of foundScans) {
    const filename = normalizeMatchText(scan.found_filename || "");
    const expectedDocument = normalizeMatchText(scan.expected_document || "");
    const inspectionText = normalizeMatchText(getInspectionMatchText(scan));

    let textScore = 0;
    let distinctiveMatches = 0;
    const exactExpectedMatch = expectedDocument === normalizedReqName;
    const exactFilenameMatch = filename === normalizedReqName;

    if (exactExpectedMatch) textScore += 30;
    if (exactFilenameMatch) textScore += 20;

    for (const word of reqWords) {
      let wordMatched = false;
      if (filename.includes(word)) {
        textScore += 3;
        wordMatched = true;
      }
      if (expectedDocument.includes(word)) {
        textScore += 2;
        wordMatched = true;
      }
      if (inspectionText.includes(word)) {
        textScore += 1;
        wordMatched = true;
      }
      if (wordMatched) distinctiveMatches += 1;
    }

    if (!exactExpectedMatch && !exactFilenameMatch && distinctiveMatches === 0) {
      continue;
    }

    let score = textScore;
    if (isWebsiteEvidence(scan.found_path)) score += 25;

    if (score > 0 && !isFolderEvidenceName(scan.found_filename)) {
      score += 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = scan;
    }
  }

  return bestScore >= 4 ? bestMatch : null;
}

function normalizeMatchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.(pdf|docx?|xlsx?|pptx?|csv|txt|odt|ods|gdoc|gsheet)$/i, "")
    .replace(/📁/g, " ")
    .replace(/[_\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isFolderEvidenceName(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("📁") || normalized.startsWith("folder:");
}

function getInspectionMatchText(scan: DocumentCheck): string {
  const inspection = scan.inspection_detail;
  if (!inspection) return scan.inspection_summary ?? "";

  return [
    scan.inspection_summary,
    inspection.summary,
    ...(inspection.checkpoint_results ?? []).flatMap((checkpoint) => [
      checkpoint.checkpoint,
      checkpoint.evidence,
    ]),
    ...(inspection.content_checks ?? []).flatMap((check) => [
      check.requirement,
      check.evidence,
    ]),
    ...(inspection.actions_required ?? []).map((action) => action.action),
    ...(inspection.actions ?? []),
    ...(inspection.strengths ?? []),
    ...(inspection.red_flags ?? []),
  ]
    .filter(Boolean)
    .join(" ");
}
