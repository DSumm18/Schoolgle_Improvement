"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageCircle, Search, ChevronRight } from "lucide-react";

/**
 * ShowMeStep — a single step in a Show Me process map.
 * Reusable across any Show Me use case (setup, compliance, site, etc.)
 */
export interface ShowMeStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "complete" | "in_progress" | "not_started" | "blocked" | "skippable";
  /** Link to the Schoolgle page where this task is completed */
  href?: string;
  /** Count of items (e.g., "32 staff connected") */
  count?: number;
  /** What the user sees in the detail panel */
  detail?: {
    whatGoodLooksLike: string;
    whatIsMissing?: string;
    nextAction: string;
    nextActionHref: string;
  };
}

interface ShowMeShellProps {
  /** Title shown at the top of the process map */
  title: string;
  /** Subtitle / description */
  subtitle: string;
  /** The steps to display */
  steps: ShowMeStep[];
  /** Callback when user clicks "Ask Ed" for a step */
  onAskEd?: (step: ShowMeStep) => void;
  /** Optional children rendered below the process map */
  children?: React.ReactNode;
}

const STATUS_CONFIG = {
  complete: {
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Complete",
  },
  in_progress: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-300",
    label: "In progress",
  },
  not_started: {
    bg: "bg-zinc-50 dark:bg-zinc-900",
    border: "border-zinc-200 dark:border-zinc-800",
    dot: "bg-zinc-300 dark:bg-zinc-600",
    text: "text-zinc-500 dark:text-zinc-400",
    label: "Not started",
  },
  blocked: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    label: "Needs attention",
  },
  skippable: {
    bg: "bg-zinc-50 dark:bg-zinc-900",
    border: "border-zinc-200 dark:border-zinc-800 border-dashed",
    dot: "bg-zinc-300 dark:bg-zinc-600",
    text: "text-zinc-400 dark:text-zinc-500",
    label: "Optional",
  },
};

export function ShowMeShell({
  title,
  subtitle,
  steps,
  onAskEd,
  children,
}: ShowMeShellProps) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedStep = steps.find((s) => s.id === selectedStepId);
  const completedCount = steps.filter((s) => s.status === "complete").length;
  const progress =
    steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const filteredSteps = searchQuery
    ? steps.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : steps;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left: Process Map (persistent) */}
      <div
        className={`flex flex-col ${
          selectedStep ? "w-1/2 lg:w-3/5" : "w-full"
        } transition-all duration-300 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {subtitle}
          </p>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              {completedCount}/{steps.length}
            </span>
          </div>

          {/* Search */}
          {steps.length > 5 && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter steps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Steps */}
        <div className="flex-1 px-6 py-4 space-y-2">
          {filteredSteps.map((step, index) => {
            const config = STATUS_CONFIG[step.status];
            const Icon = step.icon;
            const isSelected = selectedStepId === step.id;

            return (
              <React.Fragment key={step.id}>
                {/* Connector line */}
                {index > 0 && (
                  <div className="flex justify-center py-0.5">
                    <div
                      className={`w-0.5 h-4 rounded ${
                        steps[index - 1].status === "complete"
                          ? "bg-emerald-300 dark:bg-emerald-700"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      }`}
                    />
                  </div>
                )}

                {/* Step card */}
                <button
                  onClick={() => setSelectedStepId(isSelected ? null : step.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    config.bg
                  } ${config.border} ${
                    isSelected
                      ? "ring-2 ring-blue-500 shadow-md"
                      : "hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Status dot */}
                    <div className="pt-0.5">
                      <div
                        className={`w-3 h-3 rounded-full ${config.dot} ${
                          step.status === "in_progress" ? "animate-pulse" : ""
                        }`}
                      />
                    </div>

                    {/* Icon */}
                    <div className="p-2 rounded-lg bg-white/60 dark:bg-black/20 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {step.title}
                        </h3>
                        <span
                          className={`text-[10px] font-medium ${config.text}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {step.description}
                      </p>
                      {step.count !== undefined && step.count > 0 && (
                        <p
                          className={`text-xs font-medium mt-1 ${config.text}`}
                        >
                          {step.count} connected
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? "rotate-90 text-blue-500" : "text-zinc-300"
                      }`}
                    />
                  </div>
                </button>
              </React.Fragment>
            );
          })}

          {children}
        </div>
      </div>

      {/* Right: Detail Drawer (opens when a step is selected) */}
      <AnimatePresence>
        {selectedStep && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "50%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="flex flex-col bg-zinc-50 dark:bg-zinc-900 overflow-y-auto"
          >
            {/* Drawer header */}
            <div className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    STATUS_CONFIG[selectedStep.status].dot
                  }`}
                />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedStep.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedStepId(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer content */}
            <div className="flex-1 px-6 py-5 space-y-5">
              {/* Status */}
              <div
                className={`rounded-lg p-3 ${STATUS_CONFIG[selectedStep.status].bg} border ${STATUS_CONFIG[selectedStep.status].border}`}
              >
                <p
                  className={`text-sm font-semibold ${STATUS_CONFIG[selectedStep.status].text}`}
                >
                  {STATUS_CONFIG[selectedStep.status].label}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {selectedStep.description}
                </p>
              </div>

              {/* What good looks like */}
              {selectedStep.detail?.whatGoodLooksLike && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    What good looks like
                  </h3>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {selectedStep.detail.whatGoodLooksLike}
                  </p>
                </div>
              )}

              {/* What is missing */}
              {selectedStep.detail?.whatIsMissing &&
                selectedStep.status !== "complete" && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <h3 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-1">
                      What is missing
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {selectedStep.detail.whatIsMissing}
                    </p>
                  </div>
                )}

              {/* Next action */}
              {selectedStep.detail?.nextAction &&
                selectedStep.status !== "complete" && (
                  <a
                    href={selectedStep.detail.nextActionHref}
                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {selectedStep.detail.nextAction}
                      </p>
                      <p className="text-xs text-blue-200 mt-0.5">
                        Opens in Schoolgle — this guide stays visible
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  </a>
                )}

              {/* Go to module (for complete steps) */}
              {selectedStep.href && selectedStep.status === "complete" && (
                <a
                  href={selectedStep.href}
                  className="flex items-center gap-3 w-full p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold">View in Schoolgle</p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </a>
              )}

              {/* Ask Ed */}
              {onAskEd && (
                <button
                  onClick={() => onAskEd(selectedStep)}
                  className="flex items-center gap-2 w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ask Ed about this step
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
