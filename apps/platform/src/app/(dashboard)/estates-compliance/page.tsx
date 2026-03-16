"use client";

/**
 * Estates Compliance Dashboard
 *
 * Comprehensive dashboard showing all compliance domains with statutory checks,
 * RAG status, and quick access to detailed views.
 * Using shadcn/ui components for consistency.
 *
 * ENHANCEMENTS:
 * - Today's Tasks Card: Shows items due today or overdue prominently
 * - Celebration Confetti: Delightful feedback when completing tasks
 * - Urgency Sorting: Domains sorted by urgency (overdue → due today → by completion %)
 * - Multiple Task Actions: View details, complete, snooze, mark N/A
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Check,
  Clock,
  AlertTriangle,
  Plus,
  FileText,
  Settings,
  ArrowRight,
  Calendar,
  Sparkles,
  MoreHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase as supabaseClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  STATUTORY_CHECKS,
  type ComplianceDomain,
} from "@/lib/estates-compliance/statutory-checks";
import { TaskDetailSheet } from "@/components/estates-compliance/TaskDetailSheet";
import { DailyChecksCard } from "@/components/estates-compliance/DailyChecksCard";
import EdChatButton from "@/components/estates-compliance/EdChatButton";
import EdWidgetWrapper from "@/components/EdWidgetWrapper";
import { EdBrowserControlWrapper } from "@/components/estates-compliance/EdBrowserControlWrapper";
import confetti from "canvas-confetti";
import { SettingsDialog } from "@/components/estates-compliance/SettingsDialog";
import { FeatureChecklist } from "@/components/ui/feature-discovery";
import { ESTATES_FEATURES } from "@/lib/feature-definitions";

interface CheckCompletion {
  checkId: string;
  status: "pending" | "completed" | "overdue" | "not_applicable";
  lastCompleted?: string;
  nextDue?: string;
  evidence?: string[];
}

interface DomainCompletion {
  domain: ComplianceDomain;
  totalChecks: number;
  completedChecks: number;
  overdueChecks: number;
  status: "compliant" | "attention" | "critical";
  checks: CheckCompletion[];
}

export interface TodayTask {
  checkId: string;
  checkName: string;
  domain: ComplianceDomain;
  domainIcon: string;
  domainName: string;
  status: "overdue" | "due_today" | "due_soon";
  frequency: string;
  category: string;
  nextDue?: string;
}

// ============================================================================
// CONFETTI UTILITY
// ============================================================================

const triggerConfetti = () => {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
};

// ============================================================================
// URGENCY SORTING
// ============================================================================

const sortDomainsByUrgency = (
  domains: DomainCompletion[],
): DomainCompletion[] => {
  return [...domains].sort((a, b) => {
    // 1. Domains with overdue checks come first
    if (a.overdueChecks > 0 && b.overdueChecks === 0) return -1;
    if (b.overdueChecks > 0 && a.overdueChecks === 0) return 1;

    // 2. Both have overdue checks - sort by count (most overdue first)
    if (a.overdueChecks > 0 && b.overdueChecks > 0) {
      return b.overdueChecks - a.overdueChecks;
    }

    // 3. Sort by completion percentage (lowest first)
    const aCompletion =
      a.totalChecks > 0 ? a.completedChecks / a.totalChecks : 0;
    const bCompletion =
      b.totalChecks > 0 ? b.completedChecks / b.totalChecks : 0;
    return aCompletion - bCompletion;
  });
};

// ============================================================================
// TODAY'S TASKS HELPER
// ============================================================================

const getTodayTasks = (
  domains: DomainCompletion[],
  maxTasks = 5,
): TodayTask[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const tasks: TodayTask[] = [];

  for (const domainData of domains) {
    const metadata = DOMAIN_METADATA[domainData.domain];
    const checks = getChecksForDomain(domainData.domain);

    for (const check of checks) {
      const completion = domainData.checks.find((c) => c.checkId === check.id);
      const status = completion?.status || "pending";

      // Skip completed checks
      if (status === "completed" || status === "not_applicable") continue;

      // Check if overdue
      if (status === "overdue") {
        tasks.push({
          checkId: check.id,
          checkName: check.name,
          domain: domainData.domain,
          domainIcon: metadata.icon,
          domainName: metadata.name,
          status: "overdue",
          frequency: check.frequency,
          category: check.category,
          nextDue: completion?.nextDue,
        });
        continue;
      }

      // Check if due today or soon
      if (completion?.nextDue) {
        const dueDate = new Date(completion.nextDue);

        if (dueDate < tomorrow) {
          tasks.push({
            checkId: check.id,
            checkName: check.name,
            domain: domainData.domain,
            domainIcon: metadata.icon,
            domainName: metadata.name,
            status: "due_today",
            frequency: check.frequency,
            category: check.category,
            nextDue: completion.nextDue,
          });
        } else if (dueDate < nextWeek && tasks.length < maxTasks) {
          tasks.push({
            checkId: check.id,
            checkName: check.name,
            domain: domainData.domain,
            domainIcon: metadata.icon,
            domainName: metadata.name,
            status: "due_soon",
            frequency: check.frequency,
            category: check.category,
            nextDue: completion.nextDue,
          });
        }
      }
    }
  }

  // Sort by urgency: overdue first, then due today, then due soon
  return tasks
    .sort((a, b) => {
      const statusOrder = { overdue: 0, due_today: 1, due_soon: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    })
    .slice(0, maxTasks);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EstatesComplianceDashboard() {
  const { organizationId, loading: authLoading } = useAuth();

  // Initialize with static data immediately so UI is always visible
  const [domains, setDomains] = useState<DomainCompletion[]>(() => {
    return Object.keys(DOMAIN_METADATA).map((domain) => {
      const checks = getChecksForDomain(domain as ComplianceDomain);
      return {
        domain: domain as ComplianceDomain,
        totalChecks: checks.length,
        completedChecks: 0,
        overdueChecks: 0,
        pendingChecks: checks.length,
        status: "compliant", // Default to compliant until data loads
        checks: checks.map((c) => ({
          checkId: c.id,
          status: "pending",
          evidence: [],
        })),
      };
    });
  });

  const [loading, setLoading] = useState(true);
  const [expandedDomain, setExpandedDomain] = useState<ComplianceDomain | null>(
    null,
  );
  const [celebratingCheckId, setCelebratingCheckId] = useState<string | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const confettiTriggeredRef = useRef(new Set<string>());

  // Ed widget state
  const [edOpen, setEdOpen] = useState(false);
  const [edMinimized, setEdMinimized] = useState(false);

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [visibleDomains, setVisibleDomains] = useState<ComplianceDomain[]>(
    () => {
      // Default to showing all domains
      return Object.keys(DOMAIN_METADATA) as ComplianceDomain[];
    },
  );

  // Location state
  const [locations, setLocations] = useState<any[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Load settings from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem("estates-compliance-visible-domains");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setVisibleDomains(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
  }, []);

  const handleVisibilityChange = (newDomains: ComplianceDomain[]) => {
    setVisibleDomains(newDomains);
    localStorage.setItem(
      "estates-compliance-visible-domains",
      JSON.stringify(newDomains),
    );
  };

  useEffect(() => {
    // Only initialize when auth is ready and we have an organizationId
    const controller = new AbortController();

    if (!authLoading && organizationId) {
      initializeDomains(controller.signal);
    } else if (authLoading) {
      // Auth still loading, waiting...
    } else if (!organizationId) {
      console.warn(
        "[EstatesCompliance] No organization ID, setting loading=false",
      );
      setLoading(false);
    }

    return () => controller.abort("Dashboard refreshed or unmounted");
  }, [organizationId, refreshKey, authLoading]);

  useEffect(() => {
    if (!authLoading && organizationId) {
      fetchLocations();
    }
  }, [organizationId, authLoading, refreshKey]);

  const fetchLocations = async () => {
    try {
      setLocationsLoading(true);
      const { data, error } = await supabaseClient
        .from("estates_locations")
        .select("*, assigned_staff:users(display_name)")
        .eq("organization_id", organizationId)
        .order("name");

      if (error) throw error;
      setLocations(data || []);
    } catch (err) {
      console.error("[EstatesCompliance] Error fetching locations:", err);
    } finally {
      setLocationsLoading(false);
    }
  };

  const initializeDomains = async (signal?: AbortSignal) => {
    // CRITICAL: Always set loading=false at the end, no matter what
    let loadingCleared = false;
    const ensureLoadingCleared = () => {
      if (!loadingCleared) {
        loadingCleared = true;
        setLoading(false);
      }
    };

    // Global timeout for entire init process
    const globalTimeoutId = setTimeout(() => {
      console.warn(
        "[EstatesCompliance] ⏱️ GLOBAL TIMEOUT - forcing ready state",
      );
      toast.error("Data loading took too long. Showing default view.");
      ensureLoadingCleared();
    }, 45000); // 45 second max

    try {
      if (!organizationId) {
        console.warn(
          "[EstatesCompliance] No organization ID found, using empty state",
        );
        clearTimeout(globalTimeoutId);
        ensureLoadingCleared();
        return;
      }

      // Get session token for API authentication
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      // Fetch statutory completions from Supabase with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort("Statutory completions fetch timed out"),
        30000,
      );

      // Link the passed signal to our local controller
      const onAbort = () => controller.abort(signal?.reason);
      if (signal) {
        if (signal.aborted) onAbort();
        else signal.addEventListener("abort", onAbort, { once: true });
      }

      try {
        const response = await fetch(
          `/api/estates/statutory-completions?organizationId=${organizationId}&summary=true`,
          {
            headers,
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);
        if (signal) signal.removeEventListener("abort", onAbort);
        if (!response.ok) {
          const errorText = await response.text();
          console.warn(
            "[EstatesCompliance] API error response:",
            response.status,
            errorText,
          );

          if (response.status === 403) {
            console.error(
              "[EstatesCompliance] 🚨 ACCESS DENIED: Membership mismatch or authorization failure.",
            );
            toast.error(
              "Access Denied: You are not authorized to view this organization's compliance data.",
            );
            clearTimeout(globalTimeoutId);
            ensureLoadingCleared();
            return;
          }

          // Initialize completions if they don't exist
          console.warn(
            "[EstatesCompliance] API error (not 200/403), attempting initialization...",
          );
          await initializeData();
        } else {
          const data = await response.json();
          if (!data.domains || data.domains.length === 0) {
            console.warn(
              "[EstatesCompliance] Received empty domains list. Triggering initialization...",
            );
            await initializeData();
          } else {
            processDomainData(data.domains);
          }
        }
      } catch (fetchError: any) {
        if (!signal) clearTimeout(timeoutId);

        const errorString =
          typeof fetchError === "string"
            ? fetchError
            : fetchError?.message || "";
        const isTimeout =
          errorString.toLowerCase().includes("timeout") ||
          fetchError?.name === "TimeoutError";
        const isAbort =
          fetchError.name === "AbortError" ||
          errorString.toLowerCase().includes("abort") ||
          errorString.toLowerCase().includes("unmounted") ||
          errorString.toLowerCase().includes("refreshed");

        if (isTimeout) {
          console.warn("[EstatesCompliance] API request timed out");
          toast.error("Data request timed out. Please refresh the page.");
        } else if (isAbort) {
          // Silent for intentional aborts
          // Intentionally aborted
        } else {
          console.error("[EstatesCompliance] API fetch error:", fetchError);
        }
      }
    } catch (error) {
      console.error("[EstatesCompliance] Error initializing domains:", error);
    } finally {
      clearTimeout(globalTimeoutId);
      ensureLoadingCleared();
    }
  };

  const initializeData = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("Init timeout"), 20000); // 20 second timeout

    try {
      // Get session for headers
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const initResponse = await fetch("/api/estates/statutory-completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          organizationId: organizationId,
          action: "initialize",
        }),
        signal: controller.signal,
      });

      if (!initResponse.ok) {
        console.error(
          "[EstatesCompliance] Initialization failed:",
          initResponse.status,
        );
        throw new Error("Failed to initialize data");
      }

      // Fetch again after initialization
      const retryResponse = await fetch(
        `/api/estates/statutory-completions?organizationId=${organizationId}&summary=true`,
        {
          headers,
          signal: controller.signal,
        },
      );

      if (!retryResponse.ok) {
        throw new Error(
          `Failed to fetch completions after initialization: ${retryResponse.status}`,
        );
      }

      const data = await retryResponse.json();
      processDomainData(data.domains);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn("[EstatesCompliance] initializeData timed out");
        toast.error("Initialization timed out. Using default view.");
      } else {
        console.error(
          "[EstatesCompliance] Critical error during init sequence:",
          err,
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const processDomainData = (domainsSummary: any[]) => {
    const domainData: DomainCompletion[] = Object.keys(DOMAIN_METADATA).map(
      (domain) => {
        const checks = getChecksForDomain(domain as ComplianceDomain);
        const totalChecks = checks.length;

        // Find completion summary for this domain
        const summary = domainsSummary?.find((d: any) => d.domain === domain);

        const completedChecks = summary?.completedChecks || 0;
        const overdueChecks = summary?.overdueChecks || 0;
        const pendingChecks =
          summary?.pendingChecks || totalChecks - completedChecks;

        let status: "compliant" | "attention" | "critical";
        if (overdueChecks > 0) {
          status = "critical";
        } else if (totalChecks > 0 && completedChecks / totalChecks < 0.8) {
          status = "attention";
        } else {
          status = "compliant";
        }

        const checkCompletions: CheckCompletion[] = checks.map((check) => {
          const completion = summary?.completions?.find(
            (c: any) => c.check_id === check.id,
          );

          return {
            checkId: check.id,
            status: completion?.status || "pending",
            lastCompleted: completion?.completed_at,
            nextDue: completion?.next_due_date,
            evidence: completion?.evidence_ids || [],
          };
        });

        return {
          domain: domain as ComplianceDomain,
          totalChecks,
          completedChecks,
          overdueChecks,
          status,
          checks: checkCompletions,
        };
      },
    );

    setDomains(domainData);
    setLoading(false);
  };

  const handleCompleteCheck = useCallback((checkId: string) => {
    setCelebratingCheckId(checkId);

    // Trigger confetti only once per check completion
    if (!confettiTriggeredRef.current.has(checkId)) {
      confettiTriggeredRef.current.add(checkId);
      triggerConfetti();
    }

    // Reset celebration state after animation
    setTimeout(() => setCelebratingCheckId(null), 2000);
  }, []);

  const getStatusBadge = (status: "compliant" | "attention" | "critical") => {
    switch (status) {
      case "compliant":
        return (
          <Badge className="bg-green-600 hover:bg-green-700 text-white border-green-700">
            Compliant
          </Badge>
        );
      case "attention":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600">
            Needs Attention
          </Badge>
        );
      case "critical":
        return (
          <Badge className="bg-red-600 hover:bg-red-700 text-white border-red-700">
            Action Required
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: "compliant" | "attention" | "critical") => {
    switch (status) {
      case "compliant":
        return <Check className="w-4 h-4 text-green-600" />;
      case "attention":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "critical":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const getCheckStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
          >
            ✅ Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            ⏰ Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
          >
            ⚠️ Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">⊘ N/A</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "statutory":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-300"
          >
            🔴 Statutory
          </Badge>
        );
      case "good_practice":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-300"
          >
            🟡 Good Practice
          </Badge>
        );
      case "custom":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-300"
          >
            🔵 Custom
          </Badge>
        );
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getTaskStatusBadge = (status: TodayTask["status"]) => {
    switch (status) {
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 animate-pulse">
            ⚠️ Overdue
          </Badge>
        );
      case "due_today":
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-300">
            📅 Due Today
          </Badge>
        );
      case "due_soon":
        return (
          <Badge className="bg-blue-50 text-blue-600 border-blue-200">
            Soon
          </Badge>
        );
    }
  };

  // Calculate today's tasks
  const visibleDomainData = domains.filter((d) =>
    visibleDomains.includes(d.domain),
  );
  const todayTasks = loading ? [] : getTodayTasks(visibleDomainData);
  const sortedDomains = loading ? [] : sortDomainsByUrgency(visibleDomainData);

  return (
    <EdBrowserControlWrapper>
      <div className="space-y-6 p-6">
        {/* Quick Actions - Compact Version */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Link href="/estates-compliance/diary" className="group">
            <Card className="h-full border hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-lg">📅</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                    My Diary
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Daily tasks
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/estates-compliance/assets" className="group">
            <Card className="h-full border hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-lg">🏢</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                    Asset Register
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Manage assets
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/estates-compliance/contractors" className="group">
            <Card className="h-full border hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-lg">👷</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                    Contractors
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Approved list
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/estates-compliance/tasks" className="group">
            <Card className="h-full border hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-lg">📋</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                    Tasks
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    View & schedule
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/estates-compliance/helpdesk" className="group">
            <Card className="h-full border hover:border-primary/50 hover:shadow-md transition-all duration-300 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-md bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform duration-300">
                  <span className="text-lg">🎫</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                    Helpdesk
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    Report issues
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Estates Compliance
            </h1>
            <p className="text-muted-foreground mt-1">
              Statutory compliance tracking with RAG status monitoring for
              Ofsted readiness
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Link href="/estates-compliance/reports">
              <Button size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Governor Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* Today's Tasks Card - NEW! Prominently displayed at top */}
        {!loading && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-950/20 dark:to-red-950/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Today&apos;s Tasks
                      {todayTasks.length > 0 && (
                        <Badge className="bg-orange-500 text-white">
                          {todayTasks.length}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {todayTasks.length === 0
                        ? "No urgent tasks for today. Great job staying on top of compliance!"
                        : todayTasks.filter((t) => t.status === "overdue")
                              .length > 0
                          ? `${todayTasks.filter((t) => t.status === "overdue").length} overdue, ${todayTasks.filter((t) => t.status === "due_today").length} due today`
                          : `${todayTasks.length} task${todayTasks.length > 1 ? "s" : ""} requiring attention`}
                    </CardDescription>
                  </div>
                </div>
                {todayTasks.length > 0 && (
                  <Link href={`/estates-compliance/${todayTasks[0].domain}`}>
                    <Button size="sm" variant="default">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            {todayTasks.length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  {todayTasks.map((task, index) => (
                    <div
                      key={task.checkId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/80 hover:bg-background transition-colors group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <span className="text-xl">{task.domainIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">
                            {task.checkName}
                          </p>
                          {getTaskStatusBadge(task.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {task.domainName} • {task.frequency}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        {/* View Details - opens sheet/dialog */}
                        <TaskDetailSheet
                          task={task}
                          onComplete={handleCompleteCheck}
                          onSnooze={(checkId) => {
                            // Refresh data after snoozing
                            setRefreshKey((prev) => prev + 1);
                          }}
                          onMarkNA={(checkId) => {
                            // Refresh data after marking N/A
                            setRefreshKey((prev) => prev + 1);
                          }}
                        />

                        {/* Ask Ed - contextual help */}
                        <EdChatButton
                          checkId={task.checkId}
                          checkName={task.checkName}
                          domain={task.domain}
                          status={
                            task.status === "due_today" ||
                            task.status === "due_soon"
                              ? "pending"
                              : task.status
                          }
                          size="sm"
                          iconOnly
                        />

                        {/* Quick Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              aria-label="Task actions"
                            >
                              <MoreHorizontal
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleCompleteCheck(task.checkId)}
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // Open the TaskDetailSheet instead - it has the snooze dialog
                                const detailButton = document.querySelector(
                                  `[data-task-detail="${task.checkId}"]`,
                                ) as HTMLButtonElement;
                                detailButton?.click();
                              }}
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Snooze (via Details)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // Open the TaskDetailSheet instead - it has the mark N/A dialog
                                const detailButton = document.querySelector(
                                  `[data-task-detail="${task.checkId}"]`,
                                ) as HTMLButtonElement;
                                detailButton?.click();
                              }}
                            >
                              <span className="mr-2">⊘</span>
                              Mark N/A (via Details)
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/estates-compliance/${task.domain}/${task.checkId}/complete`}
                                className="cursor-pointer"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Full Form
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Daily Routines Card - Opening & Closing Checklists */}
        {!loading && <DailyChecksCard />}

        {/* Site Locations & Layout - NEW! Hierarchical Awareness */}
        {!loading && (
          <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-950 dark:to-blue-950/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <span className="text-xl">🗺️</span>
                  </div>
                  <div>
                    <CardTitle>Site Layout & Assignments</CardTitle>
                    <CardDescription>
                      Hierarchical room mapping and teacher-to-room links
                    </CardDescription>
                  </div>
                </div>
                <Link href="/estates-compliance/locations">
                  <Button size="sm" variant="ghost">
                    Manage Map
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Placeholder for Site Plan */}
                <div className="relative aspect-video rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 flex flex-col items-center justify-center overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-colors" />
                  <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-500">
                    🏢
                  </span>
                  <p className="font-bold text-blue-600 dark:text-blue-400">
                    Interactive Site Plan
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Spatial mapping enabled via Estates Evolution
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4 bg-white/50 backdrop-blur-sm"
                  >
                    Upload Floor Plans
                  </Button>
                </div>

                {/* Locations List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Active Assignments
                  </h4>
                  {locationsLoading ? (
                    <div className="space-y-2">
                      <div className="h-10 bg-muted/50 rounded animate-pulse w-full" />
                      <div className="h-10 bg-muted/50 rounded animate-pulse w-full" />
                    </div>
                  ) : locations.length === 0 ? (
                    <div className="text-center py-6 border rounded-lg bg-muted/20">
                      <p className="text-sm text-muted-foreground italic">
                        No locations mapped yet.
                      </p>
                      <Button
                        size="sm"
                        variant="link"
                        onClick={() => setRefreshKey((k) => k + 1)}
                      >
                        Refresh Setup
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {locations.map((loc) => (
                        <div
                          key={loc.id}
                          className="flex items-center justify-between p-2 rounded-md border bg-white/80 dark:bg-slate-900/80 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-[10px] h-5"
                            >
                              {loc.type}
                            </Badge>
                            <span className="text-sm font-medium">
                              {loc.name}
                            </span>
                          </div>
                          {loc.assigned_staff ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                Linked:
                              </span>
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-green-50 text-green-700 border-green-200"
                              >
                                {loc.assigned_staff.display_name}
                              </Badge>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] text-blue-600"
                            >
                              + Assign Staff
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compliance Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Compliance Overview</CardTitle>
                <CardDescription>
                  {visibleDomainData.reduce(
                    (sum, d) => sum + d.completedChecks,
                    0,
                  )}{" "}
                  of{" "}
                  {visibleDomainData.reduce((sum, d) => sum + d.totalChecks, 0)}{" "}
                  checks completed
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-600 text-white py-1.5 px-3">
                  {
                    visibleDomainData.filter((d) => d.status === "compliant")
                      .length
                  }{" "}
                  Compliant
                </Badge>
                <Badge className="bg-yellow-500 text-white py-1.5 px-3">
                  {
                    visibleDomainData.filter((d) => d.status === "attention")
                      .length
                  }{" "}
                  Needs Attention
                </Badge>
                <Badge className="bg-red-600 text-white py-1.5 px-3">
                  {
                    visibleDomainData.filter((d) => d.status === "critical")
                      .length
                  }{" "}
                  Critical
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress
              value={
                (visibleDomainData.reduce(
                  (sum, d) => sum + d.completedChecks,
                  0,
                ) /
                  visibleDomainData.reduce(
                    (sum, d) => sum + d.totalChecks,
                    0,
                  )) *
                100
              }
              className="h-3"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(
                (visibleDomainData.reduce(
                  (sum, d) => sum + d.completedChecks,
                  0,
                ) /
                  visibleDomainData.reduce(
                    (sum, d) => sum + d.totalChecks,
                    0,
                  )) *
                  100,
              )}
              % completion rate
            </p>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
            <p className="text-muted-foreground font-medium">
              Loading compliance data...
            </p>
          </div>
        ) : (
          <>
            {/* Compliance Domains - Now sorted by urgency! */}
            <div className="space-y-4">
              {sortedDomains.map((domainData) => {
                const metadata = DOMAIN_METADATA[domainData.domain];
                const isExpanded = expandedDomain === domainData.domain;
                const checks = getChecksForDomain(domainData.domain);

                return (
                  <Card
                    key={domainData.domain}
                    className={`transition-all duration-300 ${isExpanded ? "ring-2 ring-primary" : ""}`}
                  >
                    <button
                      onClick={() =>
                        setExpandedDomain(isExpanded ? null : domainData.domain)
                      }
                      className="w-full text-left"
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <span className="text-3xl">{metadata.icon}</span>
                            <div className="text-left flex-1">
                              <div className="flex items-center gap-3 flex-wrap mb-1">
                                <CardTitle className="text-lg">
                                  {metadata.name}
                                </CardTitle>
                                {getStatusBadge(domainData.status)}
                                {domainData.overdueChecks > 0 && (
                                  <Badge className="bg-red-100 text-red-700 border-red-300 animate-pulse">
                                    {domainData.overdueChecks} overdue
                                  </Badge>
                                )}
                              </div>
                              <CardDescription>
                                {metadata.description}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="text-right bg-muted/50 rounded-lg px-4 py-2">
                            <p className="text-2xl font-bold">
                              {domainData.completedChecks}/
                              {domainData.totalChecks}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">
                              checks
                            </p>
                          </div>
                          <ChevronRight
                            className={`w-5 h-5 text-muted-foreground transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </div>
                      </CardHeader>
                    </button>

                    {/* Expanded Check List */}
                    {isExpanded && (
                      <CardContent className="border-t pt-6">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b">
                          <h3 className="font-semibold">
                            Statutory & Good Practice Checks
                          </h3>
                          <Link
                            href={`/estates-compliance/${domainData.domain}`}
                          >
                            <Button variant="outline" size="sm">
                              View all checks
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </div>

                        <div className="space-y-3">
                          {checks.slice(0, 5).map((check) => {
                            const completion = domainData.checks.find(
                              (c) => c.checkId === check.id,
                            );
                            const status = completion?.status || "pending";
                            const isCelebrating =
                              celebratingCheckId === check.id;

                            return (
                              <div
                                key={check.id}
                                className={`flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-all ${isCelebrating ? "ring-2 ring-green-500 bg-green-50/50" : ""}`}
                              >
                                <div className="mt-1">
                                  {getStatusIcon(domainData.status)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <p className="font-medium text-sm">
                                      {check.name}
                                    </p>
                                    {getCategoryBadge(check.category)}
                                    {getCheckStatusBadge(status)}
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {check.frequency}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {check.description}
                                  </p>
                                  {check.reference && (
                                    <p className="text-xs text-muted-foreground mt-1 bg-muted/50 inline-block px-2 py-1 rounded">
                                      📋 Ref: {check.reference}
                                    </p>
                                  )}
                                </div>
                                <Link
                                  href={`/estates-compliance/${domainData.domain}/${check.id}/complete`}
                                  onClick={() => handleCompleteCheck(check.id)}
                                >
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className={isCelebrating ? "scale-105" : ""}
                                  >
                                    {isCelebrating ? (
                                      <>
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        Done!
                                      </>
                                    ) : (
                                      <>
                                        Complete
                                        <ArrowRight className="w-3 h-3 ml-1" />
                                      </>
                                    )}
                                  </Button>
                                </Link>
                              </div>
                            );
                          })}
                          {checks.length > 5 && (
                            <div className="text-center py-3">
                              <Link
                                href={`/estates-compliance/${domainData.domain}`}
                              >
                                <Button variant="outline" size="sm">
                                  View all {checks.length} checks
                                  <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
                          <Link
                            href={`/estates-compliance/${domainData.domain}/new`}
                          >
                            <Button size="sm" variant="outline">
                              <Plus className="w-4 h-4 mr-1" />
                              Add Custom Check
                            </Button>
                          </Link>
                          <Link
                            href={`/estates-compliance/${domainData.domain}/schedule`}
                          >
                            <Button size="sm" variant="outline">
                              <Clock className="w-4 h-4 mr-1" />
                              Schedule
                            </Button>
                          </Link>
                          <Link
                            href={`/estates-compliance/${domainData.domain}`}
                          >
                            <Button size="sm" variant="outline">
                              <FileText className="w-4 h-4 mr-1" />
                              Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          visibleDomains={visibleDomains}
          onVisibilityChange={handleVisibilityChange}
        />

        {/* Feature Discovery */}
        <FeatureChecklist
          features={ESTATES_FEATURES}
          moduleFilter="estates"
          accentColor="#00D4D4"
        />

        {/* Ed Chatbot Widget - Floating Orb */}
        <EdWidgetWrapper
          isOpen={edOpen}
          onToggle={() => setEdOpen(!edOpen)}
          isMinimized={edMinimized}
          onToggleMinimize={() => setEdMinimized(!edMinimized)}
          mode="user"
          organizationId={organizationId ?? undefined}
        />
      </div>
    </EdBrowserControlWrapper>
  );
}
