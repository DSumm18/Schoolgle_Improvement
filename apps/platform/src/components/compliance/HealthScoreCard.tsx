"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface HealthScoreCardProps {
  label: string;
  score: number;
  color: string;
  icon: LucideIcon;
}

export default function HealthScoreCard({
  label,
  score,
  color,
  icon: Icon,
}: HealthScoreCardProps) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-600";
    if (s >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-700">
      <CardContent className="p-5 flex flex-col items-center gap-3">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-slate-100 dark:text-slate-800"
            />
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-black ${getScoreColor(score)}`}>
              {score}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <Icon className="w-4 h-4" style={{ color }} />
          {label}
        </div>
      </CardContent>
    </Card>
  );
}
