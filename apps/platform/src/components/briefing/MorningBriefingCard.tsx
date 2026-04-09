"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  ChevronDown,
  ChevronUp,
  Shield,
  Building2,
  Users,
  Scale,
  PoundSterling,
  GraduationCap,
  Search,
  Volume2,
  Clock,
  Loader2,
} from "lucide-react";

interface BriefSection {
  rag: "green" | "amber" | "red";
  count: number;
  items: Array<{ title: string; priority: string; dueDate?: string }>;
  summary: string;
}

interface BriefData {
  id: string;
  headline: string;
  sections: Record<string, BriefSection>;
  script_text: string;
  audio_url: string | null;
  generated_at: string;
}

const sectionMeta: Record<string, { label: string; icon: React.ElementType }> = {
  safeguarding: { label: "Safeguarding", icon: Shield },
  estates: { label: "Estates", icon: Building2 },
  staffing: { label: "Staffing", icon: Users },
  governance: { label: "Governance", icon: Scale },
  finance: { label: "Finance", icon: PoundSterling },
  teaching: { label: "Teaching", icon: GraduationCap },
  ofsted: { label: "Ofsted", icon: Search },
};

const ragDot: Record<string, string> = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MorningBriefingCard({ organizationId }: { organizationId: string | null }) {
  const [expanded, setExpanded] = useState(false);

  const { data, error, isLoading } = useSWR<{ data: BriefData }>(
    organizationId ? "/api/morning-brief/latest" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  const brief = data?.data;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
          <span className="text-sm text-slate-500">Loading morning briefing...</span>
        </div>
      </div>
    );
  }

  if (error || !brief) {
    return null; // Don't show card if no briefing available
  }

  const activeSections = Object.entries(brief.sections).filter(
    ([, s]) => !s.summary.includes("not yet connected") && !s.summary.includes("No data available"),
  );

  const generatedTime = new Date(brief.generated_at).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-cyan-200/60 dark:border-cyan-800/40 bg-gradient-to-br from-cyan-50/50 to-blue-50/50 dark:from-cyan-950/20 dark:to-blue-950/20 overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-600 dark:text-cyan-400">
            <Sun size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Morning Briefing
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock size={12} />
              <span>Generated at {generatedTime}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio play button — disabled in Phase 1 */}
          <button
            disabled
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
            title="Audio coming soon"
          >
            <Volume2 size={16} />
          </button>
        </div>
      </div>

      {/* Script preview */}
      <div className="px-6 pb-3">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {expanded
            ? brief.script_text
            : brief.script_text.slice(0, 200) + (brief.script_text.length > 200 ? "..." : "")}
        </p>
      </div>

      {/* RAG dots row */}
      <div className="px-6 pb-3 flex flex-wrap gap-3">
        {activeSections.map(([key, section]) => {
          const meta = sectionMeta[key];
          if (!meta) return null;
          const Icon = meta.icon;
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className={`w-2 h-2 rounded-full ${ragDot[section.rag]}`} />
              <Icon size={12} />
              <span>{meta.label}</span>
            </div>
          );
        })}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-3 flex items-center justify-center gap-1 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-900/20 transition-colors border-t border-cyan-200/40 dark:border-cyan-800/30"
      >
        {expanded ? (
          <>
            Show less <ChevronUp size={14} />
          </>
        ) : (
          <>
            Read full briefing <ChevronDown size={14} />
          </>
        )}
      </button>

      {/* Expanded section details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4 space-y-2">
              {activeSections.map(([key, section]) => {
                const meta = sectionMeta[key];
                if (!meta) return null;
                const Icon = meta.icon;
                const rag = ragDot[section.rag];

                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/60 dark:bg-slate-900/40 border border-slate-200/40 dark:border-slate-800/40"
                  >
                    <div className="mt-0.5">
                      <span className={`block w-2.5 h-2.5 rounded-full ${rag}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon size={14} className="text-slate-500" />
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {meta.label}
                        </span>
                        {section.count > 0 && (
                          <span className="text-xs text-slate-500">({section.count})</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {section.summary}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
