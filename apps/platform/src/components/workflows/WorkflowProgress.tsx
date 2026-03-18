"use client";

import { motion } from "framer-motion";

interface PhaseInfo {
  title: string;
  status: string;
}

interface WorkflowProgressProps {
  progress: number;
  phases: PhaseInfo[];
  currentPhase: number;
}

export function WorkflowProgress({
  progress,
  phases,
  currentPhase,
}: WorkflowProgressProps) {
  return (
    <div className="w-full space-y-3">
      {/* Progress percentage */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Progress
        </span>
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar with phase dots */}
      <div className="relative">
        {/* Background track */}
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="h-2 rounded-full bg-gradient-to-r from-slate-400 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        {/* Phase dots */}
        {phases.length > 1 && (
          <div className="absolute inset-0 flex items-center justify-between px-0">
            {phases.map((phase, index) => {
              const isCompleted = phase.status === "completed";
              const isActive = index === currentPhase;
              const position =
                phases.length === 1 ? 50 : (index / (phases.length - 1)) * 100;

              return (
                <div
                  key={index}
                  className="absolute flex flex-col items-center"
                  style={{
                    left: `${position}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {/* Dot */}
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        className="absolute -inset-1.5 rounded-full bg-teal-400/30 dark:bg-teal-400/20"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <div
                      className={`relative w-3.5 h-3.5 rounded-full border-2 transition-colors ${
                        isCompleted
                          ? "bg-teal-500 border-teal-500"
                          : isActive
                            ? "bg-teal-500 border-teal-500"
                            : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Phase labels */}
      {phases.length > 1 && (
        <div className="relative h-5">
          {phases.map((phase, index) => {
            const position =
              phases.length === 1 ? 50 : (index / (phases.length - 1)) * 100;
            const isActive = index === currentPhase;

            return (
              <span
                key={index}
                className={`absolute text-[10px] font-medium truncate max-w-[80px] ${
                  isActive
                    ? "text-teal-600 dark:text-teal-400 font-semibold"
                    : "text-slate-400 dark:text-slate-500"
                }`}
                style={{
                  left: `${position}%`,
                  transform: "translateX(-50%)",
                }}
                title={phase.title}
              >
                {phase.title}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
