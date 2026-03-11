"use client";

import React from "react";
import { motion } from "framer-motion";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  animate?: boolean;
  className?: string;
  glow?: boolean;
}

function getDefaultColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#3b82f6";
  if (score >= 40) return "#f59e0b";
  return "#f43f5e";
}

export default function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  color,
  animate = true,
  className,
  glow = false,
}: ScoreRingProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const resolvedColor = color ?? getDefaultColor(clampedScore);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const targetOffset = circumference - (clampedScore / 100) * circumference;
  const filterId = `glow-${size}-${clampedScore}`;

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        width: size,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {glow && (
          <defs>
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        )}
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-700/60"
          strokeWidth={strokeWidth}
        />
        {/* Animated progress arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          filter={glow ? `url(#${filterId})` : undefined}
          initial={{ strokeDashoffset: animate ? circumference : targetOffset }}
          animate={{ strokeDashoffset: targetOffset }}
          transition={
            animate
              ? { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
              : { duration: 0 }
          }
        />
      </svg>

      {/* Centre text overlay */}
      <div
        style={{
          marginTop: -size,
          height: size,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <motion.span
          style={{
            fontSize: size * 0.28,
            fontWeight: 700,
            lineHeight: 1,
            color: resolvedColor,
            fontVariantNumeric: "tabular-nums",
          }}
          initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            animate ? { duration: 0.5, delay: 0.6, ease: "easeOut" } : undefined
          }
        >
          {clampedScore}
        </motion.span>
      </div>

      {/* Labels below the ring */}
      {label && (
        <span className="mt-1.5 text-[13px] font-semibold text-foreground text-center leading-tight">
          {label}
        </span>
      )}
      {sublabel && (
        <span className="mt-0.5 text-[11px] text-muted-foreground text-center leading-snug">
          {sublabel}
        </span>
      )}
    </div>
  );
}
