'use client';

import { motion } from 'framer-motion';
import { DivergenceFlag, PENNINE_SCHOOLS, RAGStatus } from '@/lib/trust-analysis/types';

interface Props {
  divergences: DivergenceFlag[];
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

export default function DfeCrossReference({ divergences }: Props) {
  const bySchool = new Map<string, DivergenceFlag[]>();
  for (const d of divergences) {
    const arr = bySchool.get(d.school) ?? [];
    arr.push(d);
    bySchool.set(d.school, arr);
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500">
        Comparing Y6 mid-year teacher assessment (2025/26) against 2025 validated SATs results.
        Divergences of 20pp+ are flagged red, 10-19pp amber.
      </div>

      {PENNINE_SCHOOLS.map((school, idx) => {
        const flags = bySchool.get(school.abbrev) ?? [];
        if (flags.length === 0) return null;

        const hasRedFlag = flags.some(f => f.rag === 'red');

        return (
          <motion.div
            key={school.abbrev}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={`border rounded-xl p-5 ${hasRedFlag ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}
          >
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900">{school.name}</h3>
              <span className="text-sm text-gray-500">URN {school.urn}</span>
              {hasRedFlag && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  Significant divergence
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {flags.map(flag => (
                <div
                  key={flag.subject}
                  className={`border rounded-lg p-4 ${ragBg(flag.rag)}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${ragDot(flag.rag)}`} />
                    <span className="font-semibold text-gray-900">{flag.subject}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                    <div>
                      <div className="text-gray-500">Mid-Year TA</div>
                      <div className="text-lg font-bold">{flag.selfReportedPct}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">2025 SATs</div>
                      <div className="text-lg font-bold">{flag.validatedPct}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Divergence</div>
                      <div className={`text-lg font-bold ${flag.divergencePp > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {flag.divergencePp > 0 ? '+' : ''}{flag.divergencePp}pp
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">{flag.narrative}</p>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
