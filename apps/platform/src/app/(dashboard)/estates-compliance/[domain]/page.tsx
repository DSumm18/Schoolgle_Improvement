"use client";

/**
 * Domain Detail Page - Redesigned
 *
 * Shows all statutory checks for a specific compliance domain
 * with completion tracking, evidence linking, and action capabilities.
 *
 * UI improvements:
 * - Compact card layout with better space utilization
 * - Improved visibility with high contrast colors
 * - Smooth animations with Magic UI components
 * - Real Supabase data integration
 *
 * @version 2.0 - Fixed imports
 */

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  FileText,
  Filter,
  Search,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  STATUTORY_CHECKS,
  type ComplianceDomain,
  type StatutoryCheck,
  type CheckStatus,
  type CheckCategory,
} from "@/lib/estates-compliance/statutory-checks";
import { MagicCard } from "@/components/magicui/magic-card";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BlurFade } from "@/components/magicui/blur-fade";
import { motion, AnimatePresence } from "framer-motion";

async function getAccessToken(contextToken?: string | null) {
  if (contextToken) return contextToken;

  return Promise.race([
    supabase.auth
      .getSession()
      .then(({ data }) => data.session?.access_token || null)
      .catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
  ]);
}

interface CheckCompletion {
  checkId: string;
  status: CheckStatus;
  lastCompleted?: string;
  nextDue?: string;
  completedBy?: string;
  ragStatus?: "red" | "amber" | "green";
  notes?: string;
}

const getStatusColor = (status: CheckStatus): string => {
  switch (status) {
    case "completed":
      return "#10b981";
    case "pending":
      return "#f59e0b";
    case "overdue":
      return "#ef4444";
    case "in_progress":
      return "#3b82f6";
    default:
      return "#6b7280";
  }
};

const getStatusBg = (status: CheckStatus): string => {
  switch (status) {
    case "completed":
      return "bg-emerald-50 dark:bg-emerald-950/20";
    case "pending":
      return "bg-amber-50 dark:bg-amber-950/20";
    case "overdue":
      return "bg-red-50 dark:bg-red-950/20";
    case "in_progress":
      return "bg-blue-50 dark:bg-blue-950/20";
    default:
      return "bg-gray-50 dark:bg-gray-950/20";
  }
};

const getCategoryColor = (category: CheckCategory): string => {
  switch (category) {
    case "statutory":
      return "#dc2626";
    case "good_practice":
      return "#d97706";
    case "custom":
      return "#2563eb";
    default:
      return "#6b7280";
  }
};

export default function DomainPage() {
  const params = useParams();
  const domainSlug = params.domain as ComplianceDomain;
  const { user, organizationId, session } = useAuth();

  // Validate domain
  if (!domainSlug || !DOMAIN_METADATA[domainSlug]) {
    notFound();
  }

  const metadata = DOMAIN_METADATA[domainSlug];
  const checks = getChecksForDomain(domainSlug);

  const [customChecks, setCustomChecks] = useState<StatutoryCheck[]>([]);
  const [completions, setCompletions] = useState<
    Record<string, CheckCompletion>
  >({});
  const [filterStatus, setFilterStatus] = useState<CheckStatus | "all">("all");
  const [filterCategory, setFilterCategory] = useState<CheckCategory | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    // CRITICAL: Always set loading=false at the end, no matter what
    let loadingCleared = false;
    const ensureLoadingCleared = () => {
      if (!loadingCleared && mounted) {
        loadingCleared = true;
        setLoading(false);
      }
    };

    // Global timeout for entire fetch process
    const globalTimeoutId = setTimeout(() => {
      console.warn("[DomainPage] ⏱️ GLOBAL TIMEOUT - forcing ready state");
      ensureLoadingCleared();
    }, 35000); // 35 second max

    async function fetchCompletions() {
      if (!organizationId) {
        clearTimeout(globalTimeoutId);
        ensureLoadingCleared();
        return;
      }

      const token = await getAccessToken(session?.access_token);
      if (!token) {
        console.warn("[DomainPage] No active auth token available yet");
        clearTimeout(globalTimeoutId);
        ensureLoadingCleared();
        return;
      }

      setLoading(true);

      // Add timeout to prevent hanging requests
      const timeoutId = setTimeout(
        () => controller.abort("Request timed out"),
        25000,
      );

      try {
        console.log("[DomainPage] Fetching completions for:", domainSlug);

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [response, customResponse] = await Promise.all([
          fetch(
            `/api/estates/statutory-completions?organizationId=${organizationId}&domain=${domainSlug}`,
            {
              headers,
              signal: controller.signal,
            },
          ),
          fetch(`/api/estates/checks/custom?domain=${domainSlug}&pageSize=100`, {
            headers,
            signal: controller.signal,
          }),
        ]);

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        const customResult = customResponse.ok
          ? await customResponse.json()
          : { checks: [] };

        if (mounted) {
          const data = result.completions || [];
          console.log("[DomainPage] Fetched", data.length, "completions");

          // Group by check_id and get the latest completion
          const completionsMap: Record<string, CheckCompletion> = {};
          data.forEach((completion: any) => {
            const checkId = completion.check_id;
            // The API returns ordered by completed_at desc, so first one is latest
            if (!completionsMap[checkId]) {
              completionsMap[checkId] = {
                checkId,
                status: completion.status || "pending",
                lastCompleted: completion.completed_at,
                completedBy: completion.completed_by,
                ragStatus: completion.rag_status,
                notes: completion.notes,
              };
            }
          });

          setCompletions(completionsMap);
          setCustomChecks(
            (customResult.checks || []).map((custom: any) => ({
              id: `custom_${custom.id}`,
              domain: custom.compliance_domain,
              name: custom.name,
              description: custom.description,
              category:
                custom.classification === "statutory"
                  ? "statutory"
                  : "custom",
              frequency: custom.frequency,
              reference: custom.statutory_reference,
              estimatedDuration: custom.estimated_duration,
              requiresQualification: custom.requires_qualification,
              evidenceRequired: custom.evidence_required || [],
              notes: custom.notes,
            })),
          );
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (mounted) {
          if (
            error.name === "AbortError" ||
            error?.message?.includes("aborted")
          ) {
            console.warn("[DomainPage] Request timed out");
          } else {
            console.error("[DomainPage] Completion fetch error:", error);
          }
        }
      } finally {
        clearTimeout(globalTimeoutId);
        ensureLoadingCleared();
      }
    }

    fetchCompletions();

    return () => {
      mounted = false;
      controller.abort();
      clearTimeout(globalTimeoutId);
    };
  }, [organizationId, domainSlug, session?.access_token]);

  const allChecks = [...checks, ...customChecks];

  const filteredChecks = allChecks.filter((check) => {
    const completion = completions[check.id];
    const statusMatch =
      filterStatus === "all" ||
      (completion?.status || "pending") === filterStatus;
    const categoryMatch =
      filterCategory === "all" || check.category === filterCategory;
    const searchMatch =
      !searchQuery ||
      check.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      check.description.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && categoryMatch && searchMatch;
  });

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const completedCount = Object.values(completions).filter(
    (c) => c.status === "completed",
  ).length;
  const overdueCount = Object.values(completions).filter(
    (c) => c.status === "overdue",
  ).length;

  const stats = [
    {
      label: "Total",
      value: allChecks.length,
      color: "from-slate-500 to-slate-600",
    },
    {
      label: "Done",
      value: completedCount,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      label: "Pending",
      value: allChecks.length - completedCount - overdueCount,
      color: "from-amber-500 to-amber-600",
    },
    { label: "Overdue", value: overdueCount, color: "from-red-500 to-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-teal-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <BlurFade delay={0} duration={0.5}>
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/estates-compliance"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </BlurFade>

        {/* Title Section */}
        <BlurFade delay={0.1} duration={0.5}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{metadata.icon}</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {metadata.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                  {metadata.description}
                </p>
              </div>
            </div>
            <Link
              href={`/estates-compliance/${domainSlug}/new`}
              className="shrink-0"
            >
              <ShimmerButton
                shimmerColor="#ffffff"
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Check
              </ShimmerButton>
            </Link>
          </div>
        </BlurFade>

        {/* Stats */}
        <BlurFade delay={0.2} duration={0.5}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.color} p-4 shadow-lg`}
              >
                <div className="absolute inset-0 bg-white/20 dark:bg-black/20" />
                <div className="relative">
                  <p className="text-xs font-semibold text-white/90 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-white">
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </BlurFade>

        {/* Filters */}
        <BlurFade delay={0.3} duration={0.5}>
          <div className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as CheckStatus | "all")
              }
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="in_progress">In Progress</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) =>
                setFilterCategory(e.target.value as CheckCategory | "all")
              }
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="statutory">Statutory</option>
              <option value="good_practice">Good Practice</option>
              <option value="custom">Custom</option>
            </select>

            <div className="flex-1 min-w-[180px] relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </BlurFade>

        {/* Checks List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full"
            />
            <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">
              Loading checks...
            </p>
          </div>
        ) : filteredChecks.length === 0 ? (
          <BlurFade delay={0.4} duration={0.5}>
            <div className="text-center py-16 px-4">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No checks found
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your filters
              </p>
              <button
                onClick={() => {
                  setFilterStatus("all");
                  setFilterCategory("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-lg bg-teal-600 text-white font-medium text-sm hover:bg-teal-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </BlurFade>
        ) : (
          <motion.div layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredChecks.map((check, index) => {
                const completion = completions[check.id];
                const status = completion?.status || "pending";

                return (
                  <BlurFade
                    key={check.id}
                    delay={0.4 + index * 0.05}
                    duration={0.4}
                  >
                    <Link
                      href={`/estates-compliance/${domainSlug}/${check.id}`}
                    >
                      <MagicCard
                        className="p-4 cursor-pointer hover:scale-[1.01] transition-transform duration-200"
                        gradientColor={getStatusColor(status)}
                        gradientOpacity={0.1}
                      >
                        <div className="flex items-start gap-3">
                          {/* Status Icon */}
                          <div
                            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: `${getStatusColor(status)}20`,
                              color: getStatusColor(status),
                            }}
                          >
                            {status === "completed" && (
                              <Check className="w-5 h-5" />
                            )}
                            {status === "pending" && (
                              <Clock className="w-5 h-5" />
                            )}
                            {status === "overdue" && (
                              <AlertTriangle className="w-5 h-5" />
                            )}
                            {status === "in_progress" && (
                              <Clock className="w-5 h-5" />
                            )}
                            {![
                              "completed",
                              "pending",
                              "overdue",
                              "in_progress",
                            ].includes(status) && <Clock className="w-5 h-5" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
                                {check.name}
                              </h3>
                              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                              {check.description}
                            </p>

                            {/* Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white"
                                style={{
                                  backgroundColor: getCategoryColor(
                                    check.category,
                                  ),
                                }}
                              >
                                {check.category === "statutory" && "Statutory"}
                                {check.category === "good_practice" &&
                                  "Good Practice"}
                                {check.category === "custom" && "Custom"}
                              </span>

                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-white"
                                style={{
                                  backgroundColor: getStatusColor(status),
                                }}
                              >
                                {status.replace("_", " ").toUpperCase()}
                              </span>

                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {check.frequency}
                              </span>

                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Last: {formatDate(completion?.lastCompleted)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </MagicCard>
                    </Link>
                  </BlurFade>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
