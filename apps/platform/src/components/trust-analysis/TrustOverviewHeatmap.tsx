'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  SchoolSelfReport, PENNINE_SCHOOLS, YEAR_GROUPS, Subject, CORE_SUBJECTS,
} from '@/lib/trust-analysis/types';

interface Props {
  selfReports: SchoolSelfReport[];
}

function getCellColor(value: number | null): string {
  if (value == null) return 'bg-gray-100 text-gray-400';
  if (value >= 80) return 'bg-emerald-500 text-white';
  if (value >= 70) return 'bg-emerald-400 text-white';
  if (value >= 60) return 'bg-amber-400 text-gray-900';
  if (value >= 50) return 'bg-amber-500 text-white';
  if (value >= 40) return 'bg-red-400 text-white';
  return 'bg-red-600 text-white';
}

function getSubjectKey(subject: Subject): 'reading' | 'writing' | 'maths' | 'combined' {
  return subject.toLowerCase() as 'reading' | 'writing' | 'maths' | 'combined';
}

export default function TrustOverviewHeatmap({ selfReports }: Props) {
  const [selectedSubject, setSelectedSubject] = useState<Subject>('Combined');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {CORE_SUBJECTS.map(subject => (
          <button
            key={subject}
            onClick={() => setSelectedSubject(subject)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedSubject === subject
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {subject}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 text-sm font-medium text-gray-500 w-32">School</th>
              {YEAR_GROUPS.map(yg => (
                <th key={yg} className="p-3 text-sm font-medium text-gray-500 text-center">{yg}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PENNINE_SCHOOLS.map((school, schoolIdx) => {
              const report = selfReports.find(r => r.school === school.abbrev);
              return (
                <motion.tr
                  key={school.abbrev}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: schoolIdx * 0.05 }}
                  className="border-t border-gray-100"
                >
                  <td className="p-3">
                    <div className="text-sm font-semibold text-gray-900">{school.abbrev}</div>
                    <div className="text-xs text-gray-500">{school.nor} NOR</div>
                  </td>
                  {YEAR_GROUPS.map(yg => {
                    const ygData = report?.yearGroups.find(y => y.yearGroup === yg);
                    const key = getSubjectKey(selectedSubject);
                    const value = ygData?.allPupils[key] ?? null;
                    return (
                      <td key={yg} className="p-1 text-center">
                        <motion.div
                          className={`rounded-lg p-3 text-sm font-bold ${getCellColor(value)}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: schoolIdx * 0.05 + 0.1 }}
                          title={`${school.abbrev} ${yg} ${selectedSubject}: ${value ?? 'No data'}%`}
                        >
                          {value != null ? `${value}%` : '\u2014'}
                        </motion.div>
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Legend:</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-500" /> 80%+</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-400" /> 70-79%</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-amber-400" /> 60-69%</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-amber-500" /> 50-59%</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-400" /> 40-49%</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-600" /> Below 40%</span>
      </div>
    </div>
  );
}
