"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from "swr";
import {
  AlertTriangle, AlertOctagon, Info, UserMinus, ArrowRight,
  ChevronDown, ChevronUp, ClipboardList, Users
} from "lucide-react";
import { ConnectorBadge } from "./ConnectorBadge";
import { fetcher } from "@/lib/fetchers";

interface LeavingImpactReportProps {
  staffId: string;
  organizationId: string;
  onTransfer?: (connectorId: string, toStaffId: string) => Promise<void>;
}

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertOctagon,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    label: "Critical",
    description: "Must be reassigned before leaving date",
  },
  important: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    label: "Important",
    description: "Should be reassigned",
  },
  low: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    label: "Low",
    description: "Nice to reassign",
  },
};

export function LeavingImpactReport({ staffId, organizationId, onTransfer }: LeavingImpactReportProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [transferring, setTransferring] = useState<string | null>(null);

  const { data: impact, isLoading, error } = useSWR(
    organizationId ? `/api/connectors/impact?staffId=${staffId}` : null,
    fetcher
  );

  // Staff list for transfer dropdown
  const { data: allStaff = [] } = useSWR(
    transferring ? `/api/staff` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-muted rounded-2xl" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-24 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (error || !impact) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-xl">
        Unable to load impact analysis.
      </div>
    );
  }

  if (impact.connectors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-6 bg-muted/50 rounded-xl text-center">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p>{impact.staff.display_name} has no active connectors.</p>
        <p className="text-xs mt-1">No responsibilities to transfer.</p>
      </div>
    );
  }

  const handleTransfer = async (connectorId: string, toStaffId: string) => {
    if (onTransfer) {
      await onTransfer(connectorId, toStaffId);
    } else {
      // Default transfer via API
      try {
        const res = await fetch("/api/connectors/transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connector_id: connectorId,
            to_staff_id: toStaffId,
            reason: `Staff member ${impact.staff.display_name} leaving`,
          }),
        });
        if (res.ok) {
          mutate(`/api/connectors/impact?staffId=${staffId}`);
          setTransferring(null);
        }
      } catch (err) {
        console.error("Transfer failed:", err);
      }
    }
  };

  // Group by severity
  const bySeverity = {
    critical: impact.connectors.filter((c: any) => c.severity === "critical"),
    important: impact.connectors.filter((c: any) => c.severity === "important"),
    low: impact.connectors.filter((c: any) => c.severity === "low"),
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <UserMinus className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Staff Change Impact</h2>
            <p className="text-sm text-muted-foreground">{impact.summary}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {(["critical", "important", "low"] as const).map((sev, i) => {
            const config = SEVERITY_CONFIG[sev];
            const SevIcon = config.icon;
            const count = bySeverity[sev].length;

            return (
              <motion.div
                key={sev}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={`rounded-xl border p-3 ${config.bg}`}
              >
                <div className={`flex items-center gap-1.5 ${config.color} text-xs font-medium`}>
                  <SevIcon className="w-3.5 h-3.5" />
                  {config.label}
                </div>
                <div className="text-xl font-black mt-1">{count}</div>
              </motion.div>
            );
          })}
        </div>

        {impact.total_affected_tasks > 0 && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <ClipboardList className="w-4 h-4" />
            <span>{impact.total_affected_tasks} tasks will need reassignment</span>
          </div>
        )}
      </motion.div>

      {/* Connector list by severity */}
      {(["critical", "important", "low"] as const).map((severity) => {
        const items = bySeverity[severity];
        if (items.length === 0) return null;

        const config = SEVERITY_CONFIG[severity];

        return (
          <motion.div
            key={severity}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <div className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
              {config.label} — {config.description}
            </div>

            {items.map((item: any, idx: number) => {
              const c = item.connector;
              const isExpanded = expandedId === c.id;
              const isTransferring = transferring === c.id;

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`border rounded-xl overflow-hidden ${config.bg}`}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <ConnectorBadge
                      name={c.connector_type?.name || "Unknown"}
                      category={c.connector_type?.category || "custom"}
                      icon={c.connector_type?.icon}
                      color={c.connector_type?.color}
                      isPrimary={c.is_primary}
                      size="sm"
                      animated={false}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground truncate">
                        {item.reason}
                      </div>
                    </div>

                    {item.suggested_replacement && (
                      <div className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 flex-shrink-0">
                        Suggestion available
                      </div>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border/50"
                      >
                        <div className="p-4 space-y-3">
                          {item.affected_tasks > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {item.affected_tasks} active task{item.affected_tasks !== 1 ? "s" : ""} will become unowned
                            </div>
                          )}

                          {item.suggested_replacement && (
                            <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3">
                              <div className="text-xs font-medium text-emerald-700 mb-1">
                                Suggested Replacement
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  {item.suggested_replacement.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.suggested_replacement.reason}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  handleTransfer(
                                    c.id,
                                    item.suggested_replacement.staff_id
                                  )
                                }
                                className="mt-2 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1"
                              >
                                <ArrowRight className="w-3 h-3" />
                                Reassign Now
                              </button>
                            </div>
                          )}

                          {/* Manual transfer */}
                          {!isTransferring ? (
                            <button
                              onClick={() => setTransferring(c.id)}
                              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                            >
                              <ArrowRight className="w-3 h-3" />
                              Choose different person
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs font-medium">Transfer to:</div>
                              <div className="max-h-40 overflow-y-auto space-y-1">
                                {allStaff
                                  .filter((s: any) => s.id !== staffId && s.is_active)
                                  .map((s: any) => (
                                    <button
                                      key={s.id}
                                      onClick={() => handleTransfer(c.id, s.id)}
                                      className="w-full text-left p-2 text-sm hover:bg-muted/50 rounded-lg transition-colors"
                                    >
                                      {s.display_name} — {s.job_title}
                                    </button>
                                  ))}
                              </div>
                              <button
                                onClick={() => setTransferring(null)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        );
      })}
    </div>
  );
}
