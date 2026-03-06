"use client";

import { ClipboardCheck, ChevronRight } from "lucide-react";
import type { MeetingTemplate } from "@/lib/meetings";

interface Props {
  template: MeetingTemplate;
  onSelect: (template: MeetingTemplate) => void;
}

export function MeetingTemplateCard({ template, onSelect }: Props) {
  const itemCount = template.compliance_items?.length || 0;
  const criticalCount =
    template.compliance_items?.filter((i) => i.is_critical).length || 0;

  return (
    <button
      onClick={() => onSelect(template)}
      className="text-left bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all group w-full"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="bg-indigo-50 dark:bg-indigo-900/30 w-10 h-10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
          <ClipboardCheck size={20} />
        </div>
        <ChevronRight
          size={16}
          className="text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all mt-2"
        />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
        {template.name}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">
        {template.description}
      </p>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>{itemCount} checklist items</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span>{criticalCount} critical</span>
        {template.is_custom && (
          <>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-indigo-500 font-medium">Custom</span>
          </>
        )}
      </div>
    </button>
  );
}
