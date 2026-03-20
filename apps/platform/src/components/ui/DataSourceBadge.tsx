"use client";

import {
  Database,
  FileSpreadsheet,
  Globe,
  PenTool,
  RefreshCw,
} from "lucide-react";

interface DataSourceBadgeProps {
  source?: string | null;
  importedAt?: string | null;
  compact?: boolean;
}

const SOURCE_CONFIG: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  csv_import: {
    label: "Connected via CSV",
    icon: FileSpreadsheet,
    color: "blue",
  },
  csv: { label: "Connected via CSV", icon: FileSpreadsheet, color: "blue" },
  manual: { label: "Added in Schoolgle", icon: PenTool, color: "zinc" },
  arbor: { label: "Connected from Arbor", icon: Database, color: "purple" },
  sims: { label: "Connected from SIMS", icon: Database, color: "indigo" },
  bromcom: { label: "Connected from Bromcom", icon: Database, color: "teal" },
  mis_sync: { label: "Synced from MIS", icon: RefreshCw, color: "green" },
  drive: { label: "Connected via Drive", icon: Globe, color: "amber" },
  api: { label: "Connected via API", icon: Database, color: "sky" },
};

const COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800",
  zinc: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700",
  purple:
    "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800",
  indigo:
    "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800",
  teal: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-800",
  green:
    "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800",
  amber:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800",
  sky: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800",
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function DataSourceBadge({
  source,
  importedAt,
  compact,
}: DataSourceBadgeProps) {
  if (!source) return null;

  const config = SOURCE_CONFIG[source] || {
    label: source.replace(/_/g, " "),
    icon: Database,
    color: "zinc",
  };

  const Icon = config.icon;
  const colorClass = COLOR_CLASSES[config.color] || COLOR_CLASSES.zinc;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${colorClass}`}
        title={importedAt ? `Imported ${formatDate(importedAt)}` : config.label}
      >
        <Icon size={10} />
        {config.label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${colorClass}`}
    >
      <Icon size={12} />
      {config.label}
      {importedAt && (
        <span className="opacity-70">&middot; {formatDate(importedAt)}</span>
      )}
    </span>
  );
}

export function DataFreshnessBadge({
  lastUpdated,
}: {
  lastUpdated?: string | null;
}) {
  if (!lastUpdated) return null;

  const now = new Date();
  const updated = new Date(lastUpdated);
  const daysSince = Math.floor(
    (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSince <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800">
        <RefreshCw size={10} />
        Fresh ({daysSince === 0 ? "today" : `${daysSince}d ago`})
      </span>
    );
  }

  if (daysSince <= 30) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800">
        <RefreshCw size={10} />
        {daysSince}d ago
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800">
      <RefreshCw size={10} />
      Stale ({daysSince}d ago)
    </span>
  );
}
