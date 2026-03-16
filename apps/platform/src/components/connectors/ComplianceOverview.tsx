"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Brain, HardHat, Lock, GraduationCap, Building,
  CheckCircle2, AlertTriangle, XCircle, Clock, ChevronRight,
  Users
} from "lucide-react";
import { ConnectorCategory, ComplianceStatus, CONNECTOR_CATEGORIES } from "@/lib/connectors/types";

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Shield, Brain, HardHat, Lock, GraduationCap, Building, Settings: Users,
};

/** Short display labels per category (full labels live in CONNECTOR_CATEGORIES). */
const SHORT_LABELS: Record<ConnectorCategory, string> = {
  safeguarding: "Safeguarding",
  send: "SEND",
  health_safety: "Health & Safety",
  data_governance: "Data & Governance",
  curriculum: "Curriculum",
  estates: "Estates",
  custom: "Custom",
};

/** Derived from the single-source CONNECTOR_CATEGORIES in types.ts. */
const CATEGORY_CONFIG: Record<ConnectorCategory, { label: string; icon: React.ComponentType<any>; color: string }> = Object.fromEntries(
  CONNECTOR_CATEGORIES.map((c) => [
    c.value,
    { label: SHORT_LABELS[c.value], icon: ICON_MAP[c.icon] ?? Users, color: c.color },
  ]),
) as Record<ConnectorCategory, { label: string; icon: React.ComponentType<any>; color: string }>;

const STATUS_CONFIG: Record<ComplianceStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  compliant: { label: "Compliant", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  expiring_soon: { label: "Expiring Soon", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  at_risk: { label: "At Risk", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  non_compliant: { label: "Non-Compliant", icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
};

interface ComplianceItem {
  connector_type: any;
  active_count: number;
  expired_training_count: number;
  expiring_soon_count: number;
  compliance_status: ComplianceStatus;
  holders: any[];
}

interface ComplianceOverviewProps {
  summary: {
    total_statutory: number;
    compliant: number;
    at_risk: number;
    expiring_soon: number;
    non_compliant: number;
  };
  compliance: ComplianceItem[];
  onViewDetails?: (typeSlug: string) => void;
}

export function ComplianceOverview({ summary, compliance, onViewDetails }: ComplianceOverviewProps) {
  // Group by category
  const byCategory = compliance.reduce((acc, item) => {
    const cat = item.connector_type.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ComplianceItem[]>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          label="Compliant"
          count={summary.compliant}
          total={summary.total_statutory}
          status="compliant"
          delay={0}
        />
        <SummaryCard
          label="Expiring Soon"
          count={summary.expiring_soon}
          total={summary.total_statutory}
          status="expiring_soon"
          delay={0.05}
        />
        <SummaryCard
          label="At Risk"
          count={summary.at_risk}
          total={summary.total_statutory}
          status="at_risk"
          delay={0.1}
        />
        <SummaryCard
          label="Non-Compliant"
          count={summary.non_compliant}
          total={summary.total_statutory}
          status="non_compliant"
          delay={0.15}
        />
      </div>

      {/* Compliance by Category */}
      {Object.entries(byCategory).map(([category, items], catIdx) => {
        const catConfig = CATEGORY_CONFIG[category as ConnectorCategory];
        if (!catConfig) return null;
        const CatIcon = catConfig.icon;

        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + catIdx * 0.05 }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="p-4 border-b border-border flex items-center gap-2">
              <CatIcon
                className="w-5 h-5"
                style={{ color: catConfig.color }}
              />
              <h3 className="font-bold text-base">{catConfig.label}</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {items.length} role{items.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="divide-y divide-border">
              {items.map((item, idx) => {
                const statusConfig = STATUS_CONFIG[item.compliance_status];
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={item.connector_type.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 + idx * 0.03 }}
                    className={`p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                      onViewDetails ? "cursor-pointer" : ""
                    }`}
                    onClick={() => onViewDetails?.(item.connector_type.slug)}
                  >
                    <StatusIcon className={`w-5 h-5 flex-shrink-0 ${statusConfig.color}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {item.connector_type.name}
                        </span>
                        {item.connector_type.is_statutory && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium flex-shrink-0">
                            Statutory
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span>
                          {item.active_count} assigned
                          {item.connector_type.min_count > 0 && (
                            <> / {item.connector_type.min_count} required</>
                          )}
                        </span>
                        {item.expired_training_count > 0 && (
                          <span className="text-red-600">
                            {item.expired_training_count} expired training
                          </span>
                        )}
                        {item.expiring_soon_count > 0 && (
                          <span className="text-amber-600">
                            {item.expiring_soon_count} expiring soon
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.bg}`}>
                      <span className={statusConfig.color}>{statusConfig.label}</span>
                    </div>

                    {onViewDetails && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function SummaryCard({
  label,
  count,
  total,
  status,
  delay,
}: {
  label: string;
  count: number;
  total: number;
  status: ComplianceStatus;
  delay: number;
}) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-xl border p-4 ${config.bg}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <StatusIcon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-xs font-medium ${config.color}`}>{label}</span>
      </div>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.1, type: "spring", stiffness: 200 }}
        className="text-2xl font-black text-foreground"
      >
        {count}
      </motion.div>
      <div className="text-xs text-muted-foreground mt-1">
        of {total} statutory roles
      </div>
    </motion.div>
  );
}
