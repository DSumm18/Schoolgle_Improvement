"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Heart, Smile } from "lucide-react";
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

const iconMap = {
  star: Star,
  heart: Heart,
  smiley: Smile,
} as const;

export function Rating({
  question,
  value,
  onChange,
  error,
  disabled,
  preview,
}: QuestionComponentProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const count = question.settings?.rating_count ?? 5;
  const iconType = question.settings?.rating_icon ?? "star";
  const Icon = iconMap[iconType] ?? Star;
  const current = typeof value === "number" ? value : 0;
  const display = hovered ?? current;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div
        className={cn(
          "flex items-center gap-1",
          error && "rounded-md ring-2 ring-red-500/20 p-2",
        )}
        role="radiogroup"
        aria-label={question.title}
      >
        {Array.from({ length: count }, (_, i) => {
          const ratingValue = i + 1;
          const filled = ratingValue <= display;
          return (
            <motion.button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange(ratingValue)}
              onMouseEnter={() => !disabled && setHovered(ratingValue)}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "p-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                disabled && "cursor-not-allowed opacity-50",
              )}
              aria-label={`${ratingValue} out of ${count}`}
              role="radio"
              aria-checked={current === ratingValue}
            >
              <Icon
                className={cn(
                  "h-7 w-7 transition-colors",
                  filled
                    ? iconType === "heart"
                      ? "fill-red-500 text-red-500"
                      : iconType === "smiley"
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/40",
                )}
              />
            </motion.button>
          );
        })}

        {current > 0 && (
          <span className="ml-2 text-sm font-medium text-muted-foreground tabular-nums">
            {current}/{count}
          </span>
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
