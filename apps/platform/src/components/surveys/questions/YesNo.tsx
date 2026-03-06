"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
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

export function YesNo({
  question,
  value,
  onChange,
  error,
  disabled,
  preview,
}: QuestionComponentProps) {
  const selected = typeof value === "string" ? value : null;

  const options = [
    { label: "Yes", val: "yes" },
    { label: "No", val: "no" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div
        className={cn(
          "flex gap-3",
          error && "rounded-md ring-2 ring-red-500/20 p-2",
        )}
        role="radiogroup"
        aria-label={question.title}
      >
        {options.map(({ label, val }) => {
          const isSelected = selected === val;
          return (
            <motion.button
              key={val}
              type="button"
              disabled={disabled}
              onClick={() => onChange(val)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              className={cn(
                "relative flex-1 max-w-[200px] rounded-xl border-2 px-6 py-4 text-center text-lg font-semibold transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                  : "border-border hover:border-muted-foreground/30 text-foreground",
                disabled && "cursor-not-allowed opacity-50",
              )}
              role="radio"
              aria-checked={isSelected}
            >
              {label}
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <Check className="h-4 w-4 text-cyan-500" />
                </motion.span>
              )}
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
