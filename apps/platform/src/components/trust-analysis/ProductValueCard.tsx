'use client';

import { motion } from 'framer-motion';

interface Question {
  question: string;
  context: string;
}

interface Props {
  tier: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  questions: Question[];
  valueStatement: string;
  nextTierTeaser?: string;
}

const TIER_STYLES = {
  1: { bg: 'from-gray-50 to-gray-100', border: 'border-gray-200', badge: 'bg-gray-200 text-gray-700', label: 'Free' },
  2: { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', label: 'Standard' },
  3: { bg: 'from-purple-50 to-violet-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', label: 'Demo' },
  4: { bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Premium' },
};

export default function ProductValueCard({ tier, title, subtitle, questions, valueStatement, nextTierTeaser }: Props) {
  const style = TIER_STYLES[tier];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={`mt-12 rounded-2xl border-2 ${style.border} bg-gradient-to-br ${style.bg} p-8`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${style.badge}`}>
          {style.label}
        </span>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-6">{subtitle}</p>

      {/* Questions for the user */}
      <div className="space-y-4 mb-8">
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Questions to consider</h4>
        {questions.map((q, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + idx * 0.1 }}
            className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
          >
            <p className="font-semibold text-gray-900 text-sm mb-1">{q.question}</p>
            <p className="text-xs text-gray-500">{q.context}</p>
          </motion.div>
        ))}
      </div>

      {/* Value statement */}
      <div className="bg-white rounded-lg p-5 border border-gray-200">
        <p className="text-sm text-gray-700 leading-relaxed">{valueStatement}</p>
      </div>

      {/* Next tier teaser */}
      {nextTierTeaser && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 italic">{nextTierTeaser}</p>
        </div>
      )}
    </motion.div>
  );
}
