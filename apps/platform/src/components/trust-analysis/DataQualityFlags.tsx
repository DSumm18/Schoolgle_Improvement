'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DataQualityFlag } from '@/lib/trust-analysis/types';

interface Props {
  flags: DataQualityFlag[];
}

export default function DataQualityFlags({ flags }: Props) {
  const [expanded, setExpanded] = useState(false);
  const errors = flags.filter(f => f.severity === 'error');
  const warnings = flags.filter(f => f.severity === 'warning');

  // Show first 3 when collapsed
  const visibleFlags = expanded ? flags : flags.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold">
            {errors.length} errors
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-bold">
            {warnings.length} warnings
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          {expanded ? 'Collapse' : `Show all ${flags.length} flags`}
        </button>
      </div>

      <AnimatePresence>
        <div className="space-y-1.5">
          {visibleFlags.map((flag, idx) => (
            <motion.div
              key={`${flag.school}-${flag.yearGroup}-${idx}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm ${
                flag.severity === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <span className="shrink-0 text-xs">{flag.severity === 'error' ? '\u{1F534}' : '\u{1F7E1}'}</span>
              <span className="font-bold text-gray-900 shrink-0 w-16">{flag.school}</span>
              <span className="font-semibold text-gray-600 shrink-0 w-10">{flag.yearGroup}</span>
              <span className="text-gray-700 truncate">{flag.issue}</span>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {!expanded && flags.length > 3 && (
        <p className="text-xs text-gray-400 text-center">
          +{flags.length - 3} more flags hidden
        </p>
      )}
    </div>
  );
}
