"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  PoundSterling,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Upload,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  Target,
  ExternalLink,
  Calculator,
  Search,
  Info,
  Zap,
  ShieldCheck,
  Banknote,
  Users,
  Building2,
  Package,
  Wallet,
  X,
  FileText,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
} from "recharts";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";

// =====================================================
// TYPES
// =====================================================

interface MonthlyPoint {
  month: string;
  planned_cumulative: number;
  actual_cumulative: number;
}

interface CFRLine {
  cfr_code: string;
  description: string;
  group: string;
  budget: number;
  actual: number;
  committed: number;
  variance: number;
  variance_percent: number;
  rag: "red" | "amber" | "green";
  monthly_profile: MonthlyPoint[];
}

interface MonitorData {
  financial_year: string;
  school_name: string;
  pupil_count: number;
  budget_cycle: "la" | "academy";
  as_at_date: string;
  months_elapsed: number;
  months_total: number;
  total_income: number;
  total_budget: number;
  total_spend: number;
  total_committed: number;
  remaining: number;
  percent_spent: number;
  projected_year_end: number;
  projected_surplus_deficit: number;
  staffing_spend: number;
  staffing_percent_of_income: number;
  staffing_target: number;
  lines: CFRLine[];
}

interface Transaction {
  date: string;
  reference: string;
  description: string;
  amount: number;
  running_total: number;
}

interface ExpectedIncomeItem {
  id: string;
  description: string;
  amount: number;
  confidence: "confirmed" | "highly_likely" | "likely" | "uncertain";
  expected_date: string;
  source: string;
}

// =====================================================
// CONSTANTS
// =====================================================

const FINANCE_ORANGE = "#FFAA4C";
const FINANCE_ORANGE_LIGHT = "#FFAA4C20";

const GROUP_ICONS: Record<string, React.ElementType> = {
  Staffing: Users,
  Premises: Building2,
  Energy: Zap,
  Supplies: Package,
  Other: Wallet,
  Income: Banknote,
};

const GROUP_ORDER = [
  "Staffing",
  "Premises",
  "Energy",
  "Supplies",
  "Other",
  "Income",
];

const CONFIDENCE_CONFIG = {
  confirmed: {
    label: "Confirmed",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  highly_likely: {
    label: "Highly Likely",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  likely: {
    label: "Likely",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  uncertain: {
    label: "Uncertain",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    dot: "bg-gray-400",
  },
};

// =====================================================
// HELPERS
// =====================================================

function fmt(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function fmtK(amount: number): string {
  if (Math.abs(amount) >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(1)}m`;
  if (Math.abs(amount) >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return amount.toFixed(0);
}

function fmtPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function ragStyles(rag: string) {
  switch (rag) {
    case "red":
      return {
        bg: "bg-red-50 dark:bg-red-950/30",
        text: "text-red-700 dark:text-red-400",
        border: "border-red-200 dark:border-red-800",
        dot: "bg-red-500",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
      };
    case "amber":
      return {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        text: "text-amber-700 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800",
        dot: "bg-amber-500",
        badge:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
      };
    default:
      return {
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        text: "text-emerald-700 dark:text-emerald-400",
        border: "border-emerald-200 dark:border-emerald-800",
        dot: "bg-emerald-500",
        badge:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      };
  }
}

// Sample expected income data (in production this comes from an API)
function getSampleExpectedIncome(): ExpectedIncomeItem[] {
  return [
    {
      id: "ei-1",
      description: "Pupil Premium Grant (Spring)",
      amount: 42_350,
      confidence: "confirmed",
      expected_date: "2026-04-15",
      source: "DfE via LA",
    },
    {
      id: "ei-2",
      description: "SEN Top-up Funding (3 pupils)",
      amount: 18_600,
      confidence: "highly_likely",
      expected_date: "2026-03-28",
      source: "LA SEND Team",
    },
    {
      id: "ei-3",
      description: "Staff secondment recharge (Q3)",
      amount: 12_400,
      confidence: "confirmed",
      expected_date: "2026-04-01",
      source: "Seconding school",
    },
    {
      id: "ei-4",
      description: "Lettings income (Spring term)",
      amount: 3_200,
      confidence: "likely",
      expected_date: "2026-04-30",
      source: "Community lettings",
    },
    {
      id: "ei-5",
      description: "Insurance claim settlement",
      amount: 8_750,
      confidence: "uncertain",
      expected_date: "2026-05-15",
      source: "RPA / insurer",
    },
    {
      id: "ei-6",
      description: "PE & Sport Premium (remaining)",
      amount: 9_250,
      confidence: "highly_likely",
      expected_date: "2026-04-01",
      source: "DfE via LA",
    },
  ];
}

// =====================================================
// ANIMATION VARIANTS
// =====================================================

const cardVariants: any = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

const sectionVariants: any = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

// =====================================================
// PROGRESS RING (reusable)
// =====================================================

function ProgressRing({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  color = FINANCE_ORANGE,
  trackColor = "#e5e7eb",
  children,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const offset = circumference * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={trackColor}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

// =====================================================
// 1. HERO SUMMARY CARDS
// =====================================================

function HeroSummaryCards({ data }: { data: MonitorData }) {
  const perPupil =
    data.pupil_count > 0 ? data.total_spend / data.pupil_count : 0;
  const surplusDeficit = data.projected_surplus_deficit;
  const isSurplus = surplusDeficit >= 0;

  const cards = [
    {
      label: "Total Budget",
      value: fmt(data.total_budget),
      subtitle: `Income: ${fmt(data.total_income)}`,
      icon: PoundSterling,
      accent:
        "from-[#FFAA4C]/10 to-[#FFAA4C]/5 dark:from-[#FFAA4C]/20 dark:to-[#FFAA4C]/5",
      iconBg: "bg-[#FFAA4C]/15",
      iconColor: "text-[#FFAA4C]",
    },
    {
      label: "Spend to Date",
      value: fmt(data.total_spend),
      subtitle: `${data.percent_spent}% of budget used`,
      icon: BarChart3,
      accent:
        "from-blue-500/10 to-blue-500/5 dark:from-blue-500/20 dark:to-blue-500/5",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
      ring: {
        value: data.percent_spent,
        color:
          data.percent_spent > 85
            ? "#ef4444"
            : data.percent_spent > 70
              ? "#f59e0b"
              : "#3b82f6",
      },
    },
    {
      label: "Remaining",
      value: fmt(data.remaining),
      subtitle: `+ ${fmt(data.total_committed)} committed`,
      icon: Clock,
      accent:
        "from-violet-500/10 to-violet-500/5 dark:from-violet-500/20 dark:to-violet-500/5",
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-500",
    },
    {
      label: "Projected Year-End",
      value: `${isSurplus ? "+" : ""}${fmt(surplusDeficit)}`,
      subtitle: isSurplus ? "Projected surplus" : "Projected deficit",
      icon: isSurplus ? TrendingUp : TrendingDown,
      accent: isSurplus
        ? "from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/20 dark:to-emerald-500/5"
        : "from-red-500/10 to-red-500/5 dark:from-red-500/20 dark:to-red-500/5",
      iconBg: isSurplus ? "bg-emerald-500/15" : "bg-red-500/15",
      iconColor: isSurplus ? "text-emerald-500" : "text-red-500",
      valueColor: isSurplus
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-red-700 dark:text-red-400",
    },
    {
      label: "Per-Pupil Spend",
      value: fmt(perPupil),
      subtitle: `${data.pupil_count} pupils on roll`,
      icon: Users,
      accent:
        "from-cyan-500/10 to-cyan-500/5 dark:from-cyan-500/20 dark:to-cyan-500/5",
      iconBg: "bg-cyan-500/15",
      iconColor: "text-cyan-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className={`relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br ${card.accent} p-5 shadow-sm`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {card.label}
              </p>
              <p
                className={`text-2xl font-bold tracking-tight ${card.valueColor ?? "text-gray-900 dark:text-white"}`}
              >
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {card.subtitle}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 ml-3">
              {card.ring ? (
                <ProgressRing
                  value={card.ring.value}
                  size={44}
                  strokeWidth={4}
                  color={card.ring.color}
                  trackColor="#e5e7eb40"
                >
                  <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                    {card.ring.value}%
                  </span>
                </ProgressRing>
              ) : (
                <div className={`rounded-lg p-2.5 ${card.iconBg}`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// =====================================================
// 2. SPEND PROFILE CHART (Recharts ComposedChart)
// =====================================================

function SpendProfileChart({
  lines,
  monthsElapsed,
}: {
  lines: CFRLine[];
  monthsElapsed: number;
}) {
  const chartData = useMemo(() => {
    if (!lines?.length) return [];

    const expLines = lines.filter(
      (l) => l.budget > 0 && l.monthly_profile?.length > 0,
    );
    if (!expLines.length) return [];

    const months = expLines[0].monthly_profile.map((mp) => mp.month);
    return months.map((month, i) => {
      let planned = 0;
      let actual = 0;
      for (const line of lines.filter((l) => l.budget > 0)) {
        const mp = line.monthly_profile[i];
        if (mp) {
          planned += mp.planned_cumulative;
          actual += mp.actual_cumulative;
        }
      }
      return {
        month,
        planned,
        actual: i < monthsElapsed ? actual : undefined,
        variance: i < monthsElapsed ? actual - planned : undefined,
        index: i,
      };
    });
  }, [lines, monthsElapsed]);

  if (!chartData.length) return null;

  const currentMonth = chartData[monthsElapsed - 1]?.month;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const planned = payload.find((p: any) => p.dataKey === "planned")?.value;
    const actual = payload.find((p: any) => p.dataKey === "actual")?.value;
    const variance =
      actual !== undefined && planned !== undefined ? actual - planned : null;

    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-xl text-xs">
        <p className="font-semibold text-gray-900 dark:text-white mb-1.5">
          {label}
        </p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
              Budget Profile
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-200 tabular-nums">
              {planned !== undefined ? fmt(planned) : "-"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <span className="inline-block h-2 w-2 rounded-full bg-[#FFAA4C]" />
              Actual Spend
            </span>
            <span className="font-medium text-gray-700 dark:text-gray-200 tabular-nums">
              {actual !== undefined ? fmt(actual) : "-"}
            </span>
          </div>
          {variance !== null && (
            <>
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <div className="flex items-center justify-between gap-6">
                <span className="text-gray-500 dark:text-gray-400">
                  Variance
                </span>
                <span
                  className={`font-bold tabular-nums ${variance > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                >
                  {variance > 0 ? "+" : ""}
                  {fmt(variance)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Spend Profile
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cumulative expenditure: budget profile vs actual spend
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-5 rounded-sm bg-gray-200 dark:bg-gray-600 border border-dashed border-gray-300 dark:border-gray-500" />
            Budget
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-5 rounded-sm bg-[#FFAA4C]" />
            Actual
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FINANCE_ORANGE} stopOpacity={0.3} />
              <stop
                offset="95%"
                stopColor={FINANCE_ORANGE}
                stopOpacity={0.02}
              />
            </linearGradient>
            <linearGradient id="plannedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#9ca3af" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f3f4f6"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickFormatter={(v) => `${fmtK(v)}`}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          {currentMonth && (
            <ReferenceLine
              x={currentMonth}
              stroke={FINANCE_ORANGE}
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "Now",
                position: "top",
                fill: FINANCE_ORANGE,
                fontSize: 10,
                fontWeight: 600,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="planned"
            stroke="#9ca3af"
            strokeWidth={2}
            strokeDasharray="6 3"
            fill="url(#plannedGradient)"
            dot={false}
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="actual"
            stroke={FINANCE_ORANGE}
            strokeWidth={2.5}
            fill="url(#actualGradient)"
            dot={{ r: 3, fill: FINANCE_ORANGE, stroke: "#fff", strokeWidth: 2 }}
            activeDot={{
              r: 5,
              fill: FINANCE_ORANGE,
              stroke: "#fff",
              strokeWidth: 2,
            }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

// =====================================================
// 3. STAFFING COST GAUGE (SVG Donut)
// =====================================================

function StaffingGauge({
  percent,
  target,
  staffingSpend,
  totalIncome,
}: {
  percent: number;
  target: number;
  staffingSpend: number;
  totalIncome: number;
}) {
  const isOver = percent > target;
  const isWarning = percent > target - 3;
  const gaugeColor = isOver ? "#ef4444" : isWarning ? "#f59e0b" : "#22c55e";
  const gaugeBg = isOver ? "#fef2f2" : isWarning ? "#fffbeb" : "#f0fdf4";

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(percent / 100, 1);
  const offset = circumference * (1 - progress);

  // Target marker position
  const targetAngle = (target / 100) * 360 - 90;
  const targetRad = (targetAngle * Math.PI) / 180;
  const markerX = 64 + (radius + 1) * Math.cos(targetRad);
  const markerY = 64 + (radius + 1) * Math.sin(targetRad);

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Staffing % of Income
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ICFP target: {target}% max
          </p>
        </div>
        <Link
          href="/dashboard/finance/icfp"
          className="flex items-center gap-1 text-xs font-medium text-[#FFAA4C] hover:underline"
        >
          ICFP <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex-1 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <svg
            width={128}
            height={128}
            className="-rotate-90"
            viewBox="0 0 128 128"
          >
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              strokeWidth="10"
              stroke={gaugeBg}
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              strokeWidth="10"
              stroke={gaugeColor}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
            {/* Target marker */}
            <circle
              cx={markerX}
              cy={markerY}
              r="4"
              fill="#1f2937"
              stroke="#fff"
              strokeWidth="2"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: gaugeColor }}>
              {percent.toFixed(1)}%
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              of income
            </span>
          </div>
        </div>

        <div className="space-y-3 flex-1 min-w-0">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              isOver
                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            }`}
          >
            {isOver ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {isOver
              ? `${(percent - target).toFixed(1)}% over`
              : `${(target - percent).toFixed(1)}% under`}{" "}
            target
          </div>

          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Staffing spend</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {fmt(staffingSpend)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total income</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {fmt(totalIncome)}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
            DfE recommends staffing costs should not exceed {target}% of total
            income (ICFP framework).
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// =====================================================
// 4. BUDGET VS ACTUAL TABLE
// =====================================================

function MiniSparkline({
  data,
  color,
}: {
  data: MonthlyPoint[];
  color: string;
}) {
  if (!data?.length) return <div className="w-[60px] h-[20px]" />;
  const chartData = data.map((d) => ({
    v: d.actual_cumulative,
    p: d.planned_cumulative,
  }));

  return (
    <div className="w-[60px] h-[20px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="p"
            stroke="#d1d5db"
            strokeWidth={1}
            dot={false}
            strokeDasharray="2 2"
          />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExpandedRow({
  line,
  organizationId,
}: {
  line: CFRLine;
  organizationId: string;
}) {
  const { data: txData } = useSWR<{ data: Transaction[] }>(
    organizationId
      ? `/api/finance/transactions?organizationId=${organizationId}&cfr_code=${line.cfr_code}`
      : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  const transactions = txData?.data ?? [];

  return (
    <tr>
      <td colSpan={9} className="px-4 py-0">
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Breakdown */}
            <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Monthly Profile
              </p>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={line.monthly_profile} barGap={1}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f3f4f6"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 9, fill: "#9ca3af" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: "#9ca3af" }}
                      tickFormatter={(v) => fmtK(v)}
                      tickLine={false}
                      axisLine={false}
                      width={45}
                    />
                    <Bar
                      dataKey="planned_cumulative"
                      fill="#e5e7eb"
                      radius={[2, 2, 0, 0]}
                      name="Budget"
                    />
                    <Bar
                      dataKey="actual_cumulative"
                      fill={FINANCE_ORANGE}
                      radius={[2, 2, 0, 0]}
                      name="Actual"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 p-3">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Recent Transactions
              </p>
              {transactions.length === 0 ? (
                <div className="flex items-center justify-center h-[100px] text-xs text-gray-400">
                  <p>No transactions loaded yet</p>
                </div>
              ) : (
                <div className="max-h-[120px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 dark:text-gray-400">
                        <th className="text-left py-1 font-medium">Date</th>
                        <th className="text-left py-1 font-medium">Ref</th>
                        <th className="text-left py-1 font-medium">
                          Description
                        </th>
                        <th className="text-right py-1 font-medium">Amount</th>
                        <th className="text-right py-1 font-medium">Running</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, i) => (
                        <tr
                          key={i}
                          className="border-t border-gray-100 dark:border-gray-700"
                        >
                          <td className="py-1 text-gray-600 dark:text-gray-400 tabular-nums">
                            {new Date(tx.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </td>
                          <td className="py-1 text-gray-500 dark:text-gray-400 font-mono">
                            {tx.reference}
                          </td>
                          <td className="py-1 text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                            {tx.description}
                          </td>
                          <td className="py-1 text-right font-medium text-gray-900 dark:text-white tabular-nums">
                            {fmt(tx.amount)}
                          </td>
                          <td className="py-1 text-right text-gray-500 dark:text-gray-400 tabular-nums">
                            {fmt(tx.running_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </td>
    </tr>
  );
}

function BudgetTable({
  lines,
  filter,
  searchQuery,
  organizationId,
}: {
  lines: CFRLine[];
  filter: "all" | "expenditure" | "income";
  searchQuery: string;
  organizationId: string;
}) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );

  const toggleGroup = useCallback((group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let result = lines;
    if (filter === "expenditure")
      result = result.filter((l) => l.group !== "Income");
    else if (filter === "income")
      result = result.filter((l) => l.group === "Income");
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.cfr_code.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q),
      );
    }
    return result;
  }, [lines, filter, searchQuery]);

  const groups = useMemo(() => {
    const map = new Map<string, CFRLine[]>();
    for (const line of filtered) {
      const g = map.get(line.group) || [];
      g.push(line);
      map.set(line.group, g);
    }
    return map;
  }, [filtered]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80">
              <th className="w-8 px-2" />
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                CFR
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Description
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Budget
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Actual YTD
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Committed
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Variance
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Trend
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                RAG
              </th>
            </tr>
          </thead>
          <tbody>
            {GROUP_ORDER.filter((g) => groups.has(g)).map((groupName) => {
              const groupLines = groups.get(groupName)!;
              const GroupIcon = GROUP_ICONS[groupName] || Wallet;
              const isCollapsed = collapsedGroups.has(groupName);
              const groupBudget = groupLines.reduce((s, l) => s + l.budget, 0);
              const groupActual = groupLines.reduce((s, l) => s + l.actual, 0);
              const groupCommitted = groupLines.reduce(
                (s, l) => s + l.committed,
                0,
              );
              const groupVariance = groupLines.reduce(
                (s, l) => s + l.variance,
                0,
              );

              return (
                <React.Fragment key={groupName}>
                  {/* Group header */}
                  <tr
                    className="bg-gray-50/80 dark:bg-gray-800/60 cursor-pointer hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-colors"
                    onClick={() => toggleGroup(groupName)}
                  >
                    <td className="px-2 py-2.5">
                      <ChevronRight
                        className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                      />
                    </td>
                    <td className="px-4 py-2.5" colSpan={2}>
                      <div className="flex items-center gap-2">
                        <GroupIcon className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                          {groupName}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">
                          ({groupLines.length} lines)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                      {fmt(groupBudget)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-700 dark:text-gray-300 tabular-nums">
                      {fmt(groupActual)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 tabular-nums">
                      {fmt(groupCommitted)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right text-xs font-bold tabular-nums ${groupVariance > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                    >
                      {groupVariance > 0 ? "+" : ""}
                      {fmt(groupVariance)}
                    </td>
                    <td />
                    <td />
                  </tr>
                  {/* Individual lines */}
                  <AnimatePresence>
                    {!isCollapsed &&
                      groupLines.map((line) => {
                        const rc = ragStyles(line.rag);
                        const isExpanded = expandedRow === line.cfr_code;
                        const sparklineColor =
                          line.rag === "red"
                            ? "#ef4444"
                            : line.rag === "amber"
                              ? "#f59e0b"
                              : "#22c55e";

                        return (
                          <React.Fragment key={line.cfr_code}>
                            <tr
                              className={`border-b border-gray-50 dark:border-gray-800 cursor-pointer transition-colors ${
                                isExpanded
                                  ? "bg-[#FFAA4C]/5 dark:bg-[#FFAA4C]/10"
                                  : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                              }`}
                              onClick={() =>
                                setExpandedRow(
                                  isExpanded ? null : line.cfr_code,
                                )
                              }
                            >
                              <td className="px-2 py-2.5">
                                <ChevronRight
                                  className={`h-3 w-3 text-gray-300 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                />
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="rounded bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-mono font-medium text-gray-700 dark:text-gray-300">
                                  {line.cfr_code}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                                {line.description}
                              </td>
                              <td className="px-4 py-2.5 text-right text-xs font-medium text-gray-900 dark:text-white tabular-nums">
                                {fmt(line.budget)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-xs font-medium text-gray-900 dark:text-white tabular-nums">
                                {fmt(line.actual)}
                              </td>
                              <td className="px-4 py-2.5 text-right text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                                {fmt(line.committed)}
                              </td>
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span
                                    className={`text-xs font-medium tabular-nums ${line.variance > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                                  >
                                    {line.variance > 0 ? "+" : ""}
                                    {fmt(line.variance)}
                                  </span>
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${rc.badge}`}
                                  >
                                    {fmtPercent(line.variance_percent)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 flex justify-center">
                                <MiniSparkline
                                  data={line.monthly_profile}
                                  color={sparklineColor}
                                />
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span
                                  className={`inline-block h-2.5 w-2.5 rounded-full ${rc.dot} ring-2 ring-white dark:ring-gray-900`}
                                  title={line.rag}
                                />
                              </td>
                            </tr>
                            {isExpanded && (
                              <ExpandedRow
                                line={line}
                                organizationId={organizationId}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =====================================================
// 5. TOP VARIANCES (Visual Cards)
// =====================================================

function TopVariances({ lines }: { lines: CFRLine[] }) {
  const sorted = useMemo(
    () =>
      [...lines]
        .filter((l) => l.budget > 0)
        .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
        .slice(0, 5),
    [lines],
  );

  const maxBudget = Math.max(
    ...sorted.map((l) => Math.max(l.budget, l.actual)),
    1,
  );

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Top 5 Variances
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Biggest over/underspends against profiled budget
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-6 rounded-sm bg-gray-200 dark:bg-gray-600" />{" "}
            Budget
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-6 rounded-sm bg-[#FFAA4C]" />{" "}
            Actual
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((line) => {
          const rc = ragStyles(line.rag);
          const isOver = line.variance > 0;
          const budgetWidth = (line.budget / maxBudget) * 100;
          const actualWidth = (line.actual / maxBudget) * 100;

          return (
            <div
              key={line.cfr_code}
              className={`rounded-lg border p-4 ${rc.border} ${rc.bg} transition-colors`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${rc.dot}`}
                  />
                  <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {line.cfr_code} &mdash; {line.description}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <span
                    className={`text-sm font-bold tabular-nums ${isOver ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
                  >
                    {isOver ? "+" : ""}
                    {fmt(line.variance)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${rc.badge}`}
                  >
                    {fmtPercent(line.variance_percent)}
                  </span>
                </div>
              </div>

              {/* Mini bar chart */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[10px] text-gray-400 dark:text-gray-500 text-right">
                    Budget
                  </span>
                  <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-300 dark:bg-gray-600 rounded-full transition-all"
                      style={{ width: `${budgetWidth}%` }}
                    />
                  </div>
                  <span className="w-16 text-[10px] text-gray-500 dark:text-gray-400 tabular-nums text-right">
                    {fmt(line.budget)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-[10px] text-gray-400 dark:text-gray-500 text-right">
                    Actual
                  </span>
                  <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FFAA4C] rounded-full transition-all"
                      style={{ width: `${actualWidth}%` }}
                    />
                  </div>
                  <span className="w-16 text-[10px] text-gray-500 dark:text-gray-400 tabular-nums text-right">
                    {fmt(line.actual)}
                  </span>
                </div>
              </div>

              {/* DfE guidance callout for high variances */}
              {Math.abs(line.variance_percent) > 15 && (
                <div className="mt-2 flex items-start gap-1.5 rounded-md bg-white/60 dark:bg-gray-900/40 border border-gray-200/50 dark:border-gray-700/50 px-2.5 py-1.5">
                  <Lightbulb className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    {line.group === "Staffing"
                      ? "DfE Schools Financial Benchmarking suggests reviewing staffing structure when variances exceed 15%."
                      : line.group === "Energy"
                        ? "Consider DfE energy efficiency guidance. Energy costs should be reviewed against Display Energy Certificate ratings."
                        : line.group === "Supplies"
                          ? "Review supply costs against similar schools via DfE benchmarking. Consider procurement frameworks."
                          : "DfE Financial Benchmarking recommends investigating variances >15% against profiled budget."}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// =====================================================
// 6. DfE BEST PRACTICE SIDEBAR
// =====================================================

function DfEGuidanceBanner({ data }: { data: MonitorData }) {
  const tips = useMemo(() => {
    const t: {
      icon: React.ElementType;
      title: string;
      body: string;
      severity: "info" | "warning" | "critical";
    }[] = [];

    if (data.staffing_percent_of_income > data.staffing_target) {
      t.push({
        icon: Users,
        title: "Staffing ratio above ICFP threshold",
        body: `At ${data.staffing_percent_of_income.toFixed(1)}%, staffing exceeds the ${data.staffing_target}% target. Review your Integrated Curriculum and Financial Planning (ICFP) to identify efficiency opportunities.`,
        severity: "critical",
      });
    } else if (data.staffing_percent_of_income > data.staffing_target - 3) {
      t.push({
        icon: Users,
        title: "Staffing ratio approaching threshold",
        body: `At ${data.staffing_percent_of_income.toFixed(1)}%, staffing costs are within 3% of the ${data.staffing_target}% ICFP target. Monitor closely.`,
        severity: "warning",
      });
    }

    const energyLines = data.lines.filter((l) => l.group === "Energy");
    const highEnergyVar = energyLines.some(
      (l) => Math.abs(l.variance_percent) > 10,
    );
    if (highEnergyVar) {
      t.push({
        icon: Zap,
        title: "Energy variance above 10%",
        body: "Consider DfE energy efficiency guidance and check your Display Energy Certificate rating. Salix Finance offers interest-free loans for energy efficiency measures.",
        severity: "warning",
      });
    }

    const supplyLines = data.lines.filter(
      (l) =>
        l.description?.toLowerCase().includes("supply") || l.cfr_code === "E26",
    );
    const highSupply = supplyLines.some((l) => l.variance_percent > 10);
    if (highSupply) {
      t.push({
        icon: Package,
        title: "Supply teacher costs elevated",
        body: "Review supply teacher usage against your ICFP workforce plan. Consider internal cover arrangements or teaching school alliance partnerships.",
        severity: "warning",
      });
    }

    if (data.projected_surplus_deficit < 0) {
      t.push({
        icon: AlertTriangle,
        title: "Projected year-end deficit",
        body: `Current projections show a deficit of ${fmt(Math.abs(data.projected_surplus_deficit))}. Consider a recovery plan and discuss with your LA or trust finance lead.`,
        severity: "critical",
      });
    }

    if (t.length === 0) {
      t.push({
        icon: ShieldCheck,
        title: "Financial health looks good",
        body: "No immediate concerns flagged. Continue monitoring against your profiled budget and review at each period-end.",
        severity: "info",
      });
    }

    return t;
  }, [data]);

  const severityStyles = {
    info: "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30",
    warning:
      "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30",
    critical:
      "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30",
  };
  const severityIcon = {
    info: "text-blue-500",
    warning: "text-amber-500",
    critical: "text-red-500",
  };

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="h-4 w-4 text-[#FFAA4C]" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          DfE Best Practice Guidance
        </h3>
      </div>
      <div className="space-y-3">
        {tips.map((tip, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 rounded-lg border p-3 ${severityStyles[tip.severity]}`}
          >
            <tip.icon
              className={`h-4 w-4 flex-shrink-0 mt-0.5 ${severityIcon[tip.severity]}`}
            />
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                {tip.title}
              </p>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed mt-0.5">
                {tip.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// =====================================================
// 7. EXPECTED INCOME OVERLAY
// =====================================================

function ExpectedIncomeOverlay({ data }: { data: MonitorData }) {
  const [showDetails, setShowDetails] = useState(false);
  const expectedItems = useMemo(() => getSampleExpectedIncome(), []);

  const byConfidence = useMemo(() => {
    const result: Record<
      string,
      { items: ExpectedIncomeItem[]; total: number }
    > = {};
    for (const item of expectedItems) {
      if (!result[item.confidence])
        result[item.confidence] = { items: [], total: 0 };
      result[item.confidence].items.push(item);
      result[item.confidence].total += item.amount;
    }
    return result;
  }, [expectedItems]);

  const totalExpected = expectedItems.reduce((s, i) => s + i.amount, 0);
  const confirmedTotal =
    (byConfidence.confirmed?.total ?? 0) +
    (byConfidence.highly_likely?.total ?? 0);
  const fmsPosition = data.remaining;
  const truePosition = fmsPosition + totalExpected;
  const conservativePosition = fmsPosition + confirmedTotal;

  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="rounded-xl border-2 border-dashed border-[#FFAA4C]/40 bg-gradient-to-br from-[#FFAA4C]/5 to-transparent dark:from-[#FFAA4C]/10 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-[#FFAA4C]/15 p-2">
            <Banknote className="h-4 w-4 text-[#FFAA4C]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Expected Income &amp; True Position
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Known income not yet posted to the ledger
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs font-medium text-[#FFAA4C] hover:underline flex items-center gap-1"
        >
          {showDetails ? "Hide" : "Show"} details
          <ChevronDown
            className={`h-3 w-3 transition-transform ${showDetails ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* True Position Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            FMS Position
          </p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
            {fmt(fmsPosition)}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            As reported in ledger
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFAA4C]/5 rounded-bl-full" />
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
            + Expected Income
          </p>
          <p className="text-lg font-bold text-[#FFAA4C] mt-1">
            {fmt(totalExpected)}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">
            {expectedItems.length} items pending
          </p>
        </div>
        <div className="rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 p-4">
          <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            True Position
          </p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {fmt(truePosition)}
          </p>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/60">
            Conservative: {fmt(conservativePosition)}
          </p>
        </div>
      </div>

      {/* Confidence breakdown bar */}
      <div className="rounded-lg bg-gray-100 dark:bg-gray-800 h-3 overflow-hidden flex mb-2">
        {(["confirmed", "highly_likely", "likely", "uncertain"] as const).map(
          (conf) => {
            const amount = byConfidence[conf]?.total ?? 0;
            if (amount === 0) return null;
            const width = (amount / totalExpected) * 100;
            const colors = {
              confirmed: "bg-emerald-500",
              highly_likely: "bg-blue-500",
              likely: "bg-amber-400",
              uncertain: "bg-gray-400",
            };
            return (
              <div
                key={conf}
                className={`h-full ${colors[conf]} first:rounded-l-lg last:rounded-r-lg`}
                style={{ width: `${width}%` }}
              />
            );
          },
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 dark:text-gray-400">
        {(["confirmed", "highly_likely", "likely", "uncertain"] as const).map(
          (conf) => {
            const cc = CONFIDENCE_CONFIG[conf];
            const amount = byConfidence[conf]?.total ?? 0;
            if (amount === 0) return null;
            return (
              <span key={conf} className="flex items-center gap-1">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${cc.dot}`}
                />
                {cc.label}: {fmt(amount)}
              </span>
            );
          },
        )}
      </div>

      {/* Detailed items */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80">
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500 dark:text-gray-400">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-500 dark:text-gray-400">
                      Confidence
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
                      Expected
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500 dark:text-gray-400">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expectedItems.map((item) => {
                    const cc = CONFIDENCE_CONFIG[item.confidence];
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 dark:border-gray-800"
                      >
                        <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                          {item.description}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white tabular-nums">
                          {fmt(item.amount)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cc.color}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${cc.dot}`}
                            />
                            {cc.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 tabular-nums">
                          {new Date(item.expected_date).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                          {item.source}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50/80 dark:bg-gray-800/80">
                    <td className="px-4 py-2.5 font-bold text-gray-700 dark:text-gray-300">
                      Total Expected
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-[#FFAA4C] tabular-nums">
                      {fmt(totalExpected)}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =====================================================
// 9. FOOTER QUICK LINKS
// =====================================================

function FooterLinks() {
  const links = [
    {
      href: "/dashboard/finance/forecast",
      icon: Calculator,
      title: "Forecast Calculator",
      subtitle: "Next year projections",
    },
    {
      href: "/dashboard/finance/icfp",
      icon: Target,
      title: "ICFP Analysis",
      subtitle: "Workforce benchmarking",
    },
    {
      href: "/dashboard/finance/payroll",
      icon: BarChart3,
      title: "Payroll Analysis",
      subtitle: "Staff cost breakdown",
    },
    {
      href: "/dashboard/finance",
      icon: PoundSterling,
      title: "Finance Hub",
      subtitle: "Overview & alerts",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="group flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm transition-all hover:border-[#FFAA4C]/40 hover:bg-[#FFAA4C]/5 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#FFAA4C]/10 p-2 group-hover:bg-[#FFAA4C]/20 transition-colors">
              <link.icon className="h-4 w-4 text-[#FFAA4C]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {link.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {link.subtitle}
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#FFAA4C] transition-colors" />
        </Link>
      ))}
    </div>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

type TableFilter = "all" | "expenditure" | "income";

export default function BudgetMonitorPage() {
  const { organization } = useAuth();
  const orgId = organization?.id;

  const {
    data: apiResponse,
    error,
    isLoading,
  } = useSWR<{ data: MonitorData }>(
    orgId ? `/api/finance/monitor?organizationId=${orgId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  );

  const data = apiResponse?.data ?? (apiResponse as unknown as MonitorData);

  const [tableFilter, setTableFilter] = useState<TableFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Loading state
  if (isLoading || (!data && !error)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-[#FFAA4C] border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading budget data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data?.lines) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto rounded-full bg-red-100 dark:bg-red-900/30 p-3 w-fit">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            Unable to load budget data
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
            {error?.message ||
              "No budget data available. Import your FMS/Xero/Sage export to get started."}
          </p>
          <Link
            href="/dashboard/finance/import"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFAA4C] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#e99a3f] transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Import Ledger Data
          </Link>
        </div>
      </div>
    );
  }

  const asAtDate = new Date(data.as_at_date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6">
      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#FFAA4C]/10 p-2.5">
              <PoundSterling className="h-6 w-6 text-[#FFAA4C]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Budget Monitor
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {data.school_name} &middot; {data.financial_year} &middot;{" "}
                {data.pupil_count} pupils &middot; As at {asAtDate}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-xs">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              Month {data.months_elapsed} of {data.months_total}
            </span>
          </div>
          <span className="rounded-lg border border-[#FFAA4C]/30 bg-[#FFAA4C]/10 px-3 py-2 text-xs font-medium text-[#FFAA4C]">
            {data.budget_cycle === "la" ? "LA Maintained" : "Academy"}
          </span>
          <Link
            href="/dashboard/finance/import"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFAA4C] px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#e99a3f] transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            Import Data
          </Link>
        </div>
      </motion.div>

      {/* ── DEMO BANNER ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5"
      >
        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <span className="font-semibold">Demo Mode</span> &mdash; Showing
          sample data with seasonal budget profiling. Import your FMS/Xero/Sage
          export to see real figures.
        </p>
      </motion.div>

      {/* ── 1. HERO SUMMARY CARDS ── */}
      <HeroSummaryCards data={data} />

      {/* ── 2 & 3. SPEND PROFILE + STAFFING GAUGE ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SpendProfileChart
            lines={data.lines}
            monthsElapsed={data.months_elapsed}
          />
        </div>
        <div>
          <StaffingGauge
            percent={data.staffing_percent_of_income}
            target={data.staffing_target}
            staffingSpend={data.staffing_spend}
            totalIncome={data.total_income}
          />
        </div>
      </div>

      {/* ── 7. EXPECTED INCOME OVERLAY ── */}
      <ExpectedIncomeOverlay data={data} />

      {/* ── 4. BUDGET VS ACTUAL TABLE ── */}
      <motion.div variants={sectionVariants} initial="hidden" animate="visible">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Budget vs Actual by CFR Code
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click any row to drill down into monthly profile and transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search CFR code or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-8 pr-8 py-2 text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 shadow-sm focus:border-[#FFAA4C] focus:outline-none focus:ring-1 focus:ring-[#FFAA4C] w-56"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {/* Tabs */}
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5 shadow-sm">
              {(["all", "expenditure", "income"] as TableFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setTableFilter(f)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    tableFilter === f
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <BudgetTable
          lines={data.lines}
          filter={tableFilter}
          searchQuery={searchQuery}
          organizationId={orgId ?? ""}
        />
        <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">
          RAG: <span className="text-emerald-500">Green</span> = within 5% of
          profiled budget, <span className="text-amber-500">Amber</span> = 5-10%
          variance, <span className="text-red-500">Red</span> = &gt;10% variance
        </p>
      </motion.div>

      {/* ── 5 & 6. VARIANCES + DfE GUIDANCE ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TopVariances lines={data.lines} />
        <DfEGuidanceBanner data={data} />
      </div>

      {/* ── 9. FOOTER QUICK LINKS ── */}
      <FooterLinks />
    </div>
  );
}
