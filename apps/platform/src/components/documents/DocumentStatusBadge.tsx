"use client";

import {
  Clock,
  AlertCircle,
  Check,
  FileText,
  Send,
  Download,
  X,
  Eye,
} from "lucide-react";
import type { DocumentStatus } from "@/lib/document-engine/types";

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<
  DocumentStatus,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }
> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    border: "border-slate-500/30",
    icon: FileText,
  },
  pending_approval: {
    label: "Pending Approval",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    border: "border-blue-500/30",
    icon: Check,
  },
  finalised: {
    label: "Finalised",
    bg: "bg-indigo-500/15",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    icon: Eye,
  },
  sent: {
    label: "Sent",
    bg: "bg-sky-500/15",
    text: "text-sky-400",
    border: "border-sky-500/30",
    icon: Send,
  },
  delivered: {
    label: "Delivered",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    icon: Download,
  },
  acknowledged: {
    label: "Acknowledged",
    bg: "bg-green-500/15",
    text: "text-green-400",
    border: "border-green-500/30",
    icon: Check,
  },
  rejected: {
    label: "Rejected",
    bg: "bg-red-500/15",
    text: "text-red-400",
    border: "border-red-500/30",
    icon: X,
  },
};

export function DocumentStatusBadge({
  status,
  size = "md",
}: DocumentStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  const Icon = config.icon;

  const sizeClasses =
    size === "sm"
      ? "px-1.5 py-0.5 text-[10px] gap-1"
      : "px-2.5 py-1 text-xs gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-md border font-semibold ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <Icon size={size === "sm" ? 10 : 12} />
      {config.label}
    </span>
  );
}
