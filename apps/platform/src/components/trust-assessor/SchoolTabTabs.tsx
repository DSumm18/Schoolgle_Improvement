"use client";

/**
 * SchoolTabTabs — 5-tab navigation shell for the Trust Assessor school detail view.
 *
 * Tabs: Overview | Forensic Review | Cohort Pathway | Pupil Level | Evidence
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
  { id: "forensic",  label: "Forensic Review",  description: "Research-backed verdict" },
  { id: "cohort",    label: "Cohort Pathway",   description: "Year-group progression" },
  { id: "pupil",     label: "Pupil Level",      description: "Individual pupil detail" },
  { id: "evidence",  label: "Evidence",         description: "Timeline & sources" },
];

interface SchoolTabTabsProps {
  school: string;
  /** Render prop: receives the currently active tab ID */
  children: (activeTab: SchoolTabId) => React.ReactNode;
}

export function SchoolTabTabs({ school, children }: SchoolTabTabsProps) {
  const [activeTab, setActiveTab] = useState<SchoolTabId>(() => {
    if (typeof window === "undefined") return "overview";
    return (localStorage.getItem(`ta-active-tab-${school}`) as SchoolTabId) ?? "overview";
  });

  // Persist active tab
  useEffect(() => {
    localStorage.setItem(`ta-active-tab-${school}`, activeTab);
  }, [activeTab, school]);

  return (
    <div className="space-y-0">
      {/* Tab bar */}
      <div className="border-b border-border bg-card sticky top-0 z-20">
        <nav className="-mb-px flex gap-0 overflow-x-auto px-6 scrollbar-hide" aria-label="School report tabs">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-shrink-0 px-4 py-3.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? "border-sky-500 text-sky-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId={`tab-indicator-${school}`}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-t-full"
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
