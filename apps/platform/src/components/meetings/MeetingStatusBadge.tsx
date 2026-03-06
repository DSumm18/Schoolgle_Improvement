"use client";

import type { MeetingStatus } from "@/lib/meetings";

const STATUS_CONFIG: Record<
  MeetingStatus,
  { label: string; bg: string; text: string }
> = {
  scheduled: {
    label: "Scheduled",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  completed: {
    label: "Completed",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-500 dark:text-gray-400",
  },
};

export function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
