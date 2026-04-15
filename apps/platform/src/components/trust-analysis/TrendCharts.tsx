'use client';

import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import { KS2Result, CensusRecord, PENNINE_SCHOOLS } from '@/lib/trust-analysis/types';
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
}

type ChartView = 'ks2-combined' | 'fsm-trend' | 'scaled-scores' | 'radar';

export default function TrendCharts({ ks2Results, census }: Props) {
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
        {chartView === 'ks2-combined' && <KS2CombinedChart ks2Results={ks2Results} />}
        {chartView === 'fsm-trend' && <FSMTrendChart censusTrends={censusTrends} />}
        {chartView === 'scaled-scores' && <ScaledScoresChart ks2Results={ks2Results} />}
        {chartView === 'radar' && <SchoolRadarChart ks2Results={ks2Results} />}
      </motion.div>
    </div>
  );
}

function KS2CombinedChart({ ks2Results }: { ks2Results: KS2Result[] }) {
  const combined = ks2Results.filter(
    r => r.subject === 'Reading, writing and maths' && r.breakdownTopic === 'All pupils' && r.expectedStandardPct != null,
  );

  const years = [...new Set(combined.map(r => r.academicYearEnd))].sort();
  const chartData = years.map(year => {
    const row: Record<string, number | string> = { year: year.toString() };
    for (const school of PENNINE_SCHOOLS) {
      const val = combined.find(r => r.urn === school.urn && r.academicYearEnd === year);
      if (val?.expectedStandardPct != null) {
        row[school.abbrev] = val.expectedStandardPct;
      }
    }
    return row;
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">KS2 Combined (RWM) &mdash; Expected Standard %</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" />
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
      <h3 className="text-lg font-semibold mb-4">Free School Meals % &mdash; Multi-Year Trend</h3>
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
      <h3 className="text-lg font-semibold mb-4">Average Scaled Scores &mdash; 2025 SATs</h3>
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
      <h3 className="text-lg font-semibold mb-4">2025 SATs &mdash; School Comparison Radar</h3>
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
