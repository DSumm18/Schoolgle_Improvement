'use client';

import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Dot,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  SchoolSelfReport, KS2Result, PENNINE_SCHOOLS, PennineSchool,
  YEAR_GROUPS, YearGroup,
} from '@/lib/trust-analysis/types';

interface Props {
  selfReports: SchoolSelfReport[];
  ks2Results: KS2Result[];
}

const SUBJECT_COLORS: Record<string, string> = {
  Reading: '#3b82f6',
  Writing: '#ef4444',
  Maths: '#10b981',
  Combined: '#8b5cf6',
};

// Map a year group to the academic year when that cohort would have been in Y6
// E.g., current Y4 in 2025/26 will be Y6 in 2027/28
function yearGroupToKs2Year(yg: YearGroup): number {
  const yearsUntilY6: Record<YearGroup, number> = {
    EYFS: 6, Y1: 5, Y2: 4, Y3: 3, Y4: 2, Y5: 1, Y6: 0,
  };
  return 2026 + yearsUntilY6[yg]; // 2025/26 is current year, Y6 sits KS2 in 2026
}

// Map year group to the academic year this cohort was in that year group
function yearGroupToAcademicYear(yg: YearGroup): string {
  const offset: Record<YearGroup, number> = {
    EYFS: -6, Y1: -5, Y2: -4, Y3: -3, Y4: -2, Y5: -1, Y6: 0,
  };
  const baseYear = 2025; // Current academic year end for Y6
  const yearEnd = baseYear + 1 + offset[yg]; // +1 because current year is 2025/26
  return `${yearEnd - 1}/${String(yearEnd).slice(-2)}`;
}

export default function CohortJourneyChart({ selfReports, ks2Results }: Props) {
  const [selectedSchool, setSelectedSchool] = useState<string>('CHPS');
  const [showCombined, setShowCombined] = useState(true);

  const school = PENNINE_SCHOOLS.find(s => s.abbrev === selectedSchool);
  const report = selfReports.find(r => r.school === selectedSchool);

  // Build the cohort journey data: one point per year group
  const journeyData = useMemo(() => {
    if (!report || !school) return [];

    return YEAR_GROUPS
      .filter(yg => yg !== 'EYFS') // EYFS doesn't have R/W/M
      .map(yg => {
        const ygData = report.yearGroups.find(y => y.yearGroup === yg);
        return {
          yearGroup: yg,
          label: `${yg}\n(${yearGroupToAcademicYear(yg)})`,
          Reading: ygData?.allPupils.reading ?? undefined,
          Writing: ygData?.allPupils.writing ?? undefined,
          Maths: ygData?.allPupils.maths ?? undefined,
          Combined: ygData?.allPupils.combined ?? undefined,
          cohortSize: ygData?.cohortSize ?? 0,
        };
      });
  }, [report, school]);

  // Get historical KS2 results for this school to overlay as reference markers
  const ks2History = useMemo(() => {
    if (!school) return [];

    return ks2Results
      .filter(
        r => r.urn === school.urn &&
          r.breakdownTopic === 'All pupils' &&
          r.expectedStandardPct != null &&
          ['Reading', 'Writing', 'Maths', 'Reading, writing and maths'].includes(r.subject),
      )
      .reduce((acc, r) => {
        const subjectKey = r.subject === 'Reading, writing and maths' ? 'Combined' : r.subject;
        const existing = acc.find(a => a.year === r.academicYearEnd);
        if (existing) {
          (existing as Record<string, unknown>)[subjectKey] = r.expectedStandardPct;
        } else {
          acc.push({
            year: r.academicYearEnd,
            [subjectKey]: r.expectedStandardPct,
          } as Record<string, unknown> & { year: number });
        }
        return acc;
      }, [] as (Record<string, unknown> & { year: number })[])
      .sort((a, b) => a.year - b.year);
  }, [school, ks2Results]);

  // Build combined chart: KS2 history + current pipeline
  const timelineData = useMemo(() => {
    const points: Record<string, unknown>[] = [];

    // Add KS2 historical results as "validated" points
    for (const ks2 of ks2History) {
      points.push({
        label: `KS2 ${ks2.year}`,
        yearGroup: 'Y6',
        isValidated: true,
        Reading: ks2.Reading ?? undefined,
        Writing: ks2.Writing ?? undefined,
        Maths: ks2.Maths ?? undefined,
        Combined: ks2.Combined ?? undefined,
      });
    }

    // Add current pipeline from self-report
    for (const point of journeyData) {
      points.push({
        ...point,
        label: point.yearGroup,
        isValidated: false,
        isSelfReport: true,
      });
    }

    return points;
  }, [ks2History, journeyData]);

  const subjects = showCombined
    ? ['Reading', 'Writing', 'Maths', 'Combined']
    : ['Reading', 'Writing', 'Maths'];

  // Find the biggest discrepancy for the callout
  const y6Self = journeyData.find(d => d.yearGroup === 'Y6');
  const lastKs2 = ks2History[ks2History.length - 1];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Select School</label>
          <select
            value={selectedSchool}
            onChange={e => setSelectedSchool(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium bg-white"
          >
            {PENNINE_SCHOOLS.map(s => (
              <option key={s.abbrev} value={s.abbrev}>{s.abbrev} &mdash; {s.name}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showCombined}
            onChange={e => setShowCombined(e.target.checked)}
            className="rounded"
          />
          Show Combined (RWM)
        </label>
      </div>

      {/* Main Chart: Current Pipeline (Y1→Y6) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">
          {school?.name} &mdash; Current Year Group Pipeline
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Each point is a different cohort at their current year group (self-reported mid-year 2025/26).
          The dotted line shows last validated KS2 result for reference.
        </p>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={journeyData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="yearGroup"
              tick={{ fontSize: 12 }}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = journeyData.find(d => d.yearGroup === label);
                return (
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm">
                    <div className="font-bold mb-1">{label} {point ? `(n=${point.cohortSize})` : ''}</div>
                    {payload.map((p: { name?: string; value?: number; color?: string }) => (
                      <div key={p.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.name}: <strong>{p.value}%</strong></span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend />

            {/* Reference lines for last KS2 validated results */}
            {lastKs2 && subjects.map(subject => {
              const val = lastKs2[subject] as number | undefined;
              if (!val) return null;
              return (
                <ReferenceLine
                  key={`ref-${subject}`}
                  y={val}
                  stroke={SUBJECT_COLORS[subject]}
                  strokeDasharray="5 5"
                  strokeOpacity={0.4}
                  label={{
                    value: `KS2 ${lastKs2.year}: ${val}%`,
                    position: 'right',
                    fontSize: 9,
                    fill: SUBJECT_COLORS[subject],
                  }}
                />
              );
            })}

            {subjects.map(subject => (
              <Line
                key={subject}
                type="monotone"
                dataKey={subject}
                stroke={SUBJECT_COLORS[subject]}
                strokeWidth={3}
                dot={{ fill: SUBJECT_COLORS[subject], r: 6, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* KS2 Historical Timeline */}
      {ks2History.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {school?.name} &mdash; Validated KS2 History (Different Cohorts)
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Each year is a different group of children who sat KS2 SATs. Shows the school&apos;s track record.
            The highlighted bar is the current Y6 mid-year self-report for comparison.
          </p>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={[
                ...ks2History.map(h => ({
                  label: `KS2 ${h.year}`,
                  ...subjects.reduce((acc, s) => ({ ...acc, [s]: (h as Record<string, unknown>)[s] }), {}),
                  isValidated: true,
                })),
                // Add current Y6 self-report as the final point
                ...(y6Self ? [{
                  label: 'Mid-Year\n2025/26',
                  Reading: y6Self.Reading,
                  Writing: y6Self.Writing,
                  Maths: y6Self.Maths,
                  Combined: y6Self.Combined,
                  isValidated: false,
                }] : []),
              ]}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />

              {subjects.map(subject => (
                <Line
                  key={subject}
                  type="monotone"
                  dataKey={subject}
                  stroke={SUBJECT_COLORS[subject]}
                  strokeWidth={2}
                  dot={(props: Record<string, unknown>) => {
                    const { cx, cy, payload } = props as { cx: number; cy: number; payload: { isValidated?: boolean } };
                    const isValidated = payload?.isValidated;
                    return (
                      <Dot
                        cx={cx}
                        cy={cy}
                        r={isValidated ? 5 : 8}
                        fill={isValidated ? SUBJECT_COLORS[subject] : '#fff'}
                        stroke={SUBJECT_COLORS[subject]}
                        strokeWidth={isValidated ? 0 : 3}
                      />
                    );
                  }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">
            Solid dots = validated KS2 SATs. Open circles = self-reported mid-year claim.
            A sudden jump from validated to self-reported demands evidence.
          </p>
        </div>
      )}

      {/* Callout box for biggest discrepancy */}
      {y6Self && lastKs2 && (() => {
        const gaps = subjects
          .map(s => ({
            subject: s,
            selfPct: (y6Self as Record<string, unknown>)[s] as number | undefined,
            ks2Pct: (lastKs2 as Record<string, unknown>)[s] as number | undefined,
          }))
          .filter(g => g.selfPct != null && g.ks2Pct != null)
          .map(g => ({ ...g, gap: g.selfPct! - g.ks2Pct! }))
          .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));

        const biggest = gaps[0];
        if (!biggest || Math.abs(biggest.gap) < 10) return null;

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-5 border-2 ${biggest.gap > 15 ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}`}
          >
            <div className="text-sm font-bold text-gray-900 mb-1">
              Biggest gap: {biggest.subject}
            </div>
            <p className="text-sm text-gray-700">
              {school?.abbrev} claims <strong>{biggest.selfPct}%</strong> {biggest.subject} mid-year,
              but last validated KS2 ({lastKs2.year}) was <strong>{biggest.ks2Pct}%</strong>.
              {biggest.gap > 0
                ? ` That's a +${biggest.gap}pp claim above what this school has actually delivered. `
                : ` That's ${biggest.gap}pp below recent performance. `}
              {biggest.gap > 20
                ? 'This school has never achieved this level at KS2. What evidence supports this claim?'
                : biggest.gap > 10
                  ? 'This level of improvement in a single year is unusual — verify with moderation evidence.'
                  : ''}
            </p>
          </motion.div>
        );
      })()}
    </div>
  );
}
