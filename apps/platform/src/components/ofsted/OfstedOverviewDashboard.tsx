"use client";

import React, { useState, useMemo } from "react";
import { motion, Variants } from "framer-motion";
import {
  CheckCircle,
  AlertTriangle,
  BarChart3,
  LayoutGrid,
  Target,
  FileText,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import ScoreRing from "./ScoreRing";
import ScoreBar from "./ScoreBar";
import { OFSTED_FRAMEWORK_DATA } from "@/lib/ofsted/framework-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OfstedOverviewDashboardProps {
  organizationId: string;
  assessments: Record<
    string,
    {
      schoolRating?: string | null;
      aiRating?: string | null;
      schoolRationale?: string | null;
      aiRationale?: string | null;
      evidence_count?: number;
      lastUpdated?: string;
    }
  >;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const RATING_SCORES: Record<string, number> = {
  exceptional: 100,
  strong_standard: 80,
  expected_standard: 60,
  needs_attention: 40,
  urgent_improvement: 20,
};

const RATING_LABELS: Record<string, string> = {
  exceptional: "Exceptional",
  strong_standard: "Strong Standard",
  expected_standard: "Expected Standard",
  needs_attention: "Needs Attention",
  urgent_improvement: "Urgent Improvement",
};

const CATEGORY_COLORS: Record<string, string> = {
  teal: "#14b8a6",
  rose: "#f43f5e",
  blue: "#3b82f6",
  orange: "#f97316",
  violet: "#8b5cf6",
  slate: "#64748b",
};

function ratingToScore(rating?: string | null): number {
  if (!rating) return 0;
  return RATING_SCORES[rating] ?? 0;
}

function scoreToLabel(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 70) return "Strong Standard";
  if (score >= 50) return "Expected Standard";
  if (score >= 30) return "Needs Attention";
  if (score > 0) return "Urgent Improvement";
  return "Not Assessed";
}

function scoreToLabelColor(score: number): string {
  if (score >= 90) return "#10b981";
  if (score >= 70) return "#3b82f6";
  if (score >= 50) return "#f59e0b";
  if (score >= 30) return "#f97316";
  if (score > 0) return "#ef4444";
  return "#9ca3af";
}

function ratingBadgeColor(rating?: string | null): {
  bg: string;
  text: string;
} {
  switch (rating) {
    case "exceptional":
      return { bg: "#d1fae5", text: "#065f46" };
    case "strong_standard":
      return { bg: "#dbeafe", text: "#1e40af" };
    case "expected_standard":
      return { bg: "#fef3c7", text: "#92400e" };
    case "needs_attention":
      return { bg: "#ffedd5", text: "#9a3412" };
    case "urgent_improvement":
      return { bg: "#fee2e2", text: "#991b1b" };
    default:
      return { bg: "#f3f4f6", text: "#6b7280" };
  }
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OfstedOverviewDashboard({
  assessments,
}: OfstedOverviewDashboardProps) {
  const [view, setView] = useState<"bars" | "cards">("bars");

  // Compute per-category and overall scores
  const { categoryScores, overallScore, totalAssessed, totalEvidence, gaps } =
    useMemo(() => {
      const catScores: {
        categoryId: string;
        categoryName: string;
        shortName: string;
        color: string;
        score: number;
        assessed: number;
        total: number;
        evidenceCount: number;
      }[] = [];

      let allScores: number[] = [];
      let assessed = 0;
      let totalSubs = 0;
      let evidence = 0;
      const gapList: {
        categoryName: string;
        subcategoryName: string;
        rating: string | null | undefined;
        evidenceCount: number;
      }[] = [];

      for (const cat of OFSTED_FRAMEWORK_DATA) {
        const subScores: number[] = [];
        let catAssessed = 0;
        let catEvidence = 0;

        for (const sub of cat.subcategories) {
          totalSubs++;
          const a = assessments[sub.id];
          const bestRating = a?.schoolRating ?? a?.aiRating ?? null;
          const s = ratingToScore(bestRating);

          if (bestRating) {
            subScores.push(s);
            catAssessed++;
            assessed++;
          }

          const ec = a?.evidence_count ?? 0;
          catEvidence += ec;
          evidence += ec;

          // Track gaps
          if (
            bestRating === "needs_attention" ||
            bestRating === "urgent_improvement"
          ) {
            gapList.push({
              categoryName: cat.name,
              subcategoryName: sub.name,
              rating: bestRating,
              evidenceCount: ec,
            });
          }
        }

        const catAvg =
          subScores.length > 0
            ? Math.round(
                subScores.reduce((a, b) => a + b, 0) / subScores.length,
              )
            : 0;

        allScores = allScores.concat(subScores);

        catScores.push({
          categoryId: cat.id,
          categoryName: cat.name,
          shortName: cat.shortName,
          color: CATEGORY_COLORS[cat.color] ?? "#64748b",
          score: catAvg,
          assessed: catAssessed,
          total: cat.subcategories.length,
          evidenceCount: catEvidence,
        });
      }

      const overall =
        allScores.length > 0
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0;

      return {
        categoryScores: catScores,
        overallScore: overall,
        totalAssessed: assessed,
        totalSubcategories: totalSubs,
        totalEvidence: evidence,
        gaps: gapList,
      };
    }, [assessments]);

  const totalSubcategories = OFSTED_FRAMEWORK_DATA.reduce(
    (acc, c) => acc + c.subcategories.length,
    0,
  );

  const overallLabel = scoreToLabel(overallScore);
  const labelColor = scoreToLabelColor(overallScore);
  const assessedPercent =
    totalSubcategories > 0
      ? Math.round((totalAssessed / totalSubcategories) * 100)
      : 0;

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      {/* ------------------------------------------------------------------ */}
      {/* HERO ROW - Score + Rating + Stats                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Overall score ring - large hero card */}
        <motion.div
          className="md:col-span-4 bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden"
          variants={fadeUp}
          custom={0}
        >
          {/* Subtle gradient background */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              background: `radial-gradient(circle at 50% 30%, ${labelColor}, transparent 70%)`,
            }}
          />
          <div className="relative z-10">
            <ScoreRing
              score={overallScore}
              size={180}
              strokeWidth={12}
              label="Overall Readiness"
              sublabel={`${totalAssessed} of ${totalSubcategories} assessed`}
              glow
            />
          </div>
        </motion.div>

        {/* Rating + Readiness Level */}
        <motion.div
          className="md:col-span-4 bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center gap-4 relative overflow-hidden"
          variants={fadeUp}
          custom={1}
        >
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              background: `radial-gradient(circle at 50% 70%, ${labelColor}, transparent 70%)`,
            }}
          />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Current Rating
              </span>
            </div>
            <motion.span
              className="inline-flex items-center rounded-full px-5 py-2 text-base font-bold"
              style={{ backgroundColor: `${labelColor}18`, color: labelColor }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {overallLabel}
            </motion.span>
            <p className="text-xs text-muted-foreground text-center max-w-[220px] leading-relaxed">
              Based on the best available rating across all assessed
              subcategories
            </p>

            {/* Mini progress ring for assessment completion */}
            <div className="mt-2 flex items-center gap-3 px-4 py-2 rounded-xl bg-muted/50">
              <div className="relative">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 36 36"
                  style={{ transform: "rotate(-90deg)" }}
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    className="stroke-slate-200 dark:stroke-slate-700"
                    strokeWidth="4"
                  />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={labelColor}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={88}
                    initial={{ strokeDashoffset: 88 }}
                    animate={{
                      strokeDashoffset: 88 - (assessedPercent / 100) * 88,
                    }}
                    transition={{
                      duration: 1,
                      delay: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {assessedPercent}% Complete
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {totalSubcategories - totalAssessed} areas remaining
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick stats - clean stacked layout */}
        <motion.div
          className="md:col-span-4 bg-card border border-border rounded-2xl p-6 flex flex-col justify-between gap-3"
          variants={fadeUp}
          custom={2}
        >
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
            Quick Stats
          </h3>

          <motion.div
            className="flex items-center gap-3 p-3 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-800/30"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/50">
              <Target className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {totalAssessed}
                <span className="text-sm font-normal text-muted-foreground">
                  /{totalSubcategories}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">Areas Assessed</p>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {totalEvidence}
              </p>
              <p className="text-xs text-muted-foreground">Evidence Linked</p>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-800/30"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/50">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {gaps.length}
              </p>
              <p className="text-xs text-muted-foreground">Gaps Identified</p>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CATEGORY BREAKDOWN                                                 */}
      {/* ------------------------------------------------------------------ */}
      <motion.div
        className="bg-card border border-border rounded-2xl p-6"
        variants={fadeUp}
        custom={3}
      >
        {/* Header with toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Category Breakdown
            </h2>
          </div>
          <div className="inline-flex rounded-lg bg-muted/60 p-0.5 overflow-hidden">
            <button
              onClick={() => setView("bars")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                view === "bars"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Bars
            </button>
            <button
              onClick={() => setView("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                view === "cards"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Cards
            </button>
          </div>
        </div>

        {/* Bars view */}
        {view === "bars" && (
          <div className="space-y-5">
            {categoryScores.map((cat, i) => (
              <motion.div
                key={cat.categoryId}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <ScoreBar
                  label={cat.categoryName}
                  score={cat.score}
                  color={cat.color}
                  delay={i * 0.08}
                  sublabel={`${cat.assessed}/${cat.total} assessed`}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Cards view */}
        {view === "cards" && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {categoryScores.map((cat, i) => (
              <motion.div
                key={cat.categoryId}
                className="border border-border rounded-xl p-5 flex items-start gap-4 hover:shadow-md hover:border-border/80 transition-all duration-300 group relative overflow-hidden"
                variants={fadeUp}
                custom={i}
              >
                {/* Subtle color accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: cat.color }}
                />
                <ScoreRing
                  score={cat.score}
                  size={64}
                  strokeWidth={5}
                  color={cat.color}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {cat.shortName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cat.assessed}/{cat.total} assessed
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {cat.evidenceCount} evidence
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-300" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/* PRIORITY ACTIONS                                                   */}
      {/* ------------------------------------------------------------------ */}
      <motion.div
        className="bg-card border border-border rounded-2xl p-6"
        variants={fadeUp}
        custom={4}
      >
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-foreground">
            Priority Actions
          </h2>
          {gaps.length > 0 && (
            <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {gaps.length} area{gaps.length !== 1 ? "s" : ""} need attention
            </span>
          )}
        </div>

        {gaps.length === 0 ? (
          <motion.div
            className="flex items-center gap-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-6 py-5"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                No critical gaps identified
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                All assessed areas are at Expected Standard or above. Keep up
                the excellent work.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {gaps.map((gap, i) => {
              const badge = ratingBadgeColor(gap.rating);
              return (
                <motion.div
                  key={`${gap.categoryName}-${gap.subcategoryName}`}
                  className="flex items-center justify-between rounded-xl border border-border hover:border-orange-200 dark:hover:border-orange-800/50 px-4 py-3 transition-colors duration-200 group"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.3 + i * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/30 flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {gap.subcategoryName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {gap.categoryName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {gap.evidenceCount === 0 && (
                      <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">
                        needs evidence
                      </span>
                    )}
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.text,
                      }}
                    >
                      {RATING_LABELS[gap.rating ?? ""] ?? "Not Rated"}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
