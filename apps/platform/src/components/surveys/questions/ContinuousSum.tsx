"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import type { SurveyQuestion } from "@/lib/surveys/types";

interface QuestionComponentProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  preview?: boolean;
}

export function ContinuousSum({
  question,
  value,
  onChange,
  error,
  disabled,
}: QuestionComponentProps) {
  const fields = question.settings?.sum_fields ?? [];
  const targetSum = question.settings?.target_sum ?? 100;
  const values: Record<string, number> =
    value && typeof value === "object" ? value : {};

  const total = fields.reduce((sum, field) => sum + (values[field] ?? 0), 0);
  const remaining = targetSum - total;
  const isExact = total === targetSum;
  const isOver = total > targetSum;
  const progress = Math.min((total / targetSum) * 100, 100);

  function handleChange(field: string, num: number) {
    if (disabled) return;
    onChange({ ...values, [field]: Math.max(0, num) });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div
        className={cn(
          "space-y-3",
          error && "rounded-md ring-2 ring-red-500/20 p-3",
        )}
        role="group"
        aria-label={question.title}
      >
        {fields.map((field) => (
          <div key={field} className="flex items-center gap-3">
            <Label className="flex-1 text-sm font-medium min-w-[120px]">
              {field}
            </Label>
            <Input
              type="number"
              min={0}
              value={values[field] ?? 0}
              onChange={(e) =>
                handleChange(field, parseInt(e.target.value, 10) || 0)
              }
              disabled={disabled}
              aria-label={field}
              className={cn("w-24 text-right tabular-nums")}
            />
          </div>
        ))}
      </div>

      {/* Total summary */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm">
          <span
            className={cn(
              "font-medium tabular-nums",
              isExact && "text-green-600 dark:text-green-400",
              isOver && "text-red-600 dark:text-red-400",
              !isExact && !isOver && "text-muted-foreground",
            )}
          >
            Total: {total} / {targetSum}
          </span>
          <span
            className={cn(
              "tabular-nums",
              isExact && "text-green-600 dark:text-green-400",
              isOver && "text-red-600 dark:text-red-400",
              !isExact && !isOver && "text-muted-foreground",
            )}
          >
            {isOver
              ? `Over by ${Math.abs(remaining)}`
              : isExact
                ? "Complete"
                : `Remaining: ${remaining}`}
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
