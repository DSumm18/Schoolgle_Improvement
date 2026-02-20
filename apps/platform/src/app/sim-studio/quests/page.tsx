"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Gamepad2, ArrowLeft, Sword, Target, Clock } from "lucide-react";

export default function QuestsPage() {
  // Placeholder data
  const availableQuests = [
    {
      id: "place-value-detectives",
      title: "Number Detectives",
      description: "Identify digit values and partition numbers",
      subject: "Maths",
      topic: "Place Value",
      keyStage: "KS1/KS2",
      duration: "3 min",
      difficulty: "developing",
      reward: 10,
      itemsCount: 5,
    },
    {
      id: "fraction-chef",
      title: "Fraction Chef",
      description: "Master equivalence through visual recipes",
      subject: "Maths",
      topic: "Fractions",
      keyStage: "KS2",
      duration: "4 min",
      difficulty: "secure",
      reward: 15,
      itemsCount: 6,
    },
    {
      id: "array-master",
      title: "Array Master",
      description: "Build multiplication understanding with visual patterns",
      subject: "Maths",
      topic: "Multiplication",
      keyStage: "KS1/KS2",
      duration: "3 min",
      difficulty: "emerging",
      reward: 10,
      itemsCount: 4,
    },
  ];

  const assignedQuests = [
    {
      id: "q1",
      questId: "place-value-detectives",
      dueDate: "2026-02-25",
      assignedBy: "Mrs. Smith",
      status: "pending",
      class: "Year 4 Hawthorn",
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "emerging":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300";
      case "developing":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
      case "secure":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
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
                <Sword className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Quests
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Assessment-as-Play micro-challenges
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
                href="/sim-studio/dashboard"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Assigned Quests */}
        {assignedQuests.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Assigned Quests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignedQuests.map((assigned) => (
                <motion.div
                  key={assigned.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-2 border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                        {assigned.class}
                      </span>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                        {availableQuests.find((q) => q.id === assigned.questId)?.title}
                      </h3>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 rounded-full text-sm font-medium">
                      Due {new Date(assigned.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Assigned by {assigned.assignedBy}
                    </span>
                    <Link
                      href={`/sim-studio/quests/play/${assigned.questId}`}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                    >
                      Start Quest
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Available Quests */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Available Quests
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableQuests.map((quest) => (
              <motion.div
                key={quest.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      {quest.subject} • {quest.topic}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                      {quest.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded text-sm font-bold">
                    <Target className="w-3 h-3" />
                    {quest.reward}
                  </div>
                </div>

                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  {quest.description}
                </p>

                <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {quest.duration}
                  </span>
                  <span>{quest.itemsCount} challenges</span>
                  <span>{quest.keyStage}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getDifficultyColor(
                      quest.difficulty
                    )}`}
                  >
                    {quest.difficulty}
                  </span>
                  <Link
                    href={`/sim-studio/quests/play/${quest.id}`}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                  >
                    Play Quest
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Quest Info */}
        <section className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            About Quests
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            Quests are short, engaging micro-assessments (2-5 minutes) that check
            understanding through interactive challenges. Each quest contains 3-6
            activities and adapts to each pupil's needs. Results feed directly into
            your dashboard, helping you track progress and identify misconceptions
            early.
          </p>
        </section>
      </div>
    </div>
  );
}
