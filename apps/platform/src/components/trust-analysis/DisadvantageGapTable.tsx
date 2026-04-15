'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DisadvantageGap, PENNINE_SCHOOLS } from '@/lib/trust-analysis/types';

interface Props {
  gaps: DisadvantageGap[];
}

function getGapColor(gap: number | null): string {
  if (gap == null) return 'text-gray-400';
  if (gap <= 5) return 'text-emerald-600 font-bold';
  if (gap <= 15) return 'text-amber-600 font-bold';
  return 'text-red-600 font-bold';
}

export default function DisadvantageGapTable({ gaps }: Props) {
  const subjects = ['Reading', 'Writing', 'Maths', 'Combined'];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left p-3 font-medium text-gray-500">School</th>
            {subjects.map(s => (
              <th key={s} colSpan={3} className="p-3 text-center font-medium text-gray-500 border-l border-gray-100">
                {s}
              </th>
            ))}
          </tr>
          <tr className="border-b border-gray-100 text-xs text-gray-400">
            <th />
            {subjects.map(s => (
              <React.Fragment key={s}>
                <th className="p-2 text-center border-l border-gray-100">FSM6</th>
                <th className="p-2 text-center">Non-FSM</th>
                <th className="p-2 text-center">Gap</th>
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {PENNINE_SCHOOLS.map((school, idx) => (
            <motion.tr
              key={school.abbrev}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="border-b border-gray-50 hover:bg-gray-50"
            >
              <td className="p-3 font-semibold">{school.abbrev}</td>
              {subjects.map(subject => {
                const gap = gaps.find(g => g.school === school.abbrev && g.subject === subject);
                return (
                  <React.Fragment key={subject}>
                    <td className="p-2 text-center border-l border-gray-100">
                      {gap?.fsmPct != null ? `${gap.fsmPct}%` : '\u2014'}
                    </td>
                    <td className="p-2 text-center">
                      {gap?.nonFsmPct != null ? `${gap.nonFsmPct}%` : '\u2014'}
                    </td>
                    <td className={`p-2 text-center ${getGapColor(gap?.gapPp ?? null)}`}>
                      {gap?.gapPp != null ? `${gap.gapPp}pp` : '\u2014'}
                    </td>
                  </React.Fragment>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
