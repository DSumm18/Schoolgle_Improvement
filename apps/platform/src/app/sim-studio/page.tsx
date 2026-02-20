"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Gamepad2, Play, Clock, Shield, Star, ArrowRight } from "lucide-react";

export default function SimStudioPage() {
  // Placeholder data - will be replaced with real data from Supabase
  const featuredSims = [
    {
      id: "place-value-adventure",
      title: "Place Value Adventure",
      description: "Explore Dienes blocks, number lines, and partitioning",
      subject: "maths",
      topic: "Place Value",
      keyStage: "KS1/KS2",
      duration: "5 min",
      questEnabled: true,
      sendFriendly: true,
      thumbnail: "/placeholder-place-value.png",
    },
  ];

  const categories = [
    { id: "maths", name: "Maths", color: "from-blue-500 to-cyan-500", icon: "🔢" },
    { id: "science", name: "Science", color: "from-green-500 to-emerald-500", icon: "🔬" },
    { id: "english", name: "English", color: "from-purple-500 to-pink-500", icon: "📚" },
    { id: "geography", name: "Geography", color: "from-amber-500 to-orange-500", icon: "🌍" },
    { id: "history", name: "History", color: "from-rose-500 to-red-500", icon: "🏛️" },
  ];

  const continueLearning = [
    { id: "q1", title: "Fraction Builders", progress: 60, lastPlayed: "2 days ago" },
    { id: "q2", title: "Place Value Party", progress: 30, lastPlayed: "5 days ago" },
  ];

  const popularThisWeek = [
    {
      id: "fraction-chef",
      title: "Fraction Chef",
      description: "Master equivalence with visual recipes",
      duration: "4 min",
      keyStage: "KS2",
      questEnabled: true,
    },
    {
      id: "array-master",
      title: "Array Master",
      description: "Multiplication through visual patterns",
      duration: "3 min",
      keyStage: "KS1/KS2",
      questEnabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Sim Studio
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Interactive simulations & assessment quests
                </p>
              </div>
            </div>
            <nav className="flex gap-2">
              <Link
                href="/sim-studio/quests"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Quests
              </Link>
              <Link
                href="/sim-studio/dashboard"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Dashboard
              </Link>
              <Link
                href="/sim-studio/studio"
                className="px-4 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition"
              >
                Create
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-12">
        {/* Featured Section */}
        <section>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Featured Simulation
          </h2>
          {featuredSims.map((sim) => (
            <motion.div
              key={sim.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-8 text-white overflow-hidden"
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  {sim.questEnabled && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Quest Enabled
                    </span>
                  )}
                  {sim.sendFriendly && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      SEND-friendly
                    </span>
                  )}
                </div>
                <h3 className="text-4xl font-bold mb-2">{sim.title}</h3>
                <p className="text-xl text-white/90 mb-6">{sim.description}</p>
                <div className="flex items-center gap-6 text-sm text-white/80 mb-6">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {sim.duration}
                  </span>
                  <span>{sim.keyStage}</span>
                  <span className="capitalize">{sim.subject}</span>
                </div>
                <Link
                  href={`/sim-studio/player/${sim.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-white/90 transition"
                >
                  <Play className="w-5 h-5" />
                  Start Simulation
                </Link>
              </div>
              <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
                <div className="w-full h-full flex items-center justify-center text-9xl">
                  🔢
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Continue Learning */}
        {continueLearning.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Continue Learning
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {continueLearning.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </h3>
                    <span className="text-sm text-slate-500">{item.lastPlayed}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Progress</span>
                      <span className="font-medium text-blue-600">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Browse by Subject
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/sim-studio/gallery/${category.id}`}
                className="group"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`bg-gradient-to-br ${category.color} rounded-xl p-6 text-white text-center shadow-sm hover:shadow-lg transition cursor-pointer`}
                >
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <h3 className="font-semibold">{category.name}</h3>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* Popular This Week */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Popular This Week
            </h2>
            <Link
              href="/sim-studio/gallery/maths"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularThisWeek.map((sim) => (
              <motion.div
                key={sim.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {sim.title}
                  </h3>
                  {sim.questEnabled && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                      Quest
                    </span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  {sim.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {sim.duration}
                  </span>
                  <span>{sim.keyStage}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Getting Started */}
        <section className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Getting Started with Sim Studio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4 text-2xl">
                🎯
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Browse Simulations
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Explore our gallery of interactive simulations across subjects
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4 text-2xl">
                ⚔️
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Assign Quests
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Set weekly micro-assessments that pupils actually enjoy
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4 text-2xl">
                📊
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                Track Progress
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View insights and calibrate teacher judgements with evidence
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
