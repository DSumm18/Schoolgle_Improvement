"use client";

import {
  AlertTriangle,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
} from "lucide-react";
import type { ComplianceBriefing } from "@/lib/estates-compliance/compliance-briefing";

function riskClasses(score: number) {
  if (score >= 5) {
    return "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800";
  }
  if (score >= 4) {
    return "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800";
  }
  if (score >= 3) {
    return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800";
  }
  if (score >= 2) {
    return "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800";
  }
  return "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800";
}

function complianceCopy(status: ComplianceBriefing["complianceStatus"]) {
  switch (status) {
    case "compliant":
      return "Compliant now";
    case "due_soon":
      return "Due soon";
    case "overdue":
      return "Overdue";
    case "in_progress":
      return "In progress";
    case "not_applicable":
      return "Not applicable";
    case "no_record":
      return "No record yet";
  }
}

function formatShortDate(value?: string) {
  if (!value) return "—";
  const date = value.split("T")[0];
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

interface ComplianceCheckBriefingProps {
  briefing: ComplianceBriefing;
}

export function ComplianceCheckBriefing({
  briefing,
}: ComplianceCheckBriefingProps) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 dark:text-teal-400" />
            Compliance briefing
          </h2>
          <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quick read for this check: compliance position, risk of drift, and
            what to watch.
          </p>
        </div>
        <div
          className={`rounded-lg border px-3 py-2 min-w-[112px] text-center ${riskClasses(briefing.riskScore)}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide">
            Risk
          </p>
          <p className="text-xl sm:text-2xl font-black leading-none mt-1">
            {briefing.riskScore}/5
          </p>
          <p className="text-xs sm:text-sm font-bold mt-1">{briefing.riskLabel}</p>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 p-2.5 sm:p-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden min-[420px]:inline">Compliance</span>
              <span className="min-[420px]:hidden">State</span>
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {complianceCopy(briefing.complianceStatus)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 p-2.5 sm:p-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Evidence
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 capitalize">
              {briefing.confidence}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 p-2.5 sm:p-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Next due
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-1">
              {formatShortDate(briefing.kpis.nextDue)}
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/60 p-3">
          <p className="text-sm font-semibold text-teal-900 dark:text-teal-200">
            {briefing.summary}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Be mindful of
            </h3>
            <ul className="space-y-2">
              {briefing.keyPoints.map((point) => (
                <li
                  key={point}
                  className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"
                >
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-indigo-500" />
              Ed can help with
            </h3>
            {briefing.edPrompts.length > 0 ? (
              <ul className="space-y-2">
                {briefing.edPrompts.map((prompt) => (
                  <li
                    key={prompt}
                    className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"
                  >
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <span>{prompt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No immediate Ed prompts. Ask Ed for a plain-English summary or
                to create a follow-up action if something changes.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
          <MiniMetric
            label="Open actions"
            value={briefing.kpis.openActions.toString()}
          />
          <MiniMetric
            label="High-risk findings"
            value={briefing.kpis.highRiskFindings.toString()}
          />
          <MiniMetric
            label="Evidence files"
            value={briefing.kpis.evidenceCount.toString()}
          />
          <MiniMetric
            label="Linked assets"
            value={briefing.kpis.linkedAssets.toString()}
          />
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/70">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            Report line
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {briefing.reportLine}
          </p>
        </div>
      </div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/70 px-2 sm:px-3 py-2 min-w-0">
      <p className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-none">
        {value}
      </p>
      <p className="text-[10px] sm:text-xs leading-tight text-gray-500 dark:text-gray-400 mt-1">
        {label}
      </p>
    </div>
  );
}
