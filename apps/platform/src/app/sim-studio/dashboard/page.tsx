"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Gamepad2,
  ArrowLeft,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  Download,
  Calendar,
  Award,
  Zap,
  Eye,
} from "lucide-react";

// Mock data - will be replaced with Supabase queries
const mockPupils = [
  {
    id: "1",
    name: "Ahmed",
    strengths: ["Place Value", "Addition"],
    misconceptions: ["Fraction equivalence confusion"],
    nextSteps: ["Work on Fractions (step-by-step scaffold)"],
    scaffoldRecommendation: "step_by_step",
    evidenceCoverage: 85,
    lastQuest: new Date("2026-02-18"),
    averageScore: 78,
    trend: "improving" as const,
  },
  {
    id: "2",
    name: "Bella",
    strengths: ["Fractions", "Multiplication"],
    misconceptions: [],
    nextSteps: ["Stretch challenge available"],
    scaffoldRecommendation: "stretch",
    evidenceCoverage: 92,
    lastQuest: new Date("2026-02-19"),
    averageScore: 92,
    trend: "stable" as const,
  },
  {
    id: "3",
    name: "Charlie",
    strengths: [],
    misconceptions: ["Place value erosion", "Zero as placeholder"],
    nextSteps: ["Work on Place Value (visual-first scaffold)"],
    scaffoldRecommendation: "visual_first",
    evidenceCoverage: 45,
    lastQuest: new Date("2026-02-15"),
    averageScore: 52,
    trend: "declining" as const,
  },
];

const mockEvidenceWarnings = [
  {
    type: "pupil" as const,
    message: "1 pupil with insufficient evidence (< 50% coverage)",
    severity: "high" as const,
    affectedEntities: ["Charlie"],
    suggestedAction: "Assign quests to increase evidence coverage",
  },
  {
    type: "skill" as const,
    message: "Fraction Equivalence - Low evidence coverage (35%)",
    severity: "medium" as const,
    affectedEntities: ["fraction_equivalence"],
    suggestedAction: "Assign Fraction Chef quest",
  },
];

const mockRecentActivity = [
  { id: 1, pupil: "Ahmed", quest: "Number Detectives", score: 85, time: "2 hours ago" },
  { id: 2, pupil: "Bella", quest: "Fraction Builders", score: 92, time: "3 hours ago" },
  { id: 3, pupil: "Charlie", quest: "Array Master", score: 78, time: "5 hours ago" },
  { id: 4, pupil: "Daisy", quest: "Number Detectives", score: 88, time: "6 hours ago" },
];

export default function TeacherDashboardPage() {
  const [selectedView, setSelectedView] = useState<'overview' | 'pupils' | 'heatmap'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPupil, setSelectedPupil] = useState<typeof mockPupils[0] | null>(null);

  const filteredPupils = mockPupils.filter((pupil) =>
    pupil.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <Target className="w-4 h-4 text-blue-500" />;
    }
  };

  const getScaffoldColor = (scaffold: string) => {
    switch (scaffold) {
      case 'stretch':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'step_by_step':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'visual_first':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'language_lite':
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
                href="/sim-studio"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </Link>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Teacher Dashboard
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Year 4 Hawthorn • Class Overview
                </p>
              </div>
            </div>
            <nav className="flex gap-2">
              <Link
                href="/sim-studio"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Gallery
              </Link>
              <Link
                href="/sim-studio/quests"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Quests
              </Link>
              <Link
                href="/sim-studio/dashboard/slt"
                className="px-4 py-2 text-sm font-medium bg-purple-500 text-white hover:bg-purple-600 rounded-lg transition"
              >
                SLT View
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total Pupils</span>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">28</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Active This Week</span>
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">24</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Avg Completion</span>
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">78%</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Quests Completed</span>
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">45</p>
          </motion.div>
        </div>

        {/* Evidence Coverage Warnings */}
        {mockEvidenceWarnings.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Evidence Coverage Alerts
            </h2>
            <div className="space-y-3">
              {mockEvidenceWarnings.map((warning, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-l-4 ${
                    warning.severity === 'high'
                      ? 'border-red-500'
                      : warning.severity === 'medium'
                      ? 'border-amber-500'
                      : 'border-blue-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          warning.severity === 'high'
                            ? 'bg-red-100 dark:bg-red-900'
                            : warning.severity === 'medium'
                            ? 'bg-amber-100 dark:bg-amber-900'
                            : 'bg-blue-100 dark:bg-blue-900'
                        }`}
                      >
                        <AlertCircle className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {warning.message}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                          Suggested: {warning.suggestedAction}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {warning.affectedEntities.map((entity) => (
                            <span
                              key={entity}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium"
                            >
                              {entity}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium">
                      Take Action
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView('overview')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                selectedView === 'overview'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setSelectedView('pupils')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                selectedView === 'pupils'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Pupil Cards
            </button>
            <button
              onClick={() => setSelectedView('heatmap')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                selectedView === 'heatmap'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              Skills Heatmap
            </button>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search pupils..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-sm font-medium flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Overview View */}
        {selectedView === 'overview' && (
          <>
            {/* Skills Needing Support */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Skills Requiring Support
              </h2>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {[
                    { skill: 'Fraction Equivalence', pupils: 5, urgency: 'high' as const },
                    { skill: 'Place Value Partitioning', pupils: 3, urgency: 'medium' as const },
                    { skill: 'Multiplication Arrays', pupils: 2, urgency: 'low' as const },
                  ].map((item, index) => (
                    <motion.div
                      key={item.skill}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-lg ${
                              item.urgency === 'high'
                                ? 'bg-red-100 dark:bg-red-900'
                                : item.urgency === 'medium'
                                ? 'bg-amber-100 dark:bg-amber-900'
                                : 'bg-blue-100 dark:bg-blue-900'
                            }`}
                          >
                            <Zap className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {item.skill}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {item.pupils} pupils need support
                            </p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium">
                          View Details
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                Recent Quest Activity
              </h2>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {mockRecentActivity.map((activity, index) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {activity.pupil}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Completed {activity.quest}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{activity.score}%</p>
                          <p className="text-xs text-slate-500">{activity.time}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* Pupil Cards View */}
        {selectedView === 'pupils' && (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPupils.map((pupil) => (
                <motion.div
                  key={pupil.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedPupil(pupil)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {pupil.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getTrendIcon(pupil.trend)}
                        <span className="text-xs text-slate-500 capitalize">{pupil.trend}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {pupil.averageScore}%
                      </p>
                      <p className="text-xs text-slate-500">Avg Score</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Strengths</p>
                      <div className="flex flex-wrap gap-1">
                        {pupil.strengths.length > 0 ? (
                          pupil.strengths.map((strength) => (
                            <span
                              key={strength}
                              className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs"
                            >
                              {strength}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">Not enough data</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Misconceptions</p>
                      <div className="flex flex-wrap gap-1">
                        {pupil.misconceptions.length > 0 ? (
                          pupil.misconceptions.map((misconception) => (
                            <span
                              key={misconception}
                              className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs"
                            >
                              {misconception}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">None detected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Evidence Coverage</span>
                      <span
                        className={`font-medium ${
                          pupil.evidenceCoverage >= 70
                            ? 'text-green-600'
                            : pupil.evidenceCoverage >= 50
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {pupil.evidenceCoverage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pupil.evidenceCoverage >= 70
                            ? 'bg-green-500'
                            : pupil.evidenceCoverage >= 50
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${pupil.evidenceCoverage}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getScaffoldColor(
                        pupil.scaffoldRecommendation
                      )}`}
                    >
                      {pupil.scaffoldRecommendation.replace('_', ' ')} scaffold
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Heatmap View */}
        {selectedView === 'heatmap' && (
          <section>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Class Skills Heatmap
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">
                Color represents average score per skill per pupil
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Pupil
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Place Value
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Fractions
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Multiplication
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                        Division
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPupils.map((pupil) => (
                      <tr key={pupil.id} className="border-b border-slate-200 dark:border-slate-700">
                        <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-white">
                          {pupil.name}
                        </td>
                        <td className="py-3 px-4">
                          <HeatmapCell score={pupil.averageScore} />
                        </td>
                        <td className="py-3 px-4">
                          <HeatmapCell score={Math.round(pupil.averageScore * 0.9)} />
                        </td>
                        <td className="py-3 px-4">
                          <HeatmapCell score={Math.round(pupil.averageScore * 0.85)} />
                        </td>
                        <td className="py-3 px-4">
                          <HeatmapCell score={Math.round(pupil.averageScore * 0.8)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function HeatmapCell({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${getColor()} text-white text-sm font-semibold rounded-lg w-12 h-12 flex items-center justify-center`}
      >
        {score}
      </div>
    </div>
  );
}
