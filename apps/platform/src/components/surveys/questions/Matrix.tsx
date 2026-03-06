"use client";

import { motion } from "framer-motion";
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

export function Matrix({
  question,
  value,
  onChange,
  error,
  disabled,
}: QuestionComponentProps) {
  const rows = question.settings?.matrix_rows ?? [];
  const columns = question.settings?.matrix_columns ?? [];
  const selected: Record<string, string> =
    value && typeof value === "object" ? value : {};

  function handleSelect(row: string, col: string) {
    if (disabled) return;
    onChange({ ...selected, [row]: col });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {/* Desktop table view */}
      <div
        className={cn(
          "hidden md:block overflow-x-auto",
          error && "rounded-md ring-2 ring-red-500/20 p-2",
        )}
      >
        <table
          className="w-full border-collapse"
          role="grid"
          aria-label={question.title}
        >
          <thead>
            <tr>
              <th className="text-left text-sm font-medium text-muted-foreground p-2 min-w-[140px]" />
              {columns.map((col) => (
                <th
                  key={col}
                  className="text-center text-sm font-medium text-muted-foreground p-2 min-w-[80px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={row}
                className={cn(
                  "border-t border-border",
                  rowIdx % 2 === 0 && "bg-muted/30",
                )}
              >
                <td className="text-sm font-medium p-2">{row}</td>
                {columns.map((col) => {
                  const isChecked = selected[row] === col;
                  return (
                    <td key={col} className="text-center p-2">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleSelect(row, col)}
                        className={cn(
                          "inline-flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isChecked
                            ? "border-cyan-500 bg-cyan-500"
                            : "border-muted-foreground/40 hover:border-cyan-400",
                          disabled && "cursor-not-allowed opacity-50",
                        )}
                        role="radio"
                        aria-checked={isChecked}
                        aria-label={`${row}: ${col}`}
                      >
                        {isChecked && (
                          <span className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div
        className={cn(
          "md:hidden space-y-3",
          error && "rounded-md ring-2 ring-red-500/20 p-2",
        )}
        role="group"
        aria-label={question.title}
      >
        {rows.map((row) => (
          <div
            key={row}
            className="rounded-lg border border-border p-3 space-y-2"
          >
            <p className="text-sm font-medium">{row}</p>
            <div className="flex flex-wrap gap-2">
              {columns.map((col) => {
                const isChecked = selected[row] === col;
                return (
                  <button
                    key={col}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelect(row, col)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-all",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isChecked
                        ? "border-cyan-500 bg-cyan-500 text-white"
                        : "border-border hover:border-cyan-300 text-foreground",
                      disabled && "cursor-not-allowed opacity-50",
                    )}
                    role="radio"
                    aria-checked={isChecked}
                    aria-label={`${row}: ${col}`}
                  >
                    {col}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </motion.div>
  );
}
