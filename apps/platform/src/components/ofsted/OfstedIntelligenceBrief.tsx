"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Database,
  HelpCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { clientAuthFetch } from "@/lib/auth/client-auth-fetch";
import type {
  OfstedInspectionIntelligenceBrief,
  OfstedIntelligenceTone,
} from "@/lib/ofsted-readiness/intelligence-brief";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TONE_CLASS: Record<OfstedIntelligenceTone, string> = {
  red: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/25 dark:text-rose-200",
  amber:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/25 dark:text-amber-200",
  green:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/25 dark:text-emerald-200",
  blue: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/70 dark:bg-blue-950/25 dark:text-blue-200",
};

interface OfstedIntelligenceBriefProps {
  organizationId?: string;
}

interface AssessmentEvidenceSummary {
  source: string;
  caveat: string;
  batchCount: number;
  eventCount: number;
  pupilCount: number;
  latestSourceLabel: string | null;
  latestAssessmentPeriod: string | null;
  latestAcademicYearStart: number | null;
}

export default function OfstedIntelligenceBrief({
  organizationId,
}: OfstedIntelligenceBriefProps) {
  const [brief, setBrief] = useState<OfstedInspectionIntelligenceBrief | null>(
    null,
  );
  const [assessmentEvidence, setAssessmentEvidence] =
    useState<AssessmentEvidenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBrief = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await clientAuthFetch(
        supabase,
        `/api/ofsted/intelligence-brief?organizationId=${encodeURIComponent(
          organizationId,
        )}`,
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to load intelligence brief");
      }

      setBrief(payload.brief);

      const readinessResponse = await clientAuthFetch(
        supabase,
        `/api/ofsted/readiness?organizationId=${encodeURIComponent(
          organizationId,
        )}`,
      );
      const readinessPayload = await readinessResponse.json().catch(() => ({}));
      setAssessmentEvidence(
        readinessResponse.ok ? readinessPayload.assessmentEvidence ?? null : null,
      );
    } catch (err) {
      console.error("[Ofsted Intelligence Brief] Load failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not load inspection intelligence",
      );
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadBrief();
  }, [loadBrief]);

  if (loading) {
    return (
      <Card className="border-border/70 bg-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/70 dark:bg-amber-950/20">
        <CardContent className="flex items-start gap-3 p-5 text-sm text-amber-900 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Inspection intelligence unavailable</p>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!brief) return null;

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
              <Database className="h-4 w-4" />
              Inspection intelligence
            </div>
            <CardTitle className="mt-2 text-2xl">{brief.title}</CardTitle>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              DfE, Trust Assessor, School Improvement, evidence and findings
              are shown with explicit source labels before they influence
              Ofsted actions.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadBrief}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 lg:grid-cols-3">
          {brief.signals.map((signal) => (
            <div
              key={signal.key}
              className={`rounded-xl border p-4 ${TONE_CLASS[signal.tone]}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
                  {signal.label}
                </p>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-950/40 dark:text-slate-200">
                  {signal.source}
                </span>
              </div>
              <div className="mt-2 text-2xl font-black">{signal.value}</div>
              <p className="mt-2 text-sm leading-relaxed">{signal.explanation}</p>
            </div>
          ))}
        </div>

        {assessmentEvidence && assessmentEvidence.eventCount > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-blue-950 dark:border-blue-900/70 dark:bg-blue-950/25 dark:text-blue-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">
                  Assessment Intelligence Evidence
                </p>
                <h3 className="mt-1 text-lg font-bold">
                  {assessmentEvidence.eventCount} teacher-locked judgements from{" "}
                  {assessmentEvidence.batchCount} snapshot
                  {assessmentEvidence.batchCount === 1 ? "" : "s"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed">
                  Ofsted Readiness can now cite live classroom assessment evidence
                  alongside DfE outcomes, Trust Assessor analysis and evidence
                  findings.
                </p>
              </div>
              <div className="rounded-lg bg-white/70 px-3 py-2 text-sm font-semibold text-blue-800 dark:bg-slate-950/40 dark:text-blue-100">
                {assessmentEvidence.pupilCount} pupils
              </div>
            </div>
            <div className="mt-3 space-y-1 border-t border-blue-200/80 pt-3 text-xs dark:border-blue-900/70">
              <p>
                <span className="font-semibold">Source:</span>{" "}
                {assessmentEvidence.latestSourceLabel ??
                  "Teacher-locked Assessment Intelligence snapshot"}
              </p>
              <p>
                <span className="font-semibold">Tables:</span>{" "}
                {assessmentEvidence.source}
              </p>
              <p>
                <span className="font-semibold">Caveat:</span>{" "}
                {assessmentEvidence.caveat}
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <BriefSection
            icon={BarChart3}
            title="Trust Patterns"
            items={brief.trustPatterns}
            empty="No trust-level pattern has been detected from the scoped schools yet."
          />
          <BriefSection
            icon={AlertTriangle}
            title="Data Quality"
            items={brief.dataQualityWarnings}
            empty="No data quality warnings from the current source mix."
          />
          <BriefSection
            icon={HelpCircle}
            title="Inspection Questions"
            items={brief.inspectionQuestions}
            empty="No priority inspection questions generated from current signals."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold text-foreground">Sources used:</span>
          {brief.sourcesUsed.length === 0 ? (
            <span>No live sources available yet</span>
          ) : (
            brief.sourcesUsed.map((source) => (
              <span
                key={source}
                className="rounded-full border border-border bg-background px-2.5 py-1"
              >
                {source}
              </span>
            ))
          )}
          <span className="ml-auto">
            Active findings: {brief.findingsSummary.active} | Critical:{" "}
            {brief.findingsSummary.critical} | High: {brief.findingsSummary.high}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function BriefSection({
  icon: Icon,
  title,
  items,
  empty,
}: {
  icon: LucideIcon;
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-4">
      <div className="mb-3 flex items-center gap-2 font-semibold">
        <Icon className="h-4 w-4 text-sky-600" />
        {title}
      </div>
      {items.length === 0 ? (
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          {empty}
        </p>
      ) : (
        <ul className="space-y-2 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
