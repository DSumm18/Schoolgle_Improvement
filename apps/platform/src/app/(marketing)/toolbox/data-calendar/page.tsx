"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Database,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  DFE_DATA_SOURCES,
  getDataSummary,
  type DataSource,
} from "@/data/dfe-data-sources";

const QUALITY_CONFIG = {
  good: {
    icon: CheckCircle2,
    color: "#10B981",
    label: "Good",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  partial: {
    icon: AlertTriangle,
    color: "#F59E0B",
    label: "Partial",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  skeleton: {
    icon: AlertTriangle,
    color: "#EF4444",
    label: "Skeleton",
    bg: "bg-red-500/10 border-red-500/20",
  },
  empty: {
    icon: XCircle,
    color: "#6B7280",
    label: "Not Imported",
    bg: "bg-gray-500/10 border-gray-500/20",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  performance: "Academic Performance",
  attendance: "Attendance & Behaviour",
  workforce: "Workforce",
  finance: "Finance",
  send: "SEND",
  ofsted: "Ofsted Inspection",
  demographics: "School Demographics",
};

function SourceCard({ source }: { source: DataSource }) {
  const q = QUALITY_CONFIG[source.quality];
  const Icon = q.icon;

  return (
    <div className={`p-5 rounded-xl border ${q.bg}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon size={14} style={{ color: q.color }} />
            <h3 className="text-sm font-bold text-foreground">{source.name}</h3>
          </div>
          <p className="text-xs text-muted-foreground">{source.description}</p>
        </div>
        <a
          href={source.govUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-foreground/5 transition-colors"
          title="View on GOV.UK"
        >
          <ExternalLink size={12} className="text-muted-foreground" />
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-muted-foreground/60 block">Latest Year</span>
          <span className="font-bold text-foreground">{source.latestYear}</span>
        </div>
        <div>
          <span className="text-muted-foreground/60 block">Records</span>
          <span className="font-bold text-foreground">
            {source.recordCount > 0 ? source.recordCount.toLocaleString() : "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground/60 block">Quality</span>
          <span className="font-bold" style={{ color: q.color }}>
            {q.label}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground/60 block">Storage</span>
          <span className="font-bold text-foreground">{source.storage}</span>
        </div>
      </div>

      {source.notes && (
        <p className="mt-3 text-[10px] text-muted-foreground/60 leading-relaxed border-t border-border/50 pt-2">
          {source.notes}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock size={10} />
          <span>{source.releaseSchedule}</span>
        </div>
        {source.needsUpdate && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">
            <RefreshCw size={8} />
            Needs Update
          </span>
        )}
      </div>
    </div>
  );
}

export default function DataCalendarPage() {
  const [filter, setFilter] = useState<"all" | "needs-update" | "good">("all");
  const summary = getDataSummary();

  const filtered = DFE_DATA_SOURCES.filter((s) => {
    if (filter === "needs-update") return s.needsUpdate;
    if (filter === "good") return s.quality === "good";
    return true;
  });

  // Group by category
  const grouped = filtered.reduce(
    (acc, s) => {
      const cat = s.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {} as Record<string, DataSource[]>,
  );

  // Upcoming releases
  const upcoming = DFE_DATA_SOURCES.filter(
    (s) =>
      s.nextRelease.includes("2026") &&
      !s.nextRelease.includes("Uncertain") &&
      !s.nextRelease.includes("Always"),
  ).sort((a, b) => {
    const monthOrder = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const getMonth = (s: string) => {
      for (let i = 0; i < monthOrder.length; i++) {
        if (s.includes(monthOrder[i])) return i;
      }
      return 99;
    };
    return getMonth(a.nextRelease) - getMonth(b.nextRelease);
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="px-6 py-6 border-b border-border">
        <div className="container mx-auto max-w-6xl">
          <Link
            href="/toolbox"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft size={14} /> Toolbox
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
              <Database size={22} className="text-sky-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground">
                DfE Data Calendar
              </h1>
              <p className="text-muted-foreground">
                Every dataset powering Schoolgle tools — where it comes from,
                when it refreshes, and what needs attention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary KPIs */}
      <section className="px-6 py-6 border-b border-border bg-foreground/[0.02]">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-card/50 border border-border text-center">
              <div className="text-2xl font-black text-foreground">
                {summary.total}
              </div>
              <div className="text-xs text-muted-foreground">Data Sources</div>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
              <div className="text-2xl font-black text-emerald-500">
                {summary.good}
              </div>
              <div className="text-xs text-muted-foreground">Good Quality</div>
            </div>
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-center">
              <div className="text-2xl font-black text-red-500">
                {summary.needsUpdate}
              </div>
              <div className="text-xs text-muted-foreground">Need Update</div>
            </div>
            <div className="p-4 rounded-xl bg-card/50 border border-border text-center">
              <div className="text-2xl font-black text-foreground">
                {summary.totalRecords.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Records</div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming releases */}
      <section className="px-6 py-6 border-b border-border">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-sky-500" /> Upcoming Data
            Releases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-card/50 border border-border"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Calendar size={12} className="text-sky-500" />
                  <span className="text-xs font-bold text-sky-500">
                    {s.nextRelease}
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground">{s.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {s.releaseSchedule}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter */}
      <section className="px-6 py-4 border-b border-border bg-foreground/[0.02]">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-1 bg-foreground/5 rounded-full p-0.5 w-fit">
            {(
              [
                ["all", "All Sources"],
                ["needs-update", "Needs Update"],
                ["good", "Good Quality"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setFilter(v)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${filter === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Data sources by category */}
      <section className="px-6 py-8">
        <div className="container mx-auto max-w-6xl space-y-10">
          {Object.entries(grouped).map(([category, sources]) => (
            <div key={category}>
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider mb-4">
                {CATEGORY_LABELS[category] || category}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sources.map((source, i) => (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <SourceCard source={source} />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Action plan */}
      <section className="px-6 py-8 border-t border-border bg-foreground/[0.02]">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-lg font-black text-foreground mb-4">
            Priority Actions
          </h2>
          <div className="space-y-3">
            {[
              {
                priority: "P1",
                action:
                  "Re-import KS2 with actual values from EES (2024-25 revised)",
                impact:
                  "Powers school-level attainment comparisons for all primary schools",
                color: "#EF4444",
              },
              {
                priority: "P1",
                action:
                  "Import KS4 data from EES (2024-25, published Oct 2025)",
                impact:
                  "Enables secondary school performance analysis — Attainment 8, % grade 5+ in English & maths",
                color: "#EF4444",
              },
              {
                priority: "P1",
                action: "Import EHCP/SEND data from EES (2025)",
                impact:
                  "Powers SEND Funding Explorer and EHCP Readiness tools with real LA data",
                color: "#EF4444",
              },
              {
                priority: "P2",
                action: "Re-import workforce data with actual values (2024)",
                impact:
                  "Enables Workforce Calculator with real pupil:teacher ratios",
                color: "#F59E0B",
              },
              {
                priority: "P2",
                action: "Import school financial data (CFR 2024-25)",
                impact:
                  "Real budget comparisons for Budget Calculator and NI Cost tools",
                color: "#F59E0B",
              },
              {
                priority: "P3",
                action: "Refresh GIAS school directory",
                impact:
                  "Latest head teachers, school status changes, new academies",
                color: "#3B82F6",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border border-border"
              >
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black text-white flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                >
                  {item.priority}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {item.action}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data source links */}
      <section className="px-6 py-8 border-t border-border">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-sm font-bold text-foreground mb-3">
            GOV.UK Data Sources
          </h3>
          <div className="text-xs text-muted-foreground space-y-1.5">
            <p>
              All data is sourced from official DfE publications under the Open
              Government Licence v3.0.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              {[
                {
                  label: "Explore Education Statistics",
                  url: "https://explore-education-statistics.service.gov.uk/",
                },
                {
                  label: "Get Information About Schools",
                  url: "https://get-information-schools.service.gov.uk/",
                },
                {
                  label: "Compare School Performance",
                  url: "https://www.compare-school-performance.service.gov.uk/",
                },
                {
                  label: "Financial Benchmarking Tool",
                  url: "https://financial-benchmarking-and-insights-tool.education.gov.uk/",
                },
              ].map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors text-foreground"
                >
                  {link.label} <ExternalLink size={10} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
