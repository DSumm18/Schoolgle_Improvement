"use client";

import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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

export function LongText({
  question,
  value,
  onChange,
  error,
  disabled,
  preview,
}: QuestionComponentProps) {
  const text = typeof value === "string" ? value : "";
  const charLimit = question.settings?.char_limit;
  const wordLimit = question.settings?.word_limit;
  const placeholder = question.settings?.placeholder ?? "";

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const wordProgress = wordLimit
    ? Math.min((wordCount / wordLimit) * 100, 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <Textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={charLimit}
        rows={4}
        aria-label={question.title}
        className={cn(
          "max-w-lg resize-y",
          error && "border-red-500 ring-2 ring-red-500/20",
        )}
      />

      <div className="space-y-1">
        {wordLimit && (
          <div className="flex items-center gap-3 max-w-lg">
            <Progress value={wordProgress} className="h-1.5 flex-1" />
            <span
              className={cn(
                "text-xs text-muted-foreground tabular-nums",
                wordCount > wordLimit && "text-red-500 font-medium",
              )}
            >
              {wordCount}/{wordLimit} words
            </span>
          </div>
        )}

        <div className="flex items-center justify-between max-w-lg">
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          {charLimit && (
            <p
              className={cn(
                "ml-auto text-xs text-muted-foreground",
                text.length > charLimit && "text-red-500",
              )}
            >
              {text.length}/{charLimit} chars
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
