'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  ReferenceLine,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EyfsAreaData {
  expected: number;
  emerging: number;
  total: number;
  pctExpected: number;
}

interface Ks1MovementSubject {
  wtsToExs: number;
  exsToGds: number;
  stayedWts: number;
  stayedExs: number;
  regression: number;
}

interface SpotlightStep {
  year: number;
  yearGroup: number;
  subject: string;
  level: string;
  scaledScore?: number;
}

interface GroveHouseData {
  summary: {
    totalPupils: number;
    totalRecords: number;
    yearsSpan: number[];
    trackablePupils: number;
  };
  eyfsGld: { year: number; pupils: number; gldCount: number; gldPct: number }[];
  eyfsAreas: { year: number; areas: Record<string, EyfsAreaData> }[];
  ks1Data: {
    year: number;
    pupils: number;
    subjects: Record<string, { total: number; wts: number; exs: number; gds: number }>;
  }[];
  ks1Movement: {
    year: number;
    writing: Ks1MovementSubject;
    reading: Ks1MovementSubject;
    maths: Ks1MovementSubject;
  }[];
  phonicsData: {
    year: number;
    pupils: number;
    total: number;
    passed: number;
    passPct: number;
    scoreBands: { band0to19: number; band20to31: number; band32plus: number; noScore: number };
  }[];
  cohortJourneys: { pupilId: string; journey: { year: number; yearGroup: number; subject: string; level: string }[] }[];
  spotlightPupil: { pupilId: string; journey: SpotlightStep[] } | null;
  spreadsheetComparison: {
    latestYear: number;
    rows: { yearGroup: string; ctf: Record<string, number | null>; spreadsheet: Record<string, number | null> }[];
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVEL_COLORS = { GDS: '#10b981', EXS: '#3b82f6', WTS: '#f59e0b', PKE: '#ef4444', other: '#9ca3af' };

const EYFS_AREA_LABELS: Record<string, string> = {
  communication_and_language: 'Comm & Lang',
  literacy: 'Literacy',
  maths: 'Maths',
  personal_social_emotional: 'PSE',
  physical_development: 'Physical Dev',
  understanding_the_world: 'Understanding',
  expressive_arts: 'Expressive Arts',
};

const SUBJECT_LABELS: Record<string, string> = {
  reading: 'Reading',
  writing: 'Writing',
  maths: 'Maths',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityBadge({ type, children }: { type: 'critical' | 'concern' | 'positive' | 'celebrating'; children: React.ReactNode }) {
  const styles = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    concern: 'bg-amber-100 text-amber-800 border-amber-200',
    positive: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    celebrating: 'bg-blue-100 text-blue-800 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[type]}`}>
      {children}
    </span>
  );
}

function StatCard({ value, label, color = 'emerald' }: { value: string | number; label: string; color?: string }) {
  const bg = color === 'blue' ? 'bg-blue-50 border-blue-200 text-blue-700 text-blue-600'
    : color === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-700 text-purple-600'
    : color === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-700 text-amber-600'
    : 'bg-emerald-50 border-emerald-200 text-emerald-700 text-emerald-600';
  const [bgCls, borderCls, valueCls, labelCls] = bg.split(' ');
  return (
    <div className={`${bgCls} ${borderCls} border rounded-xl p-4 text-center`}>
      <div className={`text-2xl font-bold ${valueCls}`}>{value}</div>
      <div className={`text-xs mt-0.5 ${labelCls}`}>{label}</div>
    </div>
  );
}

function PctHeatCell({ pct, label }: { pct: number; label: string }) {
  const bg = pct >= 80 ? 'bg-emerald-600 text-white'
    : pct >= 65 ? 'bg-emerald-400 text-white'
    : pct >= 50 ? 'bg-amber-300 text-amber-900'
    : pct > 0 ? 'bg-red-400 text-white'
    : 'bg-gray-100 text-gray-400';
  return (
    <div className={`${bg} rounded-lg p-2 text-center`}>
      <div className="text-sm font-bold">{pct > 0 ? `${pct}%` : '—'}</div>
      <div className="text-[10px] leading-tight mt-0.5 opacity-80">{label}</div>
    </div>
  );
}

function LevelPill({ level }: { level: string }) {
  const cls = level === 'GDS' ? 'bg-emerald-100 text-emerald-800'
    : level === 'EXS' ? 'bg-blue-100 text-blue-800'
    : level === 'WTS' || level === 'WT' ? 'bg-amber-100 text-amber-800'
    : level === '2' ? 'bg-emerald-100 text-emerald-800'
    : level === '1' ? 'bg-amber-100 text-amber-800'
    : 'bg-gray-100 text-gray-600';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${cls}`}>{level}</span>;
}

// ─── Section: Header ──────────────────────────────────────────────────────────

function HeaderSection({ data }: { data: GroveHouseData }) {
  const { summary } = data;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-700 text-white rounded-2xl p-8 shadow-xl"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-black tracking-tight shadow">
          GH
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight">Grove House Primary School</h2>
          <p className="text-emerald-200 text-sm mt-0.5">Per-Pupil Analytics — CTF Assessment Data · Bradford BD2 4ED</p>
        </div>
        <div className="ml-auto hidden md:block">
          <SeverityBadge type="positive">Live CTF Analysis</SeverityBadge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { v: summary.totalPupils, l: 'Unique Pupils' },
          { v: summary.totalRecords.toLocaleString(), l: 'Assessment Records' },
          { v: summary.yearsSpan.length, l: 'Years of Data' },
          { v: summary.trackablePupils, l: 'Pupils Tracked Across Years' },
        ].map(({ v, l }) => (
          <div key={l} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/20">
            <div className="text-3xl font-black tabular-nums">{v}</div>
            <div className="text-xs text-emerald-200 mt-1">{l}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-emerald-300 mt-5 flex items-start gap-2">
        <span className="mt-0.5">&#128274;</span>
        <span>
          Source: CTF assessment files exported from Arbor MIS. All pupil identifiers are SHA-256 pseudonymised.
          No names, dates of birth, or addresses are stored or transmitted.
          Years: {summary.yearsSpan.join(', ')}.
        </span>
      </p>
    </motion.div>
  );
}

// ─── Section: EYFS Deep Dive ──────────────────────────────────────────────────

function EyfsSection({ eyfsGld, eyfsAreas }: { eyfsGld: GroveHouseData['eyfsGld']; eyfsAreas: GroveHouseData['eyfsAreas'] }) {
  const trend = eyfsGld.length >= 2 ? eyfsGld[eyfsGld.length - 1].gldPct - eyfsGld[0].gldPct : 0;
  const latestAreas = eyfsAreas[eyfsAreas.length - 1];

  // Build radar data for latest year
  const radarData = latestAreas
    ? Object.entries(latestAreas.areas)
        .filter(([, v]) => v.total > 0)
        .map(([area, v]) => ({
          area: EYFS_AREA_LABELS[area] ?? area,
          pct: v.pctExpected,
        }))
    : [];

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-1 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">EYFS Deep Dive</h3>
          <p className="text-xs text-gray-500 mt-0.5">Good Level of Development + all 7 Early Learning Goal areas</p>
        </div>
        {trend < -10 && <SeverityBadge type="critical">Declining Trend {trend}pp</SeverityBadge>}
        {trend >= 0 && eyfsGld.length >= 2 && <SeverityBadge type="positive">Improving +{trend}pp</SeverityBadge>}
      </div>

      {/* GLD bar chart */}
      <div className="mt-4">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">GLD % — Year on Year</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={eyfsGld} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 12, fontWeight: 700 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white rounded-xl shadow-xl border p-3 text-sm min-w-[160px]">
                    <div className="font-bold text-gray-900 mb-1">{d.year}</div>
                    <div className="text-gray-600">{d.gldCount} / {d.pupils} pupils</div>
                    <div className={`text-2xl font-black ${d.gldPct >= 70 ? 'text-emerald-600' : d.gldPct >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {d.gldPct}%
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Good Level of Development</div>
                  </div>
                );
              }}
            />
            <ReferenceLine y={72} stroke="#9ca3af" strokeDasharray="4 4" label={{ value: 'National 72%', position: 'right', fontSize: 10, fill: '#6b7280' }} />
            <Bar dataKey="gldPct" radius={[8, 8, 0, 0]}>
              {eyfsGld.map((entry, idx) => (
                <Cell key={idx} fill={entry.gldPct >= 70 ? '#10b981' : entry.gldPct >= 60 ? '#f59e0b' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {trend < -10 && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
          <strong className="block mb-1">Declining GLD Trend — Attention Required</strong>
          GLD has dropped {Math.abs(trend)}pp from {eyfsGld[0].gldPct}% ({eyfsGld[0].year}) to {eyfsGld[eyfsGld.length - 1].gldPct}% ({eyfsGld[eyfsGld.length - 1].year}).
          Fewer children are arriving at Year 1 with the expected foundation skills.
          This will ripple into KS1 outcomes 2 years later and KS2 outcomes 6 years later.
        </div>
      )}

      {/* EYFS Area Heatmap */}
      {eyfsAreas.length > 0 && (
        <div className="mt-8">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            EYFS Area Heatmap — % at Expected Level
            <span className="ml-2 text-gray-400 normal-case font-normal">(darker green = stronger)</span>
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left pb-2 text-xs text-gray-500 font-medium pr-4 min-w-[130px]">Area</th>
                  {eyfsAreas.map(y => (
                    <th key={y.year} className="text-center pb-2 text-xs text-gray-700 font-bold px-1 min-w-[70px]">{y.year}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(EYFS_AREA_LABELS).map(area => (
                  <tr key={area} className="border-t border-gray-50">
                    <td className="py-1.5 pr-4 text-xs text-gray-600 font-medium">{EYFS_AREA_LABELS[area]}</td>
                    {eyfsAreas.map(y => (
                      <td key={y.year} className="py-1 px-1">
                        <PctHeatCell pct={y.areas[area]?.pctExpected ?? 0} label={y.areas[area]?.total ? `n=${y.areas[area].total}` : ''} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Radar for latest year */}
      {radarData.length >= 3 && (
        <div className="mt-8">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Latest Year Area Profile — {latestAreas?.year}
          </h4>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="area" tick={{ fontSize: 11 }} />
              <Radar name="% Expected" dataKey="pct" stroke="#10b981" fill="#10b981" fillOpacity={0.25} />
              <Tooltip formatter={(v: unknown) => [`${v}%`, '% at expected']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

// ─── Section: Phonics ─────────────────────────────────────────────────────────

function PhonicsSection({ phonicsData }: { phonicsData: GroveHouseData['phonicsData'] }) {
  if (!phonicsData.length) return null;

  // Score band chart — use latest year with score data
  const withScores = phonicsData.filter(y => (y.scoreBands.band32plus + y.scoreBands.band20to31 + y.scoreBands.band0to19) > 0);
  const bandData = withScores.map(y => ({
    year: y.year,
    'Below 20': y.scoreBands.band0to19,
    '20–31 (Near miss)': y.scoreBands.band20to31,
    '32+ (Pass)': y.scoreBands.band32plus,
    noScore: y.scoreBands.noScore,
  }));

  const latestPass = phonicsData[phonicsData.length - 1]?.passPct ?? 0;

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Phonics Screening Analysis</h3>
          <p className="text-xs text-gray-500 mt-0.5">Pass threshold: 32 scaled score. Year 1 check.</p>
        </div>
        <SeverityBadge type={latestPass >= 80 ? 'positive' : latestPass >= 70 ? 'celebrating' : 'concern'}>
          Latest: {latestPass}% pass rate
        </SeverityBadge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pass rate trend */}
        <div>
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Pass Rate Trend</h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={phonicsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip formatter={(v: unknown) => [`${v}%`, 'Pass rate']} />
              <ReferenceLine y={82} stroke="#9ca3af" strokeDasharray="4 4" label={{ value: 'National 82%', position: 'right', fontSize: 10, fill: '#6b7280' }} />
              <Line
                type="monotone"
                dataKey="passPct"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 6, fill: '#3b82f6', strokeWidth: 0 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Score bands */}
        {bandData.length > 0 ? (
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Score Distribution by Band</h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Below 20" stackId="a" fill="#ef4444" />
                <Bar dataKey="20–31 (Near miss)" stackId="a" fill="#f59e0b" />
                <Bar dataKey="32+ (Pass)" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200 h-[220px]">
            Scaled score data not available in CTF files
          </div>
        )}
      </div>

      {/* Year-by-year table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold">Year</th>
              <th className="text-center py-2 px-3 text-xs text-gray-500 font-semibold">Pupils</th>
              <th className="text-center py-2 px-3 text-xs text-gray-500 font-semibold">Passed</th>
              <th className="text-center py-2 px-3 text-xs text-gray-500 font-semibold">Pass Rate</th>
              <th className="text-center py-2 px-3 text-xs text-gray-500 font-semibold">Score 32+</th>
              <th className="text-center py-2 px-3 text-xs text-gray-500 font-semibold">Near Miss (20–31)</th>
              <th className="text-center py-2 px-3 text-xs text-gray-500 font-semibold">Below 20</th>
            </tr>
          </thead>
          <tbody>
            {phonicsData.map(y => (
              <tr key={y.year} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-bold text-gray-900">{y.year}</td>
                <td className="py-2 px-3 text-center text-gray-700">{y.pupils}</td>
                <td className="py-2 px-3 text-center text-gray-700">{y.passed}</td>
                <td className="py-2 px-3 text-center">
                  <span className={`font-bold ${y.passPct >= 82 ? 'text-emerald-600' : y.passPct >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                    {y.passPct}%
                  </span>
                </td>
                <td className="py-2 px-3 text-center text-emerald-700">{y.scoreBands.band32plus || '—'}</td>
                <td className="py-2 px-3 text-center text-amber-700">{y.scoreBands.band20to31 || '—'}</td>
                <td className="py-2 px-3 text-center text-red-700">{y.scoreBands.band0to19 || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Section: KS1 Detailed ────────────────────────────────────────────────────

function Ks1Section({ ks1Data, ks1Movement }: { ks1Data: GroveHouseData['ks1Data']; ks1Movement: GroveHouseData['ks1Movement'] }) {
  const [activeYear, setActiveYear] = useState<number | null>(ks1Data[ks1Data.length - 1]?.year ?? null);

  // Build stacked bar data for chart
  const buildChartData = (subj: string) =>
    ks1Data.map(y => {
      const d = y.subjects[subj];
      if (!d || d.total === 0) return { year: y.year, WTS: 0, EXS: 0, GDS: 0 };
      return {
        year: y.year,
        WTS: Math.round(100 * d.wts / d.total),
        EXS: Math.round(100 * d.exs / d.total),
        GDS: Math.round(100 * d.gds / d.total),
      };
    });

  // Detect writing weakness
  const latestKs1 = ks1Data[ks1Data.length - 1];
  const writingPct = latestKs1?.subjects?.writing
    ? Math.round(100 * (latestKs1.subjects.writing.exs + latestKs1.subjects.writing.gds) / latestKs1.subjects.writing.total)
    : null;
  const readingPct = latestKs1?.subjects?.reading
    ? Math.round(100 * (latestKs1.subjects.reading.exs + latestKs1.subjects.reading.gds) / latestKs1.subjects.reading.total)
    : null;
  const mathsPct = latestKs1?.subjects?.maths
    ? Math.round(100 * (latestKs1.subjects.maths.exs + latestKs1.subjects.maths.gds) / latestKs1.subjects.maths.total)
    : null;
  const writingIsWeakest = writingPct !== null && readingPct !== null && writingPct < readingPct;

  const selectedYearData = ks1Data.find(y => y.year === activeYear);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">KS1 Attainment — Detailed View</h3>
          <p className="text-xs text-gray-500 mt-0.5">Per-pupil breakdown: WTS / EXS / GDS across Reading, Writing, Maths</p>
        </div>
        {writingIsWeakest && writingPct !== null && (
          <SeverityBadge type="concern">Writing weakest: {writingPct}%</SeverityBadge>
        )}
      </div>

      {/* Year selector */}
      {ks1Data.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {ks1Data.map(y => (
            <button
              key={y.year}
              onClick={() => setActiveYear(y.year)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${activeYear === y.year ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {y.year} ({y.pupils} pupils)
            </button>
          ))}
        </div>
      )}

      {/* Stacked bar charts for R/W/M */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {(['reading', 'writing', 'maths'] as const).map(subj => {
          const chartData = buildChartData(subj);
          return (
            <div key={subj}>
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 text-center">
                {SUBJECT_LABELS[subj]} — % at each level
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={30}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={(v: unknown, name: unknown) => [`${v}%`, String(name)]} />
                  <Bar dataKey="WTS" stackId="a" fill={LEVEL_COLORS.WTS} />
                  <Bar dataKey="EXS" stackId="a" fill={LEVEL_COLORS.EXS} />
                  <Bar dataKey="GDS" stackId="a" fill={LEVEL_COLORS.GDS} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>

      {/* Selected year pupil-level breakdown */}
      {selectedYearData && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeYear}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-8"
          >
            <h4 className="text-sm font-bold text-gray-800 mb-3">
              {activeYear} Breakdown — {selectedYearData.pupils} pupils
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['reading', 'writing', 'maths'] as const).map(subj => {
                const d = selectedYearData.subjects[subj];
                if (!d || d.total === 0) return null;
                const expPct = Math.round(100 * (d.exs + d.gds) / d.total);
                const gdsPct = Math.round(100 * d.gds / d.total);
                const wtsPct = Math.round(100 * d.wts / d.total);
                const exsPct = Math.round(100 * d.exs / d.total);
                return (
                  <div key={subj} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-gray-900 capitalize">{subj}</span>
                      <span className={`text-lg font-black ${expPct >= 70 ? 'text-emerald-600' : expPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {expPct}%
                        <span className="text-xs font-normal text-gray-400 ml-1">exp+</span>
                      </span>
                    </div>

                    {/* Stacked pill bar */}
                    <div className="h-8 rounded-full overflow-hidden flex bg-gray-200">
                      {d.wts > 0 && (
                        <div
                          className="h-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ width: `${wtsPct}%`, backgroundColor: LEVEL_COLORS.WTS, minWidth: d.wts > 0 ? 4 : 0 }}
                          title={`WTS: ${d.wts} pupils (${wtsPct}%)`}
                        >
                          {wtsPct >= 12 && `${d.wts}`}
                        </div>
                      )}
                      {d.exs > 0 && (
                        <div
                          className="h-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ width: `${exsPct}%`, backgroundColor: LEVEL_COLORS.EXS }}
                          title={`EXS: ${d.exs} pupils`}
                        >
                          {exsPct >= 12 && `${d.exs}`}
                        </div>
                      )}
                      {d.gds > 0 && (
                        <div
                          className="h-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ width: `${gdsPct}%`, backgroundColor: LEVEL_COLORS.GDS }}
                          title={`GDS: ${d.gds} pupils (${gdsPct}%)`}
                        >
                          {gdsPct >= 10 && `${d.gds}`}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                      <span>WTS <strong className="text-amber-700">{d.wts}</strong> ({wtsPct}%)</span>
                      <span>EXS <strong className="text-blue-700">{d.exs}</strong> ({exsPct}%)</span>
                      <span>GDS <strong className="text-emerald-700">{d.gds}</strong> ({gdsPct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Writing spotlight callout */}
      {writingIsWeakest && writingPct !== null && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 mb-6">
          <strong className="block mb-1">Writing is consistently the weakest subject</strong>
          Latest year: Writing {writingPct}% vs Reading {readingPct}%
          {mathsPct !== null && ` vs Maths ${mathsPct}%`}.
          This pattern is common across similar schools. Targeted writing interventions and structured
          talk for writing programmes have the strongest EEF evidence base for this age group.
        </div>
      )}

      {/* YoY movement table */}
      {ks1Movement.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-800 mb-3">Year-on-Year Level Movement — Matched Pupils</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">Year</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-semibold">Subject</th>
                  <th className="text-center py-2 px-3 text-emerald-700 font-semibold">WTS → EXS</th>
                  <th className="text-center py-2 px-3 text-emerald-700 font-semibold">EXS → GDS</th>
                  <th className="text-center py-2 px-3 text-amber-700 font-semibold">Stayed WTS</th>
                  <th className="text-center py-2 px-3 text-blue-700 font-semibold">Stayed EXS</th>
                  <th className="text-center py-2 px-3 text-red-700 font-semibold">Regressed</th>
                </tr>
              </thead>
              <tbody>
                {ks1Movement.flatMap(m =>
                  (['reading', 'writing', 'maths'] as const).map(subj => {
                    const d = m[subj];
                    const hasData = d.wtsToExs + d.exsToGds + d.stayedWts + d.stayedExs + d.regression > 0;
                    if (!hasData) return null;
                    return (
                      <tr key={`${m.year}-${subj}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-1.5 px-3 font-bold text-gray-900">{m.year}</td>
                        <td className="py-1.5 px-3 capitalize text-gray-700">{subj}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-emerald-700">{d.wtsToExs}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-emerald-700">{d.exsToGds}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-amber-700">{d.stayedWts}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-blue-700">{d.stayedExs}</td>
                        <td className="py-1.5 px-3 text-center font-bold text-red-700">{d.regression || '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Section: Cohort Tracking ─────────────────────────────────────────────────

function CohortSection({ data }: { data: GroveHouseData }) {
  const { summary, cohortJourneys, spotlightPupil } = data;
  const [showAll, setShowAll] = useState(false);

  const journeysToShow = showAll ? cohortJourneys : cohortJourneys.slice(0, 6);

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Pupil Cohort Tracking</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {summary.trackablePupils} pupils appear across multiple academic years.
            This is what a spreadsheet cannot do.
          </p>
        </div>
        <SeverityBadge type="celebrating">{summary.trackablePupils} pupils tracked</SeverityBadge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard value={summary.trackablePupils} label="Pupils tracked across years" color="emerald" />
        <StatCard value={summary.yearsSpan.length} label="Years of data" color="blue" />
        <StatCard value={`${summary.yearsSpan[0]}–${summary.yearsSpan[summary.yearsSpan.length - 1]}`} label="Data span" color="purple" />
      </div>

      {/* Pupil Spotlight */}
      {spotlightPupil && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <h4 className="text-sm font-bold text-gray-800">Pupil Spotlight</h4>
            <span className="text-xs text-gray-400 font-mono">{spotlightPupil.pupilId}</span>
            <SeverityBadge type="positive">Pseudonymised</SeverityBadge>
          </div>
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4">
            <p className="text-xs text-teal-700 mb-3">
              Complete journey across all years and subjects — from EYFS through to current year group.
              This pupil&apos;s identity is protected by SHA-256 hashing.
            </p>
            <div className="overflow-x-auto">
              <div className="flex gap-2 flex-wrap">
                {spotlightPupil.journey.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white border border-teal-200 rounded-lg p-2 text-center min-w-[70px] shadow-sm"
                  >
                    <div className="text-[10px] text-gray-500 font-medium">{step.year}</div>
                    <div className="text-[10px] text-gray-600">Y{step.yearGroup}</div>
                    <div className="text-[10px] text-gray-500 capitalize truncate max-w-[60px]">{step.subject.slice(0, 5)}</div>
                    <LevelPill level={step.level} />
                    {step.scaledScore !== undefined && (
                      <div className="text-[9px] text-gray-400 mt-0.5">sc:{step.scaledScore}</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cohort journey cards */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 mb-3">
          Sample Pupil Journeys
          <span className="text-xs font-normal text-gray-400 ml-2">(all pseudonymised)</span>
        </h4>
        <div className="space-y-2">
          {journeysToShow.map((journey, idx) => (
            <motion.div
              key={journey.pupilId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="border border-gray-100 rounded-xl p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="font-mono text-[10px] text-gray-400 mb-2">
                Pupil {journey.pupilId}
                <span className="ml-2 text-gray-300">·</span>
                <span className="ml-2 text-gray-400">{journey.journey.length} records</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {journey.journey.slice(0, 16).map((step, stepIdx) => (
                  <span
                    key={stepIdx}
                    title={`${step.year} Year ${step.yearGroup} ${step.subject}`}
                    className="inline-flex items-center gap-0.5"
                  >
                    <span className="text-[9px] text-gray-400">Y{step.yearGroup}</span>
                    <LevelPill level={step.level} />
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
        {cohortJourneys.length > 6 && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="mt-3 text-sm text-emerald-600 hover:text-emerald-800 font-medium underline underline-offset-2"
          >
            {showAll ? 'Show fewer' : `Show all ${cohortJourneys.length} pupils`}
          </button>
        )}
      </div>
    </section>
  );
}

// ─── Section: Cross-Reference vs Spreadsheet ──────────────────────────────────

function SpreadsheetSection({ data }: { data: GroveHouseData }) {
  const { spreadsheetComparison } = data;
  if (!spreadsheetComparison) return null;

  const SUBJ_LABELS = [
    { key: 'r', label: 'Reading' },
    { key: 'w', label: 'Writing' },
    { key: 'm', label: 'Maths' },
  ];

  const getDelta = (ctf: number | null, sheet: number | null) => {
    if (ctf === null || sheet === null) return null;
    return ctf - sheet;
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">CTF Data vs Trust Spreadsheet</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Comparing what our per-pupil CTF data shows against the figures in the trust spreadsheet ({spreadsheetComparison.latestYear}).
          </p>
        </div>
        <SeverityBadge type="concern">Verify discrepancies</SeverityBadge>
      </div>

      <div className="space-y-6">
        {spreadsheetComparison.rows.map(row => (
          <div key={row.yearGroup}>
            <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              {row.yearGroup}
              <span className="text-xs font-normal text-gray-400">— Latest year data</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {SUBJ_LABELS.map(({ key, label }) => {
                const ctfVal = row.ctf[key] as number | null;
                const sheetVal = row.spreadsheet[key as keyof typeof row.spreadsheet] as number | null;
                const delta = getDelta(ctfVal, sheetVal);
                const hasDiscrepancy = delta !== null && Math.abs(delta) > 5;

                return (
                  <div
                    key={key}
                    className={`rounded-xl border p-4 ${hasDiscrepancy ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{label}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">CTF (per-pupil)</div>
                        <div className={`text-2xl font-black ${ctfVal === null ? 'text-gray-300' : 'text-gray-900'}`}>
                          {ctfVal !== null ? `${ctfVal}%` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-400 mb-0.5">Spreadsheet</div>
                        <div className="text-2xl font-black text-gray-500">
                          {sheetVal !== null ? `${sheetVal}%` : '—'}
                        </div>
                      </div>
                    </div>
                    {delta !== null && (
                      <div className={`mt-2 text-xs font-semibold ${delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-red-700' : 'text-gray-500'}`}>
                        {delta > 0 ? `+${delta}pp above spreadsheet` : delta < 0 ? `${delta}pp below spreadsheet` : 'Match'}
                        {hasDiscrepancy && ' ⚠️'}
                      </div>
                    )}
                    {ctfVal === null && (
                      <div className="mt-2 text-xs text-gray-400">No CTF data for this year group in current dataset</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-600">
        <strong className="block mb-1">How to interpret discrepancies</strong>
        Large gaps between CTF and spreadsheet may indicate: different assessment points (CTF = end of year, spreadsheet = mid-year);
        manual data entry errors in the spreadsheet; different cohort sizes; or subjects tracked differently.
        The CTF data reflects actual per-pupil MIS records — this is the ground truth.
      </div>
    </section>
  );
}

// ─── Section: What This Means ─────────────────────────────────────────────────

function WhatThisMeansSection({ data }: { data: GroveHouseData }) {
  const { summary, eyfsGld, ks1Data } = data;
  const eyfsFirst = eyfsGld[0]?.gldPct;
  const eyfsLast = eyfsGld[eyfsGld.length - 1]?.gldPct;
  const latestKs1 = ks1Data[ks1Data.length - 1];
  const writingPct = latestKs1?.subjects?.writing?.total
    ? Math.round(100 * (latestKs1.subjects.writing.exs + latestKs1.subjects.writing.gds) / latestKs1.subjects.writing.total)
    : null;
  const readingPct = latestKs1?.subjects?.reading?.total
    ? Math.round(100 * (latestKs1.subjects.reading.exs + latestKs1.subjects.reading.gds) / latestKs1.subjects.reading.total)
    : null;

  const cards = [
    {
      title: 'EYFS → KS1 Trajectory',
      color: 'text-emerald-300',
      content: eyfsFirst && eyfsLast
        ? `GLD moved from ${eyfsFirst}% to ${eyfsLast}% over ${eyfsGld.length} years. Children entering Year 1 arrive with ${eyfsLast < eyfsFirst ? 'weaker' : 'stronger'} foundations each year. A spreadsheet gives you this year\'s percentage. Schoolgle gives you the trajectory — and lets you act before it hits KS2.`
        : 'GLD trend data shows multi-year progression patterns that a spreadsheet cannot capture.',
    },
    {
      title: 'Individual Pupil Tracking',
      color: 'text-blue-300',
      content: `${summary.trackablePupils} pupils can be tracked across multiple academic years — by subject, by year group, pseudonymised end-to-end. A spreadsheet shows you a cohort percentage. Schoolgle shows you the individual children behind that number and whether each one is making progress.`,
    },
    {
      title: 'Writing Is the Pinch Point',
      color: 'text-amber-300',
      content: writingPct !== null && readingPct !== null
        ? `KS1 Writing sits at ${writingPct}% expected standard vs Reading at ${readingPct}%. This ${readingPct - writingPct}pp gap is consistent across years. With per-pupil data, you can target the exact pupils who are at EXS in Reading but WTS in Writing — a group EEF evidence shows responds strongly to structured talk programmes.`
        : 'Per-pupil writing data enables targeted intervention that cohort averages cannot support.',
    },
    {
      title: 'The CTF Is the Source of Truth',
      color: 'text-red-300',
      content: `The trust spreadsheet contains manually typed percentages — rounding errors, wrong column entries, mid-year vs end-year confusion. Our per-pupil CTF data is extracted directly from Arbor: no rounding, no transcription, no "above 25" in a number field. This is what an Ofsted deep dive team is interrogating. Schoolgle makes sure your data matches what your MIS actually holds.`,
    },
  ];

  return (
    <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-teal-900 text-white rounded-2xl p-8 shadow-xl">
      <div className="mb-6">
        <h3 className="text-2xl font-black">What This Reveals</h3>
        <p className="text-gray-400 text-sm mt-1">
          Why per-pupil CTF analysis is categorically different from a trust spreadsheet
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/10 backdrop-blur rounded-xl p-5 border border-white/10"
          >
            <h4 className={`font-bold mb-2 ${card.color}`}>{card.title}</h4>
            <p className="text-sm text-gray-300 leading-relaxed">{card.content}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 bg-emerald-900/60 border border-emerald-700/50 rounded-xl p-5 text-sm">
        <div className="flex items-start gap-3">
          <div className="text-emerald-400 text-lg mt-0.5">&#9650;</div>
          <div>
            <strong className="text-emerald-200 block mb-1">The Schoolgle Advantage</strong>
            <p className="text-emerald-300">
              This analysis was generated from {summary.totalRecords.toLocaleString()} assessment records across {summary.yearsSpan.length} academic years,
              covering {summary.totalPupils} unique pupils. Every identifier is SHA-256 pseudonymised.
              A school business manager or headteacher can see this within minutes of uploading a CTF file —
              not hours of spreadsheet work, not a consultant at £800/day, not a data analyst who speaks only in jargon.
              This is what Schoolgle Intelligence looks like.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GroveHouseAnalytics() {
  const [data, setData] = useState<GroveHouseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/trust-analysis/grove-house');
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4" />
        <p className="text-gray-500 text-sm">Loading per-pupil assessment data...</p>
        <p className="text-gray-400 text-xs mt-1">Fetching CTF records from Supabase</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        <strong className="block mb-1">Failed to load Grove House analytics</strong>
        <code className="text-xs">{error}</code>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HeaderSection data={data} />
      <EyfsSection eyfsGld={data.eyfsGld} eyfsAreas={data.eyfsAreas ?? []} />
      <PhonicsSection phonicsData={data.phonicsData} />
      <Ks1Section ks1Data={data.ks1Data} ks1Movement={data.ks1Movement ?? []} />
      <CohortSection data={data} />
      <SpreadsheetSection data={data} />
      <WhatThisMeansSection data={data} />
    </div>
  );
}
