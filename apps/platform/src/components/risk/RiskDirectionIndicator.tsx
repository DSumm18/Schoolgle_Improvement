"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { DirectionOfTravel } from "@/lib/risk-engine";

interface RiskDirectionIndicatorProps {
  direction: DirectionOfTravel;
}

const config: Record<
  DirectionOfTravel,
  { icon: typeof TrendingUp; className: string; label: string }
> = {
  improving: {
    icon: TrendingDown,
    className: "text-emerald-600 dark:text-emerald-400",
    label: "Improving",
  },
  stable: {
    icon: Minus,
    className: "text-slate-400 dark:text-slate-500",
    label: "Stable",
  },
  worsening: {
    icon: TrendingUp,
    className: "text-rose-600 dark:text-rose-400",
    label: "Worsening",
  },
};

export function RiskDirectionIndicator({
  direction,
}: RiskDirectionIndicatorProps) {
  const { icon: Icon, className, label } = config[direction];
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      title={label}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs font-medium">{label}</span>
    </span>
  );
}
