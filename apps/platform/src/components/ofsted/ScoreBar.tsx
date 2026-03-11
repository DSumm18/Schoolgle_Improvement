"use client";

import React from "react";
import { motion } from "framer-motion";

interface ScoreBarProps {
  label: string;
  score: number;
  color: string;
  delay?: number;
  showScore?: boolean;
  sublabel?: string;
}

function scoreToLabel(score: number): string {
  if (score >= 90) return "Exceptional";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Expected";
  if (score >= 30) return "Developing";
  if (score > 0) return "Concern";
  return "Not Assessed";
}

export default function ScoreBar({
  label,
  score,
  color,
  delay = 0,
  showScore = true,
  sublabel,
}: ScoreBarProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const ratingLabel = scoreToLabel(clampedScore);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {sublabel && (
            <span className="text-xs text-muted-foreground">{sublabel}</span>
          )}
        </div>
        {showScore && (
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: delay + 0.5 }}
          >
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${color}18`,
                color,
              }}
            >
              {ratingLabel}
            </span>
            <span className="text-sm font-semibold text-muted-foreground tabular-nums">
              {clampedScore}%
            </span>
          </motion.div>
        )}
      </div>
      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full relative"
          style={{ backgroundColor: color }}
          initial={{ width: "0%" }}
          animate={{ width: `${clampedScore}%` }}
          transition={{
            duration: 1,
            ease: [0.16, 1, 0.3, 1],
            delay,
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
            }}
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              duration: 1.5,
              delay: delay + 0.8,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
