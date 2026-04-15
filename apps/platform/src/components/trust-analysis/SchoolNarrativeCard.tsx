'use client';

import { motion } from 'framer-motion';
import { SchoolNarrative, getSchoolByAbbrev } from '@/lib/trust-analysis/types';

interface Props {
  narrative: SchoolNarrative;
  index: number;
}

export default function SchoolNarrativeCard({ narrative, index }: Props) {
  const school = getSchoolByAbbrev(narrative.school);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-gray-200 rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <h3 className="text-xl font-bold text-gray-900">{school?.name ?? narrative.school}</h3>
        {school && (
          <span className="text-sm text-gray-500">
            URN {school.urn} | {school.nor} NOR | {school.fsmPct}% FSM
          </span>
        )}
      </div>

      {narrative.strengths.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide mb-2">Strengths</h4>
          <ul className="space-y-1">
            {narrative.strengths.map((s, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {narrative.concerns.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-2">Areas for Development</h4>
          <ul className="space-y-1">
            {narrative.concerns.map((c, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-red-500 mt-0.5 shrink-0">!</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {narrative.ofstedQuestions.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Questions an Inspector Might Ask</h4>
          <ul className="space-y-1">
            {narrative.ofstedQuestions.map((q, i) => (
              <li key={i} className="text-sm text-blue-900 flex items-start gap-2">
                <span className="font-bold shrink-0">Q{i + 1}.</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-gray-100 pt-3">
        <p className="text-sm text-gray-600 italic">{narrative.overallAssessment}</p>
      </div>
    </motion.div>
  );
}
