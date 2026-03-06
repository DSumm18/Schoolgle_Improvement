"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SurveyQuestion } from "@/lib/surveys/types";

interface QuestionComponentProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  preview?: boolean;
}

export function SemanticDifferential({
  question,
  value,
  onChange,
  error,
  disabled,
}: QuestionComponentProps) {
  const leftLabel = question.settings?.left_label ?? "Left";
  const rightLabel = question.settings?.right_label ?? "Right";
  const points = question.settings?.max ?? 7;
  const selected = typeof value === "number" ? value : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div
        className={cn(
          "flex items-center gap-3",
          error && "rounded-md ring-2 ring-red-500/20 p-3",
        )}
        role="radiogroup"
        aria-label={question.title}
      >
        <span className="text-sm font-medium text-muted-foreground shrink-0 min-w-[60px] text-right">
          {leftLabel}
        </span>

        <div className="flex gap-1 flex-1 justify-center">
          {Array.from({ length: points }, (_, i) => {
            const num = i + 1;
            const isSelected = selected === num;
            return (
              <motion.button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => onChange(num)}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "w-9 h-9 rounded-full border-2 transition-all",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-cyan-500 bg-cyan-500"
                    : "border-muted-foreground/30 hover:border-cyan-400",
                  disabled && "cursor-not-allowed opacity-50",
                )}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${num} of ${points} between ${leftLabel} and ${rightLabel}`}
              >
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="block w-3 h-3 rounded-full bg-white mx-auto"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        <span className="text-sm font-medium text-muted-foreground shrink-0 min-w-[60px]">
          {rightLabel}
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
