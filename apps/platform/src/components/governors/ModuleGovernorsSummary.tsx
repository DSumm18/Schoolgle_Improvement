"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Printer,
} from "lucide-react";

export interface ModuleGovernorsSummaryProps {
  moduleName: string;
  moduleColor: string;
  moduleIcon: React.ReactNode;
  ragStatus: "green" | "amber" | "red";
  keyMetrics: {
    label: string;
    value: string;
    trend?: "up" | "down" | "stable";
  }[];
  keyPointsForGovernors: string[];
  highlights?: string[];
  concerns?: string[];
  dataAsOf?: string;
}

const RAG_CONFIG = {
  green: {
    label: "On Track",
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-300",
    ring: "ring-emerald-500",
    dot: "bg-emerald-500",
  },
  amber: {
    label: "Monitor",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500",
    dot: "bg-amber-500",
  },
  red: {
    label: "Action Required",
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-700 dark:text-red-300",
    ring: "ring-red-500",
    dot: "bg-red-500",
  },
};

function TrendIcon({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (trend === "up")
    return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
  if (trend === "down")
    return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  if (trend === "stable")
    return <Minus className="h-3.5 w-3.5 text-gray-400" />;
  return null;
}

function buildClipboardText(props: ModuleGovernorsSummaryProps): string {
  const lines: string[] = [];
  lines.push(`${props.moduleName} - Governors Summary`);
  lines.push(`RAG Status: ${RAG_CONFIG[props.ragStatus].label.toUpperCase()}`);
  if (props.dataAsOf) lines.push(`Data as of: ${props.dataAsOf}`);
  lines.push("");

  lines.push("Key Metrics:");
  props.keyMetrics.forEach((m) => {
    const arrow = m.trend === "up" ? " ^" : m.trend === "down" ? " v" : "";
    lines.push(`  - ${m.label}: ${m.value}${arrow}`);
  });
  lines.push("");

  lines.push("Key Points for Governors:");
  props.keyPointsForGovernors.forEach((p, i) => {
    lines.push(`  ${i + 1}. ${p}`);
  });

  if (props.highlights?.length) {
    lines.push("");
    lines.push("Highlights:");
    props.highlights.forEach((h) => lines.push(`  + ${h}`));
  }

  if (props.concerns?.length) {
    lines.push("");
    lines.push("Concerns:");
    props.concerns.forEach((c) => lines.push(`  ! ${c}`));
  }

  return lines.join("\n");
}

export default function ModuleGovernorsSummary(
  props: ModuleGovernorsSummaryProps,
) {
  const {
    moduleName,
    moduleColor,
    moduleIcon,
    ragStatus,
    keyMetrics,
    keyPointsForGovernors,
    highlights,
    concerns,
    dataAsOf,
  } = props;

  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const rag = RAG_CONFIG[ragStatus];

  const handleCopy = async () => {
    const text = buildClipboardText(props);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden print:shadow-none print:border-gray-300"
      style={{ borderLeftColor: moduleColor, borderLeftWidth: 4 }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors print:hover:bg-transparent"
      >
        <div className="flex items-center gap-3">
          <span style={{ color: moduleColor }}>{moduleIcon}</span>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {moduleName} &mdash; Governors Summary
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${rag.bg} ${rag.text}`}
          >
            <span className={`h-2 w-2 rounded-full ${rag.dot}`} />
            {rag.label}
          </span>
        </div>
        <span className="text-gray-400">
          {expanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </span>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {keyMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-md border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2.5"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                      {metric.label}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {metric.value}
                      </span>
                      <TrendIcon trend={metric.trend} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Key Points */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Key Points for Governors
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                  {keyPointsForGovernors.map((point, i) => (
                    <li key={i} className="leading-snug">
                      {point}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Highlights & Concerns side by side */}
              {(highlights?.length || concerns?.length) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {highlights && highlights.length > 0 && (
                    <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2.5">
                      <h4 className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Highlights
                      </h4>
                      <ul className="space-y-1 text-sm text-emerald-700 dark:text-emerald-400">
                        {highlights.map((h, i) => (
                          <li key={i} className="leading-snug">
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {concerns && concerns.length > 0 && (
                    <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2.5">
                      <h4 className="flex items-center gap-1.5 text-sm font-medium text-red-700 dark:text-red-300 mb-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        Concerns
                      </h4>
                      <ul className="space-y-1 text-sm text-red-700 dark:text-red-400">
                        {concerns.map((c, i) => (
                          <li key={i} className="leading-snug">
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                {dataAsOf && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Last updated: {dataAsOf}
                  </p>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors print:hidden"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print
                  </button>
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white transition-colors print:hidden"
                    style={{
                      backgroundColor: copied ? "#10b981" : moduleColor,
                    }}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy to Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
