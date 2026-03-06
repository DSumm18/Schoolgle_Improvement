"use client";

import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
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

export function DatePicker({
  question,
  value,
  onChange,
  error,
  disabled,
}: QuestionComponentProps) {
  const current = typeof value === "string" ? value : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div
        className={cn(
          "relative max-w-xs",
          error && "rounded-md ring-2 ring-red-500/20 p-2",
        )}
      >
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="date"
          value={current}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label={question.title}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm",
            "ring-offset-background placeholder:text-muted-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500",
          )}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
