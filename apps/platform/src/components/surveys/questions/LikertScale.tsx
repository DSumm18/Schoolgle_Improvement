"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LIKERT_DEFAULTS } from "@/lib/surveys/types";
import type { SurveyQuestion } from "@/lib/surveys/types";

interface QuestionComponentProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  preview?: boolean;
}

export function LikertScale({
  question,
  value,
  onChange,
  error,
  disabled,
  preview,
}: QuestionComponentProps) {
  const scaleLabels = question.settings?.scale_labels;
  const labels: string[] = scaleLabels
    ? Object.values(scaleLabels)
    : LIKERT_DEFAULTS;

  const selected = typeof value === "number" ? value : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div
        className={cn(
          "flex flex-wrap gap-2",
          error && "rounded-md ring-2 ring-red-500/20 p-2",
        )}
        role="radiogroup"
        aria-label={question.title}
      >
        {labels.map((label, i) => {
          const isSelected = selected === i;
          return (
            <motion.button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(i)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "flex-1 min-w-[100px] rounded-lg border-2 px-3 py-3 text-center text-xs font-medium transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                  : "border-border hover:border-muted-foreground/30 text-muted-foreground",
                disabled && "cursor-not-allowed opacity-50",
              )}
              role="radio"
              aria-checked={isSelected}
              aria-label={label}
            >
              <div className="text-lg font-semibold mb-1">{i + 1}</div>
              <div className="leading-tight">{label}</div>
            </motion.button>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
