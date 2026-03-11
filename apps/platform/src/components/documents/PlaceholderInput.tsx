"use client";

import { Check } from "lucide-react";
import type { PlaceholderDefinition } from "@/lib/document-engine/types";

interface PlaceholderInputProps {
  placeholder: PlaceholderDefinition;
  value: string;
  onChange: (value: string) => void;
  autoFilled?: boolean;
}

export function PlaceholderInput({
  placeholder,
  value,
  onChange,
  autoFilled,
}: PlaceholderInputProps) {
  const { key, label, required, type, data_source } = placeholder;

  const baseInputClass =
    "w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors";

  const renderInput = () => {
    switch (type) {
      case "date":
        return (
          <input
            type="date"
            id={key}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={baseInputClass}
          />
        );
      case "html":
        return (
          <textarea
            id={key}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className={`${baseInputClass} resize-y min-h-[80px]`}
          />
        );
      case "number":
        return (
          <input
            type="number"
            id={key}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className={baseInputClass}
          />
        );
      default:
        return (
          <input
            type="text"
            id={key}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className={baseInputClass}
          />
        );
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor={key} className="text-sm font-medium text-slate-200">
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </label>
        {autoFilled && (
          <span className="flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold text-blue-400">
            <Check size={10} />
            Auto-filled
          </span>
        )}
      </div>
      {data_source && (
        <p className="text-[11px] text-slate-500">
          Source: {data_source.replace(/_/g, " ")}
        </p>
      )}
      {renderInput()}
    </div>
  );
}
