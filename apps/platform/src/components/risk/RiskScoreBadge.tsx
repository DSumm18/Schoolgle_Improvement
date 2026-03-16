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

// Traditional risk colours — same in light and dark mode for universal recognition
function getBandStyles(score: number): string {
  const band = getRiskBand(score);
  switch (band) {
    case "low":
      return "bg-[#4caf50] text-white ring-[#388e3c]";
    case "medium":
      return "bg-[#fbc02d] text-[#3e2723] ring-[#f9a825]";
    case "high":
      return "bg-[#f57c00] text-white ring-[#e65100]";
    case "critical":
      return "bg-[#d32f2f] text-white ring-[#b71c1c]";
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
