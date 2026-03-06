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

function getNPSCategory(score: number): {
  label: string;
  color: string;
} {
  if (score <= 6) return { label: "Detractor", color: "text-red-500" };
  if (score <= 8) return { label: "Passive", color: "text-yellow-500" };
  return { label: "Promoter", color: "text-green-500" };
}

function getNPSButtonColor(num: number, isSelected: boolean): string {
  if (!isSelected) return "";
  if (num <= 6) return "border-red-500 bg-red-500 text-white";
  if (num <= 8) return "border-yellow-500 bg-yellow-500 text-white";
  return "border-green-500 bg-green-500 text-white";
}

function getNPSHoverColor(num: number): string {
  if (num <= 6)
    return "hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950";
  if (num <= 8)
    return "hover:border-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-950";
  return "hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-950";
}

export function NPS({
  question,
  value,
  onChange,
  error,
  disabled,
}: QuestionComponentProps) {
  const selected = typeof value === "number" ? value : null;

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
          {Array.from({ length: 11 }, (_, i) => {
            const isSelected = selected === i;
            return (
              <motion.button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => onChange(i)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className={cn(
                  "flex-1 min-w-[32px] rounded-md border py-2 text-center text-sm font-medium transition-all",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isSelected
                    ? getNPSButtonColor(i, true)
                    : cn("border-border text-foreground", getNPSHoverColor(i)),
                  disabled && "cursor-not-allowed opacity-50",
                )}
                role="radio"
                aria-checked={isSelected}
                aria-label={`${i} out of 10`}
              >
                {i}
              </motion.button>
            );
          })}
        </div>

        <div className="flex justify-between px-1">
          <span className="text-xs text-muted-foreground">
            Not at all likely
          </span>
          <span className="text-xs text-muted-foreground">
            Extremely likely
          </span>
        </div>

        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center pt-1"
          >
            <span
              className={cn(
                "text-sm font-medium",
                getNPSCategory(selected).color,
              )}
            >
              {getNPSCategory(selected).label}
            </span>
          </motion.div>
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
