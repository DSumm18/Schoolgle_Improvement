"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Gamepad2, ArrowLeft, Plus, Sparkles } from "lucide-react";

export default function StudioPage() {
  const blueprints = [
    {
      id: "place-value",
      name: "Place Value Blueprint",
      description: "Dienes blocks, number lines, and partitioning visualisations",
      subject: "maths",
      topic: "Place Value",
      keyStages: ["KS1", "KS2"],
    },
    {
      id: "fractions",
      name: "Fractions Blueprint",
      description: "Bar models, equivalence, and comparing fractions",
      subject: "maths",
      topic: "Fractions",
      keyStages: ["KS2"],
    },
  ];

  const mySims = [
    {
      id: "sim1",
      title: "My Place Value Sim",
      blueprint: "place-value",
      status: "draft",
      lastEdited: "2 days ago",
    },
  ];

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
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Sim Studio
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create and edit simulations
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Create New */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Create from Blueprint
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Choose a blueprint to start building your simulation. Blueprints provide
            the core mechanics and interactions.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {blueprints.map((blueprint) => (
              <motion.div
                key={blueprint.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      {blueprint.subject} • {blueprint.topic}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                      {blueprint.name}
                    </h3>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  {blueprint.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {blueprint.keyStages.map((ks) => (
                      <span
                        key={ks}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium"
                      >
                        {ks}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/sim-studio/studio/create?blueprint=${blueprint.id}`}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-sm font-medium flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Sim
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* My Sims */}
        {mySims.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              My Simulations
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {mySims.map((sim) => (
                  <div
                    key={sim.id}
                    className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {sim.title}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              sim.status === "published"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                            }`}
                          >
                            {sim.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          Last edited {sim.lastEdited}
                        </p>
                      </div>
                      <Link
                        href={`/sim-studio/studio/edit/${sim.id}`}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Coming Soon */}
        <section className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            More Features Coming Soon
          </h3>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We're working on advanced features like AI-assisted sim generation,
            custom interaction builders, and collaborative editing. Stay tuned!
          </p>
        </section>
      </div>
    </div>
  );
}
