"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import ScoreRing from "./ScoreRing";
import { OFSTED_FRAMEWORK_DATA } from "@/lib/ofsted/framework-data";
import { supabase } from "@/lib/supabase";
import type { OfstedRating, OfstedCategoryId } from "@/lib/ofsted/types";
import { CalendarDays, TrendingUp, Info } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OfstedTrackViewProps {
  organizationId: string;
}

interface Snapshot {
  date: string;
  label: string;
  categoryScores: Record<OfstedCategoryId, number>;
  overallScore: number;
}

type RatingLabel = "Excellent" | "Strong" | "Secure" | "Developing" | "Concern";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RATING_COLORS: Record<OfstedRating, string> = {
  exceptional: "#10b981",
  strong_standard: "#84cc16",
  expected_standard: "#f59e0b",
  needs_attention: "#f97316",
  urgent_improvement: "#ef4444",
};

const RATING_LABELS: Record<OfstedRating, RatingLabel> = {
  exceptional: "Excellent",
  strong_standard: "Strong",
  expected_standard: "Secure",
  needs_attention: "Developing",
  urgent_improvement: "Concern",
};

const CATEGORIES = OFSTED_FRAMEWORK_DATA.map((c) => ({
  id: c.id as OfstedCategoryId,
  name: c.shortName,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreToRating(score: number): OfstedRating {
  if (score >= 85) return "exceptional";
  if (score >= 70) return "strong_standard";
  if (score >= 50) return "expected_standard";
  if (score >= 30) return "needs_attention";
  return "urgent_improvement";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Generate demo snapshots that trend upward over 6 months */
function generateDemoSnapshots(): Snapshot[] {
  const now = new Date();
  const snapshots: Snapshot[] = [];

  const baseScores: Record<OfstedCategoryId, number> = {
    inclusion: 42,
    "curriculum-teaching": 55,
    achievement: 38,
    "attendance-behaviour": 60,
    "personal-development": 45,
    "leadership-governance": 50,
  };

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const iso = date.toISOString().split("T")[0];

    const categoryScores: Record<string, number> = {};
    let total = 0;

    for (const cat of CATEGORIES) {
      const monthsElapsed = 5 - i;
      const improvement = monthsElapsed * (3 + Math.random() * 5);
      const jitter = (Math.random() - 0.3) * 8;
      const score = Math.min(
        98,
        Math.max(15, Math.round(baseScores[cat.id] + improvement + jitter)),
      );
      categoryScores[cat.id] = score;
      total += score;
    }

    const overallScore = Math.round(total / CATEGORIES.length);

    snapshots.push({
      date: iso,
      label: formatDate(iso),
      categoryScores: categoryScores as Record<OfstedCategoryId, number>,
      overallScore,
    });
  }

  return snapshots;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OfstedTrackView({
  organizationId,
}: OfstedTrackViewProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSnapshots() {
      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("ofsted_assessments")
          .select("category_id, school_rating, ai_rating, updated_at")
          .eq("organization_id", organizationId)
          .order("updated_at", { ascending: true });

        if (cancelled) return;

        if (error || !data || data.length === 0) {
          setSnapshots(generateDemoSnapshots());
          setIsDemo(true);
          setLoading(false);
          return;
        }

        const byDate = new Map<
          string,
          { category_id: string; score: number }[]
        >();

        for (const row of data) {
          const dateKey = (row.updated_at as string).split("T")[0];
          if (!byDate.has(dateKey)) byDate.set(dateKey, []);

          const rating =
            (row.school_rating as OfstedRating | null) ??
            (row.ai_rating as OfstedRating | null);
          const score = rating ? ratingToScore(rating) : 50;

          byDate.get(dateKey)!.push({
            category_id: row.category_id as string,
            score,
          });
        }

        const dates = Array.from(byDate.keys()).slice(-8);

        if (dates.length < 2) {
          setSnapshots(generateDemoSnapshots());
          setIsDemo(true);
          setLoading(false);
          return;
        }

        const built: Snapshot[] = dates.map((dateKey) => {
          const rows = byDate.get(dateKey)!;
          const categoryScores: Record<string, number> = {};
          let total = 0;
          let count = 0;

          for (const cat of CATEGORIES) {
            const catRows = rows.filter((r) => r.category_id === cat.id);
            if (catRows.length > 0) {
              const avg = Math.round(
                catRows.reduce((s, r) => s + r.score, 0) / catRows.length,
              );
              categoryScores[cat.id] = avg;
              total += avg;
              count++;
            } else {
              categoryScores[cat.id] = 0;
            }
          }

          return {
            date: dateKey,
            label: formatDate(dateKey),
            categoryScores: categoryScores as Record<OfstedCategoryId, number>,
            overallScore: count > 0 ? Math.round(total / count) : 0,
          };
        });

        setSnapshots(built);
        setIsDemo(false);
      } catch {
        if (!cancelled) {
          setSnapshots(generateDemoSnapshots());
          setIsDemo(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSnapshots();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const rows = useMemo(() => {
    return [{ id: "overall" as const, name: "Overall" }, ...CATEGORIES];
  }, []);

  // Calculate trend arrows
  const getTrend = (
    rowId: string,
    snapshots: Snapshot[],
  ): "up" | "down" | "flat" => {
    if (snapshots.length < 2) return "flat";
    const latest = snapshots[snapshots.length - 1];
    const prev = snapshots[snapshots.length - 2];
    const latestScore =
      rowId === "overall"
        ? latest.overallScore
        : (latest.categoryScores[rowId as OfstedCategoryId] ?? 0);
    const prevScore =
      rowId === "overall"
        ? prev.overallScore
        : (prev.categoryScores[rowId as OfstedCategoryId] ?? 0);
    if (latestScore > prevScore + 2) return "up";
    if (latestScore < prevScore - 2) return "down";
    return "flat";
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid grid-cols-7 gap-4">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-14 rounded-full bg-muted animate-pulse mx-auto"
            />
          ))}
        </div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-12 text-center">
        <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-sm">
          Start your first assessment to track progress over time
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Score Tracking
          </h3>
          {isDemo && (
            <span className="ml-2 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <Info className="h-3 w-3" />
              Demo Data
            </span>
          )}
        </div>

        {/* Date range label */}
        <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {snapshots[0].label} &ndash; {snapshots[snapshots.length - 1].label}
        </span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card text-left text-xs font-medium text-muted-foreground pr-4 pb-4 w-40 min-w-[160px]">
                Category
              </th>
              {snapshots.map((s) => (
                <th
                  key={s.date}
                  className="text-center text-[11px] font-medium text-muted-foreground pb-4 px-1"
                >
                  {formatDateShort(s.date)}
                </th>
              ))}
              <th className="text-center text-[11px] font-medium text-muted-foreground pb-4 px-2 w-16">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => {
              const trend = getTrend(row.id, snapshots);
              const latestScore =
                row.id === "overall"
                  ? (snapshots[snapshots.length - 1]?.overallScore ?? 0)
                  : (snapshots[snapshots.length - 1]?.categoryScores[
                      row.id as OfstedCategoryId
                    ] ?? 0);
              const latestRating = scoreToRating(latestScore);
              const latestColor = RATING_COLORS[latestRating];

              return (
                <tr
                  key={row.id}
                  className={
                    row.id === "overall"
                      ? "border-b-2 border-border"
                      : "border-b border-border/40"
                  }
                >
                  {/* Category name */}
                  <td className="sticky left-0 z-10 bg-card pr-4 py-3">
                    <span
                      className={`text-sm ${
                        row.id === "overall"
                          ? "font-bold text-foreground"
                          : "font-medium text-muted-foreground"
                      }`}
                    >
                      {row.name}
                    </span>
                  </td>

                  {/* Score cells */}
                  {snapshots.map((snapshot, colIdx) => {
                    const score =
                      row.id === "overall"
                        ? snapshot.overallScore
                        : (snapshot.categoryScores[
                            row.id as OfstedCategoryId
                          ] ?? 0);
                    const rating = scoreToRating(score);
                    const color = RATING_COLORS[rating];
                    const label = RATING_LABELS[rating];

                    const delay = rowIdx * 0.03 + colIdx * 0.05;

                    return (
                      <td key={snapshot.date} className="text-center py-3 px-1">
                        <motion.div
                          className="inline-flex flex-col items-center"
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.4,
                            delay,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        >
                          <ScoreRing
                            score={score}
                            size={48}
                            strokeWidth={4}
                            color={color}
                            animate={false}
                          />
                          <span
                            className="mt-0.5 text-[9px] font-medium leading-tight"
                            style={{ color }}
                          >
                            {label}
                          </span>
                        </motion.div>
                      </td>
                    );
                  })}

                  {/* Trend indicator */}
                  <td className="text-center py-3 px-2">
                    <motion.div
                      className="inline-flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: rowIdx * 0.03 + snapshots.length * 0.05 + 0.2,
                      }}
                    >
                      {trend === "up" && (
                        <span className="flex items-center gap-0.5 text-emerald-500 text-xs font-semibold">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path d="M7 3L11 8H3L7 3Z" fill="currentColor" />
                          </svg>
                        </span>
                      )}
                      {trend === "down" && (
                        <span className="flex items-center gap-0.5 text-rose-500 text-xs font-semibold">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path d="M7 11L3 6H11L7 11Z" fill="currentColor" />
                          </svg>
                        </span>
                      )}
                      {trend === "flat" && (
                        <span className="flex items-center text-muted-foreground text-xs">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              d="M3 7H11"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      )}
                    </motion.div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border/50 flex flex-wrap items-center gap-4">
        {Object.entries(RATING_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: RATING_COLORS[key as OfstedRating] }}
            />
            <span className="text-[11px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rating-to-score helper
// ---------------------------------------------------------------------------

function ratingToScore(rating: OfstedRating): number {
  switch (rating) {
    case "exceptional":
      return 92;
    case "strong_standard":
      return 78;
    case "expected_standard":
      return 60;
    case "needs_attention":
      return 38;
    case "urgent_improvement":
      return 20;
    default:
      return 50;
  }
}
