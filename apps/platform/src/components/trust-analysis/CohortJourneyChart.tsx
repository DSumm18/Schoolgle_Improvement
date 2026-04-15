'use client';

import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  SchoolSelfReport, KS2Result, PENNINE_SCHOOLS,
} from '@/lib/trust-analysis/types';

interface Props {
  selfReports: SchoolSelfReport[];
  ks2Results: KS2Result[];
}

const SUBJECT_COLORS: Record<string, string> = {
  Reading: '#3b82f6',
  Writing: '#ef4444',
  Maths: '#10b981',
};

// Define all cohorts that are currently in school or recently left.
// Each cohort is identified by when they were in Reception.
interface CohortDef {
  id: string;
  label: string;
  receptionYear: string;     // e.g. "2019/20"
  currentYearGroup: string;  // e.g. "Y6" or "Left (KS2 2025)"
  /** Map from assessment stage to academic year end */
  timeline: { stage: string; yearEnd: number; yearLabel: string }[];
}

function buildCohorts(): CohortDef[] {
  // Current academic year is 2025/26.
  // Y6 in 2025/26 started Reception in 2019/20.
  return [
    {
      id: 'left-2025',
      label: 'KS2 2025 leavers',
      receptionYear: '2018/19',
      currentYearGroup: 'Left (KS2 2025)',
      timeline: [
        { stage: 'EYFS GLD', yearEnd: 2019, yearLabel: '2018/19' },
        { stage: 'Phonics Y1', yearEnd: 2020, yearLabel: '2019/20' },
        { stage: 'KS1 Y2', yearEnd: 2021, yearLabel: '2020/21' },
        { stage: 'Y3', yearEnd: 2022, yearLabel: '2021/22' },
        { stage: 'Y4 (MTC)', yearEnd: 2023, yearLabel: '2022/23' },
        { stage: 'Y5', yearEnd: 2024, yearLabel: '2023/24' },
        { stage: 'KS2 Y6', yearEnd: 2025, yearLabel: '2024/25' },
      ],
    },
    {
      id: 'current-y6',
      label: 'Current Y6 (KS2 May 2026)',
      receptionYear: '2019/20',
      currentYearGroup: 'Y6',
      timeline: [
        { stage: 'EYFS GLD', yearEnd: 2020, yearLabel: '2019/20' },
        { stage: 'Phonics Y1', yearEnd: 2021, yearLabel: '2020/21' },
        { stage: 'KS1 Y2', yearEnd: 2022, yearLabel: '2021/22' },
        { stage: 'Y3', yearEnd: 2023, yearLabel: '2022/23' },
        { stage: 'Y4 (MTC)', yearEnd: 2024, yearLabel: '2023/24' },
        { stage: 'Y5', yearEnd: 2025, yearLabel: '2024/25' },
        { stage: 'Y6 Mid-Year', yearEnd: 2026, yearLabel: '2025/26' },
      ],
    },
    {
      id: 'current-y5',
      label: 'Current Y5 (KS2 May 2027)',
      receptionYear: '2020/21',
      currentYearGroup: 'Y5',
      timeline: [
        { stage: 'EYFS GLD', yearEnd: 2021, yearLabel: '2020/21' },
        { stage: 'Phonics Y1', yearEnd: 2022, yearLabel: '2021/22' },
        { stage: 'KS1 Y2', yearEnd: 2023, yearLabel: '2022/23' },
        { stage: 'Y3', yearEnd: 2024, yearLabel: '2023/24' },
        { stage: 'Y4 (MTC)', yearEnd: 2025, yearLabel: '2024/25' },
        { stage: 'Y5 Mid-Year', yearEnd: 2026, yearLabel: '2025/26' },
      ],
    },
    {
      id: 'current-y4',
      label: 'Current Y4 (KS2 May 2028)',
      receptionYear: '2021/22',
      currentYearGroup: 'Y4',
      timeline: [
        { stage: 'EYFS GLD', yearEnd: 2022, yearLabel: '2021/22' },
        { stage: 'Phonics Y1', yearEnd: 2023, yearLabel: '2022/23' },
        { stage: 'KS1 Y2', yearEnd: 2024, yearLabel: '2023/24' },
        { stage: 'Y3', yearEnd: 2025, yearLabel: '2024/25' },
        { stage: 'Y4 Mid-Year', yearEnd: 2026, yearLabel: '2025/26' },
      ],
    },
    {
      id: 'current-y3',
      label: 'Current Y3 (KS2 May 2029)',
      receptionYear: '2022/23',
      currentYearGroup: 'Y3',
      timeline: [
        { stage: 'EYFS GLD', yearEnd: 2023, yearLabel: '2022/23' },
        { stage: 'Phonics Y1', yearEnd: 2024, yearLabel: '2023/24' },
        { stage: 'KS1 Y2', yearEnd: 2025, yearLabel: '2024/25' },
        { stage: 'Y3 Mid-Year', yearEnd: 2026, yearLabel: '2025/26' },
      ],
    },
  ];
}

type DataSource = 'dfe-validated' | 'self-report' | 'no-data';

interface TimelinePoint {
  stage: string;
  yearLabel: string;
  Reading: number | null;
  Writing: number | null;
  Maths: number | null;
  source: DataSource;
  sourceLabel: string;
  cohortSize?: number;
}

export default function CohortJourneyChart({ selfReports, ks2Results }: Props) {
  const [selectedSchool, setSelectedSchool] = useState<string>('CHPS');
  const [selectedCohort, setSelectedCohort] = useState<string>('current-y6');

  const cohorts = useMemo(() => buildCohorts(), []);
  const cohort = cohorts.find(c => c.id === selectedCohort)!;
  const school = PENNINE_SCHOOLS.find(s => s.abbrev === selectedSchool);
  const report = selfReports.find(r => r.school === selectedSchool);

  // Build timeline data for the selected cohort + school
  const timelineData = useMemo((): TimelinePoint[] => {
    if (!school || !cohort) return [];

    return cohort.timeline.map(step => {
      const point: TimelinePoint = {
        stage: step.stage,
        yearLabel: step.yearLabel,
        Reading: null,
        Writing: null,
        Maths: null,
        source: 'no-data',
        sourceLabel: '',
      };

      // Check if this is a KS2 endpoint and we have DfE data
      if (step.stage === 'KS2 Y6') {
        const ks2 = ks2Results.filter(
          r => r.urn === school.urn &&
            r.academicYearEnd === step.yearEnd &&
            r.breakdownTopic === 'All pupils' &&
            r.expectedStandardPct != null,
        );
        if (ks2.length > 0) {
          point.Reading = ks2.find(r => r.subject === 'Reading')?.expectedStandardPct ?? null;
          point.Writing = ks2.find(r => r.subject === 'Writing')?.expectedStandardPct ?? null;
          point.Maths = ks2.find(r => r.subject === 'Maths')?.expectedStandardPct ?? null;
          point.source = 'dfe-validated';
          point.sourceLabel = 'DfE Validated (KS2 SATs)';
        }
      }

      // Check if this is a mid-year point from the self-report
      if (step.stage.includes('Mid-Year') && report) {
        const ygMap: Record<string, string> = {
          'Y6 Mid-Year': 'Y6', 'Y5 Mid-Year': 'Y5', 'Y4 Mid-Year': 'Y4', 'Y3 Mid-Year': 'Y3',
        };
        const ygKey = ygMap[step.stage];
        if (ygKey) {
          const ygData = report.yearGroups.find(y => y.yearGroup === ygKey);
          if (ygData) {
            point.Reading = ygData.allPupils.reading;
            point.Writing = ygData.allPupils.writing;
            point.Maths = ygData.allPupils.maths;
            point.cohortSize = ygData.cohortSize;
            point.source = 'self-report';
            point.sourceLabel = 'Trust Self-Report (mid-year 2025/26)';
          }
        }
      }

      // Label no-data points
      if (point.source === 'no-data') {
        if (step.stage.includes('EYFS') && step.yearEnd === 2020) {
          point.sourceLabel = 'COVID — EYFSP cancelled';
        } else if (step.stage.includes('Phonics') && step.yearEnd === 2021) {
          point.sourceLabel = 'COVID — Phonics cancelled';
        } else if (step.stage.includes('KS1') && step.yearEnd === 2021) {
          point.sourceLabel = 'COVID — KS1 cancelled';
        } else if (step.stage.includes('KS1')) {
          point.sourceLabel = 'KS1 data not loaded (DfE)';
        } else if (step.stage === 'Y3' || step.stage === 'Y5' || step.stage.includes('MTC')) {
          point.sourceLabel = 'No DfE assessment at this stage';
        } else if (step.stage.includes('EYFS') || step.stage.includes('Phonics')) {
          point.sourceLabel = 'Data not loaded (DfE)';
        } else {
          point.sourceLabel = 'No data available';
        }
      }

      return point;
    });
  }, [school, cohort, report, ks2Results]);

  // Count data gaps
  const gapCount = timelineData.filter(p => p.source === 'no-data').length;
  const dataCount = timelineData.filter(p => p.source !== 'no-data').length;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">School</label>
          <select
            value={selectedSchool}
            onChange={e => setSelectedSchool(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium bg-white min-w-[280px]"
          >
            {PENNINE_SCHOOLS.map(s => (
              <option key={s.abbrev} value={s.abbrev}>
                {s.abbrev} — {s.name} ({s.nor} NOR, {s.fsmPct}% FSM)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">Cohort</label>
          <select
            value={selectedCohort}
            onChange={e => setSelectedCohort(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium bg-white min-w-[280px]"
          >
            {cohorts.map(c => (
              <option key={c.id} value={c.id}>
                {c.label} (Reception {c.receptionYear})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* The Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {school?.name} — {cohort.label}
            </h3>
            <p className="text-xs text-gray-500">
              Following this cohort from Reception ({cohort.receptionYear}) through every DfE assessment point
            </p>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              DfE Validated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200" />
              Self-Reported
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-dashed border-gray-300 bg-gray-50" />
              No Data
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart data={timelineData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="stage"
              tick={{ fontSize: 11 }}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: '%', position: 'insideTopLeft', fontSize: 11 }} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = timelineData.find(p => p.stage === label);
                if (!point) return null;

                return (
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm max-w-xs">
                    <div className="font-bold mb-0.5">{point.stage}</div>
                    <div className="text-xs text-gray-500 mb-2">{point.yearLabel}</div>

                    {point.source === 'no-data' ? (
                      <div className="text-gray-400 italic">{point.sourceLabel}</div>
                    ) : (
                      <>
                        <div className={`text-xs font-medium mb-1 ${point.source === 'dfe-validated' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {point.sourceLabel}
                        </div>
                        {point.cohortSize && <div className="text-xs text-gray-400 mb-1">Cohort: {point.cohortSize} pupils</div>}
                        {['Reading', 'Writing', 'Maths'].map(s => {
                          const val = (point as unknown as Record<string, unknown>)[s] as number | null;
                          return val != null ? (
                            <div key={s} className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SUBJECT_COLORS[s] }} />
                              {s}: <strong>{val}%</strong>
                            </div>
                          ) : null;
                        })}
                      </>
                    )}
                  </div>
                );
              }}
            />
            <Legend />

            {['Reading', 'Writing', 'Maths'].map(subject => (
              <Line
                key={subject}
                type="monotone"
                dataKey={subject}
                stroke={SUBJECT_COLORS[subject]}
                strokeWidth={3}
                connectNulls={false}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dot={(dotProps: any) => {
                  const { cx, cy, index } = dotProps as { cx: number; cy: number; index: number };
                  const point = timelineData[index];
                  if (!point || (point as unknown as Record<string, unknown>)[subject] == null) return <g />;

                  const isValidated = point.source === 'dfe-validated';
                  const isSelfReport = point.source === 'self-report';

                  return (
                    <g>
                      {/* Outer ring */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill={isValidated ? '#d1fae5' : isSelfReport ? '#fef3c7' : '#f3f4f6'}
                        stroke={isValidated ? '#10b981' : isSelfReport ? '#f59e0b' : '#d1d5db'}
                        strokeWidth={2}
                      />
                      {/* Inner dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={isValidated ? '#10b981' : isSelfReport ? '#f59e0b' : '#d1d5db'}
                      />
                    </g>
                  );
                }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* The Gap Callout — this IS the sales pitch */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-6"
      >
        <h3 className="text-lg font-bold mb-2">The Data Gap</h3>
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">{gapCount}</div>
            <div className="text-xs text-gray-400">Assessment points with NO data</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-400">{timelineData.filter(p => p.source === 'self-report').length}</div>
            <div className="text-xs text-gray-400">Self-reported (unvalidated)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">{timelineData.filter(p => p.source === 'dfe-validated').length}</div>
            <div className="text-xs text-gray-400">DfE validated</div>
          </div>
        </div>

        <p className="text-sm text-gray-300">
          Between KS1 (age 7) and KS2 (age 11), there are <strong>four years of flying blind</strong>.
          The only data you have is whatever teachers put in a spreadsheet. No external validation.
          No automated levelling. No consistency checks.
        </p>
        <p className="text-sm text-gray-300 mt-2">
          <strong>Schoolgle&apos;s assessment engine fills every gap on this chart</strong> — automated levelling
          at every assessment point, cross-referenced against prior attainment, with AI-powered
          consistency checks that flag exactly the kind of implausible jumps we&apos;ve found in this data.
        </p>
      </motion.div>

      {/* Per-cohort quick view for the selected school */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-3">
          All Current Cohorts — {school?.name}
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Each row is a different cohort currently in school. The percentage shown is from the mid-year self-report.
          Green dots indicate validated DfE data also exists for that cohort.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-2 font-medium text-gray-500">Year Group</th>
                <th className="text-left p-2 font-medium text-gray-500 text-xs">Cohort Started</th>
                <th className="p-2 text-center font-medium text-gray-500">n</th>
                <th className="p-2 text-center font-medium" style={{ color: SUBJECT_COLORS.Reading }}>Reading</th>
                <th className="p-2 text-center font-medium" style={{ color: SUBJECT_COLORS.Writing }}>Writing</th>
                <th className="p-2 text-center font-medium" style={{ color: SUBJECT_COLORS.Maths }}>Maths</th>
                <th className="p-2 text-center font-medium text-gray-500">KS2 Validated?</th>
              </tr>
            </thead>
            <tbody>
              {report?.yearGroups.filter(yg => yg.yearGroup !== 'EYFS').map(yg => {
                // Figure out when this cohort started Reception
                const ygOffset: Record<string, number> = { Y1: 1, Y2: 2, Y3: 3, Y4: 4, Y5: 5, Y6: 6 };
                const offset = ygOffset[yg.yearGroup] ?? 0;
                const receptionYearEnd = 2026 - offset;
                const receptionLabel = `${receptionYearEnd - 1}/${String(receptionYearEnd).slice(-2)}`;

                return (
                  <tr key={yg.yearGroup} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-2 font-semibold">{yg.yearGroup}</td>
                    <td className="p-2 text-xs text-gray-400">Reception {receptionLabel}</td>
                    <td className="p-2 text-center text-gray-500">{yg.cohortSize}</td>
                    <td className="p-2 text-center font-bold" style={{ color: SUBJECT_COLORS.Reading }}>
                      {yg.allPupils.reading ?? '—'}%
                    </td>
                    <td className="p-2 text-center font-bold" style={{ color: SUBJECT_COLORS.Writing }}>
                      {yg.allPupils.writing ?? '—'}%
                    </td>
                    <td className="p-2 text-center font-bold" style={{ color: SUBJECT_COLORS.Maths }}>
                      {yg.allPupils.maths ?? '—'}%
                    </td>
                    <td className="p-2 text-center">
                      <span className="text-xs text-gray-400">Not yet</span>
                    </td>
                  </tr>
                );
              })}
              {/* Add the leavers row if we have KS2 2025 data */}
              {(() => {
                const ks2_2025 = ks2Results.filter(
                  r => r.urn === school?.urn && r.academicYearEnd === 2025 && r.breakdownTopic === 'All pupils' && r.expectedStandardPct != null,
                );
                if (ks2_2025.length === 0) return null;
                return (
                  <tr className="border-b border-gray-50 bg-emerald-50/50">
                    <td className="p-2 font-semibold text-gray-400">Left (was Y6)</td>
                    <td className="p-2 text-xs text-gray-400">Reception 2018/19</td>
                    <td className="p-2 text-center text-gray-400">—</td>
                    <td className="p-2 text-center font-bold" style={{ color: SUBJECT_COLORS.Reading }}>
                      {ks2_2025.find(r => r.subject === 'Reading')?.expectedStandardPct ?? '—'}%
                    </td>
                    <td className="p-2 text-center font-bold" style={{ color: SUBJECT_COLORS.Writing }}>
                      {ks2_2025.find(r => r.subject === 'Writing')?.expectedStandardPct ?? '—'}%
                    </td>
                    <td className="p-2 text-center font-bold" style={{ color: SUBJECT_COLORS.Maths }}>
                      {ks2_2025.find(r => r.subject === 'Maths')?.expectedStandardPct ?? '—'}%
                    </td>
                    <td className="p-2 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> KS2 2025
                      </span>
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
