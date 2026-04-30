/**
 * KPI Dashboard - Comprehensive School Intelligence
 *
 * Top 10 KPIs that Ofsted inspectors and school improvement leads need:
 * 1. KS2 Combined Attainment
 * 2. KS2 Progress Scores (Reading, Writing, Maths)
 * 3. Overall Attendance %
 * 4. Persistent Absence %
 * 5. Disadvantaged Attainment Gap
 * 6. Prior Attainment Progress Analysis
 * 7. 3-Year Trend Analysis
 * 8. Demographic Contextualisation
 * 9. Subject-Specific Strengths/Weaknesses
 * 10. Workforce Stability Impact
 *
 * Uses data from school-intelligence-engine with LA and demographic cohort comparisons.
 */

"use client";

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  Database, ChevronDown, ChevronUp, Info, ArrowUpDown,
  GraduationCap, Users, BarChart3, Target, BookOpen, Calculator, CalendarX2,
} from 'lucide-react';

// Types matching the engine output
interface BenchmarkMetric {
  year: number;
  value: number;
}

interface KpiMetric {
  year: number;
  expected_standard_pct?: number;
  progress_score?: number | null;
  overall_pct?: number;
  persistent_absence_pct?: number;
  pct?: number;
  all_pupils_pct?: number;
  disadvantaged_pct?: number;
  gap_pp?: number;
}

interface LaBenchmarkData {
  la_name: string;
  la_code: string;
  school_count: number;
  ks2_combined: { year: number; expected_standard_pct: number }[];
  ks2_reading: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  ks2_writing: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  ks2_maths: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  disadvantaged_gap: { year: number; all_pupils_pct: number; disadvantaged_pct: number; gap_pp: number }[];
  attendance: { year: number; overall_pct: number; persistent_absence_pct: number }[];
  persistent_absence: { year: number; pct: number }[];
  three_year_trend: {
    ks2_combined_avg: number;
    attendance_avg: number;
    direction: "improving" | "stable" | "declining";
  } | null;
}

interface DemographicCohort {
  id: string;
  name: string;
  fsm_band: string;
  eal_band: string;
  sen_band: string;
  school_count: number;
  comparison_urns?: number[];
  avg_ks2_combined: number;
  avg_attendance: number;
  avg_persistent_absence?: number | null;
  avg_disadvantaged_gap?: number | null;
  avg_reading_progress?: number | null;
  avg_maths_progress?: number | null;
}

interface SchoolKpiData {
  ks2_combined?: { year: number; expected_standard_pct: number }[];
  ks2_reading?: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  ks2_writing?: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  ks2_maths?: { year: number; expected_standard_pct: number; progress_score: number | null }[];
  disadvantaged_gap?: { year: number; all_pupils_pct: number; disadvantaged_pct: number; gap_pp: number }[];
  attendance?: { year: number; overall_pct: number; persistent_absence_pct: number }[];
  persistent_absence?: { year: number; pct: number }[];
}

interface KpiDashboardProps {
  laBenchmarks: LaBenchmarkData;
  demographicCohort?: DemographicCohort | null;
  schoolData: SchoolKpiData;
}

// National benchmarks (IDSR thresholds)
const NATIONAL_BENCHMARKS = {
  ks2_combined_expected: 62, // 2025 national
  ks2_floor_standard: 60,
  ks2_progress_floor: -5,
  ks2_progress_coasting: -2.5,
  attendance_threshold: 95,
  attendance_national: 94.5,
  persistent_absence_threshold: 10,
  persistent_absence_national: 11.2,
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl p-3">
      <p className="text-xs font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          {entry.dataKey?.includes('pct') || entry.dataKey?.includes('expected') ? '%' : ''}
          {entry.dataKey?.includes('progress') ? ' score' : ''}
        </p>
      ))}
    </div>
  );
};

// Mini trend sparkline
function TrendSparkline({ data, color, inverse }: { data: number[]; color: string; inverse?: boolean }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 50;
    const y = 20 - ((val - min) / range) * 20;
    return `${x},${y}`;
  }).join(' ');

  const trend = data[data.length - 1] - data[0];
  const TrendIcon = trend > 0 === !inverse ? TrendingUp : trend < 0 === !inverse ? TrendingDown : Minus;
  const trendColor = trend > 0 === !inverse ? 'text-emerald-500' : trend < 0 === !inverse ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="flex items-center gap-1">
      <svg width="54" height="24" className="opacity-80">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
      </svg>
      <TrendIcon size={14} className={trendColor} />
    </div>
  );
}

// KPI Card Component
function KpiCard({
  icon: Icon,
  title,
  schoolValue,
  laValue,
  cohortValue,
  nationalValue,
  nationalBenchmark,
  unit = '%',
  inverse = false,
  threshold,
  trend,
  color,
  nationalNote,
  dataNote,
  expanded,
  onToggle,
  children,
}: {
  icon: any;
  title: string;
  schoolValue: number | null;
  laValue: number | null;
  cohortValue?: number | null;
  nationalValue?: number | null;
  nationalBenchmark?: number;
  unit?: string;
  inverse?: boolean;
  threshold?: { value: number; label: string; color: string };
  trend?: number[];
  color: string;
  nationalNote?: string;
  dataNote?: string;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  const isMetricValue = (value: number | null | undefined): value is number =>
    typeof value === 'number' && Number.isFinite(value);

  const formatValue = (value: number | null | undefined) =>
    isMetricValue(value) ? value : '—';

  const getValueColor = (value: number | null | undefined) => {
    if (!isMetricValue(value)) return 'text-gray-400';

    // Check threshold first
    if (threshold) {
      const atThreshold = inverse ? value > threshold.value : value < threshold.value;
      if (atThreshold) return 'text-red-600 font-bold';
    }

    // Compare to LA
    if (isMetricValue(laValue)) {
      const betterThanLa = inverse ? value < laValue : value > laValue;
      if (betterThanLa) return 'text-emerald-600 font-semibold';
      if (!inverse && value >= laValue - 3) return 'text-amber-600';
      if (inverse && value <= laValue + 3) return 'text-amber-600';
    }

    return 'text-gray-700';
  };

  const getDifference = (value: number | null | undefined, compare: number | null | undefined) => {
    if (!isMetricValue(value) || !isMetricValue(compare)) return null;
    const diff = value - compare;
    const isGood = inverse ? diff < 0 : diff > 0;
    return { diff, isGood };
  };

  const schoolDiff = getDifference(schoolValue, laValue);
  const cohortDiff = getDifference(schoolValue, cohortValue);
  const isBelowThreshold = threshold && isMetricValue(schoolValue)
    ? inverse ? schoolValue > threshold.value : schoolValue < threshold.value
    : false;
  const iconTone = color.replace('bg-', 'text-').replace('-500', '-600');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <Icon size={16} className={iconTone} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            {dataNote && <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{dataNote}</p>}
          </div>
        </div>
        {threshold && isMetricValue(schoolValue) && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
            isBelowThreshold
              ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
          }`}>
            {threshold.label}
          </span>
        )}
      </div>

      {/* Main values */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3">
          {/* School */}
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">You</p>
            <p className={`text-lg font-bold ${getValueColor(schoolValue)}`}>
              {formatValue(schoolValue)}
              {isMetricValue(schoolValue) && <span className="text-xs font-normal text-muted-foreground">{unit}</span>}
            </p>
            {schoolDiff && (
              <p className={`text-[10px] font-medium ${schoolDiff.isGood ? 'text-emerald-600' : 'text-red-600'}`}>
                {schoolDiff.diff > 0 ? '+' : ''}{schoolDiff.diff.toFixed(1)} vs LA
              </p>
            )}
          </div>

          {/* LA */}
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">LA</p>
            <p className="text-lg font-semibold text-foreground">
              {formatValue(laValue)}
              {isMetricValue(laValue) && <span className="text-xs text-muted-foreground">{unit}</span>}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {isMetricValue(laValue) && nationalBenchmark
                ? `${laValue >= nationalBenchmark ? '+' : ''}${(laValue - nationalBenchmark).toFixed(1)} vs nat`
                : 'Local avg'}
            </p>
          </div>

          {/* Cohort */}
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Similar</p>
            <p className="text-lg font-semibold text-sky-700 dark:text-sky-300">
              {formatValue(cohortValue)}
              {isMetricValue(cohortValue) && <span className="text-xs text-muted-foreground">{unit}</span>}
            </p>
            {cohortDiff && (
              <p className={`text-[10px] font-medium ${cohortDiff.isGood ? 'text-emerald-600' : 'text-red-600'}`}>
                {cohortDiff.diff > 0 ? '+' : ''}{cohortDiff.diff.toFixed(1)} vs cohort
              </p>
            )}
          </div>

          {/* National */}
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">England</p>
            <p className="text-lg font-semibold text-foreground/80">
              {formatValue(nationalValue)}
              {isMetricValue(nationalValue) && <span className="text-xs text-muted-foreground">{unit}</span>}
            </p>
            {nationalNote ? (
              <p className="text-[10px] text-muted-foreground">{nationalNote}</p>
            ) : nationalBenchmark && (
              <p className="text-[10px] text-muted-foreground">
                {inverse ? '>' : '<'}{nationalBenchmark} threshold
              </p>
            )}
          </div>
        </div>

        {/* Trend and expand */}
        <div className="flex items-center justify-between mt-3">
          {trend && trend.length >= 2 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">3-year trend:</span>
              <TrendSparkline data={trend} color={color.replace('bg-', '').replace('-500', '-600')} inverse={inverse} />
            </div>
          )}
          {children && (
            <button
              onClick={onToggle}
              className="flex items-center gap-1 text-[10px] text-sky-600 hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-200"
            >
              {expanded ? (
                <>Hide details <ChevronUp size={14} /></>
              ) : (
                <>View details <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 overflow-hidden"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Main Dashboard Component
export function KpiDashboard({ laBenchmarks, demographicCohort, schoolData }: KpiDashboardProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getMetricValue = <T extends { year: number }>(row: T, valueKey?: keyof T): number | null => {
    const value = valueKey
      ? row[valueKey]
      : (row as any).value ?? (row as any).expected_standard_pct ?? (row as any).pct;
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  };

  // Helper to get latest available value, not the latest row if that field is suppressed/null
  const getLatest = <T extends { year: number }>(data?: T[], valueKey?: keyof T): number | null => {
    if (!data || data.length === 0) return null;
    for (let i = data.length - 1; i >= 0; i -= 1) {
      const value = getMetricValue(data[i], valueKey);
      if (value !== null) return value;
    }
    return null;
  };

  const getLatestYear = <T extends { year: number }>(data?: T[], valueKey?: keyof T): number | null => {
    if (!data || data.length === 0) return null;
    for (let i = data.length - 1; i >= 0; i -= 1) {
      const value = getMetricValue(data[i], valueKey);
      if (value !== null) return data[i].year;
    }
    return null;
  };

  const formatLatestYears = (schoolYear: number | null, laYear?: number | null) => {
    if (!schoolYear && !laYear) return undefined;
    if (!schoolYear && laYear) return `School value unavailable; LA latest ${laYear}`;
    if (schoolYear && !laYear) return `Latest DfE year: ${schoolYear}`;
    if (schoolYear && laYear && schoolYear !== laYear) return `Latest: school ${schoolYear}; LA ${laYear}`;
    return `Latest DfE year: ${schoolYear}`;
  };

  // Helper to get trend values
  const getTrend = <T extends { year: number }>(data?: T[], valueKey?: keyof T): number[] => {
    if (!data || data.length < 2) return [];
    return data
      .map((d) => getMetricValue(d, valueKey))
      .filter((value): value is number => value !== null)
      .slice(-3);
  };

  // Get latest values
  const schoolKs2 = getLatest(schoolData.ks2_combined);
  const laKs2 = getLatest(laBenchmarks.ks2_combined);
  const cohortKs2 = demographicCohort?.avg_ks2_combined ?? null;

  const schoolReading = getLatest(schoolData.ks2_reading, 'expected_standard_pct');
  const laReading = getLatest(laBenchmarks.ks2_reading, 'expected_standard_pct');

  const schoolReadingProgress = getLatest(schoolData.ks2_reading, 'progress_score');
  const laReadingProgress = getLatest(laBenchmarks.ks2_reading, 'progress_score');

  const schoolMaths = getLatest(schoolData.ks2_maths, 'expected_standard_pct');
  const laMaths = getLatest(laBenchmarks.ks2_maths, 'expected_standard_pct');

  const schoolMathsProgress = getLatest(schoolData.ks2_maths, 'progress_score');
  const laMathsProgress = getLatest(laBenchmarks.ks2_maths, 'progress_score');

  const schoolAttendance = getLatest(schoolData.attendance, 'overall_pct');
  const laAttendance = getLatest(laBenchmarks.attendance, 'overall_pct');
  const cohortAttendance = demographicCohort?.avg_attendance ?? null;

  const schoolPa = getLatest(schoolData.persistent_absence, 'pct');
  const laPa = getLatest(laBenchmarks.persistent_absence, 'pct');
  const cohortPa = demographicCohort?.avg_persistent_absence ?? null;

  const schoolGap = getLatest(schoolData.disadvantaged_gap, 'gap_pp');
  const laGap = getLatest(laBenchmarks.disadvantaged_gap, 'gap_pp');
  const cohortGap = demographicCohort?.avg_disadvantaged_gap ?? null;
  const cohortReadingProgress = demographicCohort?.avg_reading_progress ?? null;
  const cohortMathsProgress = demographicCohort?.avg_maths_progress ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-6 shadow-sm"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <BarChart3 size={24} className="text-blue-400" />
              School Intelligence Dashboard
            </h2>
            <p className="text-muted-foreground mt-2">
              Comparing against <strong>{laBenchmarks.school_count}</strong> schools in <strong>{laBenchmarks.la_name}</strong>
              {demographicCohort && (
                <> and <strong>{demographicCohort.school_count}</strong> schools with similar intakes</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-muted/30 border border-border rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <Database size={14} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">DfE Data</span>
            </div>
            {laBenchmarks.three_year_trend && (
              <div className={`rounded-full px-3 py-1.5 flex items-center gap-1.5 ${
                laBenchmarks.three_year_trend.direction === 'improving'
                  ? 'bg-muted/30 border border-border'
                  : laBenchmarks.three_year_trend.direction === 'declining'
                    ? 'bg-muted/30 border border-border'
                    : 'bg-muted/30 border border-border'
              }`}>
                {laBenchmarks.three_year_trend.direction === 'improving' ? (
                  <TrendingUp size={14} className="text-emerald-300" />
                ) : laBenchmarks.three_year_trend.direction === 'declining' ? (
                  <TrendingDown size={14} className="text-red-300" />
                ) : (
                  <Minus size={14} className="text-gray-300" />
                )}
                <span className="text-xs font-semibold text-muted-foreground">
                  {laBenchmarks.three_year_trend.direction} LA trend
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* 1. KS2 Combined Attainment */}
        <KpiCard
          icon={GraduationCap}
          title="KS2 Combined (RWM+)"
          dataNote={formatLatestYears(getLatestYear(schoolData.ks2_combined), getLatestYear(laBenchmarks.ks2_combined))}
          schoolValue={schoolKs2}
          laValue={laKs2}
          cohortValue={cohortKs2}
          nationalValue={NATIONAL_BENCHMARKS.ks2_combined_expected}
          nationalBenchmark={NATIONAL_BENCHMARKS.ks2_floor_standard}
          threshold={{ value: NATIONAL_BENCHMARKS.ks2_floor_standard, label: 'Floor standard', color: 'red' }}
          trend={getTrend(schoolData.ks2_combined)}
          color="bg-indigo-500"
          expanded={expandedCards.has('ks2-combined')}
          onToggle={() => toggleCard('ks2-combined')}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={
                schoolData.ks2_combined?.map(d => ({
                  year: d.year,
                  School: d.expected_standard_pct,
                  'LA Average': laBenchmarks.ks2_combined.find(l => l.year === d.year)?.expected_standard_pct,
                  National: NATIONAL_BENCHMARKS.ks2_combined_expected,
                })) || []
              }>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#6b7280" />
                <YAxis domain={[40, 100]} tick={{ fontSize: 10 }} stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={NATIONAL_BENCHMARKS.ks2_floor_standard} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Floor standard', position: 'left', fontSize: 9, fill: '#ef4444' }} />
                <Line type="monotone" dataKey="School" stroke="#4f46e5" strokeWidth={2.5} dot={{ fill: '#fff', r: 3 }} />
                <Line type="monotone" dataKey="LA Average" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="National" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </KpiCard>

        {/* 3. Overall Attendance */}
        <KpiCard
          icon={Users}
          title="Overall Attendance"
          dataNote={formatLatestYears(getLatestYear(schoolData.attendance, 'overall_pct'), getLatestYear(laBenchmarks.attendance, 'overall_pct'))}
          schoolValue={schoolAttendance}
          laValue={laAttendance}
          cohortValue={cohortAttendance}
          nationalValue={NATIONAL_BENCHMARKS.attendance_national}
          nationalBenchmark={NATIONAL_BENCHMARKS.attendance_threshold}
          threshold={{ value: NATIONAL_BENCHMARKS.attendance_threshold, label: 'Ofsted flag', color: 'red' }}
          trend={getTrend(schoolData.attendance, 'overall_pct')}
          color="bg-emerald-500"
          expanded={expandedCards.has('attendance')}
          onToggle={() => toggleCard('attendance')}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={
                schoolData.attendance?.map(d => ({
                  year: d.year,
                  School: d.overall_pct,
                  'LA Average': laBenchmarks.attendance.find(l => l.year === d.year)?.overall_pct,
                  National: NATIONAL_BENCHMARKS.attendance_national,
                })) || []
              }>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#6b7280" />
                <YAxis domain={[85, 100]} tick={{ fontSize: 10 }} stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={NATIONAL_BENCHMARKS.attendance_threshold} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Ofsted concern', position: 'insideTopLeft', fontSize: 9, fill: '#f59e0b' }} />
                <Line type="monotone" dataKey="School" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#fff', r: 3 }} />
                <Line type="monotone" dataKey="LA Average" stroke="#34d399" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="National" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </KpiCard>

        {/* 4. Persistent Absence */}
        <KpiCard
          icon={CalendarX2}
          title="Persistent Absence"
          dataNote={formatLatestYears(getLatestYear(schoolData.persistent_absence, 'pct'), getLatestYear(laBenchmarks.persistent_absence, 'pct'))}
          schoolValue={schoolPa}
          laValue={laPa}
          cohortValue={cohortPa}
          nationalValue={NATIONAL_BENCHMARKS.persistent_absence_national}
          nationalBenchmark={NATIONAL_BENCHMARKS.persistent_absence_threshold}
          inverse
          threshold={{ value: NATIONAL_BENCHMARKS.persistent_absence_threshold, label: 'DfE concern', color: 'red' }}
          trend={getTrend(schoolData.persistent_absence, 'pct')}
          color="bg-amber-500"
          expanded={expandedCards.has('pa')}
          onToggle={() => toggleCard('pa')}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={
                schoolData.persistent_absence?.map(d => ({
                  year: d.year,
                  School: d.pct,
                  'LA Average': laBenchmarks.persistent_absence.find(l => l.year === d.year)?.pct,
                  National: NATIONAL_BENCHMARKS.persistent_absence_national,
                })) || []
              }>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#6b7280" />
                <YAxis domain={[0, 25]} tick={{ fontSize: 10 }} stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={NATIONAL_BENCHMARKS.persistent_absence_threshold} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'DfE concern', position: 'insideTopLeft', fontSize: 9, fill: '#ef4444' }} />
                <Line type="monotone" dataKey="School" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#fff', r: 3 }} />
                <Line type="monotone" dataKey="LA Average" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="National" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </KpiCard>

        {/* 5. Disadvantaged Gap */}
        <KpiCard
          icon={Target}
          title="Disadvantaged Attainment Gap"
          dataNote={formatLatestYears(getLatestYear(schoolData.disadvantaged_gap, 'gap_pp'), getLatestYear(laBenchmarks.disadvantaged_gap, 'gap_pp'))}
          schoolValue={schoolGap}
          laValue={laGap}
          cohortValue={cohortGap}
          nationalValue={null}
          nationalNote="No single DfE threshold"
          inverse
          trend={schoolData.disadvantaged_gap?.slice(-3).map(d => d.gap_pp ?? 0)}
          color="bg-purple-500"
          expanded={expandedCards.has('gap')}
          onToggle={() => toggleCard('gap')}
        >
          <div className="space-y-3">
            <p className="text-xs text-gray-600">
              The gap between disadvantaged pupils (FSM) and their peers. Lower is better.
              National average gap is approximately <strong>20-25 percentage points</strong>.
            </p>
            {schoolData.disadvantaged_gap && schoolData.disadvantaged_gap.length > 0 && (
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={
                    schoolData.disadvantaged_gap.map(d => ({
                      year: d.year,
                      'Your Gap': d.gap_pp,
                      'LA Gap': laBenchmarks.disadvantaged_gap.find(l => l.year === d.year)?.gap_pp,
                    }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#6b7280" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Your Gap" fill="#8b5cf6" />
                    <Bar dataKey="LA Gap" fill="#a78bfa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </KpiCard>

        {/* 2. KS2 Reading Progress */}
        <KpiCard
          icon={BookOpen}
          title="KS2 Reading Progress"
          dataNote={formatLatestYears(getLatestYear(schoolData.ks2_reading, 'progress_score'), getLatestYear(laBenchmarks.ks2_reading, 'progress_score'))}
          schoolValue={schoolReadingProgress}
          laValue={laReadingProgress}
          cohortValue={cohortReadingProgress}
          nationalValue={0}
          nationalNote="National mean"
          unit=" score"
          threshold={{ value: NATIONAL_BENCHMARKS.ks2_progress_floor, label: 'Floor standard', color: 'red' }}
          trend={getTrend(schoolData.ks2_reading, 'progress_score')}
          color="bg-blue-500"
          expanded={expandedCards.has('reading-progress')}
          onToggle={() => toggleCard('reading-progress')}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={
                schoolData.ks2_reading?.map(d => ({
                  year: d.year,
                  School: d.progress_score ?? undefined,
                  'LA Average': laBenchmarks.ks2_reading.find(l => l.year === d.year)?.progress_score,
                })) || []
              }>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#6b7280" />
                <YAxis domain={[-7, 5]} tick={{ fontSize: 10 }} stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="2 2" />
                <ReferenceLine y={NATIONAL_BENCHMARKS.ks2_progress_floor} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Floor', position: 'left', fontSize: 9, fill: '#ef4444' }} />
                <Line type="monotone" dataKey="School" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#fff', r: 3 }} />
                <Line type="monotone" dataKey="LA Average" stroke="#60a5fa" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </KpiCard>

        {/* 2. KS2 Maths Progress */}
        <KpiCard
          icon={Calculator}
          title="KS2 Maths Progress"
          dataNote={formatLatestYears(getLatestYear(schoolData.ks2_maths, 'progress_score'), getLatestYear(laBenchmarks.ks2_maths, 'progress_score'))}
          schoolValue={schoolMathsProgress}
          laValue={laMathsProgress}
          cohortValue={cohortMathsProgress}
          nationalValue={0}
          nationalNote="National mean"
          unit=" score"
          threshold={{ value: NATIONAL_BENCHMARKS.ks2_progress_floor, label: 'Floor standard', color: 'red' }}
          trend={getTrend(schoolData.ks2_maths, 'progress_score')}
          color="bg-cyan-500"
          expanded={expandedCards.has('maths-progress')}
          onToggle={() => toggleCard('maths-progress')}
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={
                schoolData.ks2_maths?.map(d => ({
                  year: d.year,
                  School: d.progress_score ?? undefined,
                  'LA Average': laBenchmarks.ks2_maths.find(l => l.year === d.year)?.progress_score,
                })) || []
              }>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} stroke="#6b7280" />
                <YAxis domain={[-7, 5]} tick={{ fontSize: 10 }} stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="2 2" />
                <ReferenceLine y={NATIONAL_BENCHMARKS.ks2_progress_floor} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Floor', position: 'left', fontSize: 9, fill: '#ef4444' }} />
                <Line type="monotone" dataKey="School" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#fff', r: 3 }} />
                <Line type="monotone" dataKey="LA Average" stroke="#22d3ee" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </KpiCard>

      </div>

      {/* Context info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-4 flex items-start gap-3"
      >
        <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700 leading-relaxed">
          <strong className="text-gray-900">Understanding these comparisons:</strong>{' '}
          <strong>LA (Local Authority)</strong> averages include all primary schools in {laBenchmarks.la_name}.
          {demographicCohort && (
            <> <strong>Similar schools</strong> are matched by FSM%, EAL%, and SEN% profiles for fairer comparison. </>
          )}
          <strong>National</strong> benchmarks are from DfE performance tables. Key thresholds: KS2 floor standard = 60%,
          Attendance {"<"} 95% = Ofsted concern, Persistent absence {">"} 10% = DfE concern.
        </div>
      </motion.div>
    </div>
  );
}

// Export types for use in pages
export type { LaBenchmarkData, DemographicCohort, SchoolKpiData };
