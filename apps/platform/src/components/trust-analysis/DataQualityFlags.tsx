'use client';

import { motion } from 'framer-motion';
import { DataQualityFlag } from '@/lib/trust-analysis/types';

interface Props {
  flags: DataQualityFlag[];
}

export default function DataQualityFlags({ flags }: Props) {
  const errors = flags.filter(f => f.severity === 'error');
  const warnings = flags.filter(f => f.severity === 'warning');

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
          {errors.length} errors
        </span>
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
          {warnings.length} warnings
        </span>
      </div>

      <div className="space-y-2">
        {flags.map((flag, idx) => (
          <motion.div
            key={`${flag.school}-${flag.yearGroup}-${idx}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              flag.severity === 'error'
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <span className="text-lg shrink-0">{flag.severity === 'error' ? '\u{1F534}' : '\u{1F7E1}'}</span>
            <div>
              <span className="font-semibold text-sm">{flag.school} \u2014 {flag.yearGroup}</span>
              <p className="text-sm text-gray-700">{flag.issue}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
