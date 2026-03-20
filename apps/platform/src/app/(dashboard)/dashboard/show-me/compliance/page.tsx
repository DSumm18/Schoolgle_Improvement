"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
  FileText,
  GraduationCap,
  ClipboardList,
  Shield,
  Mail,
  AlertTriangle,
  Globe,
  Building2,
  Lock,
  Scale,
} from "lucide-react";
import { ShowMeShell, type ShowMeStep } from "@/components/show-me/ShowMeShell";
import { useEdChatbot } from "@/components/EdChatbotProvider";

/**
 * Show Me: Compliance Readiness
 *
 * Derived entirely from real API data.
 * Only shows compliance areas this school actually has data for.
 */

export default function ShowMeCompliancePage() {
  const { organizationId, organization } = useAuth();
  const { openChatWith } = useEdChatbot();
  const [steps, setSteps] = useState<ShowMeStep[]>([]);
  const [loading, setLoading] = useState(true);

  const checkCompliance = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token)
      h["Authorization"] = `Bearer ${session.access_token}`;

    const fetchJson = async (url: string): Promise<any> => {
      try {
        const res = await fetch(url, { headers: h });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    };

    const [
      itemsData,
      trainingData,
      scrData,
      complaintsData,
      estatesData,
      riskData,
    ] = await Promise.all([
      fetchJson(
        `/api/compliance/items?organizationId=${organizationId}&type=policy`,
      ),
      fetchJson(`/api/compliance/training?organizationId=${organizationId}`),
      fetchJson(`/api/compliance/scr?organizationId=${organizationId}`),
      fetchJson(`/api/compliance/complaints?organizationId=${organizationId}`),
      fetchJson(
        `/api/estates/statutory-completions?organizationId=${organizationId}&summary=true`,
      ),
      fetchJson(
        `/api/risk?organizationId=${organizationId}&category=legal_compliance`,
      ),
    ]);

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const built: ShowMeStep[] = [];

    // === POLICIES ===
    const policies = itemsData?.items || itemsData?.data || [];
    if (policies.length > 0) {
      const withSchedule = policies.filter(
        (p: any) => p.review_schedule?.next_review_date,
      );
      const overdue = withSchedule.filter(
        (p: any) => new Date(p.review_schedule.next_review_date) < now,
      );
      const dueSoon = withSchedule.filter((p: any) => {
        const d = new Date(p.review_schedule.next_review_date);
        return d >= now && d <= in30Days;
      });

      const status: ShowMeStep["status"] =
        overdue.length > 0
          ? "blocked"
          : dueSoon.length > 0
            ? "in_progress"
            : "complete";

      built.push({
        id: "policies",
        title: "Statutory Policies",
        description:
          overdue.length > 0
            ? `${overdue.length} polic${overdue.length !== 1 ? "ies" : "y"} overdue for review`
            : dueSoon.length > 0
              ? `${dueSoon.length} polic${dueSoon.length !== 1 ? "ies" : "y"} due for review soon`
              : `${policies.length} polic${policies.length !== 1 ? "ies" : "y"} tracked — all current`,
        icon: FileText,
        status,
        href: "/dashboard/compliance/policies",
        count: policies.length,
        detail: {
          whatGoodLooksLike:
            "All statutory policies are reviewed within their scheduled cycle and approved by the governing body.",
          whatIsMissing:
            overdue.length > 0
              ? `${overdue.length} polic${overdue.length !== 1 ? "ies are" : "y is"} overdue: ${overdue
                  .slice(0, 3)
                  .map((p: any) => p.title)
                  .join(
                    ", ",
                  )}${overdue.length > 3 ? ` and ${overdue.length - 3} more` : ""}`
              : dueSoon.length > 0
                ? `${dueSoon.length} polic${dueSoon.length !== 1 ? "ies" : "y"} due for review within 30 days`
                : undefined,
          nextAction:
            overdue.length > 0
              ? "Review overdue policies"
              : dueSoon.length > 0
                ? "Review upcoming policies"
                : "View all policies",
          nextActionHref: "/dashboard/compliance/policies",
        },
      });
    }

    // === TRAINING ===
    const completions = trainingData?.completions || [];
    if (completions.length > 0) {
      const expired = completions.filter(
        (c: any) => c.expires_at && new Date(c.expires_at) < now,
      );
      const expiringSoon = completions.filter((c: any) => {
        if (!c.expires_at) return false;
        const d = new Date(c.expires_at);
        return d >= now && d <= in30Days;
      });

      const status: ShowMeStep["status"] =
        expired.length > 0
          ? "blocked"
          : expiringSoon.length > 0
            ? "in_progress"
            : "complete";

      built.push({
        id: "training",
        title: "Training Compliance",
        description:
          expired.length > 0
            ? `${expired.length} training record${expired.length !== 1 ? "s" : ""} expired`
            : expiringSoon.length > 0
              ? `${expiringSoon.length} expiring within 30 days`
              : `${completions.length} training record${completions.length !== 1 ? "s" : ""} — all current`,
        icon: GraduationCap,
        status,
        href: "/dashboard/compliance/training",
        count: completions.length,
        detail: {
          whatGoodLooksLike:
            "All staff training is current. No expired certificates. Renewal dates are tracked.",
          whatIsMissing:
            expired.length > 0
              ? `${expired.length} expired: ${expired
                  .slice(0, 3)
                  .map(
                    (c: any) =>
                      c.course?.title || c.course_name || "Unknown course",
                  )
                  .join(
                    ", ",
                  )}${expired.length > 3 ? ` and ${expired.length - 3} more` : ""}`
              : expiringSoon.length > 0
                ? `${expiringSoon.length} certificate${expiringSoon.length !== 1 ? "s" : ""} expiring within 30 days`
                : undefined,
          nextAction:
            expired.length > 0
              ? "Renew expired training"
              : "View training matrix",
          nextActionHref: "/dashboard/compliance/training",
        },
      });
    }

    // === SCR ===
    const scrEntries = scrData?.entries || scrData?.data || [];
    if (scrEntries.length > 0) {
      const activeEntries = scrEntries.filter(
        (e: any) => e.status === "active",
      );
      const missingDbs = activeEntries.filter(
        (e: any) => !e.dbs_certificate_number && !e.dbs_date,
      );
      const missingIdentity = activeEntries.filter(
        (e: any) => !e.identity_verified,
      );
      const totalMissing = missingDbs.length + missingIdentity.length;

      const status: ShowMeStep["status"] =
        missingDbs.length > 0
          ? "blocked"
          : missingIdentity.length > 0
            ? "in_progress"
            : "complete";

      built.push({
        id: "scr",
        title: "Single Central Record",
        description:
          totalMissing > 0
            ? `${totalMissing} check${totalMissing !== 1 ? "s" : ""} incomplete across ${activeEntries.length} staff`
            : `${activeEntries.length} staff — all checks complete`,
        icon: ClipboardList,
        status,
        href: "/dashboard/compliance/scr",
        count: activeEntries.length,
        detail: {
          whatGoodLooksLike:
            "Every active staff member has a current DBS, verified identity, right to work, and all required pre-employment checks.",
          whatIsMissing:
            missingDbs.length > 0
              ? `${missingDbs.length} staff without DBS records`
              : missingIdentity.length > 0
                ? `${missingIdentity.length} staff without identity verification`
                : undefined,
          nextAction: totalMissing > 0 ? "Complete missing checks" : "View SCR",
          nextActionHref: "/dashboard/compliance/scr",
        },
      });
    }

    // === COMPLAINTS ===
    const complaints = complaintsData?.complaints || complaintsData?.data || [];
    if (complaints.length > 0) {
      const open = complaints.filter((c: any) => c.status === "open");

      built.push({
        id: "complaints",
        title: "Complaints",
        description:
          open.length > 0
            ? `${open.length} open complaint${open.length !== 1 ? "s" : ""}`
            : `${complaints.length} complaint${complaints.length !== 1 ? "s" : ""} — all resolved`,
        icon: Mail,
        status: open.length > 0 ? "in_progress" : "complete",
        href: "/dashboard/compliance/complaints",
        count: complaints.length,
        detail: {
          whatGoodLooksLike:
            "All complaints are resolved within the 3-stage procedure. No open complaints outstanding.",
          whatIsMissing:
            open.length > 0
              ? `${open.length} complaint${open.length !== 1 ? "s" : ""} still open — ${open.filter((c: any) => c.current_stage === "stage_3").length > 0 ? "including governor panel stage" : open[0]?.current_stage?.replace("_", " ")}`
              : undefined,
          nextAction:
            open.length > 0
              ? "Review open complaints"
              : "View complaint history",
          nextActionHref: "/dashboard/compliance/complaints",
        },
      });
    }

    // === ESTATES STATUTORY COMPLIANCE ===
    const domains = estatesData?.domains || [];
    if (domains.length > 0) {
      const totalChecks = domains.reduce(
        (s: number, d: any) => s + (d.totalChecks || 0),
        0,
      );
      const completedChecks = domains.reduce(
        (s: number, d: any) => s + (d.completedChecks || 0),
        0,
      );
      const overdueChecks = domains.reduce(
        (s: number, d: any) => s + (d.overdueChecks || 0),
        0,
      );
      const criticalDomains = domains.filter(
        (d: any) => d.status === "critical",
      );

      const status: ShowMeStep["status"] =
        criticalDomains.length > 0
          ? "blocked"
          : overdueChecks > 0
            ? "in_progress"
            : "complete";

      built.push({
        id: "estates-compliance",
        title: "Estates Statutory Compliance",
        description:
          criticalDomains.length > 0
            ? `${criticalDomains.length} domain${criticalDomains.length !== 1 ? "s" : ""} critical — ${overdueChecks} overdue check${overdueChecks !== 1 ? "s" : ""}`
            : overdueChecks > 0
              ? `${overdueChecks} overdue check${overdueChecks !== 1 ? "s" : ""} of ${totalChecks}`
              : `${completedChecks}/${totalChecks} checks complete`,
        icon: Building2,
        status,
        href: "/estates-compliance",
        count: completedChecks,
        detail: {
          whatGoodLooksLike:
            "All statutory checks (fire, asbestos, legionella, electrical, gas) are current with evidence uploaded.",
          whatIsMissing:
            criticalDomains.length > 0
              ? `Critical domains: ${criticalDomains.map((d: any) => d.domain).join(", ")}`
              : overdueChecks > 0
                ? `${overdueChecks} check${overdueChecks !== 1 ? "s are" : " is"} overdue`
                : undefined,
          nextAction:
            overdueChecks > 0
              ? "Review overdue checks"
              : "View compliance dashboard",
          nextActionHref: "/estates-compliance",
        },
      });
    }

    // === COMPLIANCE RISKS ===
    const risks = riskData?.risks || [];
    if (risks.length > 0) {
      const aboveAppetite = risks.filter((r: any) => r.above_appetite);
      const highRisks = risks.filter(
        (r: any) => (r.effective_residual_score || 0) >= 15,
      );

      built.push({
        id: "compliance-risks",
        title: "Compliance Risks",
        description:
          aboveAppetite.length > 0
            ? `${aboveAppetite.length} risk${aboveAppetite.length !== 1 ? "s" : ""} above appetite`
            : `${risks.length} compliance risk${risks.length !== 1 ? "s" : ""} — within appetite`,
        icon: AlertTriangle,
        status:
          aboveAppetite.length > 0
            ? "blocked"
            : highRisks.length > 0
              ? "in_progress"
              : "complete",
        href: "/dashboard/risk",
        count: risks.length,
        detail: {
          whatGoodLooksLike:
            "All legal and compliance risks are identified, scored, and have active mitigations. None above appetite threshold.",
          whatIsMissing:
            aboveAppetite.length > 0
              ? `${aboveAppetite.length} risk${aboveAppetite.length !== 1 ? "s" : ""} above appetite — board escalation may be required`
              : highRisks.length > 0
                ? `${highRisks.length} high-scoring risk${highRisks.length !== 1 ? "s" : ""} — review mitigations`
                : undefined,
          nextAction:
            aboveAppetite.length > 0
              ? "Review risks above appetite"
              : "View risk register",
          nextActionHref: "/dashboard/risk",
        },
      });
    }

    setSteps(built);
    setLoading(false);
  }, [organizationId, organization]);

  useEffect(() => {
    checkCompliance();
  }, [checkCompliance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
        <Shield className="w-12 h-12 text-zinc-300 mb-4" />
        <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
          No compliance data yet
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md">
          Start by creating policies, tracking training, or setting up your
          Single Central Record. This view will show your compliance posture
          once you have data.
        </p>
        <a
          href="/dashboard/compliance"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          <Shield className="w-4 h-4" />
          Go to Compliance Hub
        </a>
      </div>
    );
  }

  const blockedCount = steps.filter((s) => s.status === "blocked").length;
  const inProgressCount = steps.filter(
    (s) => s.status === "in_progress",
  ).length;
  const completeCount = steps.filter((s) => s.status === "complete").length;

  const summaryParts = [];
  if (blockedCount > 0)
    summaryParts.push(
      `${blockedCount} need${blockedCount === 1 ? "s" : ""} attention`,
    );
  if (inProgressCount > 0) summaryParts.push(`${inProgressCount} in progress`);
  if (completeCount > 0) summaryParts.push(`${completeCount} compliant`);

  return (
    <ShowMeShell
      title={`Show Me: Compliance — ${organization?.name || "Your School"}`}
      subtitle={summaryParts.join(" · ") || "Checking compliance status..."}
      steps={steps}
      onAskEd={(step) => {
        const prompt =
          step.status === "blocked"
            ? `Our ${step.title.toLowerCase()} needs urgent attention. ${step.detail?.whatIsMissing || ""} What should we do?`
            : step.status === "in_progress"
              ? `Our ${step.title.toLowerCase()} has some items to review. ${step.detail?.whatIsMissing || ""} What are the priorities?`
              : `Our ${step.title.toLowerCase()} looks compliant. Is there anything we should check or improve?`;
        openChatWith(prompt);
      }}
    />
  );
}
