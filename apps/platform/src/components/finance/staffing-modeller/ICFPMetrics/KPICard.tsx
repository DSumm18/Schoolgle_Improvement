"use client";

type RAG = "green" | "amber" | "red";

interface KPICardProps {
  label: string;
  value: string;
  target: string;
  rag: RAG;
  borderColor: string;
}

const RAG_STYLES: Record<RAG, { bg: string; text: string; label: string }> = {
  green: { bg: "bg-green-50 dark:bg-green-900/20", text: "text-green-700 dark:text-green-400", label: "Green" },
  amber: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-400", label: "Amber" },
  red: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", label: "Red" },
};

export function KPICard({ label, value, target, rag, borderColor }: KPICardProps) {
  const s = RAG_STYLES[rag];

  return (
    <div
      className="border border-slate-200/60 dark:border-slate-700/50 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-900"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
    >
      <div className="text-[9px] text-slate-400 dark:text-slate-500 mb-0.5">{label}</div>
      <div className="text-[17px] font-medium text-slate-900 dark:text-white leading-none">
        {value}
        <span className={`inline-block text-[8px] font-medium px-1.5 py-0.5 rounded ml-1.5 ${s.bg} ${s.text}`}>
          {s.label}
        </span>
      </div>
      <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">Target: {target}</div>
    </div>
  );
}
