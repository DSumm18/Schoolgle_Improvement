'use client';

import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  SchoolSelfReport, KS2Result, PENNINE_SCHOOLS,
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
};

// For each year group currently in school, when did that cohort start Reception?
function cohortReceptionYear(yg: YearGroup): string {
  const map: Record<YearGroup, string> = {
    EYFS: '2025/26', Y1: '2024/25', Y2: '2023/24', Y3: '2022/23',
    Y4: '2021/22', Y5: '2020/21', Y6: '2019/20',
  };
  return map[yg];
}

// Describe where this cohort is heading
function cohortDestination(yg: YearGroup): string {
  const map: Record<YearGroup, string> = {
    EYFS: 'KS2 in 2032', Y1: 'KS2 in 2031', Y2: 'KS2 in 2030', Y3: 'KS2 in 2029',
    Y4: 'KS2 in 2028', Y5: 'KS2 in 2027', Y6: 'KS2 May 2026',
  };
  return map[yg];
}

type ViewMode = 'all-cohorts' | 'single-cohort';

export default function CohortJourneyChart({ selfReports, ks2Results }: Props) {
  const [selectedSchool, setSelectedSchool] = useState<string>('CHPS');
  const [viewMode, setViewMode] = useState<ViewMode>('all-cohorts');
  const [selectedYearGroup, setSelectedYearGroup] = useState<YearGroup>('Y6');

  const school = PENNINE_SCHOOLS.find(s => s.abbrev === selectedSchool);
  const report = selfReports.find(r => r.school === selectedSchool);

  // Get KS2 2025 validated results for this school (last year's Y6 — now left)
  const ks2_2025 = useMemo(() => {
    if (!school) return null;
    const results = ks2Results.filter(
      r => r.urn === school.urn && r.academicYearEnd === 2025 &&
        r.breakdownTopic === 'All pupils' && r.expectedStandardPct != null,
    );
    if (results.length === 0) return null;
    return {
      Reading: results.find(r => r.subject === 'Reading')?.expectedStandardPct ?? null,
      Writing: results.find(r => r.subject === 'Writing')?.expectedStandardPct ?? null,
      Maths: results.find(r => r.subject === 'Maths')?.expectedStandardPct ?? null,
    };
  }, [school, ks2Results]);

  // ─── View 1: All Cohorts Pipeline ─────────────────────────────────
  // Each year group is a different cohort at a different stage.
  // X-axis = year groups (Y1→Y6). Each data point = self-reported mid-year.
  // KS2 2025 leavers shown as reference.
  const pipelineData = useMemo(() => {
    if (!report) return [];
    return YEAR_GROUPS
      .filter(yg => yg !== 'EYFS')
      .map(yg => {
        const ygData = report.yearGroups.find(y => y.yearGroup === yg);
        return {
          yearGroup: yg,
          cohort: `Started ${cohortReceptionYear(yg)}`,
          cohortSize: ygData?.cohortSize ?? 0,
          Reading: ygData?.allPupils.reading ?? null,
          Writing: ygData?.allPupils.writing ?? null,
          Maths: ygData?.allPupils.maths ?? null,
        };
      });
  }, [report]);

  // ─── View 2: Single Cohort Journey ────────────────────────────────
  // For a selected year group, show that cohort's journey through every
  // DfE assessment point from EYFS to their current position.
  const cohortJourneyData = useMemo(() => {
    if (!school || !report) return [];

    const ygData = report.yearGroups.find(y => y.yearGroup === selectedYearGroup);
    if (!ygData) return [];

    // Build timeline stages from EYFS to current year group
    const allStages: { stage: string; yg: YearGroup; label: string }[] = [
      { stage: 'EYFS (GLD)', yg: 'EYFS', label: 'EYFS' },
      { stage: 'Y1 (Phonics)', yg: 'Y1', label: 'Y1' },
      { stage: 'Y2 (KS1)', yg: 'Y2', label: 'Y2' },
      { stage: 'Y3', yg: 'Y3', label: 'Y3' },
      { stage: 'Y4 (MTC)', yg: 'Y4', label: 'Y4' },
      { stage: 'Y5', yg: 'Y5', label: 'Y5' },
      { stage: 'Y6 (KS2)', yg: 'Y6', label: 'Y6' },
    ];

    const ygIndex = YEAR_GROUPS.indexOf(selectedYearGroup);

    return allStages
      .filter((_, i) => i <= ygIndex) // Only show stages up to current year group
      .map((stageInfo, i) => {
        const isCurrentStage = i === ygIndex;
        const isFutureAssessed = !isCurrentStage;

        // We only have the self-report for the CURRENT year group position
        // Historical stages are gaps (unless we have DfE data)
        let reading: number | null = null;
        let writing: number | null = null;
        let maths: number | null = null;
        let source = 'no-data' as string;
        let reason = '';

        if (isCurrentStage) {
          reading = ygData.allPupils.reading;
          writing = ygData.allPupils.writing;
          maths = ygData.allPupils.maths;
          source = 'self-report';
          reason = 'Trust self-report (mid-year 2025/26)';
        } else {
          // Check if we have DfE data for a past checkpoint
          // For KS2 — only if this cohort was in Y6 in a past year (they weren't)
          // For KS1 — ks1_results is empty
          // So everything is a gap
          if (stageInfo.yg === 'EYFS') {
            reason = selectedYearGroup === 'Y6' ? 'COVID year — EYFSP cancelled' : 'EYFSP data not loaded';
          } else if (stageInfo.yg === 'Y1') {
            reason = selectedYearGroup === 'Y6' ? 'COVID year — Phonics cancelled' : 'Phonics data not loaded';
          } else if (stageInfo.yg === 'Y2') {
            reason = 'KS1 data not imported yet';
          } else {
            reason = 'No DfE assessment published for this year group';
          }
        }

        return {
          stage: stageInfo.stage,
          Reading: reading,
          Writing: writing,
          Maths: maths,
          source,
          reason,
          cohortSize: isCurrentStage ? ygData.cohortSize : null,
        };
      });
  }, [school, report, selectedYearGroup]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">School</label>
            <select
              value={selectedSchool}
              onChange={e => setSelectedSchool(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-400 text-base font-bold text-gray-900 bg-white shadow-sm appearance-none cursor-pointer hover:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              style={{ fontSize: '16px', color: '#111827' }}
            >
              {PENNINE_SCHOOLS.map(s => (
                <option key={s.abbrev} value={s.abbrev} style={{ fontSize: '15px', color: '#111827', padding: '8px' }}>
                  {s.abbrev} — {s.name} ({s.nor} pupils, {s.fsmPct}% FSM)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">View</label>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('all-cohorts')}
                className={`flex-1 px-5 py-3 rounded-lg text-base font-bold transition-all ${
                  viewMode === 'all-cohorts'
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-900 border-2 border-gray-300 hover:bg-gray-200'
                }`}
              >
                All Cohorts Pipeline
              </button>
              <button
                onClick={() => setViewMode('single-cohort')}
                className={`flex-1 px-5 py-3 rounded-lg text-base font-bold transition-all ${
                  viewMode === 'single-cohort'
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-900 border-2 border-gray-300 hover:bg-gray-200'
                }`}
              >
                Single Cohort Journey
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'single-cohort' && (
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Select Cohort</label>
            <select
              value={selectedYearGroup}
              onChange={e => setSelectedYearGroup(e.target.value as YearGroup)}
              className="w-full px-4 py-3 rounded-lg border-2 border-gray-400 text-base font-bold text-gray-900 bg-white shadow-sm appearance-none cursor-pointer hover:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              style={{ fontSize: '16px', color: '#111827' }}
            >
              {YEAR_GROUPS.filter(yg => yg !== 'EYFS').map(yg => {
                const ygData = report?.yearGroups.find(y => y.yearGroup === yg);
                return (
                  <option key={yg} value={yg} style={{ fontSize: '15px', color: '#111827', padding: '8px' }}>
                    {yg} — Started Reception {cohortReceptionYear(yg)} — {cohortDestination(yg)}
                    {ygData ? ` (${ygData.cohortSize} pupils)` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {/* ─── VIEW 1: ALL COHORTS PIPELINE ─────────────────────────── */}
      {viewMode === 'all-cohorts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {school?.name} — All Cohorts at Their Current Stage
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Each point on the X-axis is a <strong>different cohort</strong> at their current year group.
              Y1 children started in 2024, Y6 children started in 2019.
              The dotted lines show last year&apos;s validated KS2 results (a different cohort who have now left).
            </p>

            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={pipelineData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="yearGroup"
                  tick={{ fontSize: 13, fontWeight: 600, fill: '#111827' }}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const point = pipelineData.find(d => d.yearGroup === label);
                    return (
                      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-sm">
                        <div className="font-bold text-gray-900">{label}</div>
                        <div className="text-xs text-gray-500 mb-2">
                          {point?.cohort} &middot; {point?.cohortSize} pupils
                        </div>
                        {payload.map((p: { name?: string; value?: number; color?: string }) => (
                          p.value != null ? (
                            <div key={p.name} className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                              <span className="text-gray-700">{p.name}: <strong>{p.value}%</strong></span>
                            </div>
                          ) : null
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend />

                {/* KS2 2025 reference lines */}
                {ks2_2025 && Object.entries(ks2_2025).map(([subj, val]) => (
                  val != null ? (
                    <ReferenceLine
                      key={`ref-${subj}`}
                      y={val}
                      stroke={SUBJECT_COLORS[subj]}
                      strokeDasharray="8 4"
                      strokeOpacity={0.5}
                      strokeWidth={2}
                      label={{
                        value: `KS2 2025: ${val}%`,
                        position: 'right',
                        fontSize: 10,
                        fill: SUBJECT_COLORS[subj],
                        fontWeight: 600,
                      }}
                    />
                  ) : null
                ))}

                {Object.entries(SUBJECT_COLORS).map(([subject, color]) => (
                  <Line
                    key={subject}
                    type="monotone"
                    dataKey={subject}
                    stroke={color}
                    strokeWidth={3}
                    dot={{ fill: color, r: 7, strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 10 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-3 flex items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-8 border-t-2 border-dashed border-gray-400" />
                Dotted = KS2 2025 validated (last year&apos;s leavers)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-gray-400" />
                Solid = Self-reported mid-year 2025/26
              </span>
            </div>
          </div>

          {/* Interpretation callout */}
          {report && (() => {
            const y5 = report.yearGroups.find(y => y.yearGroup === 'Y5');
            const y6 = report.yearGroups.find(y => y.yearGroup === 'Y6');
            if (!y5 || !y6) return null;
            const subjects = ['writing', 'reading', 'maths'] as const;
            const jumps = subjects
              .filter(s => y5.allPupils[s] != null && y6.allPupils[s] != null)
              .map(s => ({
                subject: s.charAt(0).toUpperCase() + s.slice(1),
                y5: y5.allPupils[s]!,
                y6: y6.allPupils[s]!,
                jump: y6.allPupils[s]! - y5.allPupils[s]!,
              }))
              .filter(j => j.jump > 12);

            if (jumps.length === 0) return null;

            return (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5">
                <h4 className="font-bold text-red-900 mb-2">Pipeline Inconsistency Detected</h4>
                {jumps.map(j => (
                  <p key={j.subject} className="text-sm text-red-800 mb-1">
                    <strong>{j.subject}</strong>: Y5 at {j.y5}% jumps to Y6 at {j.y6}% — that&apos;s
                    <strong> +{j.jump}pp in a single year</strong>.
                    Is this genuine progress or inconsistent teacher assessment?
                  </p>
                ))}
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* ─── VIEW 2: SINGLE COHORT JOURNEY ────────────────────────── */}
      {viewMode === 'single-cohort' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {school?.name} — {selectedYearGroup} Cohort Journey
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              These children started Reception in <strong>{cohortReceptionYear(selectedYearGroup)}</strong>.
              Every DfE assessment checkpoint is shown below &mdash; data points where we have results, and gaps where we don&apos;t.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {cohortDestination(selectedYearGroup)}.
              {report?.yearGroups.find(y => y.yearGroup === selectedYearGroup)
                ? ` Currently ${report.yearGroups.find(y => y.yearGroup === selectedYearGroup)!.cohortSize} pupils.`
                : ''}
            </p>

            {/* The journey timeline */}
            <div className="space-y-3">
              {cohortJourneyData.map((point, idx) => {
                const hasData = point.source !== 'no-data';
                return (
                  <motion.div
                    key={point.stage}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    className="flex items-center gap-4"
                  >
                    {/* Timeline dot and connector */}
                    <div className="flex flex-col items-center w-8 shrink-0">
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        point.source === 'dfe-validated' ? 'bg-emerald-500 border-emerald-300' :
                        point.source === 'self-report' ? 'bg-amber-500 border-amber-300' :
                        'bg-gray-200 border-gray-300 border-dashed'
                      }`} />
                      {idx < cohortJourneyData.length - 1 && (
                        <div className={`w-0.5 h-8 ${hasData ? 'bg-gray-300' : 'bg-gray-200 border-l border-dashed border-gray-300'}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 rounded-lg p-4 border ${
                      point.source === 'dfe-validated' ? 'bg-emerald-50 border-emerald-200' :
                      point.source === 'self-report' ? 'bg-amber-50 border-amber-200' :
                      'bg-gray-50 border-gray-200 border-dashed'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-gray-900">{point.stage}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          point.source === 'dfe-validated' ? 'bg-emerald-100 text-emerald-800' :
                          point.source === 'self-report' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {point.source === 'dfe-validated' ? 'DfE Validated' :
                           point.source === 'self-report' ? 'Self-Reported' :
                           'No Data'}
                        </span>
                      </div>

                      {hasData ? (
                        <div className="flex gap-6 mt-2">
                          {[
                            { label: 'Reading', val: point.Reading, color: SUBJECT_COLORS.Reading },
                            { label: 'Writing', val: point.Writing, color: SUBJECT_COLORS.Writing },
                            { label: 'Maths', val: point.Maths, color: SUBJECT_COLORS.Maths },
                          ].map(s => (
                            <div key={s.label} className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                              <span className="text-sm text-gray-700">{s.label}: <strong className="text-gray-900">{s.val ?? '—'}%</strong></span>
                            </div>
                          ))}
                          {point.cohortSize && (
                            <span className="text-xs text-gray-400">n={point.cohortSize}</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">{point.reason}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* The Gap = The Pitch */}
          {(() => {
            const gaps = cohortJourneyData.filter(p => p.source === 'no-data').length;
            const total = cohortJourneyData.length;
            if (gaps === 0) return null;

            return (
              <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl p-6">
                <h3 className="text-lg font-bold mb-2">The Data Gap</h3>
                <div className="flex gap-8 mb-4">
                  <div>
                    <span className="text-3xl font-bold text-red-400">{gaps}</span>
                    <span className="text-sm text-gray-400 ml-2">of {total} checkpoints have no data</span>
                  </div>
                </div>
                <p className="text-sm text-gray-300">
                  For this cohort, you have <strong>{total - gaps === 1 ? 'one single data point' : `${total - gaps} data points`}</strong> across
                  their entire school journey. Everything else is a gap.
                  Between KS1 (age 7) and KS2 (age 11), there are four years where the only data is whatever
                  teachers enter into a spreadsheet &mdash; with no external validation, no automated levelling,
                  no consistency checks.
                </p>
                <p className="text-sm text-gray-300 mt-2 font-semibold">
                  Schoolgle fills every gap on this timeline with automated, AI-powered assessment.
                </p>
              </div>
            );
          })()}
        </motion.div>
      )}

      {/* ─── ALL COHORTS TABLE (always visible) ───────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-bold text-gray-900 mb-3">
          All Current Cohorts &mdash; {school?.name}
        </h3>
        <p className="text-xs text-gray-600 mb-4">
          Click any row to see that cohort&apos;s full journey in the chart above.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 font-bold text-gray-900">Year Group</th>
                <th className="text-left p-3 font-bold text-gray-700 text-xs">Cohort Started</th>
                <th className="p-3 text-center font-bold text-gray-700">Pupils</th>
                <th className="p-3 text-center font-bold" style={{ color: SUBJECT_COLORS.Reading }}>Reading</th>
                <th className="p-3 text-center font-bold" style={{ color: SUBJECT_COLORS.Writing }}>Writing</th>
                <th className="p-3 text-center font-bold" style={{ color: SUBJECT_COLORS.Maths }}>Maths</th>
                <th className="p-3 text-center font-bold text-gray-700">Source</th>
              </tr>
            </thead>
            <tbody>
              {/* KS2 2025 leavers (validated) */}
              {ks2_2025 && (
                <tr className="border-b border-gray-100 bg-emerald-50/50">
                  <td className="p-3 font-bold text-gray-500">Leavers (was Y6)</td>
                  <td className="p-3 text-xs text-gray-500">Reception 2018/19</td>
                  <td className="p-3 text-center text-gray-400">&mdash;</td>
                  <td className="p-3 text-center font-bold" style={{ color: SUBJECT_COLORS.Reading }}>
                    {ks2_2025.Reading ?? '—'}%
                  </td>
                  <td className="p-3 text-center font-bold" style={{ color: SUBJECT_COLORS.Writing }}>
                    {ks2_2025.Writing ?? '—'}%
                  </td>
                  <td className="p-3 text-center font-bold" style={{ color: SUBJECT_COLORS.Maths }}>
                    {ks2_2025.Maths ?? '—'}%
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      KS2 Validated
                    </span>
                  </td>
                </tr>
              )}

              {/* Current year groups (self-reported) */}
              {report?.yearGroups.filter(yg => yg.yearGroup !== 'EYFS').map(yg => (
                <tr
                  key={yg.yearGroup}
                  className={`border-b border-gray-50 hover:bg-amber-50/30 cursor-pointer transition-colors ${
                    viewMode === 'single-cohort' && selectedYearGroup === yg.yearGroup ? 'bg-amber-50 ring-1 ring-amber-200' : ''
                  }`}
                  onClick={() => { setViewMode('single-cohort'); setSelectedYearGroup(yg.yearGroup); }}
                >
                  <td className="p-3 font-bold text-gray-900">{yg.yearGroup}</td>
                  <td className="p-3 text-xs text-gray-600">Reception {cohortReceptionYear(yg.yearGroup)}</td>
                  <td className="p-3 text-center font-semibold text-gray-700">{yg.cohortSize}</td>
                  <td className="p-3 text-center font-bold" style={{ color: SUBJECT_COLORS.Reading }}>
                    {yg.allPupils.reading ?? '—'}%
                  </td>
                  <td className="p-3 text-center font-bold" style={{ color: SUBJECT_COLORS.Writing }}>
                    {yg.allPupils.writing ?? '—'}%
                  </td>
                  <td className="p-3 text-center font-bold" style={{ color: SUBJECT_COLORS.Maths }}>
                    {yg.allPupils.maths ?? '—'}%
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-bold bg-amber-100 px-2 py-0.5 rounded-full">
                      Self-Reported
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
