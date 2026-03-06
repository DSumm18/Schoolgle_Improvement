"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Checkbox as UICheckbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

export function Checkbox({
  question,
  value,
  onChange,
  error,
  disabled,
  preview,
}: QuestionComponentProps) {
  const [otherText, setOtherText] = useState("");
  const choices = question.choices ?? [];
  const hasOther = question.settings?.allow_other;
  const otherLabel = question.settings?.other_label ?? "Other";
  const selected: string[] = Array.isArray(value) ? value : [];
  const minSelections = question.settings?.min_selections;
  const maxSelections = question.settings?.max_selections;

  function toggle(choiceValue: string) {
    const next = selected.includes(choiceValue)
      ? selected.filter((v) => v !== choiceValue)
      : [...selected, choiceValue];
    onChange(next);
  }

  const otherSelected = selected.includes("__other__");

  function toggleOther() {
    if (otherSelected) {
      onChange(selected.filter((v) => v !== "__other__"));
      setOtherText("");
    } else {
      onChange([...selected, "__other__"]);
    }
  }

  const hint =
    minSelections && maxSelections
      ? `Select between ${minSelections} and ${maxSelections}`
      : minSelections
        ? `Select at least ${minSelections}`
        : maxSelections
          ? `Select up to ${maxSelections}`
          : null;

  return (
    <div className="space-y-3">
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <div
        className={cn(
          "space-y-2",
          error && "rounded-md ring-2 ring-red-500/20 p-2",
        )}
        role="group"
        aria-label={question.title}
      >
        {choices.map((choice, i) => {
          const choiceVal = choice.value ?? choice.id;
          const checked = selected.includes(choiceVal);
          return (
            <motion.div
              key={choice.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center space-x-3"
            >
              <UICheckbox
                id={`${question.id}-${choice.id}`}
                checked={checked}
                onCheckedChange={() => toggle(choiceVal)}
                disabled={disabled}
              />
              <Label
                htmlFor={`${question.id}-${choice.id}`}
                className="cursor-pointer text-sm font-normal leading-relaxed"
              >
                {choice.label}
              </Label>
            </motion.div>
          );
        })}

        {hasOther && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: choices.length * 0.03 }}
            className="flex items-start space-x-3"
          >
            <UICheckbox
              id={`${question.id}-other`}
              checked={otherSelected}
              onCheckedChange={toggleOther}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-1.5">
              <Label
                htmlFor={`${question.id}-other`}
                className="cursor-pointer text-sm font-normal"
              >
                {otherLabel}
              </Label>
              {otherSelected && (
                <Input
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Please specify..."
                  disabled={disabled}
                  className="max-w-xs"
                  autoFocus
                />
              )}
            </div>
          </motion.div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
