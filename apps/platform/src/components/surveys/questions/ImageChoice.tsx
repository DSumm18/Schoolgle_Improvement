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

export function ImageChoice({
  question,
  value,
  onChange,
  error,
  disabled,
}: QuestionComponentProps) {
  const choices = question.choices ?? [];
  const isMulti = (question.settings?.max_selections ?? 1) > 1;
  const selected: string[] = Array.isArray(value) ? value : [];

  function handleSelect(choiceId: string) {
    if (disabled) return;

    if (isMulti) {
      const maxSelections = question.settings?.max_selections ?? choices.length;
      if (selected.includes(choiceId)) {
        onChange(selected.filter((id) => id !== choiceId));
      } else if (selected.length < maxSelections) {
        onChange([...selected, choiceId]);
      }
    } else {
      onChange([choiceId]);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div
        className={cn(
          "grid grid-cols-2 md:grid-cols-3 gap-3",
          error && "rounded-md ring-2 ring-red-500/20 p-2",
        )}
        role="group"
        aria-label={question.title}
      >
        {choices.map((choice) => {
          const isSelected = selected.includes(choice.id);
          return (
            <motion.button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(choice.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative rounded-lg border-2 overflow-hidden transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-cyan-500 shadow-md"
                  : "border-border hover:border-muted-foreground/50",
                disabled && "cursor-not-allowed opacity-50",
              )}
              role={isMulti ? "checkbox" : "radio"}
              aria-checked={isSelected}
              aria-label={choice.label}
            >
              {/* Image */}
              <div className="aspect-[4/3] bg-muted relative">
                {choice.image_url ? (
                  <img
                    src={choice.image_url}
                    alt={choice.label}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image
                  </div>
                )}

                {/* Checkmark overlay */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white shadow-sm"
                  >
                    <Check className="h-4 w-4" />
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <div
                className={cn(
                  "px-2 py-2 text-center text-sm font-medium",
                  isSelected
                    ? "text-cyan-700 dark:text-cyan-300"
                    : "text-foreground",
                )}
              >
                {choice.label}
              </div>
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
