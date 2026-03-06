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

export function OpinionScale({
  question,
  value,
  onChange,
  error,
  disabled,
  preview,
}: QuestionComponentProps) {
  const min = question.settings?.min ?? 1;
  const max = question.settings?.max ?? 10;
  const minLabel = question.settings?.min_label ?? "";
  const maxLabel = question.settings?.max_label ?? "";
  const selected = typeof value === "number" ? value : null;
  const count = max - min + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div
        className={cn(
          "space-y-1",
          error && "rounded-md ring-2 ring-red-500/20 p-2",
        )}
        role="radiogroup"
        aria-label={question.title}
      >
        <div className="flex gap-1">
          {Array.from({ length: count }, (_, i) => {
            const num = min + i;
            const isSelected = selected === num;
            return (
              <motion.button
                key={num}
                type="button"
                disabled={disabled}
                onClick={() => onChange(num)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className={cn(
                  "flex-1 min-w-[36px] rounded-md border py-2 text-center text-sm font-medium transition-all",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? "border-cyan-500 bg-cyan-500 text-white"
                    : "border-border hover:border-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950 text-foreground",
                  disabled && "cursor-not-allowed opacity-50",
                )}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${num}`}
              >
                {num}
              </motion.button>
            );
          })}
        </div>

        {(minLabel || maxLabel) && (
          <div className="flex justify-between px-1">
            <span className="text-xs text-muted-foreground">{minLabel}</span>
            <span className="text-xs text-muted-foreground">{maxLabel}</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
