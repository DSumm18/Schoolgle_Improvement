"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Loader2,
  RefreshCw,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePageHeader } from "@/components/ui/module-page-header";

/** Fetch with Supabase auth token */
async function authFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return fetch(url, { ...options, headers });
}

// ─── Types ────────────────────────────────────────────────────

type PageState =
  | "loading"
  | "no_website"
  | "ready"
  | "scanning"
  | "has_results"
  | "error";

interface DocumentQuality {
  score: number;
  criteriaMet: string[];
  criteriaMissing: string[];
  documentYear?: number;
  pageCount?: number;
  wordCount?: number;
}

interface CheckResult {
  requirementKey: string;
  requirementName: string;
  category: string;
  status: "found" | "not_found" | "needs_checking";
  foundOnUrl?: string;
  matchedText?: string;
  checkingReason?: string;
  summary?: string;
  quality?: DocumentQuality;
  legislation: string[];
}

interface ScanResult {
  websiteUrl: string;
  scannedAt: string;
  durationMs: number;
  totalRequirements: number;
  foundCount: number;
  notFoundCount: number;
  needsCheckingCount: number;
  compliancePercent: number;
  schoolType: string;
  schoolPhase: string;
  results: CheckResult[];
}

const CATEGORY_LABELS: Record<string, string> = {
  identity: "School Identity & Contact",
  admissions: "Admissions",
  curriculum: "Curriculum",
  send: "SEND",
  pupil_premium: "Pupil Premium",
  pe_sport_premium: "PE & Sport Premium",
  governance: "Governance",
  safeguarding: "Safeguarding",
  online_safety: "Online Safety",
  policies: "Policies",
  performance_data: "Performance Data",
  financial: "Financial Information",
  equality: "Equality & Diversity",
  ofsted: "Ofsted",
  careers: "Careers (Secondary)",
  accessibility: "Accessibility",
  siams: "Church School (SIAMS)",
};

const STATUS_CONFIG = {
  found: {
    icon: CheckCircle2,
    label: "Found",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  not_found: {
    icon: XCircle,
    label: "Not Found",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
  },
  needs_checking: {
    icon: AlertTriangle,
    label: "Needs Checking",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
  },
};

// ─── Page ─────────────────────────────────────────────────────

export default function WebsiteComplianceDashboard() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  const [state, setState] = useState<PageState>("loading");
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Load org website and any existing results
  const loadData = useCallback(async () => {
    if (!organizationId) return;

    try {
      const { data: orgData } = await supabase
        .from("organizations")
        .select("website_url")
        .eq("id", organizationId)
        .maybeSingle();

      const url = orgData?.website_url;
      setWebsiteUrl(url || null);

      if (!url) {
        setState("no_website");
        return;
      }

      // Check for existing quick scan results
      console.log(
        "[QuickScan] Fetching existing results for org:",
        organizationId,
      );
      const res = await authFetch(
        `/api/website-scan/quick?organizationId=${organizationId}`,
      );
      if (res.ok) {
        const data = await res.json();
        console.log("[QuickScan] API response keys:", Object.keys(data));
        // apiSuccess returns payload directly (no .data wrapper)
        const payload = data.data || data;
        if (payload?.hasResults && Array.isArray(payload?.results)) {
          setScanResult(payload);
          setState("has_results");
          return;
        }
      }

      console.log("[QuickScan] No valid results, setting state to ready");
      setState("ready");
    } catch (err) {
      console.error("Error loading data:", err);
      setState("ready");
    }
  }, [organizationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Run quick scan
  const runScan = async () => {
    console.log("[QuickScan] runScan called, orgId:", organizationId);
    if (!organizationId) {
      console.log("[QuickScan] No organizationId, aborting");
      return;
    }

    setState("scanning");
    setError(null);

    try {
      const res = await authFetch("/api/website-scan/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Scan failed");
      }

      const data = await res.json();
      setScanResult(data.data || data);
      setState("has_results");
    } catch (err) {
      console.error("Scan error:", err);
      setError(err instanceof Error ? err.message : "Scan failed");
      setState("error");
    }
  };

  // ─── Score ring ─────────────────────────────────────────────
  const ScoreRing = ({ score }: { score: number }) => {
    const size = 130;
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-black"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}%
          </motion.span>
          <span className="text-xs text-muted-foreground">compliant</span>
        </div>
      </div>
    );
  };

  // ─── Loading ────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1400px] mx-auto">
        <ModulePageHeader
          moduleId="compliance"
          icon={Globe}
          label="Statutory Compliance"
          title="Website Compliance"
          badge="28+ checks"
        />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ─── No website ─────────────────────────────────────────────
  if (state === "no_website") {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1400px] mx-auto space-y-6">
        <ModulePageHeader
          moduleId="compliance"
          icon={Globe}
          label="Statutory Compliance"
          title="Website Compliance"
          badge="28+ checks"
        />
        <Card className="border border-border/50">
          <CardContent className="p-8 text-center">
            <Globe className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-2">
              No school website registered
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Please update your school settings to add your website URL before
              running a compliance check.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Scanning ───────────────────────────────────────────────
  if (state === "scanning") {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1400px] mx-auto space-y-6">
        <ModulePageHeader
          moduleId="compliance"
          icon={Globe}
          label="Statutory Compliance"
          title="Website Compliance"
          badge="Scanning..."
        />
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
            <Globe className="w-5 h-5 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-sm font-medium">
            Checking your website compliance...
          </p>
          <p className="text-xs text-muted-foreground">
            This takes about 30-60 seconds
          </p>
          {websiteUrl && (
            <p className="text-xs text-muted-foreground">
              {websiteUrl.replace(/^https?:\/\//, "")}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── Ready / Error ──────────────────────────────────────────
  if (state === "ready" || state === "error") {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1400px] mx-auto space-y-6">
        <ModulePageHeader
          moduleId="compliance"
          icon={Globe}
          label="Statutory Compliance"
          title="Website Compliance"
          badge="28+ checks"
        />
        <Card className="border border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              Check your website compliance
            </h3>
            <p className="text-sm text-muted-foreground mb-1">
              We&apos;ll scan{" "}
              <strong className="text-foreground">
                {websiteUrl?.replace(/^https?:\/\//, "")}
              </strong>{" "}
              against 28+ statutory requirements.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Takes about 30-60 seconds. No AI or deep analysis — just a quick
              presence check.
            </p>
            <button
              onClick={runScan}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 mx-auto"
            >
              <Globe className="w-4 h-4" />
              Scan My Website
            </button>
            {error && (
              <p className="mt-4 text-sm text-rose-600 flex items-center gap-1 justify-center">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Has results ────────────────────────────────────────────
  const result = scanResult;

  // Safety: if scanResult is missing or has no results array, show ready state
  if (!result?.results || !Array.isArray(result.results)) {
    return (
      <div className="p-6 md:p-8 min-h-screen max-w-[1400px] mx-auto space-y-6">
        <ModulePageHeader
          moduleId="compliance"
          icon={Globe}
          label="Statutory Compliance"
          title="Website Compliance"
          badge="28+ checks"
        />
        <Card className="border border-border/50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              Check your website compliance
            </h3>
            <p className="text-sm text-muted-foreground mb-1">
              We&apos;ll scan{" "}
              <strong className="text-foreground">
                {websiteUrl?.replace(/^https?:\/\//, "")}
              </strong>{" "}
              against 28+ statutory requirements.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Takes about 30-60 seconds. No AI or deep analysis — just a quick
              presence check.
            </p>
            <button
              onClick={runScan}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 mx-auto"
            >
              <Globe className="w-4 h-4" />
              Scan My Website
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group by category
  const grouped: Record<string, CheckResult[]> = {};
  for (const r of result.results) {
    if (!grouped[r.category]) grouped[r.category] = [];
    grouped[r.category].push(r);
  }

  // Sort categories: worst first
  const sortedCategories = Object.entries(grouped).sort(
    ([, a], [, b]) =>
      b.filter((r) => r.status === "not_found").length -
      a.filter((r) => r.status === "not_found").length,
  );

  return (
    <div className="p-6 md:p-8 min-h-screen max-w-[1400px] mx-auto space-y-6">
      <ModulePageHeader
        moduleId="compliance"
        icon={Globe}
        label="Statutory Compliance"
        title="Website Compliance"
        badge={`${result.compliancePercent}% compliant`}
      />

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Globe className="w-3.5 h-3.5" />
              {websiteUrl.replace(/^https?:\/\//, "")}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {result.scannedAt && (
            <span className="text-xs">
              Scanned{" "}
              {new Date(result.scannedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}{" "}
              in {(result.durationMs / 1000).toFixed(0)}s
            </span>
          )}
        </div>
        <button
          onClick={runScan}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-scan
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border/50">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <ScoreRing score={result.compliancePercent} />
          </CardContent>
        </Card>

        {[
          {
            label: "Found",
            count: result.foundCount,
            config: STATUS_CONFIG.found,
          },
          {
            label: "Not Found",
            count: result.notFoundCount,
            config: STATUS_CONFIG.not_found,
          },
          {
            label: "Needs Checking",
            count: result.needsCheckingCount,
            config: STATUS_CONFIG.needs_checking,
          },
        ].map(({ label, count, config }) => {
          const Icon = config.icon;
          return (
            <Card key={label} className="border border-border/50">
              <CardContent className="p-5 flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center`}
                >
                  <Icon className={`w-6 h-6 ${config.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-black">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Missing items callout */}
      {result.notFoundCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-4"
        >
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                {result.notFoundCount} statutory requirement
                {result.notFoundCount !== 1 ? "s" : ""} not found on your
                website
              </p>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-1">
                These are legal requirements under the School Information
                Regulations. Ofsted will check for these during inspection.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Checklist by category */}
      <div className="space-y-3">
        {sortedCategories.map(([category, items]) => {
          const isExpanded = expandedCategories.has(category);
          const foundCount = items.filter((r) => r.status === "found").length;
          const allFound = foundCount === items.length;

          return (
            <Card
              key={category}
              className={`border overflow-hidden ${allFound ? "border-emerald-200 dark:border-emerald-800/50" : items.some((r) => r.status === "not_found") ? "border-rose-200 dark:border-rose-800/50" : "border-border/50"}`}
            >
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-semibold flex-1 text-left">
                  {CATEGORY_LABELS[category] || category}
                </span>
                <span
                  className={`text-xs font-medium ${allFound ? "text-emerald-600" : "text-muted-foreground"}`}
                >
                  {foundCount}/{items.length}
                </span>
                {allFound && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-border/50"
                  >
                    {items.map((item) => {
                      const config = STATUS_CONFIG[item.status];
                      const Icon = config.icon;

                      return (
                        <div
                          key={item.requirementKey}
                          className="px-4 py-3 border-b border-border/30 last:border-b-0 flex items-start gap-3"
                        >
                          <Icon
                            className={`w-4 h-4 mt-0.5 shrink-0 ${config.color}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {item.requirementName}
                            </p>
                            {item.summary && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.summary}
                              </p>
                            )}
                            {item.foundOnUrl && (
                              <a
                                href={item.foundOnUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5 truncate"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                {item.foundOnUrl
                                  .replace(/^https?:\/\//, "")
                                  .slice(0, 70)}
                              </a>
                            )}
                            {item.checkingReason && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.checkingReason}
                              </p>
                            )}
                            {item.quality && (
                              <div className="mt-1.5 space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        item.quality.score >= 70
                                          ? "bg-emerald-500"
                                          : item.quality.score >= 40
                                            ? "bg-amber-500"
                                            : "bg-red-500"
                                      }`}
                                      style={{
                                        width: `${item.quality.score}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                                    {item.quality.score}% quality
                                  </span>
                                </div>
                                {item.quality.criteriaMissing.length > 0 && (
                                  <details className="text-xs">
                                    <summary className="text-amber-600 dark:text-amber-400 cursor-pointer hover:underline">
                                      {item.quality.criteriaMissing.length}{" "}
                                      criteria not evidenced
                                    </summary>
                                    <ul className="mt-1 ml-4 space-y-0.5 text-muted-foreground list-disc">
                                      {item.quality.criteriaMissing.map(
                                        (c, ci) => (
                                          <li key={ci}>{c}</li>
                                        ),
                                      )}
                                    </ul>
                                  </details>
                                )}
                                {item.quality.criteriaMet.length > 0 && (
                                  <details className="text-xs">
                                    <summary className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">
                                      {item.quality.criteriaMet.length} criteria
                                      evidenced
                                    </summary>
                                    <ul className="mt-1 ml-4 space-y-0.5 text-muted-foreground list-disc">
                                      {item.quality.criteriaMet.map((c, ci) => (
                                        <li key={ci}>{c}</li>
                                      ))}
                                    </ul>
                                  </details>
                                )}
                              </div>
                            )}
                            {item.status === "not_found" &&
                              item.legislation.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Required by: {item.legislation[0]}
                                </p>
                              )}
                          </div>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${config.bg} ${config.color} ${config.border} border`}
                          >
                            {config.label}
                          </span>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Footer info */}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <FileText className="w-3.5 h-3.5" />
        Quick scan — checks page content and link names. For deep analysis
        including PDF content, AI quality assessment, and Ofsted evidence
        mapping, use the Ofsted Readiness module.
      </p>
    </div>
  );
}
