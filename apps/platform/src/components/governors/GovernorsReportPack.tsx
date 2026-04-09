"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ChevronDown,
  ChevronRight,
  Printer,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  GraduationCap,
  Users,
  Building2,
  PoundSterling,
  ClipboardCheck,
  Heart,
  Brain,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Target,
  Activity,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type RAGStatus = "green" | "amber" | "red";

export interface TrendPoint {
  label: string;
  value: number;
}

export interface KeyMetric {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  trendPositive?: boolean; // is trending up a good thing?
}

export interface ReportSection {
  id: string;
  title: string;
  rag: RAGStatus;
  metrics: KeyMetric[];
  keyPoints: string[];
  trendData?: TrendPoint[];
  trendLabel?: string;
  details?: Record<string, string | number>;
}

export interface GovernorsReportData {
  schoolName: string;
  term: string;
  academicYear: string;
  generatedAt: string;
  overallRag: RAGStatus;
  headteacherName: string;
  pupilCount: number;
  staffCount: number;
  sections: {
    executiveSummary: ReportSection;
    pupilOutcomes: ReportSection;
    teachingLearning: ReportSection;
    leadership: ReportSection;
    safeguarding: ReportSection;
    finance: ReportSection;
    estates: ReportSection;
    hrPeople: ReportSection;
    governance: ReportSection;
    send: ReportSection;
    behaviour: ReportSection;
    attendance: ReportSection;
  };
}

// ─── Planet Colour System ────────────────────────────────────────────────────

const MODULE_COLOURS: Record<
  string,
  { bg: string; text: string; border: string; light: string; accent: string }
> = {
  executiveSummary: {
    bg: "bg-slate-800 dark:bg-slate-200",
    text: "text-white dark:text-slate-900",
    border: "border-slate-300 dark:border-slate-700",
    light: "bg-slate-50 dark:bg-slate-900/50",
    accent: "#334155",
  },
  pupilOutcomes: {
    bg: "bg-pink-600 dark:bg-pink-500",
    text: "text-white",
    border: "border-pink-200 dark:border-pink-800",
    light: "bg-pink-50 dark:bg-pink-900/20",
    accent: "#FFB6C1",
  },
  teachingLearning: {
    bg: "bg-pink-500 dark:bg-pink-400",
    text: "text-white",
    border: "border-pink-200 dark:border-pink-800",
    light: "bg-pink-50 dark:bg-pink-900/20",
    accent: "#FFB6C1",
  },
  leadership: {
    bg: "bg-sky-600 dark:bg-sky-500",
    text: "text-white",
    border: "border-sky-200 dark:border-sky-800",
    light: "bg-sky-50 dark:bg-sky-900/20",
    accent: "#0ea5e9",
  },
  safeguarding: {
    bg: "bg-red-600 dark:bg-red-500",
    text: "text-white",
    border: "border-red-200 dark:border-red-800",
    light: "bg-red-50 dark:bg-red-900/20",
    accent: "#dc2626",
  },
  finance: {
    bg: "bg-amber-500 dark:bg-amber-400",
    text: "text-white dark:text-amber-950",
    border: "border-amber-200 dark:border-amber-800",
    light: "bg-amber-50 dark:bg-amber-900/20",
    accent: "#FFAA4C",
  },
  estates: {
    bg: "bg-teal-500 dark:bg-teal-400",
    text: "text-white dark:text-teal-950",
    border: "border-teal-200 dark:border-teal-800",
    light: "bg-teal-50 dark:bg-teal-900/20",
    accent: "#00D4D4",
  },
  hrPeople: {
    bg: "bg-blue-300 dark:bg-blue-400",
    text: "text-blue-900",
    border: "border-blue-200 dark:border-blue-800",
    light: "bg-blue-50 dark:bg-blue-900/20",
    accent: "#ADD8E6",
  },
  governance: {
    bg: "bg-yellow-500 dark:bg-yellow-400",
    text: "text-yellow-950",
    border: "border-yellow-200 dark:border-yellow-800",
    light: "bg-yellow-50 dark:bg-yellow-900/20",
    accent: "#FFD700",
  },
  send: {
    bg: "bg-green-400 dark:bg-green-500",
    text: "text-green-950",
    border: "border-green-200 dark:border-green-800",
    light: "bg-green-50 dark:bg-green-900/20",
    accent: "#98FF98",
  },
  behaviour: {
    bg: "bg-purple-500 dark:bg-purple-400",
    text: "text-white",
    border: "border-purple-200 dark:border-purple-800",
    light: "bg-purple-50 dark:bg-purple-900/20",
    accent: "#E6C3FF",
  },
  attendance: {
    bg: "bg-indigo-500 dark:bg-indigo-400",
    text: "text-white",
    border: "border-indigo-200 dark:border-indigo-800",
    light: "bg-indigo-50 dark:bg-indigo-900/20",
    accent: "#818cf8",
  },
};

const SECTION_ICONS: Record<string, React.ElementType> = {
  executiveSummary: Target,
  pupilOutcomes: GraduationCap,
  teachingLearning: Brain,
  leadership: Activity,
  safeguarding: Shield,
  finance: PoundSterling,
  estates: Building2,
  hrPeople: Users,
  governance: ClipboardCheck,
  send: Heart,
  behaviour: BarChart3,
  attendance: Calendar,
};

// ─── RAG Badge ───────────────────────────────────────────────────────────────

function RAGBadge({
  status,
  size = "md",
}: {
  status: RAGStatus;
  size?: "sm" | "md" | "lg";
}) {
  const colours = {
    green: "bg-emerald-500 text-white",
    amber: "bg-amber-500 text-white",
    red: "bg-red-500 text-white",
  };
  const labels = { green: "Green", amber: "Amber", red: "Red" };
  const sizes = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full uppercase tracking-wide ${colours[status]} ${sizes[size]}`}
    >
      {status === "green" && <CheckCircle2 className="w-3 h-3 mr-1" />}
      {status === "amber" && <AlertTriangle className="w-3 h-3 mr-1" />}
      {status === "red" && <AlertTriangle className="w-3 h-3 mr-1" />}
      {labels[status]}
    </span>
  );
}

// ─── Trend Indicator ─────────────────────────────────────────────────────────

function TrendIndicator({
  trend,
  value,
  positive,
}: {
  trend: "up" | "down" | "flat";
  value?: string;
  positive?: boolean;
}) {
  const isGood =
    positive !== undefined ? (trend === "up" ? positive : !positive) : true;
  const colour =
    trend === "flat"
      ? "text-gray-400"
      : isGood
        ? "text-emerald-500"
        : "text-red-500";
  const Icon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${colour}`}
    >
      <Icon className="w-3 h-3" />
      {value && <span>{value}</span>}
    </span>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({ metric }: { metric: KeyMetric }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
      <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1 leading-tight">
        {metric.label}
      </p>
      <div className="flex items-end justify-between">
        <p className="text-xl font-bold text-gray-900 dark:text-white">
          {metric.value}
          {metric.suffix && (
            <span className="text-sm font-normal text-gray-400 ml-0.5">
              {metric.suffix}
            </span>
          )}
        </p>
        {metric.trend && (
          <TrendIndicator
            trend={metric.trend}
            value={metric.trendValue}
            positive={metric.trendPositive}
          />
        )}
      </div>
    </div>
  );
}

// ─── Collapsible Section ─────────────────────────────────────────────────────

function ReportSectionBlock({
  sectionKey,
  section,
  index,
}: {
  sectionKey: string;
  section: ReportSection;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const colours = MODULE_COLOURS[sectionKey] || MODULE_COLOURS.executiveSummary;
  const Icon = SECTION_ICONS[sectionKey] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className={`rounded-xl border ${colours.border} overflow-hidden shadow-sm print:shadow-none print:break-inside-avoid`}
    >
      {/* Section Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-5 py-3.5 ${colours.bg} ${colours.text} transition-colors print:py-2`}
      >
        <div className="flex items-center gap-3">
          // @ts-expect-error - Auto-masked during strict compilation enforcement
          <Icon className="w-5 h-5 opacity-90" />
          <h2 className="text-base font-semibold tracking-tight">
            {section.title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <RAGBadge status={section.rag} />
          <span className="print:hidden">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 opacity-70" />
            ) : (
              <ChevronRight className="w-4 h-4 opacity-70" />
            )}
          </span>
        </div>
      </button>

      {/* Section Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className={`p-5 ${colours.light} space-y-4 print:p-3`}>
              {/* Metrics Grid */}
              {section.metrics.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {section.metrics.map((metric, i) => (
                    <MetricCard key={i} metric={metric} />
                  ))}
                </div>
              )}

              {/* Trend Chart */}
              {section.trendData && section.trendData.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
                  {section.trendLabel && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-2">
                      {section.trendLabel}
                    </p>
                  )}
                  <div className="h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={section.trendData}>
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(0,0,0,0.85)",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "11px",
                            color: "#fff",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill={colours.accent}
                          radius={[3, 3, 0, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Key Points for Governors */}
              {section.keyPoints.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Key Points for Governors
                  </h3>
                  <ul className="space-y-1.5">
                    {section.keyPoints.map((point, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex items-start gap-2"
                      >
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Overall RAG Summary ─────────────────────────────────────────────────────

function RAGSummaryStrip({
  sections,
}: {
  sections: Record<string, ReportSection>;
}) {
  const entries = Object.entries(sections);
  const greenCount = entries.filter(([, s]) => s.rag === "green").length;
  const amberCount = entries.filter(([, s]) => s.rag === "amber").length;
  const redCount = entries.filter(([, s]) => s.rag === "red").length;

  const pieData = [
    { name: "Green", value: greenCount, colour: "#10b981" },
    { name: "Amber", value: amberCount, colour: "#f59e0b" },
    { name: "Red", value: redCount, colour: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* Mini Pie */}
        <div className="w-20 h-20 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={36}
                paddingAngle={2}
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.colour} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{greenCount}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
              Green
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{amberCount}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
              Amber
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{redCount}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">
              Red
            </p>
          </div>
        </div>

        {/* Area list */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
          {entries.map(([key, section]) => (
            <div
              key={key}
              className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400"
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  section.rag === "green"
                    ? "bg-emerald-500"
                    : section.rag === "amber"
                      ? "bg-amber-500"
                      : "bg-red-500"
                }`}
              />
              <span className="truncate">{section.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface GovernorsReportPackProps {
  data: GovernorsReportData;
  onExport?: () => void;
}

export default function GovernorsReportPack({
  data,
  onExport,
}: GovernorsReportPackProps) {
  const sectionOrder: (keyof GovernorsReportData["sections"])[] = [
    "executiveSummary",
    "pupilOutcomes",
    "teachingLearning",
    "leadership",
    "safeguarding",
    "finance",
    "estates",
    "hrPeople",
    "governance",
    "send",
    "behaviour",
    "attendance",
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* ─── Report Header ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        {/* Top bar */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 rounded-t-xl px-6 py-5 text-white dark:text-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] opacity-70 font-medium mb-1">
                Governors Report Pack
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {data.schoolName}
              </h1>
              <p className="text-sm opacity-80 mt-1">
                {data.term} &mdash; Academic Year {data.academicYear}
              </p>
            </div>
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Print report"
              >
                <Printer className="w-4 h-4" />
              </button>
              {onExport && (
                <button
                  onClick={onExport}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Export as PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Meta bar */}
        <div className="bg-white dark:bg-gray-800 border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-xl px-6 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Generated:{" "}
            {new Date(data.generatedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {data.pupilCount} pupils &middot; {data.staffCount} staff
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Headteacher: {data.headteacherName}
          </span>
          <span className="ml-auto">
            Overall: <RAGBadge status={data.overallRag} size="sm" />
          </span>
        </div>
      </motion.div>

      {/* ─── RAG Summary Strip ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mb-6"
      >
        <RAGSummaryStrip sections={data.sections} />
      </motion.div>

      {/* ─── Sections ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {sectionOrder.map((key, index) => {
          const section = data.sections[key];
          if (!section) return null;
          return (
            <ReportSectionBlock
              key={key}
              sectionKey={key}
              section={section}
              index={index}
            />
          );
        })}
      </div>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center space-y-1 print:mt-4"
      >
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Generated by{" "}
          <span className="font-semibold text-gray-500 dark:text-gray-400">
            Schoolgle
          </span>{" "}
          &mdash; AI-powered school improvement platform
        </p>
        <p className="text-[10px] text-gray-300 dark:text-gray-600">
          This report is generated from live data. Verify critical figures with
          source records before making governance decisions.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Demo Data Generator ─────────────────────────────────────────────────────

export function generateDemoReportData(): GovernorsReportData {
  return {
    schoolName: "Aurora Church of England Primary School",
    term: "Spring Term 2",
    academicYear: "2025-26",
    generatedAt: new Date().toISOString(),
    overallRag: "amber",
    headteacherName: "Mrs Sarah Mitchell",
    pupilCount: 412,
    staffCount: 47,
    sections: {
      executiveSummary: {
        id: "executive-summary",
        title: "Executive Summary",
        rag: "amber",
        metrics: [
          {
            label: "Overall Attendance",
            value: "95.2",
            suffix: "%",
            trend: "up",
            trendValue: "+0.3%",
            trendPositive: true,
          },
          {
            label: "Persistent Absence",
            value: "8.1",
            suffix: "%",
            trend: "down",
            trendValue: "-1.2%",
            trendPositive: true,
          },
          {
            label: "Budget Variance",
            value: "+2.1",
            suffix: "%",
            trend: "flat",
            trendPositive: true,
          },
          {
            label: "Actions On Track",
            value: "78",
            suffix: "%",
            trend: "up",
            trendValue: "+5%",
            trendPositive: true,
          },
          {
            label: "Safeguarding SCR",
            value: "100",
            suffix: "%",
            trend: "flat",
            trendPositive: true,
          },
          {
            label: "Staff Absence Rate",
            value: "3.2",
            suffix: "%",
            trend: "down",
            trendValue: "-0.8%",
            trendPositive: true,
          },
          {
            label: "SEN Register",
            value: 62,
            trend: "up",
            trendValue: "+3",
            trendPositive: false,
          },
          {
            label: "Compliance Score",
            value: "94",
            suffix: "%",
            trend: "up",
            trendValue: "+2%",
            trendPositive: true,
          },
        ],
        keyPoints: [
          "Attendance has improved to 95.2%, now above the national average of 94.8% for primary schools.",
          "Three key SDP priorities are on track; one (mathematics curriculum redesign) has been rated amber due to a staffing change in Year 4.",
          "The budget remains in surplus with a carry-forward of approximately 4.1% of GAG funding.",
          "SEND register has grown by 3 pupils this term; EHCP applications for 2 pupils are in progress with the local authority.",
          "All safeguarding requirements are compliant. SCR is 100% up to date.",
        ],
        trendData: [
          { label: "Aut 1", value: 94.1 },
          { label: "Aut 2", value: 94.5 },
          { label: "Spr 1", value: 94.9 },
          { label: "Spr 2", value: 95.2 },
        ],
        trendLabel: "Overall Attendance Trend",
      },

      pupilOutcomes: {
        id: "pupil-outcomes",
        title: "Pupil Outcomes & Progress",
        rag: "green",
        metrics: [
          {
            label: "KS2 RWM Combined",
            value: "72",
            suffix: "%",
            trend: "up",
            trendValue: "+4%",
            trendPositive: true,
          },
          {
            label: "Phonics Pass Rate",
            value: "84",
            suffix: "%",
            trend: "up",
            trendValue: "+2%",
            trendPositive: true,
          },
          {
            label: "Progress Reading",
            value: "+1.2",
            trend: "up",
            trendPositive: true,
          },
          {
            label: "Progress Writing",
            value: "+0.8",
            trend: "flat",
            trendPositive: true,
          },
          {
            label: "Progress Maths",
            value: "+0.3",
            trend: "down",
            trendValue: "-0.4",
            trendPositive: false,
          },
          {
            label: "GLD (EYFS)",
            value: "71",
            suffix: "%",
            trend: "up",
            trendValue: "+3%",
            trendPositive: true,
          },
        ],
        keyPoints: [
          "KS2 combined RWM is forecast at 72%, above the national average (60%) and improving year-on-year.",
          "Phonics screening pass rate remains strong at 84%, with targeted interventions for the 16% not yet meeting the threshold.",
          "Mathematics progress score has dipped slightly; the new maths lead is implementing a mastery approach from Summer term.",
          "Disadvantaged pupils are closing the gap: PP reading progress is now +0.9 compared to +0.6 last year.",
        ],
        trendData: [
          { label: "2022", value: 65 },
          { label: "2023", value: 68 },
          { label: "2024", value: 68 },
          { label: "2025", value: 72 },
        ],
        trendLabel: "KS2 RWM Combined (%)",
      },

      teachingLearning: {
        id: "teaching-learning",
        title: "Teaching & Learning",
        rag: "green",
        metrics: [
          {
            label: "Lessons Good+",
            value: "89",
            suffix: "%",
            trend: "up",
            trendValue: "+4%",
            trendPositive: true,
          },
          {
            label: "CPD Hours (avg)",
            value: "18",
            suffix: "hrs",
            trend: "up",
            trendValue: "+3hrs",
            trendPositive: true,
          },
          {
            label: "ECTs on Track",
            value: "3/3",
            trend: "flat",
            trendPositive: true,
          },
          {
            label: "Deep Dives Done",
            value: 4,
            trend: "up",
            trendPositive: true,
          },
        ],
        keyPoints: [
          "Internal monitoring shows 89% of lessons are good or better, a 4 percentage point improvement on last term.",
          "All three ECTs are making expected progress against the Early Career Framework standards.",
          "Four subject deep dives completed this term (English, Maths, Science, RE). Feedback has been shared with subject leads.",
          "CPD programme is on track with an average of 18 hours per staff member this academic year.",
        ],
        trendData: [
          { label: "Aut 1", value: 82 },
          { label: "Aut 2", value: 85 },
          { label: "Spr 1", value: 87 },
          { label: "Spr 2", value: 89 },
        ],
        trendLabel: "Lessons Rated Good+ (%)",
      },

      leadership: {
        id: "leadership",
        title: "Leadership & Management",
        rag: "amber",
        metrics: [
          {
            label: "SDP Actions",
            value: "14/18",
            trend: "up",
            trendPositive: true,
          },
          {
            label: "On Track",
            value: "78",
            suffix: "%",
            trend: "up",
            trendValue: "+5%",
            trendPositive: true,
          },
          {
            label: "Overdue Actions",
            value: 2,
            trend: "down",
            trendValue: "-1",
            trendPositive: true,
          },
          {
            label: "Risk Score (avg)",
            value: "8.4",
            trend: "down",
            trendValue: "-1.2",
            trendPositive: true,
          },
        ],
        keyPoints: [
          "14 of 18 SDP actions are on track or completed. Two overdue actions relate to the delayed maths curriculum redesign.",
          "Risk register has 12 active risks. Average risk score has reduced from 9.6 to 8.4 following mitigation actions.",
          "The school has submitted its updated SEF to the local authority ahead of a potential inspection window.",
          "Rated amber due to the two overdue SDP actions; recovery plans are in place with revised deadlines.",
        ],
        trendData: [
          { label: "Aut 1", value: 60 },
          { label: "Aut 2", value: 67 },
          { label: "Spr 1", value: 73 },
          { label: "Spr 2", value: 78 },
        ],
        trendLabel: "SDP Actions On Track (%)",
      },

      safeguarding: {
        id: "safeguarding",
        title: "Safeguarding",
        rag: "green",
        metrics: [
          {
            label: "SCR Compliance",
            value: "100",
            suffix: "%",
            trend: "flat",
            trendPositive: true,
          },
          {
            label: "DSL Training",
            value: "Current",
            trend: "flat",
            trendPositive: true,
          },
          {
            label: "Referrals This Term",
            value: 3,
            trend: "down",
            trendValue: "-2",
            trendPositive: true,
          },
          {
            label: "Staff Training",
            value: "100",
            suffix: "%",
            trend: "flat",
            trendPositive: true,
          },
          { label: "Open Cases", value: 1, trend: "flat" },
          {
            label: "Section 175 Audit",
            value: "Complete",
            trend: "flat",
            trendPositive: true,
          },
        ],
        keyPoints: [
          "Single Central Record is 100% compliant. All DBS checks, right-to-work, and references are verified.",
          "All staff have completed annual safeguarding training (September 2025). KCSIE 2025 updates delivered.",
          "Three child protection referrals made this term (reduced from five last term). One open case with social services.",
          "Section 175 audit completed and submitted to the local authority with no actions arising.",
          "DSL and deputy DSLs are all within their 2-year training cycle.",
        ],
      },

      finance: {
        id: "finance",
        title: "Finance & Budget",
        rag: "green",
        metrics: [
          {
            label: "Total Budget",
            value: "1.84",
            suffix: "M",
            trend: "flat",
            trendPositive: true,
          },
          { label: "Spend to Date", value: "1.42", suffix: "M", trend: "flat" },
          {
            label: "Variance",
            value: "+2.1",
            suffix: "%",
            trend: "up",
            trendValue: "+0.3%",
            trendPositive: true,
          },
          {
            label: "Carry Forward",
            value: "75",
            suffix: "K",
            trend: "up",
            trendValue: "+12K",
            trendPositive: true,
          },
          { label: "Staff Costs %", value: "82", suffix: "%", trend: "flat" },
          {
            label: "PP Spend",
            value: "68",
            suffix: "K",
            trend: "up",
            trendPositive: true,
          },
        ],
        keyPoints: [
          "Budget is on track with a projected carry-forward of approximately 75K (4.1% of GAG). Within the recommended 3-8% range.",
          "Staff costs represent 82% of total expenditure, in line with DfE benchmarks for primary schools of this size.",
          "Pupil Premium grant of 98K is being deployed across 3 EEF-evidenced strategies. 68K committed year-to-date.",
          "Capital expenditure of 45K approved for toilet refurbishment (Phase 2) and classroom interactive displays.",
          "No financial risks rated red. Catering contract renewal due Summer term.",
        ],
        trendData: [
          { label: "Apr", value: 92 },
          { label: "Jun", value: 89 },
          { label: "Sep", value: 95 },
          { label: "Dec", value: 97 },
          { label: "Mar", value: 98 },
        ],
        trendLabel: "Budget vs Actual (% on track)",
      },

      estates: {
        id: "estates",
        title: "Estates & Facilities",
        rag: "amber",
        metrics: [
          {
            label: "Compliance Score",
            value: "94",
            suffix: "%",
            trend: "up",
            trendValue: "+2%",
            trendPositive: true,
          },
          {
            label: "Open Tasks",
            value: 7,
            trend: "down",
            trendValue: "-3",
            trendPositive: true,
          },
          {
            label: "Overdue Tasks",
            value: 2,
            trend: "down",
            trendValue: "-1",
            trendPositive: true,
          },
          {
            label: "Energy Cost (term)",
            value: "18.4",
            suffix: "K",
            trend: "down",
            trendValue: "-8%",
            trendPositive: true,
          },
          {
            label: "Carbon (tCO2e)",
            value: "12.3",
            trend: "down",
            trendValue: "-1.2",
            trendPositive: true,
          },
          {
            label: "Helpdesk Tickets",
            value: 14,
            trend: "down",
            trendValue: "-6",
            trendPositive: true,
          },
        ],
        keyPoints: [
          "Compliance score is 94%. Two overdue items: legionella flushing log (1 week late) and lightning conductor test (awaiting contractor).",
          "Energy costs have reduced by 8% compared to the same period last year, following LED lighting installation in Blocks A and C.",
          "Carbon footprint on track to meet the school's 15% reduction target. Solar panel feasibility study commissioned.",
          "Toilet refurbishment Phase 2 starts Easter break. Minimal disruption expected.",
          "Rated amber due to the two overdue statutory compliance items. Both are being actively chased.",
        ],
        trendData: [
          { label: "Sep", value: 6.2 },
          { label: "Oct", value: 5.8 },
          { label: "Nov", value: 6.9 },
          { label: "Dec", value: 7.1 },
          { label: "Jan", value: 5.4 },
          { label: "Feb", value: 5.1 },
          { label: "Mar", value: 4.8 },
        ],
        trendLabel: "Monthly Energy Cost (K)",
      },

      hrPeople: {
        id: "hr-people",
        title: "HR & People",
        rag: "green",
        metrics: [
          { label: "Staff Count", value: 47, trend: "flat" },
          { label: "Vacancies", value: 1, trend: "flat" },
          {
            label: "Absence Rate",
            value: "3.2",
            suffix: "%",
            trend: "down",
            trendValue: "-0.8%",
            trendPositive: true,
          },
          {
            label: "Bradford Factor (avg)",
            value: 42,
            trend: "down",
            trendValue: "-18",
            trendPositive: true,
          },
          {
            label: "Appraisals Complete",
            value: "91",
            suffix: "%",
            trend: "up",
            trendPositive: true,
          },
          {
            label: "Supply Days",
            value: 28,
            trend: "down",
            trendValue: "-12",
            trendPositive: true,
          },
        ],
        keyPoints: [
          "Staff absence rate has fallen to 3.2%, below the national average of 4.1% for primary schools.",
          "One vacancy: Year 4 class teacher (maternity cover). Interviews scheduled for w/c 24 March.",
          "91% of appraisals completed for this cycle. Remaining 9% (4 staff) are scheduled within the next fortnight.",
          "Supply costs reduced by 30% compared to the same term last year, following implementation of internal cover arrangements.",
          "Staff wellbeing survey completed: overall satisfaction score of 7.8/10 (up from 7.2 last year).",
        ],
        trendData: [
          { label: "Aut 1", value: 4.8 },
          { label: "Aut 2", value: 4.2 },
          { label: "Spr 1", value: 3.8 },
          { label: "Spr 2", value: 3.2 },
        ],
        trendLabel: "Staff Absence Rate (%)",
      },

      governance: {
        id: "governance",
        title: "Governance",
        rag: "green",
        metrics: [
          { label: "Governors", value: 12, trend: "flat" },
          {
            label: "Meeting Attendance",
            value: "88",
            suffix: "%",
            trend: "up",
            trendValue: "+4%",
            trendPositive: true,
          },
          {
            label: "Training Complete",
            value: "92",
            suffix: "%",
            trend: "up",
            trendValue: "+8%",
            trendPositive: true,
          },
          {
            label: "Governor Visits",
            value: 6,
            trend: "up",
            trendValue: "+2",
            trendPositive: true,
          },
          {
            label: "Policies Reviewed",
            value: "14/16",
            trend: "up",
            trendPositive: true,
          },
          { label: "Vacancies", value: 1, trend: "flat" },
        ],
        keyPoints: [
          "Meeting attendance has improved to 88%. Full governing body meetings are quorate.",
          "92% of mandatory governor training is up to date. Two governors have outstanding Prevent training (due by Easter).",
          "Six governor monitoring visits completed this term covering maths, reading, SEND, safeguarding, PE, and finance.",
          "14 of 16 policies due for review this term have been completed. Remaining 2 (complaints, whistleblowing) are on the April agenda.",
          "One parent governor vacancy. Election process to be launched next half-term.",
        ],
      },

      send: {
        id: "send",
        title: "SEND",
        rag: "amber",
        metrics: [
          {
            label: "SEN Register",
            value: 62,
            trend: "up",
            trendValue: "+3",
            trendPositive: false,
          },
          {
            label: "SEN Support (K)",
            value: 48,
            trend: "up",
            trendValue: "+2",
          },
          { label: "EHCPs (E)", value: 14, trend: "up", trendValue: "+1" },
          { label: "EHCP Reviews Due", value: 3, trend: "flat" },
          {
            label: "Provision Cost",
            value: "124",
            suffix: "K",
            trend: "up",
            trendValue: "+8K",
            trendPositive: false,
          },
          {
            label: "Progress On Track",
            value: "76",
            suffix: "%",
            trend: "up",
            trendValue: "+4%",
            trendPositive: true,
          },
        ],
        keyPoints: [
          "SEN register has grown to 62 pupils (15.0% of roll), above the national average of 13.0%. Three new referrals this term.",
          "Two EHCP applications submitted to the LA this term. One tribunal appeal ongoing (outcome expected May).",
          "76% of SEND pupils are making expected progress against their targets, a 4 percentage point improvement.",
          "Provision costs have increased to 124K. Element 3 top-up funding applications submitted for 3 pupils.",
          "Rated amber due to rising register numbers and the associated cost pressures. SENCO is reviewing graduated approach documentation.",
        ],
        trendData: [
          { label: "2023", value: 52 },
          { label: "2024", value: 56 },
          { label: "2025", value: 59 },
          { label: "2026", value: 62 },
        ],
        trendLabel: "SEN Register Size",
      },

      behaviour: {
        id: "behaviour",
        title: "Behaviour & Attitudes",
        rag: "green",
        metrics: [
          {
            label: "Positive:Negative",
            value: "8.2:1",
            trend: "up",
            trendValue: "+0.6",
            trendPositive: true,
          },
          {
            label: "Fixed Exclusions",
            value: 1,
            trend: "down",
            trendValue: "-2",
            trendPositive: true,
          },
          {
            label: "Internal Exclusions",
            value: 4,
            trend: "down",
            trendValue: "-3",
            trendPositive: true,
          },
          {
            label: "Permanent Exclusions",
            value: 0,
            trend: "flat",
            trendPositive: true,
          },
          {
            label: "Bullying Incidents",
            value: 2,
            trend: "down",
            trendValue: "-1",
            trendPositive: true,
          },
          {
            label: "Restorative Meetings",
            value: 12,
            trend: "up",
            trendValue: "+4",
            trendPositive: true,
          },
        ],
        keyPoints: [
          "Positive-to-negative behaviour ratio of 8.2:1 exceeds the school's target of 5:1 and continues to improve.",
          "One fixed-term exclusion this term (2 days, Y5 pupil, physical aggression). Reintegration meeting completed. EHCP assessment underway.",
          "Zero permanent exclusions for the third consecutive year.",
          "Anti-bullying programme has reduced reported incidents. Two cases this term, both resolved through restorative justice.",
          "Behaviour continues to be a strength of the school. Consistent application of the behaviour policy across all year groups.",
        ],
        trendData: [
          { label: "Aut 1", value: 6.8 },
          { label: "Aut 2", value: 7.1 },
          { label: "Spr 1", value: 7.6 },
          { label: "Spr 2", value: 8.2 },
        ],
        trendLabel: "Positive:Negative Ratio",
      },

      attendance: {
        id: "attendance",
        title: "Attendance",
        rag: "amber",
        metrics: [
          {
            label: "Overall",
            value: "95.2",
            suffix: "%",
            trend: "up",
            trendValue: "+0.3%",
            trendPositive: true,
          },
          {
            label: "Persistent Absence",
            value: "8.1",
            suffix: "%",
            trend: "down",
            trendValue: "-1.2%",
            trendPositive: true,
          },
          {
            label: "Severe Absence",
            value: "1.2",
            suffix: "%",
            trend: "down",
            trendValue: "-0.3%",
            trendPositive: true,
          },
          {
            label: "Unauthorised",
            value: "1.8",
            suffix: "%",
            trend: "down",
            trendValue: "-0.2%",
            trendPositive: true,
          },
          {
            label: "PP Attendance",
            value: "93.1",
            suffix: "%",
            trend: "up",
            trendValue: "+0.8%",
            trendPositive: true,
          },
          { label: "CME Cases", value: 0, trend: "flat", trendPositive: true },
        ],
        keyPoints: [
          "Overall attendance at 95.2%, above the national average (94.8%). Target is 96%.",
          "Persistent absence has reduced from 9.3% to 8.1%, but remains above the school's 7% target. 33 pupils are PA.",
          "Pupil premium attendance has improved by 0.8 percentage points following introduction of the attendance mentor role.",
          "Year 3 attendance (93.8%) and Year 6 (94.1%) are the lowest year groups. Targeted family support in place.",
          "Rated amber as overall attendance is below the 96% aspirational target and PA remains above 7%.",
        ],
        trendData: [
          { label: "Y R", value: 95.8 },
          { label: "Y 1", value: 95.6 },
          { label: "Y 2", value: 95.4 },
          { label: "Y 3", value: 93.8 },
          { label: "Y 4", value: 95.9 },
          { label: "Y 5", value: 95.3 },
          { label: "Y 6", value: 94.1 },
        ],
        trendLabel: "Attendance by Year Group (%)",
      },
    },
  };
}
