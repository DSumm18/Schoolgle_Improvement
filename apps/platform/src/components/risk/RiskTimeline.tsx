"use client";

import { useMemo } from "react";
import {
  getRiskLevel,
  getRiskLevelColor,
  type RiskLevel,
} from "@/lib/risk/scoring-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskTimelineEvent {
  id: string;
  previous_score: number;
  new_score: number;
  change_amount: number;
  risk_level: RiskLevel;
  change_reason: string;
  triggered_by: string;
  triggered_by_email?: string | null;
  created_at: string;
  metadata?: Record<string, any>;
}

interface RiskTimelineProps {
  events: RiskTimelineEvent[];
  /** Show compact version without full details */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Trigger label mapping
// ---------------------------------------------------------------------------

const TRIGGER_LABELS: Record<string, string> = {
  check_overdue: "Check Overdue",
  repeat_failure: "Repeat Failure",
  contractor_visit_cancelled: "Contractor Cancelled",
  critical_no_action_24hrs: "Critical — No Action",
  mitigation_confirmed: "Mitigation Confirmed",
  monitoring_check_completed: "Check Completed",
  permanent_fix_verified: "Permanent Fix Verified",
  professional_inspection_safe: "Inspection Passed",
  staff_notification_confirmed: "Staff Notified",
  system_auto: "System Auto",
  user_action: "User Action",
  daily_sync: "Daily Sync",
  scheduled_review: "Scheduled Review",
  incident: "Incident Logged",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getChangeIcon(change: number): string {
  if (change > 0) return "▲";
  if (change < 0) return "▼";
  return "●";
}

function getChangeBorderClass(change: number): string {
  if (change > 0) return "border-red-400";
  if (change < 0) return "border-green-400";
  return "border-gray-300";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RiskTimeline({ events, compact = false }: RiskTimelineProps) {
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [events],
  );

  if (sortedEvents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        No risk score events recorded yet
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-gray-200" />

      <div className="space-y-0">
        {sortedEvents.map((event, index) => {
          const color = getRiskLevelColor(event.risk_level);
          const isFirst = index === 0;
          const isLast = index === sortedEvents.length - 1;

          return (
            <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Node dot */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md`}
                  style={{ backgroundColor: color }}
                  title={`Score: ${event.new_score} (${event.risk_level})`}
                >
                  {event.new_score}
                </div>
              </div>

              {/* Content card */}
              <div
                className={`flex-1 rounded-lg border-l-4 bg-white p-3 shadow-sm ${getChangeBorderClass(event.change_amount)}`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        event.change_amount > 0
                          ? "text-red-600"
                          : event.change_amount < 0
                            ? "text-green-600"
                            : "text-gray-500"
                      }`}
                    >
                      {getChangeIcon(event.change_amount)}{" "}
                      {event.change_amount > 0 ? "+" : ""}
                      {event.change_amount}
                    </span>
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {TRIGGER_LABELS[event.triggered_by] ?? event.triggered_by}
                    </span>
                  </div>
                  <time className="text-xs text-gray-400">
                    {formatDate(event.created_at)}
                  </time>
                </div>

                {/* Reason */}
                {!compact && (
                  <p className="mt-1 text-sm text-gray-600">
                    {event.change_reason}
                  </p>
                )}

                {/* Footer: who and score change */}
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                  <span>
                    {event.previous_score} → {event.new_score}
                  </span>
                  {event.triggered_by_email && (
                    <span>by {event.triggered_by_email}</span>
                  )}
                  {!event.triggered_by_email && (
                    <span className="italic">system</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compact Score Sparkline (for table rows / cards)
// ---------------------------------------------------------------------------

interface RiskScoreSparklineProps {
  events: RiskTimelineEvent[];
  width?: number;
  height?: number;
}

export function RiskScoreSparkline({
  events,
  width = 120,
  height = 32,
}: RiskScoreSparklineProps) {
  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [events],
  );

  if (sorted.length < 2) return null;

  const scores = sorted.map((e) => e.new_score);
  const maxScore = 25;
  const padding = 2;

  const points = scores.map((score, i) => {
    const x = padding + (i / (scores.length - 1)) * (width - padding * 2);
    const y = height - padding - (score / maxScore) * (height - padding * 2);
    return `${x},${y}`;
  });

  const lastScore = scores[scores.length - 1];
  const level = getRiskLevel(lastScore);
  const color = getRiskLevelColor(level);

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {scores.length > 0 && (
        <circle
          cx={parseFloat(points[points.length - 1].split(",")[0])}
          cy={parseFloat(points[points.length - 1].split(",")[1])}
          r={3}
          fill={color}
        />
      )}
    </svg>
  );
}
