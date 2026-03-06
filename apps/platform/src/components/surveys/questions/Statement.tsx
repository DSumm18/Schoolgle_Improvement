"use client";

import { motion } from "framer-motion";
import { Checkbox as UICheckbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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

export function Statement({
  question,
  value,
  onChange,
  error,
  disabled,
  preview,
}: QuestionComponentProps) {
  const showCheckbox = question.settings?.acknowledge_checkbox;
  const checkboxLabel =
    question.settings?.acknowledge_label ?? "I acknowledge this statement";
  const acknowledged = value === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="rounded-lg border bg-muted/30 p-5 space-y-2">
        <h3 className="text-base font-semibold leading-snug">
          {question.title}
        </h3>
        {question.description && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {question.description}
          </p>
        )}
      </div>

      {showCheckbox && (
        <div
          className={cn(
            "flex items-center space-x-3",
            error && "rounded-md ring-2 ring-red-500/20 p-2",
          )}
        >
          <UICheckbox
            id={`${question.id}-ack`}
            checked={acknowledged}
            onCheckedChange={(checked) => onChange(checked === true)}
            disabled={disabled}
          />
          <Label
            htmlFor={`${question.id}-ack`}
            className="cursor-pointer text-sm font-normal"
          >
            {checkboxLabel}
          </Label>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
