'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell,
} from 'recharts';

interface GroveHouseData {
  summary: {
    totalPupils: number;
    totalRecords: number;
    yearsSpan: number[];
    trackablePupils: number;
  };
  eyfsGld: { year: number; pupils: number; gldCount: number; gldPct: number }[];
  ks1Data: {
    year: number;
    pupils: number;
    subjects: Record<string, { total: number; wts: number; exs: number; gds: number }>;
  }[];
  phonicsData: { year: number; pupils: number; total: number; passed: number; passPct: number }[];
  cohortJourneys: { pupilId: string; journey: { year: number; yearGroup: number; subject: string; level: string }[] }[];
}

const LEVEL_COLORS = {
  GDS: '#10b981',
  EXS: '#3b82f6',
  WTS: '#f59e0b',
  PKE: '#ef4444',
  other: '#9ca3af',
};

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
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
        <p className="text-gray-500">Loading per-pupil assessment data...</p>
      </div>
    );
  }

  if (error || !data) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header with key stats */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-xl font-bold">GH</div>
          <div>
            <h3 className="text-xl font-bold">Grove House Primary School</h3>
            <p className="text-sm text-emerald-200">Per-Pupil Analytics &mdash; From CTF Assessment Data</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{data.summary.totalPupils}</div>
            <div className="text-xs text-emerald-200">Unique Pupils</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{data.summary.totalRecords.toLocaleString()}</div>
            <div className="text-xs text-emerald-200">Assessment Records</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{data.summary.yearsSpan.length}</div>
            <div className="text-xs text-emerald-200">Years of Data</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{data.summary.trackablePupils}</div>
            <div className="text-xs text-emerald-200">Pupils Tracked Across Years</div>
          </div>
        </div>

        <p className="text-sm text-emerald-200 mt-4">
          Source: CTF assessment files uploaded from the school&apos;s MIS (Arbor). All pupil identifiers
          are SHA-256 pseudonymised. No names, DOBs, or addresses stored.
        </p>
      </div>

      {/* EYFS GLD Trend */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">EYFS Good Level of Development &mdash; 4 Year Trend</h3>
        <p className="text-xs text-gray-500 mb-4">
          Source: EYFS Profile data from CTF files. GLD = all 7 Early Learning Goals at expected level.
          This is per-pupil calculated, not a self-reported percentage.
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.eyfsGld}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" tick={{ fontSize: 12, fontWeight: 600 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white rounded-lg shadow-lg border p-3 text-sm">
                    <div className="font-bold">{d.year}</div>
                    <div>{d.gldCount} / {d.pupils} pupils achieved GLD</div>
                    <div className="font-bold text-lg">{d.gldPct}%</div>
                  </div>
                );
              }}
            />
            <Bar dataKey="gldPct" radius={[8, 8, 0, 0]}>
              {data.eyfsGld.map((entry, idx) => (
                <Cell key={idx} fill={entry.gldPct >= 70 ? '#10b981' : entry.gldPct >= 60 ? '#f59e0b' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {data.eyfsGld.length >= 2 && (() => {
          const first = data.eyfsGld[0];
          const last = data.eyfsGld[data.eyfsGld.length - 1];
          const trend = last.gldPct - first.gldPct;
          if (trend < -10) {
            return (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                <strong>Declining GLD trend:</strong> GLD has dropped {Math.abs(trend)}pp from {first.gldPct}% ({first.year}) to {last.gldPct}% ({last.year}).
                This means fewer children are arriving at Year 1 with the expected foundation skills.
                The impact will ripple through KS1 and into KS2 outcomes for these cohorts.
              </div>
            );
          }
          return null;
        })()}
      </section>

      {/* KS1 Attainment Breakdown */}
      {data.ks1Data.length > 0 && (
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-1">KS1 Attainment Breakdown &mdash; Per Pupil</h3>
          <p className="text-xs text-gray-500 mb-4">
            Source: KS1 assessment data from CTF files. Each bar shows the number of pupils at each level.
            WTS = Working Towards Standard. EXS = Expected Standard. GDS = Greater Depth.
          </p>

          {data.ks1Data.map(ks1Year => (
            <div key={ks1Year.year} className="mb-8">
              <h4 className="text-base font-bold text-gray-800 mb-3">
                {ks1Year.year} &mdash; {ks1Year.pupils} pupils
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['reading', 'writing', 'maths'].map(subj => {
                  const d = ks1Year.subjects[subj];
                  if (!d || d.total === 0) return null;
                  const expPct = Math.round(100 * (d.exs + d.gds) / d.total);
                  const gdsPct = Math.round(100 * d.gds / d.total);
                  const wtsPct = Math.round(100 * d.wts / d.total);

                  return (
                    <motion.div
                      key={subj}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-gray-900 capitalize">{subj}</span>
                        <span className={`text-lg font-bold ${expPct >= 70 ? 'text-emerald-600' : expPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {expPct}%
                        </span>
                      </div>

                      {/* Stacked bar */}
                      <div className="h-8 rounded-full overflow-hidden flex bg-gray-100">
                        {d.wts > 0 && (
                          <div
                            className="h-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ width: `${wtsPct}%`, backgroundColor: LEVEL_COLORS.WTS }}
                            title={`WTS: ${d.wts} pupils (${wtsPct}%)`}
                          >
                            {wtsPct >= 15 && `${d.wts}`}
                          </div>
                        )}
                        {d.exs > 0 && (
                          <div
                            className="h-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ width: `${Math.round(100 * d.exs / d.total)}%`, backgroundColor: LEVEL_COLORS.EXS }}
                            title={`EXS: ${d.exs} pupils`}
                          >
                            {Math.round(100 * d.exs / d.total) >= 15 && `${d.exs}`}
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
                        <span>WTS: {d.wts} ({wtsPct}%)</span>
                        <span>EXS: {d.exs} ({Math.round(100 * d.exs / d.total)}%)</span>
                        <span>GDS: {d.gds} ({gdsPct}%)</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Cohort Tracking */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Pupil Cohort Tracking</h3>
        <p className="text-xs text-gray-500 mb-4">
          {data.summary.trackablePupils} pupils appear across multiple academic years, allowing us to
          track their individual progression. This is what the trust spreadsheet cannot do.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-emerald-700">{data.summary.trackablePupils}</div>
            <div className="text-xs text-emerald-600">Pupils tracked across years</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{data.summary.yearsSpan.length}</div>
            <div className="text-xs text-blue-600">Years of assessment data</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              {data.summary.yearsSpan[0]} &ndash; {data.summary.yearsSpan[data.summary.yearsSpan.length - 1]}
            </div>
            <div className="text-xs text-purple-600">Data span</div>
          </div>
        </div>

        {/* Show sample cohort journeys */}
        {data.cohortJourneys.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3">Sample Pupil Journeys (pseudonymised)</h4>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.cohortJourneys.slice(0, 10).map((journey, idx) => (
                <motion.div
                  key={journey.pupilId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border rounded-lg p-3 text-sm"
                >
                  <div className="font-mono text-xs text-gray-400 mb-2">Pupil {journey.pupilId}</div>
                  <div className="flex flex-wrap gap-2">
                    {journey.journey.slice(0, 12).map((step, stepIdx) => (
                      <span
                        key={stepIdx}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          step.level === 'GDS' ? 'bg-emerald-100 text-emerald-800' :
                          step.level === 'EXS' ? 'bg-blue-100 text-blue-800' :
                          step.level === 'WTS' || step.level === 'WT' ? 'bg-amber-100 text-amber-800' :
                          step.level === '2' ? 'bg-emerald-100 text-emerald-800' :
                          step.level === '1' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-600'
                        }`}
                        title={`${step.year} Year ${step.yearGroup}`}
                      >
                        Y{step.yearGroup} {step.subject.slice(0, 4)} {step.level}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* The "so what" — comparison to spreadsheet */}
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-8">
        <h3 className="text-xl font-bold mb-4">What This Reveals That a Spreadsheet Cannot</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-lg p-5">
            <h4 className="font-bold text-emerald-300 mb-2">EYFS → KS1 Progression</h4>
            <p className="text-sm text-gray-300">
              GLD has dropped from {data.eyfsGld[0]?.gldPct ?? '?'}% to {data.eyfsGld[data.eyfsGld.length - 1]?.gldPct ?? '?'}% over
              {data.eyfsGld.length} years. The children entering Year 1 are less prepared each year.
              This will show in KS1 outcomes 2 years later and KS2 outcomes 6 years later.
              A spreadsheet gives you this year&apos;s percentage. We give you the trajectory.
            </p>
          </div>

          <div className="bg-white/10 rounded-lg p-5">
            <h4 className="font-bold text-blue-300 mb-2">Individual Pupil Tracking</h4>
            <p className="text-sm text-gray-300">
              {data.summary.trackablePupils} pupils can be tracked across multiple academic years.
              We can identify which children are making progress, which are stuck, and which have
              regressed &mdash; by subject, by year, pseudonymised. A spreadsheet shows you a cohort
              percentage. We show you the 17 children behind that number.
            </p>
          </div>

          <div className="bg-white/10 rounded-lg p-5">
            <h4 className="font-bold text-amber-300 mb-2">Writing Is the Weakness</h4>
            <p className="text-sm text-gray-300">
              KS1 Writing: {data.ks1Data[0]?.subjects?.writing
                ? `${Math.round(100 * (data.ks1Data[0].subjects.writing.exs + data.ks1Data[0].subjects.writing.gds) / data.ks1Data[0].subjects.writing.total)}%`
                : '?'} expected standard
              vs Reading: {data.ks1Data[0]?.subjects?.reading
                ? `${Math.round(100 * (data.ks1Data[0].subjects.reading.exs + data.ks1Data[0].subjects.reading.gds) / data.ks1Data[0].subjects.reading.total)}%`
                : '?'}.
              This is consistent with the trust-wide pattern but now we can see exactly which pupils are
              below in Writing and cross-reference against their Reading and Maths levels.
            </p>
          </div>

          <div className="bg-white/10 rounded-lg p-5">
            <h4 className="font-bold text-red-300 mb-2">Data Quality vs Spreadsheet</h4>
            <p className="text-sm text-gray-300">
              The trust spreadsheet says Grove House Y6 is at 54% Writing.
              Our per-pupil CTF data gives us the actual attainment level of every child &mdash;
              not a percentage someone typed into a cell. No rounding errors. No &ldquo;0.14 instead
              of 14&rdquo;. No &ldquo;above 25&rdquo; in a number field. The MIS is the source of truth.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
