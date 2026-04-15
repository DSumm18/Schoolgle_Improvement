'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TrustOverviewHeatmap from '@/components/trust-analysis/TrustOverviewHeatmap';
import DisadvantageGapTable from '@/components/trust-analysis/DisadvantageGapTable';
import DataQualityFlags from '@/components/trust-analysis/DataQualityFlags';
import DfeCrossReference from '@/components/trust-analysis/DfeCrossReference';
import TrendCharts from '@/components/trust-analysis/TrendCharts';
import SchoolNarrativeCard from '@/components/trust-analysis/SchoolNarrativeCard';
import GroveHouseDemo from '@/components/trust-analysis/GroveHouseDemo';
import { PENNINE_SELF_REPORTS } from '@/lib/trust-analysis/pennine-data';
import {
  calculateDivergences, detectDataQualityIssues, calculateDisadvantageGaps,
  analysePipelines, analyseTrackRecord, extractProgressMeasures, buildPipelinePredictions,
} from '@/lib/trust-analysis/analysis';
import { generateSchoolNarrative } from '@/lib/trust-analysis/school-narratives';
import {
  DfEData, SchoolNarrative, DivergenceFlag, DataQualityFlag, DisadvantageGap,
  TrackRecordFlag, PipelineTrajectory, ProgressMeasure, PipelinePrediction,
} from '@/lib/trust-analysis/types';

type TabKey = 'overview' | 'cross-reference' | 'trends' | 'narratives' | 'grove-house';

const TABS: { key: TabKey; label: string; description: string }[] = [
  { key: 'overview', label: 'Trust Overview', description: 'Heatmaps, gap analysis, data quality' },
  { key: 'cross-reference', label: 'Reality Check', description: 'Track record, pipeline, progress measures' },
  { key: 'trends', label: 'Historical Trends', description: 'KS2, FSM, scaled scores over time' },
  { key: 'narratives', label: 'School Reports', description: 'Per-school narrative with Ofsted Qs' },
  { key: 'grove-house', label: 'Grove House Demo', description: 'Per-pupil analysis (SENSITIVE)' },
];

export default function TrustAnalysisPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [dfeData, setDfeData] = useState<DfEData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDfE() {
      try {
        const res = await fetch('/api/trust-analysis');
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: DfEData = await res.json();
        setDfeData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load DfE data');
      } finally {
        setLoading(false);
      }
    }
    fetchDfE();
  }, []);

  // Compute analyses
  const divergences: DivergenceFlag[] = dfeData
    ? calculateDivergences(PENNINE_SELF_REPORTS, dfeData.ks2Results)
    : [];
  const qualityFlags: DataQualityFlag[] = detectDataQualityIssues(PENNINE_SELF_REPORTS);
  const gaps: DisadvantageGap[] = calculateDisadvantageGaps(PENNINE_SELF_REPORTS);

  // New cohort-based analyses
  const pipelines: PipelineTrajectory[] = analysePipelines(PENNINE_SELF_REPORTS);
  const trackRecords: TrackRecordFlag[] = dfeData
    ? analyseTrackRecord(PENNINE_SELF_REPORTS, dfeData.ks2Results)
    : [];
  const progressMeasures: ProgressMeasure[] = dfeData
    ? extractProgressMeasures(dfeData.ks2Results)
    : [];
  const predictions: PipelinePrediction[] = dfeData
    ? buildPipelinePredictions(PENNINE_SELF_REPORTS, dfeData.ks2Results)
    : [];

  const narratives: SchoolNarrative[] = PENNINE_SELF_REPORTS.map(report =>
    generateSchoolNarrative(
      report,
      dfeData?.ks2Results ?? [],
      dfeData?.census ?? [],
      divergences,
      qualityFlags,
    ),
  );

  const totalPupils = 2821; // Sum of all NOR

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                &#x263F;
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pennine Academies Yorkshire</h1>
                <p className="text-sm text-gray-500">Trust Code 17012 &middot; 7 Primary Schools &middot; Mid-Year Analysis 2025/26</p>
              </div>
            </div>
          </motion.div>

          {/* Trust summary stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6"
          >
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
              <div className="text-2xl font-bold text-gray-900">{totalPupils.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Total Pupils</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
              <div className="text-2xl font-bold text-gray-900">7</div>
              <div className="text-xs text-gray-500">Schools</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
              <div className="text-2xl font-bold text-amber-600">{qualityFlags.filter(f => f.severity === 'error').length}</div>
              <div className="text-xs text-gray-500">Data Errors</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
              <div className="text-2xl font-bold text-red-600">{trackRecords.filter(t => t.rag === 'red').length}</div>
              <div className="text-xs text-gray-500">Unprecedented Claims</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
              <div className={`text-2xl font-bold ${loading ? 'text-gray-400' : 'text-emerald-600'}`}>
                {loading ? '...' : '\u2713'}
              </div>
              <div className="text-xs text-gray-500">DfE Data {loading ? 'Loading' : 'Loaded'}</div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto pb-px">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex flex-col items-start px-4 py-2.5 rounded-t-lg text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-gray-50 text-gray-900 border border-b-0 border-gray-200 font-semibold'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{tab.label}</span>
                {activeTab === tab.key && (
                  <span className="text-xs text-gray-400 font-normal">{tab.description}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">
              Failed to load DfE data: {error}. Layer 1 analysis is still available below.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Trust-Wide Heatmap &mdash; ARE by Subject</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <TrustOverviewHeatmap selfReports={PENNINE_SELF_REPORTS} />
                </div>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Year 6 Disadvantage Gap (FSM6 vs Non-FSM)</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <DisadvantageGapTable gaps={gaps} />
                </div>
              </section>
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Data Quality Flags</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <DataQualityFlags flags={qualityFlags} />
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'cross-reference' && (
            <motion.div key="cross-ref" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Reality Check: What a Spreadsheet Can&apos;t Tell You</h2>
              <p className="text-sm text-gray-500 mb-6">
                Track record analysis, pipeline consistency checks, and DfE progress measures.
                This is what happens when you cross-reference self-reported data against reality.
              </p>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
                  <p className="text-gray-500">Loading DfE data from Supabase...</p>
                </div>
              ) : (
                <DfeCrossReference
                  trackRecords={trackRecords}
                  pipelines={pipelines}
                  progressMeasures={progressMeasures}
                  predictions={predictions}
                />
              )}
            </motion.div>
          )}

          {activeTab === 'trends' && (
            <motion.div key="trends" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Layer 2: Historical Trends from DfE Data</h2>
              <p className="text-sm text-gray-500 mb-6">
                Multi-year DfE data reveals patterns invisible in a single year&apos;s spreadsheet.
              </p>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
                  <p className="text-gray-500">Loading trend data...</p>
                </div>
              ) : dfeData ? (
                <TrendCharts ks2Results={dfeData.ks2Results} census={dfeData.census} />
              ) : null}
            </motion.div>
          )}

          {activeTab === 'narratives' && (
            <motion.div key="narratives" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">Per-School Narrative Reports</h2>
                <p className="text-sm text-gray-500 mb-6">
                  AI-generated analysis combining self-reported data with DfE cross-referencing.
                  Each report identifies strengths, concerns, and questions an Ofsted inspector might ask.
                </p>
              </div>
              {narratives.map((narrative, idx) => (
                <SchoolNarrativeCard key={narrative.school} narrative={narrative} index={idx} />
              ))}
            </motion.div>
          )}

          {activeTab === 'grove-house' && (
            <motion.div key="grove-house" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Layer 3: Grove House Per-Pupil Demo</h2>
              <p className="text-sm text-gray-500 mb-6">
                SENSITIVE &mdash; For David&apos;s wife&apos;s school only. Not for trust-wide sharing.
              </p>
              <GroveHouseDemo />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
