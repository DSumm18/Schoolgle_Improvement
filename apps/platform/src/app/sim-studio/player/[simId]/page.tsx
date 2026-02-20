"use client";

import { use } from "react";
import { useParams } from "next/navigation";
import { Gamepad2, ArrowLeft, Share, Download } from "lucide-react";
import Link from "next/link";
import SimPlayer from "@/components/sim-studio/SimPlayer";

export default function SimPlayerPage() {
  const params = useParams();
  const simId = params.simId as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/sim-studio"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <Gamepad2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Place Value Adventure
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Interactive Dienes blocks & number line
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-2">
                <Share className="w-4 h-4" />
                Share
              </button>
              <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Simulation Player */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
              <div className="aspect-video w-full relative">
                <SimPlayer simId={simId} initialMode="teach" />
              </div>
            </div>

            {/* Simulation Info */}
            <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                About This Simulation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Subject
                  </h3>
                  <p className="text-slate-900 dark:text-white">Maths - Place Value</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Key Stage
                  </h3>
                  <p className="text-slate-900 dark:text-white">KS1 / KS2</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                    Duration
                  </h3>
                  <p className="text-slate-900 dark:text-white">5-10 minutes</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Learning Objectives
                </h3>
                <ul className="text-slate-900 dark:text-white space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Recognise the place value of each digit in a two-digit number</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Identify, represent and estimate numbers using different representations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Read and write numbers to at least 100 in numerals and in words</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  💡 Teacher Tip
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Use Teach Mode for whole-class demonstration, then switch to Pupil Mode for
                  individual practice. Evidence Mode captures detailed performance data for
                  assessment.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Quick Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Uses this week</span>
                    <span className="font-medium text-slate-900 dark:text-white">127</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Avg. score</span>
                    <span className="font-medium text-slate-900 dark:text-white">84%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '84%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Completion rate</span>
                    <span className="font-medium text-slate-900 dark:text-white">92%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Related Sims */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Related Simulations
              </h3>
              <div className="space-y-3">
                <Link
                  href="/sim-studio/player/fraction-chef"
                  className="block p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                >
                  <div className="font-medium text-slate-900 dark:text-white text-sm">
                    Fraction Chef
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Fractions • 4 min</div>
                </Link>
                <Link
                  href="/sim-studio/player/array-master"
                  className="block p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition"
                >
                  <div className="font-medium text-slate-900 dark:text-white text-sm">
                    Array Master
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Multiplication • 3 min</div>
                </Link>
              </div>
            </div>

            {/* Accessibility Notice */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">♿</span>
                <div>
                  <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">
                    SEND-Friendly
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-400">
                    This simulation includes accessibility features like high contrast mode,
                    reduced motion, keyboard navigation, and voice support.
                  </p>
 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
