"use client";

import { Badge } from "@/components/ui/badge";
import {
  ComplianceStatus,
  PolicyCategory,
  STATUS_LABELS,
  STATUS_COLORS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/lib/compliance/types";

interface StatusBadgeProps {
  status?: ComplianceStatus;
  category?: PolicyCategory;
}

export default function StatusBadge({ status, category }: StatusBadgeProps) {
  if (status) {
    return (
      <Badge
        className={`text-[10px] font-bold uppercase px-2 py-0.5 ${STATUS_COLORS[status]}`}
      >
        {STATUS_LABELS[status]}
      </Badge>
    );
  }

  if (category) {
    return (
      <Badge
        className={`text-[10px] font-normal uppercase px-2 py-0.5 ${CATEGORY_COLORS[category]}`}
      >
        {CATEGORY_LABELS[category]}
      </Badge>
    );
  }

  return null;
}
