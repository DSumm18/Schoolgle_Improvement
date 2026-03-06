"use client";

import { motion } from "framer-motion";
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

export function ShortText({
  question,
  value,
  onChange,
  error,
  disabled,
  preview,
}: QuestionComponentProps) {
  const text = typeof value === "string" ? value : "";
  const charLimit = question.settings?.char_limit;
  const inputType = question.settings?.input_type ?? "text";
  const placeholder = question.settings?.placeholder ?? "";

  const inputTypeMap: Record<string, string> = {
    text: "text",
    email: "email",
    phone: "tel",
    number: "number",
    url: "url",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <Input
        type={inputTypeMap[inputType] ?? "text"}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={charLimit}
        aria-label={question.title}
        className={cn(
          "max-w-md",
          error && "border-red-500 ring-2 ring-red-500/20",
        )}
      />

      <div className="flex items-center justify-between">
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
            {text.length}/{charLimit}
          </p>
        )}
      </div>
    </motion.div>
  );
}
