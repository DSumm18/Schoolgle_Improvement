"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Slider as SliderPrimitive } from "@/components/ui/slider";
import type { SurveyQuestion } from "@/lib/surveys/types";

interface QuestionComponentProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  preview?: boolean;
}

export function Slider({
  question,
  value,
  onChange,
  error,
  disabled,
}: QuestionComponentProps) {
  const min = question.settings?.min ?? 0;
  const max = question.settings?.max ?? 100;
  const step = question.settings?.step ?? 1;
  const minLabel = question.settings?.min_label ?? "";
  const maxLabel = question.settings?.max_label ?? "";
  const current = typeof value === "number" ? value : min;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div
        className={cn(
          "space-y-4 px-1",
          error && "rounded-md ring-2 ring-red-500/20 p-3",
        )}
      >
        <div className="relative pt-6">
          <div className="absolute -top-0 left-1/2 -translate-x-1/2">
            <motion.span
              key={current}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="inline-flex items-center justify-center rounded-md bg-cyan-500 px-2.5 py-0.5 text-sm font-semibold text-white tabular-nums"
            >
              {current}
            </motion.span>
          </div>

          <SliderPrimitive
            value={[current]}
            onValueChange={(vals: number[]) => onChange(vals[0])}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            aria-label={question.title}
            className={cn(disabled && "opacity-50 cursor-not-allowed")}
          />
        </div>

        <div className="flex justify-between">
          <span className="text-xs text-muted-foreground">
            {minLabel || min}
          </span>
          <span className="text-xs text-muted-foreground">
            {maxLabel || max}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
