"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Target,
  Calendar,
  Pin,
  Filter,
  Download,
  Eye,
} from "lucide-react";

// Mock calibration data
const mockCalibrationData = [
  {
    pupilId: "1",
    pupilName: "Ahmed",
    teacherJudgement: "GDS",
    schoolgleAssessment: "EXS",
    status: "calibration_required" as const,
    skill: "Place Value",
    confidence: "high",
  },
  {
    pupilId: "2",
    pupilName: "Bella",
    teacherJudgement: "EXS",
    schoolgleAssessment: "EXS",
    status: "agreement" as const,
    skill: "Fractions",
    confidence: "high",
  },
  {
    pupilId: "3",
    pupilName: "Charlie",
    teacherJudgement: "WTS",
    schoolgleAssessment: "EXS",
    status: "calibration_required" as const,
    skill: "Multiplication",
    confidence: "medium",
  },
  {
    pupilId: "4",
    pupilName: "Daisy",
    teacherJudgement: "EXS",
    schoolgleAssessment: "GDS",
    moderation: "EXS",
    status: "moderated" as const,
    skill: "Place Value",
    confidence: "high",
  },
];

// Mock timeline events
const mockTimelineEvents = [
  {
    id: "1",
    type: "scheme_change" as const,
    date: "2026-01-15",
    title: "Changed to White Rose Maths",
    description: "Adopted White Rose scheme across KS2",
    trigger: "Inconsistent progress in fractions",
    hypothesis: "Current scheme not providing enough scaffolding",
    action: "Staff training on White Rose approach",
    impact: "Awaiting evidence",
  },
  {
    id: "2",
    type: "mismatch_detected" as const,
    date: "2026-02-10",
    title: "Calibration Check Required",
    description: "Multiple teacher-Schoolgle mismatches in Year 4",
    trigger: "Automated detection of 5+ high-confidence mismatches",
    hypothesis: "Possible assessment drift in teacher judgements",
    action: "Scheduled moderation meeting for 2026-02-20",
    impact: "Pending review",
  },
  {
    id: "3",
    type: "intervention_started" as const,
    date: "2026-02-01",
    title: "Targeted Maths Intervention",
    description: "Small group intervention for place value",
    trigger: "3 pupils identified with place value gaps",
    hypothesis: "Lack of foundational understanding affecting progress",
    action: "3x weekly small group sessions with TA",
    impact: "Early signs of improvement in recent quest data",
  },
];

// Mock cohort trends
const mockCohortTrends = {
  labels: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
  concept: [65, 68, 72, 75, 78, 82],
  transfer: [60, 62, 65, 68, 70, 73],
};

export default function SLTDashboardPage() {
  const [selectedView, setSelectedView] = useState<'calibration' | 'trends' | 'timeline'>('calibration');
  const [filterStatus, setFilterStatus] = useState<'all' | 'agreement' | 'calibration_required'>('all');

  const filteredCalibration = mockCalibrationData.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'agreement':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'calibration_required':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'moderated':
        return <Shield className="w-5 h-5 text-blue-500" />;
      default:
        return <XCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getJudgementColor = (judgement: string) => {
    switch (judgement) {
      case 'GDS':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'EXS':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'WTS':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/sim-studio/dashboard"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </Link>
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  SLT Calibration Dashboard
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Year 4 Hawthorn • Cross-class Analytics
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm font-medium flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm font-medium flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Calibration Rate</span>
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">78%</p>
            <p className="text-xs text-slate-500 mt-1">Teacher-Schoolgle agreement</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Calibration Checks</span>
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">5</p>
            <p className="text-xs text-slate-500 mt-1">Require review</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Cohort Trend</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">+12%</p>
            <p className="text-xs text-slate-500 mt-1">Since September</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Evidence Coverage</span>
              <Eye className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">85%</p>
            <p className="text-xs text-slate-500 mt-1">Across all skills</p>
          </motion.div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('calibration')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              selectedView === 'calibration'
                ? 'bg-purple-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Calibration View
          </button>
          <button
            onClick={() => setSelectedView('trends')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              selectedView === 'trends'
                ? 'bg-purple-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Cohort Trends
          </button>
          <button
            onClick={() => setSelectedView('timeline')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
              selectedView === 'timeline'
                ? 'bg-purple-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            Timeline & Pins
          </button>
        </div>

        {/* Calibration View */}
        {selectedView === 'calibration' && (
          <>
            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                All ({mockCalibrationData.length})
              </button>
              <button
                onClick={() => setFilterStatus('agreement')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  filterStatus === 'agreement'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Agreement ({mockCalibrationData.filter((d) => d.status === 'agreement').length})
              </button>
              <button
                onClick={() => setFilterStatus('calibration_required')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  filterStatus === 'calibration_required'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Needs Calibration ({mockCalibrationData.filter((d) => d.status === 'calibration_required').length})
              </button>
            </div>

            {/* Calibration Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Pupil
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Teacher Judgement
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Schoolgle Assessment
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Moderation
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Status
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Confidence
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredCalibration.map((item) => (
                    <tr key={item.pupilId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900 dark:text-white">{item.pupilName}</div>
                        <div className="text-sm text-slate-500">{item.skill}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getJudgementColor(
                            item.teacherJudgement
                          )}`}
                        >
                          {item.teacherJudgement}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getJudgementColor(
                            item.schoolgleAssessment
                          )}`}
                        >
                          {item.schoolgleAssessment}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {item.moderation ? (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getJudgementColor(
                              item.moderation
                            )}`}
                          >
                            {item.moderation}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="text-xs text-slate-600 dark:text-slate-400 capitalize">
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            item.confidence === 'high'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : item.confidence === 'medium'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.confidence}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {item.status === 'calibration_required' ? (
                          <button className="px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition text-xs font-medium">
                            Review
                          </button>
                        ) : (
                          <button className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition text-xs font-medium">
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Trends View */}
        {selectedView === 'trends' && (
          <div className="space-y-6">
            {/* Cohort Trend Graph */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Cohort Performance Over Time
              </h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {mockCohortTrends.labels.map((label, index) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex gap-1 items-end justify-center h-48">
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                        style={{ height: `${mockCohortTrends.concept[index]}%` }}
                        title={`Concept: ${mockCohortTrends.concept[index]}%`}
                      />
                      <div
                        className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                        style={{ height: `${mockCohortTrends.transfer[index]}%` }}
                        title={`Transfer: ${mockCohortTrends.transfer[index]}%`}
                      />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Concept</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Transfer</span>
                </div>
              </div>
            </div>

            {/* Hotspot Report */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Misconception Hotspots by Year Group
              </h3>
              <div className="space-y-3">
                {[
                  { year: 'Year 4', misconception: 'Fraction equivalence confusion', pupils: 8, severity: 'high' },
                  { year: 'Year 5', misconception: 'Area vs perimeter', pupils: 5, severity: 'medium' },
                  { year: 'Year 3', misconception: 'Zero as placeholder', pupils: 4, severity: 'medium' },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-l-4 ${
                      item.severity === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{item.misconception}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {item.year} • {item.pupils} pupils affected
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Equity View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  SEND Scaffold Usage
                </h3>
                <div className="space-y-3">
                  {[
                    { scaffold: 'Step-by-step', usage: 45, outcomes: 72 },
                    { scaffold: 'Visual-first', usage: 30, outcomes: 68 },
                    { scaffold: 'Motor-friendly', usage: 15, outcomes: 75 },
                  ].map((item) => (
                    <div key={item.scaffold}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">{item.scaffold}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{item.outcomes}% avg</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${item.usage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  EAL Performance Comparison
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">English-only</span>
                      <span className="font-medium text-slate-900 dark:text-white">71%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '71%' }} />
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Translation enabled</span>
                      <span className="font-medium text-slate-900 dark:text-white">84%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '84%' }} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    +13% improvement with translation support
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline View */}
        {selectedView === 'timeline' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Improvement Timeline with Evidence Pins
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
              Track triggers, actions, and impact over time
            </p>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />

              {/* Timeline events */}
              <div className="space-y-6 pl-10">
                {mockTimelineEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Pin icon */}
                    <div className="absolute -left-10 top-0">
                      <div
                        className={`p-2 rounded-full ${
                          event.type === 'mismatch_detected'
                            ? 'bg-amber-100 dark:bg-amber-900'
                            : event.type === 'scheme_change'
                            ? 'bg-blue-100 dark:bg-blue-900'
                            : event.type === 'intervention_started'
                            ? 'bg-green-100 dark:bg-green-900'
                            : 'bg-purple-100 dark:bg-purple-900'
                        }`}
                      >
                        <Pin className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                      </div>
                    </div>

                    {/* Event card */}
                    <div
                      className={`p-4 rounded-lg border-l-4 ${
                        event.type === 'mismatch_detected'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                          : event.type === 'scheme_change'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : event.type === 'intervention_started'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{event.date}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                event.type === 'mismatch_detected'
                                  ? 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                                  : event.type === 'scheme_change'
                                  ? 'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                                  : 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300'
                              }`}
                            >
                              {event.type.replace('_', ' ')}
                            </span>
                          </div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{event.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {event.description}
                          </p>
                        </div>
                        <button className="px-3 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-xs font-medium">
                          Expand
                        </button>
                      </div>

                      {/* Trigger → Hypothesis → Action → Impact */}
                      <div className="mt-3 space-y-2 text-sm">
                        {event.trigger && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">Trigger:</span>
                            <span className="text-slate-600 dark:text-slate-400">{event.trigger}</span>
                          </div>
                        )}
                        {event.hypothesis && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">Hypothesis:</span>
                            <span className="text-slate-600 dark:text-slate-400">{event.hypothesis}</span>
                          </div>
                        )}
                        {event.action && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">Action:</span>
                            <span className="text-slate-600 dark:text-slate-400">{event.action}</span>
                          </div>
                        )}
                        {event.impact && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-slate-700 dark:text-slate-300">Impact:</span>
                            <span
                              className={`font-medium ${
                                event.impact.toLowerCase().includes('improvement')
                                  ? 'text-green-600 dark:text-green-400'
                                  : event.impact.toLowerCase().includes('pending')
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {event.impact}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
