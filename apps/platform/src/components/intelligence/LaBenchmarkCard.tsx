/**
 * LA Benchmark Card
 *
 * Displays 3-way comparison: School | LA | National
 * Shows KS2, Attendance, and Persistent Absence with visual indicators
 */

import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';

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
  ks2_combined: 60, // 2024 national average
  attendance: 94.5, // Primary
  persistent_absence: 11.2, // 2024 national
};

function ComparisonBar({
  school,
  la,
  national,
  label,
  unit = '%',
  inverse = false, // For lower-is-better metrics (absence)
  threshold,
}: {
  school: number;
  la: number;
  national: number;
  label: string;
  unit?: string;
  inverse?: boolean;
  threshold?: { value: number; label: string };
}) {
  const max = Math.max(school, la, national, 100);
  const schoolPct = (school / max) * 100;
  const laPct = (la / max) * 100;
  const nationalPct = (national / max) * 100;

  // Determine status
  const betterThanLa = inverse ? school < la : school > la;
  const betterThanNational = inverse ? school < national : school > national;
  const atThreshold = threshold && (inverse ? school > threshold.value : school < threshold.value);

  const getStatusColor = () => {
    if (atThreshold) return 'text-red-600';
    if (betterThanLa && betterThanNational) return 'text-emerald-600';
    if (betterThanLa || betterThanNational) return 'text-amber-600';
    return 'text-gray-600';
  };

  const getStatusIcon = () => {
    if (atThreshold) return <AlertTriangle size={14} className="text-red-600" />;
    if (betterThanLa && betterThanNational) return <CheckCircle2 size={14} className="text-emerald-600" />;
    if (betterThanLa || betterThanNational) return <Minus size={14} className="text-amber-600" />;
    return <Minus size={14} className="text-gray-400" />;
  };

  const getBarColor = (value: number, isSchool: boolean) => {
    if (isSchool && atThreshold) return 'bg-red-500';
    if (isSchool && betterThanLa && betterThanNational) return 'bg-emerald-500';
    if (isSchool && (betterThanLa || betterThanNational)) return 'bg-amber-500';
    return 'bg-gray-300';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          {threshold && atThreshold && (
            <span className="text-[10px] text-red-600">{threshold.label}</span>
          )}
        </div>
      </div>

      {/* Bar chart */}
      <div className="space-y-1.5">
        {/* School */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-12 text-gray-500">You</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${getBarColor(school, true)} transition-all`}
              style={{ width: `${schoolPct}%` }}
            />
          </div>
          <span className={`text-xs font-semibold w-14 text-right ${getStatusColor()}`}>
            {school}{unit}
          </span>
        </div>

        {/* LA */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-12 text-gray-500">LA</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all"
              style={{ width: `${laPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 w-14 text-right">
            {la}{unit}
          </span>
        </div>

        {/* National */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] w-12 text-gray-500">England</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400 transition-all"
              style={{ width: `${nationalPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-14 text-right">
            {national}{unit}
          </span>
        </div>
      </div>

      {/* Comparison text */}
      <div className="text-[10px] text-gray-500">
        {betterThanLa && betterThanNational && `Above LA and national`}
        {betterThanLa && !betterThanNational && `Above LA, below national`}
        {!betterThanLa && betterThanNational && `Below LA, above national`}
        {!betterThanLa && !betterThanNational && `Below LA and national`}
      </div>
    </div>
  );
}

export function LaBenchmarkCard({ laBenchmarks, schoolData }: LaBenchmarkCardProps) {
  // Get latest year data
  const latestYear = laBenchmarks.ks2_combined[laBenchmarks.ks2_combined.length - 1]?.year;

  const getLatestValue = (data?: BenchmarkMetric[]) => {
    if (!data || data.length === 0) return null;
    return data[data.length - 1]?.value ?? null;
  };

  const schoolKs2 = getLatestValue(schoolData.ks2_combined);
  const laKs2 = getLatestValue(laBenchmarks.ks2_combined);
  const schoolAttendance = getLatestValue(schoolData.attendance);
  const laAttendance = getLatestValue(laBenchmarks.attendance);
  const schoolPa = getLatestValue(schoolData.persistent_absence);
  const laPa = getLatestValue(laBenchmarks.persistent_absence);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Local Authority Comparison</h3>
          <p className="text-xs text-gray-500">
            Compared to {laBenchmarks.la_name} ({laBenchmarks.school_count} schools)
          </p>
        </div>
        {latestYear && (
          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {latestYear}/{latestYear + 1}
          </span>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KS2 Combined */}
        {schoolKs2 !== null && laKs2 !== null && (
          <div className="bg-gray-50 rounded-lg p-3">
            <ComparisonBar
              school={schoolKs2}
              la={laKs2}
              national={NATIONAL_AVERAGES.ks2_combined}
              label="KS2 Combined"
              threshold={{ value: 60, label: 'Floor std' }}
            />
          </div>
        )}

        {/* Attendance */}
        {schoolAttendance !== null && laAttendance !== null && (
          <div className="bg-gray-50 rounded-lg p-3">
            <ComparisonBar
              school={schoolAttendance}
              la={laAttendance}
              national={NATIONAL_AVERAGES.attendance}
              label="Overall Attendance"
              threshold={{ value: 95, label: 'Ofsted flag' }}
            />
          </div>
        )}

        {/* Persistent Absence */}
        {schoolPa !== null && laPa !== null && (
          <div className="bg-gray-50 rounded-lg p-3">
            <ComparisonBar
              school={schoolPa}
              la={laPa}
              national={NATIONAL_AVERAGES.persistent_absence}
              label="Persistent Absence"
              inverse // Lower is better
              threshold={{ value: 10, label: 'DfE concern' }}
            />
          </div>
        )}
      </div>

      {/* Context note */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-[10px] text-gray-500">
          <strong>Context:</strong> LA averages include all primary schools in {laBenchmarks.la_name}.
          Schools with similar FSM profiles should be compared directly. National averages
          are provided for context but may not reflect your community's characteristics.
        </p>
      </div>
    </div>
  );
}

// Compact version for smaller displays
export function LaBenchmarkCompact({
  laBenchmarks,
  schoolData,
}: LaBenchmarkCardProps) {
  const getLatestValue = (data?: BenchmarkMetric[]) => {
    if (!data || data.length === 0) return null;
    return data[data.length - 1]?.value ?? null;
  };

  const schoolKs2 = getLatestValue(schoolData.ks2_combined);
  const laKs2 = getLatestValue(laBenchmarks.ks2_combined);

  const diff = schoolKs2 !== null && laKs2 !== null ? schoolKs2 - laKs2 : null;

  return (
    <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
      <span className="text-[10px] text-blue-700">{laBenchmarks.la_name} avg:</span>
      {schoolKs2 !== null && laKs2 !== null && (
        <>
          <span className="text-xs font-semibold text-blue-900">{laKs2}% KS2</span>
          {diff !== null && (
            <span className={`text-[10px] font-medium ${diff >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              ({diff >= 0 ? '+' : ''}{diff}pp vs you)
            </span>
          )}
        </>
      )}
    </div>
  );
}
