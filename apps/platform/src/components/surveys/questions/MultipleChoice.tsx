"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

export function MultipleChoice({
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
  const isOtherSelected = value === "__other__";

  function handleChange(val: string) {
    if (val !== "__other__") {
      setOtherText("");
    }
    onChange(val);
  }

  function handleOtherText(text: string) {
    setOtherText(text);
    onChange("__other__");
  }

  return (
    <div className="space-y-3">
      <RadioGroup
        value={value ?? ""}
        onValueChange={handleChange}
        disabled={disabled}
        className={cn(
          "space-y-2",
          error && "rounded-md ring-2 ring-red-500/20 p-2",
        )}
        aria-label={question.title}
      >
        {choices.map((choice, i) => (
          <motion.div
            key={choice.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center space-x-3"
          >
            <RadioGroupItem
              value={choice.value ?? choice.id}
              id={`${question.id}-${choice.id}`}
            />
            <Label
              htmlFor={`${question.id}-${choice.id}`}
              className="cursor-pointer text-sm font-normal leading-relaxed"
            >
              {choice.label}
            </Label>
          </motion.div>
        ))}

        {hasOther && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: choices.length * 0.03 }}
            className="flex items-start space-x-3"
          >
            <RadioGroupItem
              value="__other__"
              id={`${question.id}-other`}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-1.5">
              <Label
                htmlFor={`${question.id}-other`}
                className="cursor-pointer text-sm font-normal"
              >
                {otherLabel}
              </Label>
              {isOtherSelected && (
                <Input
                  value={otherText}
                  onChange={(e) => handleOtherText(e.target.value)}
                  placeholder="Please specify..."
                  disabled={disabled}
                  className="max-w-xs"
                  autoFocus
                />
              )}
            </div>
          </motion.div>
        )}
      </RadioGroup>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
