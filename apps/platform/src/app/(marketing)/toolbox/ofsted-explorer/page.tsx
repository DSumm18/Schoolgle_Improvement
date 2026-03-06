"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  ChevronDown,
  ExternalLink,
  Info,
  Mail,
  Search,
  Shield,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

/* ─── Types ─── */

interface GradeData {
  total: number;
  outstanding: number;
  outstanding_pct: number;
  good: number;
  good_pct: number;
  requires_improvement: number;
  ri_pct: number;
  inadequate: number;
  inadequate_pct: number;
  good_or_outstanding_pct: number;
}

interface TrendYear {
  total: number;
  good_plus_pct: number;
  outstanding_pct: number;
  ri_pct: number;
  inadequate_pct: number;
}

interface SafeguardingData {
  effective: number;
  not_effective: number;
  total: number;
  effective_pct: number;
}

interface NationalData {
  all_time: GradeData;
  recent: GradeData;
  recent_years: string[];
  trends: Record<string, TrendYear>;
  deprivation: Record<string, GradeData>;
  safeguarding: { all_time: SafeguardingData; recent: SafeguardingData };
  sub_grades: Record<string, GradeData>;
  la_count: number;
  school_count: number;
}

interface RegionData extends GradeData {
  phases: Record<string, GradeData>;
  trends: Record<string, TrendYear>;
}

interface LAData extends GradeData {
  region: string;
  phases: Record<string, GradeData>;
  trends: Record<string, TrendYear>;
  sub_grades: Record<string, GradeData>;
  deprivation: Record<string, GradeData>;
  safeguarding: SafeguardingData | null;
}

interface LatestData {
  as_at: string;
  source: string;
  source_url: string;
  total_schools: number;
  graded_schools: number;
  not_judged_schools: number;
  national: GradeData;
  phases: Record<string, GradeData>;
  safeguarding: { effective_pct: number; total: number };
}

/* ─── Constants ─── */

const GRADE_COLOURS = {
  outstanding: "#10B981",
  good: "#3B82F6",
  ri: "#F59E0B",
  inadequate: "#EF4444",
};

const TREND_YEARS = ["2019", "2020", "2021", "2022", "2023", "2024"];

const SUB_GRADE_LABELS: Record<string, string> = {
  leadership: "Leadership & Management",
  quality_of_education: "Quality of Education",
  personal_development: "Personal Development",
  behaviour: "Behaviour & Attitudes",
};

const DEP_ORDER = [
  "Least deprived",
  "Less deprived",
  "Average",
  "Deprived",
  "Most deprived",
];

/* ─── Components ─── */

function GradeBar({
  data,
}: {
  data: {
    outstanding_pct: number;
    good_pct: number;
    ri_pct: number;
    inadequate_pct: number;
  };
}) {
  return (
    <div className="flex h-6 rounded-full overflow-hidden">
      <div
        className="transition-all duration-500"
        style={{
          width: `${data.outstanding_pct}%`,
          backgroundColor: GRADE_COLOURS.outstanding,
        }}
        title={`Outstanding: ${data.outstanding_pct}%`}
      />
      <div
        className="transition-all duration-500"
        style={{
          width: `${data.good_pct}%`,
          backgroundColor: GRADE_COLOURS.good,
        }}
        title={`Good: ${data.good_pct}%`}
      />
      <div
        className="transition-all duration-500"
        style={{ width: `${data.ri_pct}%`, backgroundColor: GRADE_COLOURS.ri }}
        title={`Requires Improvement: ${data.ri_pct}%`}
      />
      <div
        className="transition-all duration-500"
        style={{
          width: `${data.inadequate_pct}%`,
          backgroundColor: GRADE_COLOURS.inadequate,
        }}
        title={`Inadequate: ${data.inadequate_pct}%`}
      />
    </div>
  );
}

function TrendChart({
  trends,
  label,
}: {
  trends: Record<string, TrendYear>;
  label?: string;
}) {
  const years = TREND_YEARS.filter((y) => trends[y]);
  if (years.length < 2) return null;

  const maxPct = 100;
  const chartH = 140;
  const chartW = 320;
  const padX = 36;
  const padY = 20;
  const plotW = chartW - padX * 2;
  const plotH = chartH - padY * 2;

  const points = years.map((y, i) => {
    const x = padX + (i / (years.length - 1)) * plotW;
    const pct = trends[y].good_plus_pct;
    const cy = padY + (1 - pct / maxPct) * plotH;
    return { x, y: cy, pct, year: y, total: trends[y].total };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Calculate trend direction
  const firstPct = points[0].pct;
  const lastPct = points[points.length - 1].pct;
  const diff = lastPct - firstPct;

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-foreground">{label}</h4>
          <span
            className={`text-xs font-bold flex items-center gap-1 ${diff >= 0 ? "text-emerald-500" : "text-red-500"}`}
          >
            {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {diff > 0 ? "+" : ""}
            {diff.toFixed(1)}pp since {years[0]}
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full max-w-sm"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const cy = padY + (1 - pct / maxPct) * plotH;
          return (
            <g key={pct}>
              <line
                x1={padX}
                y1={cy}
                x2={chartW - padX}
                y2={cy}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeDasharray="4 2"
              />
              <text
                x={padX - 4}
                y={cy + 3}
                textAnchor="end"
                fill="currentColor"
                fillOpacity={0.3}
                fontSize={8}
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path
          d={`${linePath} L ${points[points.length - 1].x} ${padY + plotH} L ${points[0].x} ${padY + plotH} Z`}
          fill="url(#trendGrad)"
          opacity={0.15}
        />
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points */}
        {points.map((p) => (
          <g key={p.year}>
            <circle
              cx={p.x}
              cy={p.y}
              r={4}
              fill="#3B82F6"
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fill="#3B82F6"
              fontSize={9}
              fontWeight="bold"
            >
              {p.pct}%
            </text>
            <text
              x={p.x}
              y={chartH - 2}
              textAnchor="middle"
              fill="currentColor"
              fillOpacity={0.4}
              fontSize={8}
            >
              {p.year}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-card/50 border border-border text-center">
      <div
        className="text-2xl font-black"
        style={color ? { color } : undefined}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground/60">{sub}</div>}
    </div>
  );
}

function SubGradeRow({
  label,
  data,
  nationalData,
}: {
  label: string;
  data: GradeData;
  nationalData?: GradeData;
}) {
  const diff = nationalData
    ? data.good_or_outstanding_pct - nationalData.good_or_outstanding_pct
    : null;
  return (
    <div className="p-3 rounded-lg bg-card/30 border border-border/50">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-foreground">{label}</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold" style={{ color: GRADE_COLOURS.good }}>
            {data.good_or_outstanding_pct}% Good+
          </span>
          {diff !== null && (
            <span
              className={`font-bold ${diff >= 0 ? "text-emerald-500" : "text-red-500"}`}
            >
              ({diff > 0 ? "+" : ""}
              {diff.toFixed(1)}pp)
            </span>
          )}
        </div>
      </div>
      <GradeBar data={data} />
    </div>
  );
}

function DeprivationTable({ data }: { data: Record<string, GradeData> }) {
  const bands = DEP_ORDER.filter((d) => data[d]);
  if (bands.length === 0) return null;

  return (
    <div className="space-y-2">
      {bands.map((band) => {
        const d = data[band];
        return (
          <div key={band} className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground w-28 flex-shrink-0 text-right">
              {band}
            </span>
            <div className="flex-1">
              <div className="flex h-4 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${d.good_or_outstanding_pct}%`,
                    backgroundColor: GRADE_COLOURS.good,
                  }}
                  className="transition-all duration-500 rounded-l-full"
                />
                <div
                  style={{
                    width: `${100 - d.good_or_outstanding_pct}%`,
                    backgroundColor: "#e5e7eb",
                  }}
                  className="transition-all duration-500 rounded-r-full dark:bg-white/10"
                />
              </div>
            </div>
            <span className="text-xs font-bold text-foreground w-16 text-right">
              {d.good_or_outstanding_pct}%
            </span>
            <span className="text-[10px] text-muted-foreground/60 w-20 text-right">
              ({d.total.toLocaleString()})
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Page ─── */

export default function OfstedExplorerPage() {
  const [national, setNational] = useState<NationalData | null>(null);
  const [latestData, setLatestData] = useState<LatestData | null>(null);
  const [regionData, setRegionData] = useState<Record<
    string,
    RegionData
  > | null>(null);
  const [laData, setLaData] = useState<Record<string, LAData> | null>(null);
  const [laList, setLaList] = useState<{ name: string; region: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"dashboard" | "region" | "la">("dashboard");
  const [selectedPhase, setSelectedPhase] = useState("all");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLA, setSelectedLA] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/data/ofsted?view=national").then((r) => r.json()),
      fetch("/api/data/ofsted?view=region").then((r) => r.json()),
      fetch("/api/data/ofsted?view=la").then((r) => r.json()),
      fetch("/api/data/ofsted?view=la-list").then((r) => r.json()),
      fetch("/api/data/ofsted?view=latest").then((r) => r.json()),
    ])
      .then(([nat, regions, las, list, latest]) => {
        setNational(nat);
        setRegionData(regions);
        setLaData(las);
        setLaList(list);
        setLatestData(latest);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const phases = ["all", "Primary", "Secondary", "Special", "Nursery", "PRU"];
  const regions = regionData
    ? Object.keys(regionData).filter((k) => k !== "national")
    : [];

  const filteredLAs = laData
    ? Object.entries(laData)
        .filter(([name, data]) => {
          if (selectedRegion !== "all" && data.region !== selectedRegion)
            return false;
          if (searchQuery)
            return name.toLowerCase().includes(searchQuery.toLowerCase());
          return true;
        })
        .sort((a, b) => b[1].total - a[1].total)
    : [];

  const selectedLAData = selectedLA && laData ? laData[selectedLA] : null;

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
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <BarChart3 size={22} className="text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl md:text-3xl font-black text-foreground">
                  Ofsted Inspection Explorer
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Verified DfE Data
                </span>
              </div>
              <p className="text-muted-foreground">
                Year-on-year trends, sub-grade analysis, deprivation context,
                and safeguarding rates across 155 local authorities.
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Info size={10} className="text-muted-foreground/40" />
                <p className="text-[10px] text-muted-foreground/60">
                  Source: DfE Ofsted data — current snapshot (as at Aug 2025,
                  22,005 schools) plus five-year inspection trends (129,540
                  inspections from 24,090 schools).{" "}
                  <a
                    href="https://www.gov.uk/government/statistics/state-funded-schools-inspections-and-outcomes-as-at-31-august-2024"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    GOV.UK source
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* View tabs */}
          <section className="px-6 py-4 border-b border-border bg-foreground/[0.02]">
            <div className="container mx-auto max-w-6xl flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex items-center gap-1 bg-foreground/5 rounded-full p-0.5">
                {(
                  [
                    ["dashboard", "KPI Dashboard"],
                    ["region", "By Region"],
                    ["la", "By Local Authority"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => {
                      setView(v);
                      setSelectedLA(null);
                    }}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {view === "region" && (
                <div className="flex flex-wrap gap-1.5">
                  {phases.map((phase) => (
                    <button
                      key={phase}
                      onClick={() => setSelectedPhase(phase)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedPhase === phase ? "bg-primary/15 text-primary border-primary/30" : "text-muted-foreground border-transparent hover:bg-foreground/5"}`}
                    >
                      {phase === "all" ? "All Phases" : phase}
                    </button>
                  ))}
                </div>
              )}

              {view === "la" && (
                <div className="flex items-center gap-3 flex-1">
                  <div className="relative flex-1 max-w-xs">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Search local authority..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-full text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="px-3 py-2 text-xs font-bold bg-card border border-border rounded-full text-foreground"
                  >
                    <option value="all">All Regions</option>
                    {regions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </section>

          {/* ── DASHBOARD VIEW ── */}
          {view === "dashboard" && national && (
            <div className="px-6 py-8">
              <div className="container mx-auto max-w-6xl space-y-10">
                {/* Current Snapshot (Aug 2025 — most recent per school) */}
                {latestData && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-lg font-black text-foreground">
                        Current Snapshot
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        As at {latestData.as_at}
                      </span>
                    </div>
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border border-emerald-500/15">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
                        <div>
                          <div className="text-5xl font-black text-emerald-500">
                            {latestData.national.good_or_outstanding_pct}%
                          </div>
                          <div className="text-sm font-bold text-foreground mt-1">
                            of all schools are Good or Outstanding
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {latestData.graded_schools.toLocaleString()} graded
                            schools out of{" "}
                            {latestData.total_schools.toLocaleString()} total
                          </div>
                        </div>
                        <div className="flex-1 w-full">
                          <GradeBar data={latestData.national} />
                          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                            <span>
                              <span
                                className="font-bold"
                                style={{
                                  color: GRADE_COLOURS.outstanding,
                                }}
                              >
                                {latestData.national.outstanding_pct}%
                              </span>{" "}
                              Outstanding
                            </span>
                            <span>
                              <span
                                className="font-bold"
                                style={{ color: GRADE_COLOURS.good }}
                              >
                                {latestData.national.good_pct}%
                              </span>{" "}
                              Good
                            </span>
                            <span>
                              <span
                                className="font-bold"
                                style={{ color: GRADE_COLOURS.ri }}
                              >
                                {latestData.national.ri_pct}%
                              </span>{" "}
                              RI
                            </span>
                            <span>
                              <span
                                className="font-bold"
                                style={{
                                  color: GRADE_COLOURS.inadequate,
                                }}
                              >
                                {latestData.national.inadequate_pct}%
                              </span>{" "}
                              Inadequate
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {Object.entries(latestData.phases)
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([phase, data]) => (
                            <div
                              key={phase}
                              className="p-3 rounded-xl bg-card/60 border border-border/50 text-center"
                            >
                              <div className="text-[10px] font-bold text-muted-foreground mb-0.5">
                                {phase}
                              </div>
                              <div
                                className="text-lg font-black"
                                style={{ color: GRADE_COLOURS.good }}
                              >
                                {data.good_or_outstanding_pct}%
                              </div>
                              <div className="text-[9px] text-muted-foreground/60">
                                {data.total.toLocaleString()} schools
                              </div>
                            </div>
                          ))}
                      </div>
                      {latestData.not_judged_schools > 0 && (
                        <p className="text-[10px] text-muted-foreground/50 mt-4">
                          {latestData.not_judged_schools.toLocaleString()}{" "}
                          schools are &quot;Not judged&quot; — inspected after
                          Sep 2024 when Ofsted stopped awarding overall
                          effectiveness grades.
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground/50">
                        <Info size={10} />
                        <span>
                          Most-recent-inspection-per-school methodology.{" "}
                          <a
                            href={latestData.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-foreground"
                          >
                            GOV.UK source
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Five-Year Inspection KPIs */}
                <div>
                  <h2 className="text-lg font-black text-foreground mb-4">
                    Five-Year Inspection Trends
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <KpiCard
                      label="Schools Inspected"
                      value={national.school_count.toLocaleString()}
                      sub="across 5 years"
                    />
                    <KpiCard
                      label="Local Authorities"
                      value={national.la_count.toString()}
                    />
                    <KpiCard
                      label="Good or Outstanding"
                      value={`${national.all_time.good_or_outstanding_pct}%`}
                      sub="all inspections"
                      color={GRADE_COLOURS.good}
                    />
                    <KpiCard
                      label="Good+ (2022-24)"
                      value={`${national.recent.good_or_outstanding_pct}%`}
                      sub={`${national.recent.total.toLocaleString()} inspections`}
                      color={GRADE_COLOURS.good}
                    />
                    <KpiCard
                      label="Safeguarding Effective"
                      value={`${national.safeguarding.recent.effective_pct}%`}
                      sub={`${national.safeguarding.recent.not_effective} schools failed`}
                      color={GRADE_COLOURS.outstanding}
                    />
                    <KpiCard
                      label="Inadequate (2022-24)"
                      value={`${national.recent.inadequate_pct}%`}
                      sub={`${national.recent.inadequate.toLocaleString()} inspections`}
                      color={GRADE_COLOURS.inadequate}
                    />
                  </div>
                </div>

                {/* Validation banner */}
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 flex items-start gap-3">
                  <ExternalLink
                    size={14}
                    className="text-blue-500 flex-shrink-0 mt-0.5"
                  />
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">
                      Two complementary datasets:
                    </span>{" "}
                    The &quot;Current Snapshot&quot; above uses the official
                    most-recent-inspection-per-school methodology (
                    {latestData
                      ? `${latestData.graded_schools.toLocaleString()} schools, ${latestData.national.good_or_outstanding_pct}% Good+`
                      : "loading..."}
                    ), matching the DfE headline figure. The &quot;Five-Year
                    Trends&quot; below show all 129,540 individual inspections (
                    {national.all_time.good_or_outstanding_pct}% Good+) to
                    reveal year-on-year changes — schools inspected multiple
                    times appear multiple times.{" "}
                    <a
                      href="https://www.gov.uk/government/statistics/state-funded-schools-inspections-and-outcomes-as-at-31-august-2025"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline text-blue-500 hover:text-blue-400"
                    >
                      Verify on GOV.UK
                    </a>
                  </div>
                </div>

                {/* Year-on-Year Trend */}
                <div>
                  <h2 className="text-lg font-black text-foreground mb-4">
                    Year-on-Year Trend: Good or Outstanding %
                  </h2>
                  <div className="p-6 rounded-2xl bg-card/50 border border-border">
                    <TrendChart
                      trends={national.trends}
                      label="National Good+ % (inspection outcomes by year)"
                    />
                    <div className="mt-4 grid grid-cols-3 md:grid-cols-6 gap-3">
                      {TREND_YEARS.filter((y) => national.trends[y]).map(
                        (year) => {
                          const t = national.trends[year];
                          return (
                            <div
                              key={year}
                              className="text-center p-2 rounded-lg bg-foreground/[0.03] border border-border/50"
                            >
                              <div className="text-xs font-bold text-muted-foreground">
                                {year}
                              </div>
                              <div className="text-sm font-black text-foreground">
                                {t.good_plus_pct}%
                              </div>
                              <div className="text-[9px] text-muted-foreground/60">
                                {t.total.toLocaleString()} inspections
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 mt-3">
                      Note: 2020-21 volumes are lower due to COVID-19 inspection
                      suspensions. Inspections during this period were weighted
                      towards schools causing concern, so the lower Good+ rates
                      for those years are not representative of overall school
                      quality.
                    </p>
                  </div>
                </div>

                {/* Sub-grade Analysis */}
                <div>
                  <h2 className="text-lg font-black text-foreground mb-4">
                    Sub-Grade Analysis (National)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(SUB_GRADE_LABELS).map(([key, label]) => {
                      const data = national.sub_grades[key];
                      if (!data || data.total === 0) return null;
                      return (
                        <SubGradeRow key={key} label={label} data={data} />
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mt-2">
                    Quality of Education, Personal Development, and Behaviour
                    sub-grades were introduced with the 2019 Education
                    Inspection Framework. Leadership & Management covers all 5
                    years. Sub-grade totals differ accordingly.
                  </p>
                </div>

                {/* Deprivation Context */}
                <div>
                  <h2 className="text-lg font-black text-foreground mb-4">
                    Deprivation Context
                  </h2>
                  <div className="p-6 rounded-2xl bg-card/50 border border-border">
                    <DeprivationTable data={national.deprivation} />
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">
                          Gap:{" "}
                          {(
                            (national.deprivation["Least deprived"]
                              ?.good_or_outstanding_pct || 0) -
                            (national.deprivation["Most deprived"]
                              ?.good_or_outstanding_pct || 0)
                          ).toFixed(1)}
                          pp
                        </span>{" "}
                        — Schools in the most deprived areas are{" "}
                        {(
                          (national.deprivation["Least deprived"]
                            ?.good_or_outstanding_pct || 0) -
                          (national.deprivation["Most deprived"]
                            ?.good_or_outstanding_pct || 0)
                        ).toFixed(1)}{" "}
                        percentage points less likely to be rated Good or
                        Outstanding than those in the least deprived areas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Safeguarding */}
                <div>
                  <h2 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-emerald-500" />{" "}
                    Safeguarding
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 rounded-2xl bg-card/50 border border-border">
                      <div className="text-xs font-bold text-muted-foreground mb-2">
                        Recent (2022-24)
                      </div>
                      <div className="text-3xl font-black text-emerald-500">
                        {national.safeguarding.recent.effective_pct}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        safeguarding effective
                      </div>
                      <div className="mt-2 text-xs text-red-500 font-bold">
                        {national.safeguarding.recent.not_effective} schools
                        failed safeguarding
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-card/50 border border-border">
                      <div className="text-xs font-bold text-muted-foreground mb-2">
                        All Time (5 years)
                      </div>
                      <div className="text-3xl font-black text-emerald-500">
                        {national.safeguarding.all_time.effective_pct}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        safeguarding effective
                      </div>
                      <div className="mt-2 text-xs text-red-500 font-bold">
                        {national.safeguarding.all_time.not_effective} schools
                        failed safeguarding
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase breakdown */}
                <div>
                  <h2 className="text-lg font-black text-foreground mb-4">
                    Good+ by Phase
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {regionData &&
                      regionData.national?.phases &&
                      Object.entries(regionData.national.phases)
                        .sort((a, b) => b[1].total - a[1].total)
                        .map(([phase, data]) => (
                          <div
                            key={phase}
                            className="p-4 rounded-xl bg-card/50 border border-border text-center"
                          >
                            <div className="text-xs font-bold text-muted-foreground mb-1">
                              {phase}
                            </div>
                            <div
                              className="text-xl font-black"
                              style={{ color: GRADE_COLOURS.good }}
                            >
                              {data.good_or_outstanding_pct}%
                            </div>
                            <div className="text-[10px] text-muted-foreground/60">
                              {data.total.toLocaleString()} inspections
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── REGION VIEW ── */}
          {view === "region" && regionData && (
            <section className="px-6 py-8">
              <div className="container mx-auto max-w-6xl space-y-3">
                {/* Legend */}
                <div className="flex items-center gap-4 mb-4">
                  {[
                    { label: "Outstanding", color: GRADE_COLOURS.outstanding },
                    { label: "Good", color: GRADE_COLOURS.good },
                    { label: "Requires Improvement", color: GRADE_COLOURS.ri },
                    { label: "Inadequate", color: GRADE_COLOURS.inadequate },
                  ].map((g) => (
                    <div key={g.label} className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: g.color }}
                      />
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {g.label}
                      </span>
                    </div>
                  ))}
                </div>

                {regions.map((region, i) => {
                  const rData = regionData[region];
                  if (!rData) return null;

                  // Phase filter
                  const displayData =
                    selectedPhase === "all"
                      ? rData
                      : rData.phases?.[selectedPhase];
                  if (!displayData) return null;

                  return (
                    <motion.div
                      key={region}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-xl bg-card/50 border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-bold text-foreground">
                            {region}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({displayData.total.toLocaleString()} inspections)
                          </span>
                          <span
                            className="text-xs font-bold ml-3"
                            style={{ color: GRADE_COLOURS.good }}
                          >
                            {displayData.good_or_outstanding_pct}% Good+
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span style={{ color: GRADE_COLOURS.outstanding }}>
                            {displayData.outstanding_pct}%
                          </span>
                          <span style={{ color: GRADE_COLOURS.good }}>
                            {displayData.good_pct}%
                          </span>
                          <span style={{ color: GRADE_COLOURS.ri }}>
                            {displayData.ri_pct}%
                          </span>
                          <span style={{ color: GRADE_COLOURS.inadequate }}>
                            {displayData.inadequate_pct}%
                          </span>
                        </div>
                      </div>
                      <GradeBar data={displayData} />
                      {/* Show trend if available and on "all" phase */}
                      {selectedPhase === "all" &&
                        rData.trends &&
                        Object.keys(rData.trends).length >= 2 && (
                          <div className="mt-4 pt-4 border-t border-border/50">
                            <TrendChart trends={rData.trends} />
                          </div>
                        )}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── LA LIST VIEW ── */}
          {view === "la" && !selectedLA && (
            <section className="px-6 py-8">
              <div className="container mx-auto max-w-6xl">
                <p className="text-xs text-muted-foreground mb-4">
                  {filteredLAs.length} local authorities
                </p>
                <div className="space-y-2">
                  {filteredLAs.map(([name, data], i) => (
                    <motion.button
                      key={name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.5) }}
                      onClick={() => setSelectedLA(name)}
                      className="w-full text-left p-4 rounded-xl bg-card/50 border border-border hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {name}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            {data.region}
                          </span>
                          <span
                            className="text-xs font-bold"
                            style={{ color: GRADE_COLOURS.good }}
                          >
                            {data.good_or_outstanding_pct}% Good+
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {data.total.toLocaleString()} inspections
                          </span>
                          <ChevronDown
                            size={14}
                            className="text-muted-foreground/30 -rotate-90 group-hover:text-primary transition-all"
                          />
                        </div>
                      </div>
                      <GradeBar data={data} />
                    </motion.button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── LA DETAIL VIEW ── */}
          {view === "la" && selectedLA && selectedLAData && (
            <section className="px-6 py-8">
              <div className="container mx-auto max-w-6xl">
                <button
                  onClick={() => setSelectedLA(null)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft size={14} /> Back to all LAs
                </button>

                <div className="mb-8">
                  <h2 className="text-2xl font-black text-foreground mb-1">
                    {selectedLA}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedLAData.region} —{" "}
                    {selectedLAData.total.toLocaleString()} total inspections
                  </p>
                </div>

                {/* Grade summary */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  <KpiCard
                    label="Good+"
                    value={`${selectedLAData.good_or_outstanding_pct}%`}
                    color={GRADE_COLOURS.good}
                  />
                  {[
                    {
                      label: "Outstanding",
                      pct: selectedLAData.outstanding_pct,
                      count: selectedLAData.outstanding,
                      color: GRADE_COLOURS.outstanding,
                    },
                    {
                      label: "Good",
                      pct: selectedLAData.good_pct,
                      count: selectedLAData.good,
                      color: GRADE_COLOURS.good,
                    },
                    {
                      label: "Requires Improvement",
                      pct: selectedLAData.ri_pct,
                      count: selectedLAData.requires_improvement,
                      color: GRADE_COLOURS.ri,
                    },
                    {
                      label: "Inadequate",
                      pct: selectedLAData.inadequate_pct,
                      count: selectedLAData.inadequate,
                      color: GRADE_COLOURS.inadequate,
                    },
                  ].map((g) => (
                    <KpiCard
                      key={g.label}
                      label={g.label}
                      value={`${g.pct}%`}
                      sub={`(${g.count})`}
                      color={g.color}
                    />
                  ))}
                </div>

                <div className="mb-8">
                  <GradeBar data={selectedLAData} />
                </div>

                {/* Trend */}
                {selectedLAData.trends &&
                  Object.keys(selectedLAData.trends).length >= 2 && (
                    <div className="mb-8 p-6 rounded-2xl bg-card/50 border border-border">
                      <TrendChart
                        trends={selectedLAData.trends}
                        label={`${selectedLA} — Good+ % by Year`}
                      />
                    </div>
                  )}

                {/* Sub-grades */}
                {selectedLAData.sub_grades &&
                  Object.values(selectedLAData.sub_grades).some(
                    (d) => d && d.total > 0,
                  ) && (
                    <div className="mb-8">
                      <h3 className="text-sm font-bold text-foreground mb-3">
                        Sub-Grade Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(SUB_GRADE_LABELS).map(
                          ([key, label]) => {
                            const data = selectedLAData.sub_grades[key];
                            if (!data || data.total === 0) return null;
                            return (
                              <SubGradeRow
                                key={key}
                                label={label}
                                data={data}
                                nationalData={national?.sub_grades[key]}
                              />
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                {/* Deprivation */}
                {selectedLAData.deprivation &&
                  Object.keys(selectedLAData.deprivation).length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-bold text-foreground mb-3">
                        Deprivation Context
                      </h3>
                      <div className="p-4 rounded-xl bg-card/50 border border-border">
                        <DeprivationTable data={selectedLAData.deprivation} />
                      </div>
                    </div>
                  )}

                {/* Safeguarding */}
                {selectedLAData.safeguarding && (
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                      <Shield size={14} className="text-emerald-500" />{" "}
                      Safeguarding
                    </h3>
                    <div className="p-4 rounded-xl bg-card/50 border border-border flex items-center gap-6">
                      <div>
                        <span className="text-2xl font-black text-emerald-500">
                          {selectedLAData.safeguarding.effective_pct}%
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          effective
                        </span>
                      </div>
                      {selectedLAData.safeguarding.not_effective > 0 && (
                        <div className="text-xs text-red-500 font-bold">
                          {selectedLAData.safeguarding.not_effective} school
                          {selectedLAData.safeguarding.not_effective !== 1
                            ? "s"
                            : ""}{" "}
                          failed
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        ({selectedLAData.safeguarding.total} inspections)
                      </div>
                    </div>
                  </div>
                )}

                {/* Phase breakdown */}
                <h3 className="text-sm font-bold text-foreground mb-4">
                  By Phase
                </h3>
                <div className="space-y-3 mb-8">
                  {Object.entries(selectedLAData.phases)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([phase, pdata]) => (
                      <div
                        key={phase}
                        className="p-4 rounded-xl bg-card/50 border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-foreground">
                            {phase}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{pdata.total} inspections</span>
                            <span
                              className="font-bold"
                              style={{ color: GRADE_COLOURS.good }}
                            >
                              {pdata.good_or_outstanding_pct}% Good+
                            </span>
                          </div>
                        </div>
                        <GradeBar data={pdata} />
                      </div>
                    ))}
                </div>

                {/* vs National comparison */}
                {national && (
                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/15">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                      <TrendingUp size={14} className="text-primary" />
                      {selectedLA} vs National Average
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center text-xs">
                      {[
                        {
                          label: "Good+",
                          la: selectedLAData.good_or_outstanding_pct,
                          nat: national.all_time.good_or_outstanding_pct,
                          isPositiveGood: true,
                        },
                        {
                          label: "Outstanding",
                          la: selectedLAData.outstanding_pct,
                          nat: national.all_time.outstanding_pct,
                          isPositiveGood: true,
                        },
                        {
                          label: "Good",
                          la: selectedLAData.good_pct,
                          nat: national.all_time.good_pct,
                          isPositiveGood: true,
                        },
                        {
                          label: "RI",
                          la: selectedLAData.ri_pct,
                          nat: national.all_time.ri_pct,
                          isPositiveGood: false,
                        },
                        {
                          label: "Inadequate",
                          la: selectedLAData.inadequate_pct,
                          nat: national.all_time.inadequate_pct,
                          isPositiveGood: false,
                        },
                      ].map((g) => {
                        const diff = g.la - g.nat;
                        const isGood = g.isPositiveGood ? diff > 0 : diff < 0;
                        return (
                          <div key={g.label}>
                            <div className="text-muted-foreground mb-1">
                              {g.label}
                            </div>
                            <div className="font-bold text-foreground">
                              {g.la}%{" "}
                              <span className="text-muted-foreground/60">
                                vs {g.nat}%
                              </span>
                            </div>
                            <div
                              className="font-bold mt-0.5"
                              style={{
                                color: isGood
                                  ? GRADE_COLOURS.outstanding
                                  : GRADE_COLOURS.inadequate,
                              }}
                            >
                              {diff > 0 ? "+" : ""}
                              {diff.toFixed(1)}pp
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Signal CTA */}
          <section className="px-6 py-12 border-t border-border bg-foreground/[0.02]">
            <div className="container mx-auto max-w-3xl text-center">
              <Mail size={24} className="text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-black text-foreground mb-2">
                Get school-level insights
              </h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Signal Pro subscribers get school-level Ofsted data, alerts for
                inspection changes in your LA, and downloadable reports.
              </p>
              <Link
                href="/insights/newsletter"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-full font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"
              >
                Subscribe to the Signal <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          {/* Data methodology */}
          <section className="px-6 py-8 border-t border-border">
            <div className="container mx-auto max-w-4xl">
              <h3 className="text-sm font-bold text-foreground mb-3">
                Data Sources & Methodology
              </h3>
              <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                <p>
                  <span className="font-bold">Sources:</span> (1){" "}
                  <a
                    href="https://www.gov.uk/government/statistics/state-funded-schools-inspections-and-outcomes-as-at-31-august-2025"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    State-funded school inspections as at 31 August 2025
                  </a>{" "}
                  — most recent inspection per school. (2){" "}
                  <a
                    href="https://www.gov.uk/government/publications/five-year-ofsted-inspection-data"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Five-Year Ofsted Inspection Data
                  </a>{" "}
                  — every inspection 2019-2024. Both published by the Department
                  for Education under the Open Government Licence.
                </p>
                <p>
                  <span className="font-bold">Current Snapshot:</span> 22,005
                  schools, 18,618 graded. Uses the official
                  most-recent-inspection-per-school methodology — matches the
                  DfE headline &quot;93.1% of schools are Good or
                  Outstanding&quot;.
                </p>
                <p>
                  <span className="font-bold">Five-Year Trends:</span> 129,540
                  individual inspection records from 24,090 schools across 155
                  local authorities. Shows every inspection (a school inspected
                  multiple times appears multiple times) to reveal year-on-year
                  trends.
                </p>
                <p>
                  <span className="font-bold">2020-21 caveat:</span> Ofsted
                  suspended routine inspections during COVID-19. The 4,507
                  (2020) and 1,996 (2021) inspections conducted were weighted
                  toward schools causing concern, producing lower Good+ rates
                  that are not representative of the sector as a whole.
                </p>
                <p>
                  <span className="font-bold">Sub-grades:</span> Quality of
                  Education, Personal Development, and Behaviour & Attitudes
                  were introduced with the 2019 Education Inspection Framework.
                  These sub-grades cover 35,754 inspections. Leadership &
                  Management covers all 129,540 inspections.
                </p>
                <p>
                  <span className="font-bold">
                    Framework change (Sep 2024):
                  </span>{" "}
                  Ofsted has stopped judging overall effectiveness from
                  September 2024. Historical data in this tool predates this
                  change.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
