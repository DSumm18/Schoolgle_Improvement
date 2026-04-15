'use client';

import { motion } from 'framer-motion';
import {
  TrackRecordFlag, PipelineTrajectory, ProgressMeasure, PipelinePrediction,
  PENNINE_SCHOOLS, RAGStatus,
} from '@/lib/trust-analysis/types';

interface Props {
  trackRecords: TrackRecordFlag[];
  pipelines: PipelineTrajectory[];
  progressMeasures: ProgressMeasure[];
  predictions: PipelinePrediction[];
}

function ragBg(rag: RAGStatus): string {
  switch (rag) {
    case 'red': return 'bg-red-50 border-red-200';
    case 'amber': return 'bg-amber-50 border-amber-200';
    case 'green': return 'bg-emerald-50 border-emerald-200';
  }
}

function ragDot(rag: RAGStatus): string {
  switch (rag) {
    case 'red': return 'bg-red-500';
    case 'amber': return 'bg-amber-500';
    case 'green': return 'bg-emerald-500';
  }
}

export default function DfeCrossReference({ trackRecords, pipelines, progressMeasures, predictions }: Props) {
  const redTrackRecords = trackRecords.filter(t => t.rag === 'red');
  const amberTrackRecords = trackRecords.filter(t => t.rag === 'amber');
  const redPipelines = pipelines.filter(p => p.rag === 'red');

  return (
    <div className="space-y-8">
      {/* Summary banner */}
      <div className="bg-gray-900 text-white rounded-xl p-6">
        <h3 className="text-lg font-bold mb-2">What the data actually says</h3>
        <p className="text-sm text-gray-300 mb-4">
          This analysis compares each school&apos;s self-reported data against their own historical track record,
          internal pipeline consistency, and DfE progress measures. These are the questions a spreadsheet cannot answer.
        </p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-red-400">{redTrackRecords.length}</div>
            <div className="text-xs text-gray-400">Claims exceeding school&apos;s best-ever KS2 by 20pp+</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-amber-400">{redPipelines.length}</div>
            <div className="text-xs text-gray-400">Implausible year-on-year jumps in pipeline</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-400">
              {progressMeasures.filter(p => p.score < -1).length}
            </div>
            <div className="text-xs text-gray-400">Subjects where school loses pupil progress</div>
          </div>
        </div>
      </div>

      {/* Section 1: Track Record — "Has this school EVER achieved what they're claiming?" */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Track Record: &ldquo;Has this school ever achieved what they&apos;re claiming?&rdquo;
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Current Y6 mid-year self-report compared against the school&apos;s own validated KS2 history.
          If a school has never achieved 67% Writing at KS2, claiming it mid-year demands evidence.
        </p>

        {PENNINE_SCHOOLS.map((school, idx) => {
          const schoolFlags = trackRecords.filter(t => t.school === school.abbrev);
          const hasRed = schoolFlags.some(f => f.rag === 'red');
          if (schoolFlags.length === 0) return null;

          return (
            <motion.div
              key={school.abbrev}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className={`border rounded-xl p-5 mb-4 ${hasRed ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}
            >
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <h4 className="text-base font-bold text-gray-900">{school.name}</h4>
                {hasRed && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Unprecedented claims
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {schoolFlags.map(flag => (
                  <div key={flag.subject} className={`border rounded-lg p-4 ${ragBg(flag.rag)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${ragDot(flag.rag)}`} />
                      <span className="font-semibold text-gray-900">{flag.subject}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                      <div>
                        <div className="text-gray-500">Mid-Year Claim</div>
                        <div className="text-lg font-bold">{flag.currentY6Pct}%</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Best-Ever KS2</div>
                        <div className="text-lg font-bold">{flag.bestHistoricalPct}%</div>
                        <div className="text-xs text-gray-400">{flag.bestHistoricalYear}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">vs History</div>
                        <div className={`text-lg font-bold ${flag.vsHistoryPp > 10 ? 'text-red-600' : flag.vsHistoryPp < -10 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {flag.vsHistoryPp > 0 ? '+' : ''}{flag.vsHistoryPp}pp
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{flag.narrative}</p>

                    {/* Mini sparkline of history */}
                    {flag.history.length > 1 && (
                      <div className="mt-2 flex items-end gap-1 h-8">
                        {flag.history.map((h, i) => {
                          const maxPct = Math.max(...flag.history.map(x => x.pct), flag.currentY6Pct);
                          const height = maxPct > 0 ? (h.pct / maxPct) * 100 : 0;
                          return (
                            <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                              <div
                                className="w-full bg-gray-300 rounded-t"
                                style={{ height: `${height}%`, minHeight: '2px' }}
                                title={`${h.year}: ${h.pct}%`}
                              />
                              <span className="text-[9px] text-gray-400">{h.year}</span>
                            </div>
                          );
                        })}
                        {/* Current claim bar */}
                        <div className="flex flex-col items-center gap-0.5 flex-1">
                          <div
                            className={`w-full rounded-t ${flag.rag === 'red' ? 'bg-red-400' : flag.rag === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                            style={{ height: `${(flag.currentY6Pct / Math.max(...flag.history.map(x => x.pct), flag.currentY6Pct)) * 100}%`, minHeight: '2px' }}
                            title={`Claim: ${flag.currentY6Pct}%`}
                          />
                          <span className="text-[9px] font-bold text-gray-600">Now</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Section 2: Pipeline Analysis */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Pipeline: &ldquo;Does the data tell a consistent story across year groups?&rdquo;
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          If Y5 Writing is 33% and Y6 Writing jumps to 51%, that&apos;s +18pp in one year.
          Is that genuine progress or inconsistent assessment?
        </p>

        <div className="space-y-3">
          {pipelines.filter(p => p.rag !== 'green').map((pipeline, idx) => (
            <motion.div
              key={`${pipeline.school}-${pipeline.subject}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`border rounded-lg p-4 ${ragBg(pipeline.rag)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2.5 h-2.5 rounded-full ${ragDot(pipeline.rag)}`} />
                <span className="font-semibold text-sm">{pipeline.school} &mdash; {pipeline.subject}</span>
                <span className="text-xs text-gray-500">
                  {pipeline.points.map(p => `${p.yearGroup}:${p.pct}%`).join(' \u2192 ')}
                </span>
              </div>
              <p className="text-sm text-gray-700">{pipeline.narrative}</p>
            </motion.div>
          ))}
          {pipelines.filter(p => p.rag !== 'green').length === 0 && (
            <p className="text-sm text-gray-500">No implausible pipeline jumps detected.</p>
          )}
        </div>
      </section>

      {/* Section 3: Progress Measures */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Progress Measures: &ldquo;Does this school add value or lose it?&rdquo;
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          DfE progress measures track real cohorts from KS1 to KS2. Positive = school adds value. Negative = school loses value.
          This is the only genuinely cohort-based indicator in the public data.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 font-medium text-gray-500">School</th>
                <th className="p-3 text-center font-medium text-gray-500">Reading</th>
                <th className="p-3 text-center font-medium text-gray-500">Writing</th>
                <th className="p-3 text-center font-medium text-gray-500">Maths</th>
              </tr>
            </thead>
            <tbody>
              {PENNINE_SCHOOLS.map(school => {
                const schoolMeasures = progressMeasures.filter(p => p.school === school.abbrev);
                if (schoolMeasures.length === 0) return null;
                return (
                  <tr key={school.abbrev} className="border-b border-gray-100">
                    <td className="p-3 font-semibold">{school.abbrev}</td>
                    {['Reading', 'Writing', 'Maths'].map(subject => {
                      const m = schoolMeasures.find(p => p.subject === subject);
                      if (!m) return <td key={subject} className="p-3 text-center text-gray-400">&mdash;</td>;
                      const color = m.score >= 1 ? 'text-emerald-600' : m.score <= -1 ? 'text-red-600' : 'text-gray-600';
                      return (
                        <td key={subject} className={`p-3 text-center font-bold ${color}`} title={m.interpretation}>
                          {m.score > 0 ? '+' : ''}{m.score.toFixed(1)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2">2023 data (most recent with progress measures). Positive = school adds value KS1&rarr;KS2.</p>
        </div>
      </section>

      {/* Section 4: Pipeline Predictions */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Pipeline Forecast: &ldquo;Where is each school heading?&rdquo;
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Current Y5 Combined predicts next year&apos;s KS2. Current Y6 Combined predicts this May&apos;s outcome.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictions.map((pred, idx) => {
            const school = PENNINE_SCHOOLS.find(s => s.abbrev === pred.school);
            const declining = pred.currentY5Combined != null && pred.lastKs2Combined != null &&
              pred.currentY5Combined < pred.lastKs2Combined - 10;

            return (
              <motion.div
                key={pred.school}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`border rounded-lg p-4 ${declining ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}
              >
                <div className="font-semibold text-sm mb-2">{school?.name ?? pred.school}</div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm mb-2">
                  <div>
                    <div className="text-gray-500 text-xs">Y5 (next Y6)</div>
                    <div className="text-lg font-bold">{pred.currentY5Combined != null ? `${pred.currentY5Combined}%` : '\u2014'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Y6 mid-year</div>
                    <div className="text-lg font-bold">{pred.currentY6Combined != null ? `${pred.currentY6Combined}%` : '\u2014'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Last KS2</div>
                    <div className="text-lg font-bold">{pred.lastKs2Combined != null ? `${pred.lastKs2Combined}%` : '\u2014'}</div>
                    {pred.lastKs2Year && <div className="text-[10px] text-gray-400">{pred.lastKs2Year}</div>}
                  </div>
                </div>
                <p className="text-xs text-gray-600">{pred.narrative}</p>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
