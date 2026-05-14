"use client";

/**
 * SchoolTabTabs — 5-tab navigation shell for the Trust Assessor school detail view.
 *
 * Tabs: Overview | DfE Review | Cohort & Gaps | Pupil Data | Evidence
 *
 * Active tab is persisted to localStorage keyed by `ta-active-tab-{school}` so
 * refreshing the page returns the user to the same tab.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type SchoolTabId = "overview" | "forensic" | "cohort" | "pupil" | "evidence";

interface Tab {
  id: SchoolTabId;
  label: string;
  description: string;
}

const TABS: Tab[] = [
  { id: "overview",  label: "Overview",        description: "Governor-ready summary" },
  { id: "forensic",  label: "DfE Review",      description: "Validated DfE comparison" },
  { id: "cohort",    label: "Cohort & Gaps",   description: "Year-group and disadvantage analysis" },
  { id: "pupil",     label: "Pupil Data",      description: "Individual pupil detail" },
  { id: "evidence",  label: "Evidence",        description: "Timeline & sources" },
];

interface SchoolTabTabsProps {
  school: string;
  /** Render prop: receives the currently active tab ID */
  children: (activeTab: SchoolTabId) => React.ReactNode;
}

export function SchoolTabTabs({ school, children }: SchoolTabTabsProps) {
  const [activeTab, setActiveTab] = useState<SchoolTabId>(() => {
    if (typeof window === "undefined") return "overview";
    const storedTab = localStorage.getItem(`ta-active-tab-${school}`) as SchoolTabId | null;
    return TABS.some((tab) => tab.id === storedTab) ? storedTab : "overview";
  });

  // Persist active tab
  useEffect(() => {
    localStorage.setItem(`ta-active-tab-${school}`, activeTab);
  }, [activeTab, school]);

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="sticky top-0 z-20 rounded-2xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">Report Sections</div>
            <div className="text-xs text-muted-foreground">Switch between the main parts of this school review</div>
          </div>
          <div className="hidden rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700 dark:bg-sky-500/10 dark:text-sky-300 sm:block">
            {TABS.find((tab) => tab.id === activeTab)?.label}
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1 scrollbar-hide" aria-label="School report tabs">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-card text-sky-600 shadow-sm ring-1 ring-border dark:text-sky-300"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                }`}
                aria-current={isActive ? "page" : undefined}
                title={tab.description}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId={`tab-indicator-${school}`}
                    className="absolute inset-x-4 -bottom-1 h-0.5 rounded-full bg-sky-500"
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {children(activeTab)}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
