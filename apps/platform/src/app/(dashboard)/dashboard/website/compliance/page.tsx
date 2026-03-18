"use client";

import { useState, useCallback } from "react";
import {
  Globe,
  ShieldCheck,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";

// ─── Types ──────────────────────────────────────────────────────

interface RequirementAssessment {
  requirementKey: string;
  requirementName: string;
  category: string;
  status: "compliant" | "partial" | "not_found" | "outdated";
  complianceScore: number;
  qualityScore: number;
  clarityScore: number;
  currencyStatus: string;
  datesFound: string[];
  pagesFound: { url: string; title: string }[];
  evidenceQuotes: string[];
  gaps: string[];
  recommendations: string[];
  redFlags: string[];
  confidence: number;
  aiAssessed: boolean;
}

interface CategorySummary {
  category: string;
  categoryLabel: string;
  totalRequirements: number;
  compliantCount: number;
  partialCount: number;
  notFoundCount: number;
  outdatedCount: number;
  averageQuality: number;
  averageClarity: number;
  compliancePercent: number;
}

interface ComplianceReport {
  websiteUrl: string;
  schoolName?: string;
  schoolType: string;
  scannedAt: string;
  overallComplianceScore: number;
  overallQualityScore: number;
  overallClarityScore: number;
  totalRequirements: number;
  statutoryRequirements: number;
  compliantCount: number;
  partialCount: number;
  notFoundCount: number;
  outdatedCount: number;
  categorySummary: CategorySummary[];
  assessments: RequirementAssessment[];
  pagesScanned: number;
  pdfsProcessed: number;
  scanDuration: number;
  priorityActions: string[];
}

interface ScanResult {
  report: ComplianceReport;
  crawlBackend?: "firecrawl" | "playwright";
  crawlStats?: {
    successfulPages: number;
    failedPages: number;
    pdfsProcessed: number;
    duration: number;
  };
}

// ─── Status helpers ────────────────────────────────────────────

const statusConfig = {
  compliant: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: "Compliant",
  },
  partial: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Partial",
  },
  not_found: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Not Found",
  },
  outdated: {
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    label: "Outdated",
  },
};

function ScoreRing({
  score,
  size = 80,
  label,
}: {
  score: number;
  size?: number;
  label: string;
}) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 60
        ? "text-amber-500"
        : "text-red-500";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-gray-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className={color}
        />
      </svg>
      <span className={`text-xl font-bold ${color}`}>{score}%</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function WebsiteCompliancePage() {
  const { organization, organizationId } = useAuth();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [schoolType, setSchoolType] = useState<"maintained" | "academy">(
    "maintained",
  );
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [expandedRequirements, setExpandedRequirements] = useState<Set<string>>(
    new Set(),
  );

  const schoolName = organization?.name || "School";

  const handleScan = useCallback(async () => {
    if (!websiteUrl) return;
    setScanning(true);
    setError(null);
    setResult(null);
    setScanProgress("Initiating website scan...");

    try {
      const res = await fetch("/api/ofsted/website-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteUrl,
          schoolType,
          organizationId,
          maxPages: 100,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Scan failed: ${res.status}`);
      }

      const data = await res.json();
      setResult(data.data || data);
      setScanProgress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
      setScanProgress("");
    } finally {
      setScanning(false);
    }
  }, [websiteUrl, schoolType, organizationId]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleRequirement = (key: string) => {
    setExpandedRequirements((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const report = result?.report;

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/dashboard/website"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-fuchsia-50 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-fuchsia-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Website Compliance</h1>
          <p className="text-sm text-gray-500">
            DfE statutory requirements checker — powered by Firecrawl + AI
          </p>
        </div>
      </div>

      {/* Scan form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School Website URL
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://www.yourschool.co.uk"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none"
              disabled={scanning}
            />
          </div>
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School Type
            </label>
            <select
              value={schoolType}
              onChange={(e) =>
                setSchoolType(e.target.value as "maintained" | "academy")
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 outline-none bg-white"
              disabled={scanning}
            >
              <option value="maintained">Maintained</option>
              <option value="academy">Academy</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleScan}
              disabled={scanning || !websiteUrl}
              className="px-6 py-2.5 bg-fuchsia-600 text-white rounded-xl hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Scanning...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4" /> Scan Website
                </>
              )}
            </button>
          </div>
        </div>

        {scanning && scanProgress && (
          <div className="flex items-center gap-2 text-sm text-fuchsia-600 bg-fuchsia-50 rounded-xl p-3">
            <Loader2 className="w-4 h-4 animate-spin" />
            {scanProgress}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {report && (
        <>
          {/* Score overview */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-lg font-semibold">
                  {report.schoolName || schoolName}
                </h2>
                <p className="text-sm text-gray-500">
                  {report.websiteUrl} &middot; Scanned{" "}
                  {new Date(report.scannedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>{report.pagesScanned} pages scanned</span>
                  <span>{report.pdfsProcessed} PDFs processed</span>
                  <span>
                    {Math.round(report.scanDuration / 1000)}s scan time
                  </span>
                  {result?.crawlBackend && (
                    <span className="px-2 py-0.5 bg-fuchsia-50 text-fuchsia-600 rounded-full">
                      {result.crawlBackend === "firecrawl"
                        ? "Firecrawl"
                        : "Playwright"}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-8">
                <ScoreRing
                  score={report.overallComplianceScore}
                  label="Compliance"
                />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {report.overallQualityScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Quality (1-5)
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {report.overallClarityScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Clarity (1-5)
                  </span>
                </div>
              </div>
            </div>

            {/* Status bars */}
            <div className="mt-6 grid grid-cols-4 gap-4">
              {(
                [
                  {
                    label: "Compliant",
                    count: report.compliantCount,
                    color: "bg-emerald-500",
                  },
                  {
                    label: "Partial",
                    count: report.partialCount,
                    color: "bg-amber-500",
                  },
                  {
                    label: "Not Found",
                    count: report.notFoundCount,
                    color: "bg-red-500",
                  },
                  {
                    label: "Outdated",
                    count: report.outdatedCount,
                    color: "bg-orange-500",
                  },
                ] as const
              ).map((s) => (
                <div
                  key={s.label}
                  className="text-center p-3 bg-gray-50 rounded-xl"
                >
                  <div className="text-2xl font-bold">{s.count}</div>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-xs text-gray-500">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Actions */}
          {report.priorityActions.length > 0 && (
            <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
              <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5" />
                Priority Actions ({report.priorityActions.length})
              </h3>
              <ul className="space-y-2">
                {report.priorityActions.map((action, i) => (
                  <li
                    key={i}
                    className="text-sm text-red-700 flex items-start gap-2"
                  >
                    <span className="font-mono text-xs bg-red-100 rounded px-1.5 py-0.5 mt-0.5">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Categories */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Detailed Results</h3>
            {report.categorySummary.map((cat) => {
              const isExpanded = expandedCategories.has(cat.category);
              const catAssessments = report.assessments.filter(
                (a) => a.category === cat.category,
              );

              return (
                <div
                  key={cat.category}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                >
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(cat.category)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="font-semibold">
                        {cat.categoryLabel}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({cat.totalRequirements} requirements)
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        {cat.compliantCount > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                            {cat.compliantCount} OK
                          </span>
                        )}
                        {cat.partialCount > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                            {cat.partialCount} partial
                          </span>
                        )}
                        {cat.notFoundCount > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                            {cat.notFoundCount} missing
                          </span>
                        )}
                        {cat.outdatedCount > 0 && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                            {cat.outdatedCount} outdated
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {cat.compliancePercent}%
                      </span>
                    </div>
                  </button>

                  {/* Expanded requirements */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {catAssessments.map((assessment) => {
                        const config = statusConfig[assessment.status];
                        const StatusIcon = config.icon;
                        const isReqExpanded = expandedRequirements.has(
                          assessment.requirementKey,
                        );

                        return (
                          <div
                            key={assessment.requirementKey}
                            className="border-b border-gray-50 last:border-0"
                          >
                            <button
                              onClick={() =>
                                toggleRequirement(assessment.requirementKey)
                              }
                              className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <StatusIcon
                                  className={`w-4 h-4 flex-shrink-0 ${config.color}`}
                                />
                                <span className="text-sm">
                                  {assessment.requirementName}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full ${config.bg} ${config.color}`}
                                >
                                  {config.label}
                                </span>
                                {isReqExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            </button>

                            {isReqExpanded && (
                              <div className="px-6 pb-4 space-y-3 bg-gray-50">
                                {/* Scores */}
                                <div className="flex gap-6 text-xs text-gray-500">
                                  <span>
                                    Compliance: {assessment.complianceScore}%
                                  </span>
                                  <span>
                                    Quality: {assessment.qualityScore}/5
                                  </span>
                                  <span>
                                    Clarity: {assessment.clarityScore}/5
                                  </span>
                                  <span>
                                    Confidence:{" "}
                                    {Math.round(assessment.confidence * 100)}%
                                  </span>
                                  {assessment.aiAssessed && (
                                    <span className="text-fuchsia-500">
                                      AI assessed
                                    </span>
                                  )}
                                </div>

                                {/* Pages found */}
                                {assessment.pagesFound.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-500 mb-1">
                                      Found on:
                                    </h5>
                                    <div className="space-y-1">
                                      {assessment.pagesFound.map((p, i) => (
                                        <a
                                          key={i}
                                          href={p.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-xs text-fuchsia-600 hover:underline"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          {p.title || p.url}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Evidence */}
                                {assessment.evidenceQuotes.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-500 mb-1">
                                      Evidence:
                                    </h5>
                                    {assessment.evidenceQuotes.map((q, i) => (
                                      <blockquote
                                        key={i}
                                        className="text-xs text-gray-600 border-l-2 border-fuchsia-300 pl-2 mb-1 italic"
                                      >
                                        {q}
                                      </blockquote>
                                    ))}
                                  </div>
                                )}

                                {/* Gaps */}
                                {assessment.gaps.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-medium text-red-500 mb-1">
                                      Gaps:
                                    </h5>
                                    <ul className="text-xs text-red-600 space-y-0.5">
                                      {assessment.gaps.map((g, i) => (
                                        <li key={i}>• {g}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Recommendations */}
                                {assessment.recommendations.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-medium text-blue-500 mb-1">
                                      Recommendations:
                                    </h5>
                                    <ul className="text-xs text-blue-600 space-y-0.5">
                                      {assessment.recommendations.map(
                                        (r, i) => (
                                          <li key={i}>• {r}</li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}

                                {/* Red flags */}
                                {assessment.redFlags.length > 0 && (
                                  <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                                    <h5 className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Red Flags:
                                    </h5>
                                    <ul className="text-xs text-red-600 space-y-0.5">
                                      {assessment.redFlags.map((r, i) => (
                                        <li key={i}>• {r}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rescan button */}
          <div className="flex justify-center">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Rescan Website
            </button>
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && !scanning && !error && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-fuchsia-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Check Your Website Compliance
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            Enter your school website URL above to scan against 35+ DfE
            statutory requirements. The scanner uses Firecrawl to crawl your
            entire site (including sitemaps and PDFs) and AI to assess each
            requirement.
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              35+ requirements
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              Full site crawl
            </div>
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              AI quality scoring
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
