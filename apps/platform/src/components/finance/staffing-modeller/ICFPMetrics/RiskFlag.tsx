"use client";

interface RiskFlagProps {
  color: string;
  title: string;
  description: string;
}

export function RiskFlag({ color, title, description }: RiskFlagProps) {
  return (
    <div className="flex items-start gap-2 px-2.5 py-2 border-b border-slate-200/60 dark:border-slate-700/50 last:border-b-0">
      <div
        className="w-2 h-2 rounded-full shrink-0 mt-0.5"
        style={{ background: color }}
      />
      <div>
        <div className="text-[11px] font-medium text-slate-900 dark:text-white">{title}</div>
        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{description}</div>
      </div>
    </div>
  );
}
