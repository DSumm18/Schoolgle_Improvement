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
import CohortJourneyChart from '@/components/trust-analysis/CohortJourneyChart';
import ProductValueCard from '@/components/trust-analysis/ProductValueCard';
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

type TabKey = 'overview' | 'cohort-journey' | 'cross-reference' | 'trends' | 'narratives' | 'grove-house';

const TABS: { key: TabKey; label: string; description: string }[] = [
  { key: 'overview', label: 'Trust Overview', description: 'Heatmaps, gap analysis, data quality' },
  { key: 'cohort-journey', label: 'Cohort Journey', description: 'Track each cohort through the pipeline' },
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
              {gaps.some(g => g.fsmPct != null) && (
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Year 6 Disadvantage Gap (FSM6 vs Non-FSM)</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <DisadvantageGapTable gaps={gaps} />
                </div>
              </section>
              )}
              <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Data Quality Flags</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <DataQualityFlags flags={qualityFlags} />
                </div>
              </section>

              <ProductValueCard
                tier={1}
                title="Spreadsheet Health Check"
                subtitle="Instant analysis of the data you already have."
                questions={[
                  { question: 'How many hours did your teachers spend building this spreadsheet?', context: '7 schools, EYFS to Y6, All Pupils + FSM + GD breakdowns. Estimate 2-3 hours per school, per data collection point. That\'s 14-21 hours of teacher time per term — time not spent teaching.' },
                  { question: 'Where is this data stored and who has access?', context: 'A shared spreadsheet has no audit trail, no version control, and no validation. If someone types 0.67 instead of 67%, every calculation downstream is wrong.' },
                  { question: 'Are the percentages calculated consistently across all schools?', context: 'We\'ve already found missing data, zero Greater Depth in Writing across multiple schools, and cohort sizes that don\'t match census records. How confident are you in the numbers?' },
                  { question: 'What happens to this data between collection points?', context: 'This is a snapshot. It doesn\'t tell you whether children are making progress between assessments. The next data point is another manual spreadsheet in another term.' },
                ]}
                valueStatement="This analysis took Schoolgle 3 seconds. It found data quality issues, missing fields, and inconsistencies that would take a human analyst hours to spot. Every school in your trust gets this instantly, every time they submit data."
                nextTierTeaser="Want to see how this data compares to validated DfE results? That's the next level."
              />
            </motion.div>
          )}

          {activeTab === 'cohort-journey' && (
            <motion.div key="cohort-journey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Cohort Journey: Follow the Children</h2>
              <p className="text-sm text-gray-500 mb-6">
                Select a school and see each cohort&apos;s reported attainment plotted across year groups.
                The dotted lines show last validated KS2 results &mdash; where the self-report line diverges
                from validated history, that&apos;s the question the trust needs to answer.
              </p>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
                  <p className="text-gray-500">Loading DfE data...</p>
                </div>
              ) : dfeData ? (
                <CohortJourneyChart
                  selfReports={PENNINE_SELF_REPORTS}
                  ks2Results={dfeData.ks2Results}
                />
              ) : null}
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

              <ProductValueCard
                tier={2}
                title="DfE Cross-Reference Analysis"
                subtitle="Your self-reported data validated against 3 years of government-verified results."
                questions={[
                  { question: 'Could your trust produce this analysis internally?', context: 'This requires access to DfE validated KS2 data for every school, mapped against your mid-year assessments, with automated divergence detection. No school or trust has this capability built in.' },
                  { question: 'Do your school leaders know their track record?', context: 'Some schools are claiming mid-year results they have never achieved at validated KS2. Without this cross-reference, those claims go unchallenged until SATs results arrive in July — too late to intervene.' },
                  { question: 'Which schools are adding value and which are losing it?', context: 'DfE progress measures show whether a school accelerates or decelerates pupil progress from KS1 to KS2. This is the single most important indicator of school effectiveness — and most trusts never look at it.' },
                  { question: 'What will you tell Ofsted when they ask about data reliability?', context: 'An inspector will compare your self-evaluation against published data. If there are significant divergences, they will question your leadership\'s understanding of the school\'s performance.' },
                ]}
                valueStatement="This analysis cross-references your trust's self-reported data against 3 years of validated DfE results for all 7 schools. It identifies track record violations, pipeline inconsistencies, and progress patterns that are invisible in a spreadsheet. This is what Ofsted sees — and now you can see it first."
                nextTierTeaser="Want to track individual pupils from Reception to Year 6? See what per-pupil analytics can reveal."
              />
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

              <ProductValueCard
                tier={2}
                title="Automated School Reports"
                subtitle="Every school gets a written narrative report with strengths, concerns, and Ofsted questions — generated in seconds."
                questions={[
                  { question: 'How long would it take a School Improvement Partner to write these reports manually?', context: '7 schools, each needing strengths, concerns, data analysis, and Ofsted-style questioning. Conservatively 2 hours per school. That\'s a full working day for one person — and the reports would be based on the same unreliable spreadsheet data.' },
                  { question: 'Are these reports consistent in their methodology?', context: 'Every school is assessed using identical criteria, identical DfE cross-referencing, identical thresholds. No human bias. No varying standards between reviewers.' },
                  { question: 'Can your trust produce these reports before every standards meeting?', context: 'With Schoolgle, updated reports are generated instantly whenever new data is submitted. No waiting, no manual analysis, no consultant fees.' },
                ]}
                valueStatement="These reports combine your self-reported data with validated DfE results to produce Ofsted-ready analysis for every school in your trust. The questions at the bottom of each report are the exact questions an inspector would ask — now you can prepare the answers before they walk through the door."
                nextTierTeaser="These reports analyse school-level data. Imagine the same analysis at individual pupil level — every child, every subject, every term."
              />
            </motion.div>
          )}

          {activeTab === 'grove-house' && (
            <motion.div key="grove-house" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Per-Pupil Analytics</h2>
              <p className="text-sm text-gray-500 mb-6">
                What becomes possible when schools share their assessment data.
              </p>
              <GroveHouseDemo />

              <ProductValueCard
                tier={4}
                title="Per-Pupil Analytics"
                subtitle="Track every child from Reception to Year 6. Every assessment point. Every gap identified."
                questions={[
                  { question: 'What data do you need to provide?', context: 'Your school\'s CTF (Common Transfer File) exports and census XML. These are files your MIS system (Arbor, SIMS, Bromcom) already generates. One upload per school.' },
                  { question: 'What about data protection?', context: 'All pupil data is pseudonymised using SHA-256 hashing before it enters our system. No pupil names, dates of birth, or addresses are stored. A data processing agreement is required.' },
                  { question: 'What does per-pupil analysis reveal that school-level data cannot?', context: 'School-level percentages hide individual stories. A school at 65% Reading could have 35% of pupils stuck at Working Towards for three years with no progress — or it could have a cohort making steady gains. Only per-pupil data tells you which.' },
                  { question: 'How does this connect to the trust analysis above?', context: 'The spreadsheet health check found inconsistencies. The DfE cross-reference found track record violations. Per-pupil analytics finds the root cause: which pupils, which subjects, which year groups — and what to do about it.' },
                ]}
                valueStatement="This is where spreadsheets end and real school improvement begins. Per-pupil cohort tracking from Reception to Year 6, cross-referenced against FSM, SEND, EAL, and Pupil Premium status. AI-powered intervention recommendations. Evidence packs ready for Ofsted. All from the data your school already has — just not using."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
