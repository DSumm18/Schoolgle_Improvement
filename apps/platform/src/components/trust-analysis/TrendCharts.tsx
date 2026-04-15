'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { KS2Result, CensusRecord, SchoolSelfReport, PENNINE_SCHOOLS, getSchoolByAbbrev } from '@/lib/trust-analysis/types';
import { buildCensusTrends } from '@/lib/trust-analysis/analysis';

const SCHOOL_COLORS: Record<string, string> = {
  CVPS: '#6366f1',
  CHPS: '#ef4444',
  FPS:  '#f59e0b',
  GHPS: '#3b82f6',
  HPS:  '#10b981',
  LPS:  '#8b5cf6',
  LGPS: '#f97316',
};

interface Props {
  ks2Results: KS2Result[];
  census: CensusRecord[];
  selfReports?: SchoolSelfReport[];
}

type ChartView = 'ks2-combined' | 'fsm-trend' | 'scaled-scores' | 'radar';

export default function TrendCharts({ ks2Results, census, selfReports }: Props) {
  const [chartView, setChartView] = useState<ChartView>('ks2-combined');
  const censusTrends = buildCensusTrends(census);

  const tabs: { key: ChartView; label: string }[] = [
    { key: 'ks2-combined', label: 'KS2 Combined Trend' },
    { key: 'fsm-trend', label: 'FSM % Over Time' },
    { key: 'scaled-scores', label: 'Scaled Scores 2025' },
    { key: 'radar', label: 'School Radar' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setChartView(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              chartView === tab.key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={chartView}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        {chartView === 'ks2-combined' && <KS2CombinedChart ks2Results={ks2Results} selfReports={selfReports} />}
        {chartView === 'fsm-trend' && <FSMTrendChart censusTrends={censusTrends} />}
        {chartView === 'scaled-scores' && <ScaledScoresChart ks2Results={ks2Results} />}
        {chartView === 'radar' && <SchoolRadarChart ks2Results={ks2Results} />}
      </motion.div>
    </div>
  );
}

function KS2CombinedChart({ ks2Results, selfReports }: { ks2Results: KS2Result[]; selfReports?: SchoolSelfReport[] }) {
  const combined = ks2Results.filter(
    r => r.subject === 'Reading, writing and maths' && r.breakdownTopic === 'All pupils' && r.expectedStandardPct != null,
  );

  const years = [...new Set(combined.map(r => r.academicYearEnd))].sort();

  // Build chart data with DfE years + self-report as final column
  const chartData = [
    ...years.map(year => {
      const row: Record<string, number | string> = { year: `KS2 ${year} (DfE Validated)` };
      for (const school of PENNINE_SCHOOLS) {
        const val = combined.find(r => r.urn === school.urn && r.academicYearEnd === year);
        if (val?.expectedStandardPct != null) {
          row[school.abbrev] = val.expectedStandardPct;
        }
      }
      return row;
    }),
    // Add the self-report mid-year Y6 as the final column
    ...(selfReports ? [{
      year: 'Mid-Year 25/26 (School Self-Report)',
      ...Object.fromEntries(
        selfReports.map(report => {
          const y6 = report.yearGroups.find(yg => yg.yearGroup === 'Y6');
          return [report.school, y6?.allPupils.combined ?? undefined];
        }).filter(([, v]) => v != null),
      ),
    }] : []),
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">KS2 Combined (RWM) &mdash; Validated vs Self-Reported</h3>
      <p className="text-xs text-gray-500 mb-4">
        <strong>KS2 2023&ndash;2025:</strong> Source: DfE validated SATs results (different cohort each year).
        <strong> Mid-Year 2025/26:</strong> Source: Trust spreadsheet (self-reported, current Y6, not yet validated).
      </p>
      <ResponsiveContainer width="100%" height={450}>
        <BarChart data={chartData} margin={{ bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            tick={(props: { x: number; y: number; payload: { value: string } }) => {
              const { x, y, payload } = props;
              const isDfE = payload.value.includes('DfE');
              const lines = payload.value.split(' (');
              return (
                <g transform={`translate(${x},${y})`}>
                  <text x={0} y={0} dy={12} textAnchor="middle" fontSize={10} fontWeight={700} fill="#111827">
                    {lines[0]}
                  </text>
                  <text x={0} y={0} dy={24} textAnchor="middle" fontSize={9} fill={isDfE ? '#1d4ed8' : '#b45309'} fontWeight={600}>
                    {isDfE ? '\u{1F451} DfE Validated' : '\u{1F4CB} School Self-Report'}
                  </text>
                </g>
              );
            }}
            height={50}
          />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          {PENNINE_SCHOOLS.map(school => (
            <Bar
              key={school.abbrev}
              dataKey={school.abbrev}
              fill={SCHOOL_COLORS[school.abbrev]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2">
        The final column shows what each school claims their current Y6 will achieve.
        Compare against the validated KS2 columns to assess whether the claim is consistent with the school&apos;s track record.
      </p>
    </div>
  );
}

function FSMTrendChart({ censusTrends }: { censusTrends: ReturnType<typeof buildCensusTrends> }) {
  const allYears = [...new Set(censusTrends.flatMap(t => t.years.map(y => y.year)))].sort();
  const chartData = allYears.map(year => {
    const row: Record<string, number | string> = { year: year.toString() };
    for (const trend of censusTrends) {
      const entry = trend.years.find(y => y.year === year);
      if (entry?.fsmPct != null) {
        row[trend.school] = entry.fsmPct;
      }
    }
    return row;
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">Free School Meals % &mdash; Multi-Year Trend</h3>
      <p className="text-xs text-gray-500 mb-2">Source: DfE School Census (whole-school figures reported annually by each school to the DfE). This is NOT from the trust&apos;s spreadsheet.</p>
      <p className="text-xs text-gray-600 mb-4">
        <strong>Why this matters:</strong> FSM% is the primary indicator of disadvantage.
        Nationally, disadvantaged pupils attain significantly lower than their peers.
        A rising FSM% means the school is serving an increasingly disadvantaged community &mdash;
        attainment data must be interpreted in that context. A school whose FSM% has doubled
        cannot be compared like-for-like against its own historical results without acknowledging
        the changing cohort demographics.
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" />
          <YAxis domain={[0, 60]} />
          <Tooltip />
          <Legend />
          {PENNINE_SCHOOLS.map(school => (
            <Line
              key={school.abbrev}
              type="monotone"
              dataKey={school.abbrev}
              stroke={SCHOOL_COLORS[school.abbrev]}
              strokeWidth={2}
              dot={{ fill: SCHOOL_COLORS[school.abbrev], r: 4 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-400 mt-2">Note: FSM% is calculated across all pupils on roll (including nursery where applicable). The trust&apos;s spreadsheet may show different percentages as it only covers the year groups submitted.</p>
    </div>
  );
}

function ScaledScoresChart({ ks2Results }: { ks2Results: KS2Result[] }) {
  const scores2025 = ks2Results.filter(
    r => r.academicYearEnd === 2025 && r.breakdownTopic === 'All pupils' && r.averageScaledScore != null &&
      ['Reading', 'Maths', 'Grammar, punctuation and spelling'].includes(r.subject),
  );

  const chartData = PENNINE_SCHOOLS.map(school => {
    const row: Record<string, number | string> = { school: school.abbrev };
    for (const subj of ['Reading', 'Maths', 'Grammar, punctuation and spelling']) {
      const val = scores2025.find(r => r.urn === school.urn && r.subject === subj);
      const key = subj === 'Grammar, punctuation and spelling' ? 'GPS' : subj;
      row[key] = val?.averageScaledScore ?? 0;
    }
    return row;
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">Average Scaled Scores &mdash; 2025 SATs</h3>
      <p className="text-xs text-gray-500 mb-4">Source: DfE validated KS2 results (2024/25 SATs). These are the actual test scores, not teacher assessment.</p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="school" />
          <YAxis domain={[90, 115]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="Reading" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Maths" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="GPS" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2">National expected standard = scaled score 100. Scores below 100 indicate below-average attainment.</p>
    </div>
  );
}

function SchoolRadarChart({ ks2Results }: { ks2Results: KS2Result[] }) {
  const subjects = ['Reading', 'Writing', 'Maths'];
  const data2025 = ks2Results.filter(
    r => r.academicYearEnd === 2025 && r.breakdownTopic === 'All pupils' && subjects.includes(r.subject),
  );

  const radarData = subjects.map(subject => {
    const row: Record<string, number | string> = { subject };
    for (const school of PENNINE_SCHOOLS) {
      const val = data2025.find(r => r.urn === school.urn && r.subject === subject);
      row[school.abbrev] = val?.expectedStandardPct ?? 0;
    }
    return row;
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">2025 SATs &mdash; School Comparison Radar</h3>
      <p className="text-xs text-gray-500 mb-4">Source: DfE validated KS2 results (2024/25). % of pupils reaching expected standard in Reading, Writing, and Maths.</p>
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis domain={[0, 100]} />
          {PENNINE_SCHOOLS.map(school => (
            <Radar
              key={school.abbrev}
              name={school.abbrev}
              dataKey={school.abbrev}
              stroke={SCHOOL_COLORS[school.abbrev]}
              fill={SCHOOL_COLORS[school.abbrev]}
              fillOpacity={0.1}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
