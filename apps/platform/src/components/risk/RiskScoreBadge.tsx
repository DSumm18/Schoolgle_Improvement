"use client";

import { getRiskBand } from "@/lib/risk-engine";

interface RiskScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

function getBandStyles(score: number): string {
  const band = getRiskBand(score);
  switch (band) {
    case "low":
      return "bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-700";
    case "medium":
      return "bg-yellow-100 text-yellow-800 ring-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:ring-yellow-700";
    case "high":
      return "bg-orange-100 text-orange-800 ring-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:ring-orange-700";
    case "critical":
      return "bg-rose-100 text-rose-800 ring-rose-300 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-700";
  }
}

export function RiskScoreBadge({ score, size = "md" }: RiskScoreBadgeProps) {
  return (
    <div
      className={`${sizeClasses[size]} ${getBandStyles(score)} inline-flex items-center justify-center rounded-lg font-black ring-1 shrink-0`}
    >
      {score}
    </div>
  );
}
