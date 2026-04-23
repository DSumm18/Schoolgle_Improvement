/**
 * LA Benchmark Card - Premium Design
 *
 * Displays 3-way comparison: School | LA | National
 * Features animated charts, DfE branding, and trend visualization
 */

"use client";

import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  Database, ChevronDown, ChevronUp, Info,
} from 'lucide-react';

interface BenchmarkMetric {
  year: number;
  value: number;
}

interface LaBenchmarkData {
  la_name: string;
  la_code: string;
  school_count: number;
  ks2_combined: BenchmarkMetric[];
  attendance: BenchmarkMetric[];
  persistent_absence: BenchmarkMetric[];
}

interface SchoolData {
  ks2_combined?: BenchmarkMetric[];
  attendance?: BenchmarkMetric[];
  persistent_absence?: BenchmarkMetric[];
}

interface LaBenchmarkCardProps {
  laBenchmarks: LaBenchmarkData;
  schoolData: SchoolData;
}

const NATIONAL_AVERAGES = {
  ks2_combined: 60,
  attendance: 94.5,
  persistent_absence: 11.2,
};

// Custom tooltip with better styling
const CustomTooltip = ({ active, payload, label, inverse }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-xl p-3">
      <p className="text-xs font-medium text-gray-700">{label}</p>
      {payload.map((entry: any, index: number) => (
        <p key={index} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {entry.value}%
        </p>
      ))}
    </div>
  );
};

// Metric Card with sparkline trend
function MetricCard({
  title,
  schoolValue,
  laValue,
  nationalValue,
  schoolTrend,
  laTrend,
  unit = '%',
  inverse,
  threshold,
  color,
}: {
  title: string;
  schoolValue: number;
  laValue: number;
  nationalValue: number;
  schoolTrend?: BenchmarkMetric[];
  laTrend?: BenchmarkMetric[];
  unit?: string;
  inverse?: boolean;
  threshold?: { value: number; label: string };
  color: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const betterThanLa = inverse ? schoolValue < laValue : schoolValue > laValue;
  const betterThanNational = inverse ? schoolValue < nationalValue : schoolValue > nationalValue;
  const atThreshold = threshold && (inverse ? schoolValue > threshold.value : schoolValue < threshold.value);

  const getStatusColor = () => {
    if (atThreshold) return 'text-red-600';
    if (betterThanLa && betterThanNational) return 'text-emerald-600';
    if (betterThanLa || betterThanNational) return 'text-amber-600';
    return 'text-gray-500';
  };

  const getStatusLabel = () => {
    if (atThreshold) return 'Below threshold';
    if (betterThanLa && betterThanNational) return 'Above both';
    if (betterThanLa) return 'Above LA';
    if (betterThanNational) return 'Above national';
    return 'Below both';
  };

  const diffFromLa = schoolValue - laValue;
  const diffFromNational = schoolValue - nationalValue;

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!schoolTrend || !laTrend) return [];
    const years = [...new Set([...schoolTrend, ...laTrend].map(d => d.year))].sort();
    return years.map(year => ({
      year: year.toString(),
      School: schoolTrend.find(d => d.year === year)?.value ?? null,
      'LA Average': laTrend.find(d => d.year === year)?.value ?? null,
      National: nationalValue,
    }));
  }, [schoolTrend, laTrend, nationalValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl border border-gray-200/80 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className={`px-4 py-3 bg-gradient-to-r ${color.replace('500', '50')} border-b border-gray-200/50`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
            <p className="text-[10px] text-gray-500">{getStatusLabel()}</p>
          </div>
          {atThreshold && (
            <div className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-[10px] font-medium">
              <AlertTriangle size={12} />
              {threshold.label}
            </div>
          )}
          {!atThreshold && betterThanLa && betterThanNational && (
            <CheckCircle2 size={18} className="text-emerald-600" />
          )}
        </div>
      </div>

      {/* Main values */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-3">
          {/* School */}
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">You</p>
            <p className={`text-2xl font-bold ${getStatusColor()}`}>
              {schoolValue}
              <span className="text-sm font-normal text-gray-400">{unit}</span>
            </p>
            {diffFromLa !== 0 && (
              <p className={`text-[10px] font-medium ${diffFromLa > 0 === !inverse ? 'text-emerald-600' : 'text-red-600'}`}>
                {diffFromLa > 0 === !inverse ? '+' : ''}{diffFromLa.toFixed(1)} vs LA
              </p>
            )}
          </div>

          {/* LA */}
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">LA</p>
            <p className="text-xl font-semibold text-gray-700">
              {laValue}
              <span className="text-xs text-gray-400">{unit}</span>
            </p>
            <p className="text-[10px] text-gray-400">Local avg</p>
          </div>

          {/* National */}
          <div className="text-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">England</p>
            <p className="text-xl font-semibold text-gray-600">
              {nationalValue}
              <span className="text-xs text-gray-400">{unit}</span>
            </p>
            <p className="text-[10px] text-gray-400">National avg</p>
          </div>
        </div>

        {/* Expandable chart */}
        {schoolTrend && laTrend && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-1 text-[10px] text-gray-500 hover:text-gray-700 py-1"
            >
              {expanded ? (
                <>Hide trend <ChevronUp size={12} /></>
              ) : (
                <>View 3-year trend <ChevronDown size={12} /></>
              )}
            </button>

            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mt-2"
              >
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 10 }}
                      stroke="#9ca3af"
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="#9ca3af"
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip content={<CustomTooltip inverse={inverse} />} />
                    <ReferenceLine
                      y={threshold?.value}
                      stroke={atThreshold ? '#ef4444' : '#d1d5db'}
                      strokeDasharray="3 3"
                      label={{ value: threshold?.label, position: 'topLeft', fontSize: 9, fill: '#9ca3af' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="School"
                      stroke={atThreshold ? '#ef4444' : betterThanLa ? '#10b981' : '#f59e0b'}
                      strokeWidth={2.5}
                      dot={{ fill: '#fff, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="LA Average"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                    <Line
                      type="monotone"
                      dataKey="National"
                      stroke="#9ca3af"
                      strokeWidth={1.5}
                      dot={false}
                      strokeDasharray="2 2"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// DfE badge component
function DfEBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-full px-3 py-1">
      <Database size={12} className="text-blue-600" />
      <span className="text-[10px] font-semibold text-blue-700">DfE Data</span>
    </div>
  );
}

export function LaBenchmarkCard({ laBenchmarks, schoolData }: LaBenchmarkCardProps) {
  const getLatestValue = (data?: BenchmarkMetric[]) => {
    if (!data || data.length === 0) return null;
    return data[data.length - 1]?.value ?? null;
  };

  const getTrendData = (schoolData?: BenchmarkMetric[], laData?: BenchmarkMetric[]) => {
    if (!schoolData || !laData) return undefined;
    return { schoolTrend: schoolData, laTrend: laData };
  };

  const schoolKs2 = getLatestValue(schoolData.ks2_combined);
  const laKs2 = getLatestValue(laBenchmarks.ks2_combined);
  const ks2Trends = getTrendData(schoolData.ks2_combined, laBenchmarks.ks2_combined);

  const schoolAttendance = getLatestValue(schoolData.attendance);
  const laAttendance = getLatestValue(laBenchmarks.attendance);
  const attendanceTrends = getTrendData(schoolData.attendance, laBenchmarks.attendance);

  const schoolPa = getLatestValue(schoolData.persistent_absence);
  const laPa = getLatestValue(laBenchmarks.persistent_absence);
  const paTrends = getTrendData(schoolData.persistent_absence, laBenchmarks.persistent_absence);

  const latestYear = laBenchmarks.ks2_combined[laBenchmarks.ks2_combined.length - 1]?.year;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200/80 shadow-lg overflow-hidden"
    >
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              Local Authority Benchmarks
            </h3>
            <p className="text-sm text-slate-300 mt-0.5">
              Compare against {laBenchmarks.school_count} schools in {laBenchmarks.la_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DfEBadge />
            {latestYear && (
              <span className="text-xs bg-white/10 text-white/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                {latestYear}/{latestYear + 1}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="p-6 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* KS2 Combined */}
          {schoolKs2 !== null && laKs2 !== null && ks2Trends && (
            <MetricCard
              title="KS2 Combined"
              schoolValue={schoolKs2}
              laValue={laKs2}
              nationalValue={NATIONAL_AVERAGES.ks2_combined}
              schoolTrend={ks2Trends.schoolTrend}
              laTrend={ks2Trends.laTrend}
              threshold={{ value: 60, label: 'Floor standard' }}
              color="bg-indigo-500"
            />
          )}

          {/* Attendance */}
          {schoolAttendance !== null && laAttendance !== null && attendanceTrends && (
            <MetricCard
              title="Overall Attendance"
              schoolValue={schoolAttendance}
              laValue={laAttendance}
              nationalValue={NATIONAL_AVERAGES.attendance}
              schoolTrend={attendanceTrends.schoolTrend}
              laTrend={attendanceTrends.laTrend}
              threshold={{ value: 95, label: 'Ofsted flag' }}
              color="bg-emerald-500"
            />
          )}

          {/* Persistent Absence */}
          {schoolPa !== null && laPa !== null && paTrends && (
            <MetricCard
              title="Persistent Absence"
              schoolValue={schoolPa}
              laValue={laPa}
              nationalValue={NATIONAL_AVERAGES.persistent_absence}
              schoolTrend={paTrends.schoolTrend}
              laTrend={paTrends.laTrend}
              inverse
              threshold={{ value: 10, label: 'DfE concern' }}
              color="bg-amber-500"
            />
          )}
        </div>

        {/* Context note */}
        <div className="mt-5 p-4 bg-blue-50/50 border border-blue-100/50 rounded-xl flex items-start gap-3">
          <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600 leading-relaxed">
            <strong className="text-gray-800">About LA comparisons:</strong>{' '}
            Local Authority averages include all primary schools in {laBenchmarks.la_name}.
            These comparisons are often more meaningful than national benchmarks as they reflect
            similar demographic profiles and local contexts. Consider factors like FSM%, EAL%, and
            mobility when interpreting differences.
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Compact version with better styling
export function LaBenchmarkCompact({ laBenchmarks, schoolData }: LaBenchmarkCardProps) {
  const getLatestValue = (data?: BenchmarkMetric[]) => {
    if (!data || data.length === 0) return null;
    return data[data.length - 1]?.value ?? null;
  };

  const schoolKs2 = getLatestValue(schoolData.ks2_combined);
  const laKs2 = getLatestValue(laBenchmarks.ks2_combined);

  const diff = schoolKs2 !== null && laKs2 !== null ? schoolKs2 - laKs2 : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 rounded-xl px-4 py-2 shadow-sm"
    >
      <Database size={14} className="text-blue-600" />
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-blue-700 font-medium">{laBenchmarks.la_name}</span>
        <span className="text-xs text-blue-900 font-semibold">{laKs2}% KS2</span>
        {diff !== null && (
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            diff >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {diff >= 0 ? '+' : ''}{diff}pp vs you
          </span>
        )}
      </div>
    </motion.div>
  );
}
