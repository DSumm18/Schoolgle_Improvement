"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FolderSearch,
  Loader2,
  FileText,
  ShieldCheck,
  Users,
  BookOpen,
  BarChart3,
  CalendarCheck,
  Heart,
  Crown,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clientAuthFetch } from "@/lib/auth/client-auth-fetch";
import { supabase } from "@/lib/supabase";

// --- Types ---

interface DocumentFound {
  name: string;
  path: string;
  area: string;
  matched_to: string;
  source?: "website" | "website_document" | "drive";
  source_label?: string;
  evidence_url?: string | null;
  found_on_url?: string | null;
  readiness_status?:
    | "ready"
    | "needs_review"
    | "needs_publication"
    | "present_unassessed";
  website_status?: string | null;
  compliance_score?: number | null;
  notes?: string[];
  action_required?: boolean;
}

interface DocumentMissing {
  expected_name: string;
  area: string;
  priority: string;
  reason?: string;
  website_expected?: boolean;
  suggested_action?: string;
}

interface AreaCoverage {
  found: number;
  expected: number;
  percentage: number;
}

interface CheckResult {
  documents_found: DocumentFound[];
  documents_missing: DocumentMissing[];
  coverage_by_area: Record<string, AreaCoverage>;
  overall_coverage: number;
  total_files_scanned: number;
  total_website_sources_scanned?: number;
  action_required_count?: number;
  saved_document_checks_count?: number;
  website_scan?: {
    status: string;
    website_url: string;
    trust_url: string | null;
    assessed_at: string | null;
  } | null;
}

interface DocumentPresenceCheckerProps {
  organizationId: string;
  accessToken: string | null;
  provider: string;
  folderId?: string;
  onResolved?: () => void;
}

// --- Area metadata ---

const AREA_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  Safeguarding: { icon: ShieldCheck, color: "text-red-600" },
  "Inclusion & SEND": { icon: Users, color: "text-purple-600" },
  "Curriculum & Teaching": { icon: BookOpen, color: "text-blue-600" },
  "Achievement & Assessment": { icon: BarChart3, color: "text-emerald-600" },
  "Attendance & Behaviour": { icon: CalendarCheck, color: "text-amber-600" },
  "Personal Development": { icon: Heart, color: "text-pink-600" },
  "Leadership & Management": { icon: Crown, color: "text-indigo-600" },
};

const PRIORITY_BADGE: Record<
  string,
  { label: string; variant: "destructive" | "default" | "secondary" }
> = {
  critical: { label: "Critical", variant: "destructive" },
  important: { label: "Important", variant: "default" },
  recommended: { label: "Recommended", variant: "secondary" },
};

const READINESS_BADGE: Record<
  NonNullable<DocumentFound["readiness_status"]>,
  { label: string; className: string }
> = {
  ready: {
    label: "Ready",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  },
  needs_review: {
    label: "Review",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  needs_publication: {
    label: "Publish/link",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  present_unassessed: {
    label: "Found",
    className:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200",
  },
};

// --- Component ---

export default function DocumentPresenceChecker({
  organizationId,
  accessToken,
  provider,
  folderId,
  onResolved,
}: DocumentPresenceCheckerProps) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  const runCheck = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, string> = { organizationId };
      if (accessToken && folderId) {
        body.provider = provider;
        body.access_token = accessToken;
        body.folder_id = folderId;
      }

      const response = await clientAuthFetch(supabase, "/api/ofsted/document-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || `Request failed with status ${response.status}`,
        );
      }

      const data: CheckResult = await response.json();
      setResult(data);
      onResolved?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId, accessToken, provider, folderId, onResolved]);

  const toggleArea = (area: string) => {
    setExpandedArea((prev) => (prev === area ? null : area));
  };

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getCoverageTextColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-600";
    if (percentage >= 50) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Website Evidence Sync
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Website scans automatically refresh Ofsted evidence checks. Use
            refresh only if you have changed cloud evidence or want to re-run
            the latest website evidence mapping.
          </p>
        </div>
        <Button onClick={runCheck} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <FolderSearch className="mr-2 h-4 w-4" />
              Refresh Evidence
            </>
          )}
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {error}
            </p>
          </div>
        </motion.div>
      )}

      {/* Optional cloud warning */}
      {!accessToken && !error && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <div className="flex items-center gap-2">
            <FolderSearch className="h-5 w-5 text-blue-600" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Drive is optional here. Website-scanned policies are used first;
              connected Drive is only needed for internal evidence such as SCR,
              training records and provision maps.
            </p>
          </div>
        </div>
      )}

      {/* Overall coverage summary */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Overall Document Coverage
                  </p>
                  <p
                    className={`text-3xl font-bold ${getCoverageTextColor(result.overall_coverage)}`}
                  >
                    {result.overall_coverage}%
                  </p>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {result.documents_found.length} of{" "}
                    {result.documents_found.length +
                      result.documents_missing.length}{" "}
                    expected documents found. Checked{" "}
                    {result.total_website_sources_scanned ?? 0} website sources
                    {result.total_files_scanned > 0
                      ? ` and ${result.total_files_scanned} cloud files`
                      : ""}
                    .{" "}
                    {typeof result.saved_document_checks_count === "number"
                      ? `Saved ${result.saved_document_checks_count} evidence checks.`
                      : ""}
                  </p>
                  {result.website_scan?.website_url && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Website source: {result.website_scan.website_url}
                      {result.website_scan.trust_url
                        ? ` + ${result.website_scan.trust_url}`
                        : ""}
                    </p>
                  )}
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-slate-600 dark:text-slate-300">
                      {result.documents_found.length} found
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-slate-600 dark:text-slate-300">
                      {result.documents_missing.length} missing
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-slate-600 dark:text-slate-300">
                      {result.action_required_count ?? 0} actions
                    </span>
                  </div>
                </div>
              </div>
              {/* Overall progress bar */}
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <motion.div
                  className={`h-full rounded-full ${getCoverageColor(result.overall_coverage)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${result.overall_coverage}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Area grid */}
      {result && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {Object.entries(result.coverage_by_area).map(
              ([area, coverage], index) => {
                const config = AREA_CONFIG[area] || {
                  icon: FileText,
                  color: "text-slate-600",
                };
                const Icon = config.icon;
                const isExpanded = expandedArea === area;

                const foundDocs = result.documents_found.filter(
                  (d) => d.area === area,
                );
                const missingDocs = result.documents_missing.filter(
                  (d) => d.area === area,
                );

                return (
                  <motion.div
                    key={area}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    layout
                    className={isExpanded ? "sm:col-span-2 lg:col-span-3" : ""}
                  >
                    <Card
                      className="cursor-pointer transition-shadow hover:shadow-md"
                      onClick={() => toggleArea(area)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${config.color}`} />
                            <CardTitle className="text-base">{area}</CardTitle>
                          </div>
                          <span
                            className={`text-sm font-semibold ${getCoverageTextColor(coverage.percentage)}`}
                          >
                            {coverage.found}/{coverage.expected}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Progress bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <motion.div
                            className={`h-full rounded-full ${getCoverageColor(coverage.percentage)}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${coverage.percentage}%` }}
                            transition={{
                              duration: 0.5,
                              delay: index * 0.05 + 0.2,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          {coverage.percentage}% coverage
                        </p>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="mt-4 space-y-3 overflow-hidden"
                            >
                              {/* Found documents */}
                              {foundDocs.length > 0 && (
                                <div>
                                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-600">
                                    Found
                                  </p>
                                  <ul className="space-y-1.5">
                                    {foundDocs.map((doc) => (
                                      <li
                                        key={doc.matched_to}
                                        className="flex items-start gap-2 text-sm"
                                      >
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                        <div>
                                          <span className="font-medium text-slate-700 dark:text-slate-200">
                                            {doc.matched_to}
                                          </span>
                                          <div className="mt-1 flex flex-wrap gap-1.5">
                                            <Badge
                                              variant="outline"
                                              className="text-[10px]"
                                            >
                                              {doc.source_label || "Evidence"}
                                            </Badge>
                                            {doc.readiness_status && (
                                              <Badge
                                                variant="outline"
                                                className={`text-[10px] ${READINESS_BADGE[doc.readiness_status].className}`}
                                              >
                                                {
                                                  READINESS_BADGE[
                                                    doc.readiness_status
                                                  ].label
                                                }
                                              </Badge>
                                            )}
                                            {typeof doc.compliance_score ===
                                              "number" && (
                                              <Badge
                                                variant="outline"
                                                className="text-[10px]"
                                              >
                                                {doc.compliance_score}%
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="mt-1 text-xs text-slate-400">
                                            {doc.name}
                                          </p>
                                          {doc.notes?.[0] && (
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                              {doc.notes[0]}
                                            </p>
                                          )}
                                          <div className="mt-1 flex flex-wrap gap-2">
                                            {doc.evidence_url && (
                                              <a
                                                href={doc.evidence_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(event) =>
                                                  event.stopPropagation()
                                                }
                                                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                                              >
                                                Open evidence
                                                <ExternalLink className="h-3 w-3" />
                                              </a>
                                            )}
                                            {doc.found_on_url &&
                                              doc.found_on_url !==
                                                doc.evidence_url && (
                                                <a
                                                  href={doc.found_on_url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={(event) =>
                                                    event.stopPropagation()
                                                  }
                                                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                                                >
                                                  Source page
                                                  <ExternalLink className="h-3 w-3" />
                                                </a>
                                              )}
                                          </div>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Missing documents */}
                              {missingDocs.length > 0 && (
                                <div>
                                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-red-600">
                                    Missing
                                  </p>
                                  <ul className="space-y-1.5">
                                    {missingDocs.map((doc) => {
                                      const priorityInfo = PRIORITY_BADGE[
                                        doc.priority
                                      ] || {
                                        label: doc.priority,
                                        variant: "secondary" as const,
                                      };
                                      return (
                                        <li
                                          key={doc.expected_name}
                                          className="flex items-center gap-2 text-sm"
                                        >
                                          <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                                          <span className="font-medium text-slate-700 dark:text-slate-200">
                                            {doc.expected_name}
                                          </span>
                                          <Badge
                                            variant={priorityInfo.variant}
                                            className="text-[10px]"
                                          >
                                            {priorityInfo.label}
                                          </Badge>
                                          {doc.website_expected && (
                                            <Badge
                                              variant="outline"
                                              className="text-[10px]"
                                            >
                                              Website expected
                                            </Badge>
                                          )}
                                          {doc.reason && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                              {doc.reason}
                                            </p>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              },
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
