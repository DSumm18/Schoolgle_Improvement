"use client";

import React from "react";
import useSWR from "swr";
import { motion } from "framer-motion";
import { BarChart3, RefreshCw, Maximize2, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import { CanvasChart } from "./CanvasChart";
import { vizSpecToRechartsConfig } from "@/lib/canvas/viz-renderer";
import type { CanvasReport, VizSpec } from "@/lib/canvas/types";

// ─── Canvas Widget for Dashboard ───────────────────────────

interface CanvasWidgetProps {
  /** Saved canvas report ID to render */
  canvasId: string;
  /** Optional compact mode for smaller spaces */
  compact?: boolean;
  /** Custom height */
  height?: number;
  /** Animation delay for staggered reveal */
  delay?: number;
}

export function CanvasWidget({
  canvasId,
  compact = false,
  height = compact ? 200 : 300,
  delay = 0,
}: CanvasWidgetProps) {
  const { organization } = useAuth();
  const organizationId = organization?.id;

  const { data, isLoading, error, mutate } = useSWR<{ data: CanvasReport }>(
    organizationId
      ? `/api/canvas/reports/${canvasId}?organizationId=${organizationId}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  const report = data?.data;

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        <div
          className="flex items-center justify-center"
          style={{ height: height + 60 }}
        >
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </motion.div>
    );
  }

  if (error || !report) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-card border border-border rounded-2xl p-4 text-center"
      >
        <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Widget unavailable</p>
      </motion.div>
    );
  }

  if (!report.viz_spec) {
    return null;
  }

  const rechartsConfig = vizSpecToRechartsConfig(
    report.viz_spec as VizSpec,
    (report.viz_spec as VizSpec).dataSource?.staticData || [],
    {
      primaryColor: (report.school_branding_snapshot as Record<string, string>)
        ?.primaryColor,
      schoolName: (report.school_branding_snapshot as Record<string, string>)
        ?.schoolName,
    },
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <CanvasChart
        config={rechartsConfig}
        spec={report.viz_spec as VizSpec}
        height={height}
      />
    </motion.div>
  );
}

// ─── Canvas Widget Grid ────────────────────────────────────

interface CanvasWidgetGridProps {
  /** Organization ID to load widgets for */
  className?: string;
  /** Max widgets to show */
  limit?: number;
}

/**
 * Renders all pinned Canvas widgets for the current user's dashboard.
 * Fetches canvas_reports where is_widget=true, ordered by widget_position.
 */
export function CanvasWidgetGrid({
  className = "",
  limit = 6,
}: CanvasWidgetGridProps) {
  const { organization } = useAuth();
  const organizationId = organization?.id;

  const { data, isLoading } = useSWR(
    organizationId
      ? `/api/canvas/reports?organizationId=${organizationId}&widget=true&limit=${limit}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  const widgets: CanvasReport[] = data?.data || [];

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-2xl h-[300px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (widgets.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          Canvas Widgets
        </h2>
        <a
          href="/dashboard/canvas"
          className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
        >
          View all <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {widgets.map((w, i) => (
          <CanvasWidget key={w.id} canvasId={w.id} compact delay={i * 0.1} />
        ))}
      </div>
    </div>
  );
}
