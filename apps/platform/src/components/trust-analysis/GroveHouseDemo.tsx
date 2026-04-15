'use client';

import { motion } from 'framer-motion';

export default function GroveHouseDemo() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">&#x1F512;</span>
          <h3 className="text-lg font-bold text-amber-900">Per-Pupil Analysis &mdash; Grove House Primary Only</h3>
        </div>
        <p className="text-sm text-amber-800 mb-4">
          This layer demonstrates Schoolgle&apos;s per-pupil analysis capability using pseudonymised data from the school&apos;s MIS.
          All pupil identifiers are SHA-256 hashed with a school-local salt. Names are resolved LIVE from Google Drive only and never stored in the database.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-3xl font-bold text-gray-900">417</div>
            <div className="text-sm text-gray-500">Pupils on Roll</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-3xl font-bold text-gray-900">27.3%</div>
            <div className="text-sm text-gray-500">FSM Eligibility</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="text-3xl font-bold text-gray-900">39.8%</div>
            <div className="text-sm text-gray-500">EAL Pupils</div>
          </div>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">&#x1F6A7;</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Per-Pupil Analysis Coming Soon</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          This feature will connect to the school&apos;s Google Drive MIS exports to show individual pupil trajectories,
          SEND/PP cross-referencing, and intervention recommendations &mdash; all with zero-knowledge pseudonymisation.
        </p>
        <div className="mt-6 space-y-2 text-sm text-gray-400">
          <p>Planned capabilities:</p>
          <ul className="space-y-1">
            <li>Per-pupil attainment tracking across year groups</li>
            <li>SEND/FSM/EAL overlay on cohort analysis</li>
            <li>Teacher assessment accuracy vs validated results</li>
            <li>AI-generated intervention recommendations per pupil</li>
            <li>Ofsted-ready evidence packs</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
