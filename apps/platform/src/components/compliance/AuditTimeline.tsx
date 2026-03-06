"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Eye,
  Send,
  Shield,
  AlertTriangle,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogEntry } from "@/lib/compliance/types";

interface AuditTimelineProps {
  organizationId: string;
  entityType?: string;
  entityId?: string;
}

const ACTION_ICONS: Record<string, any> = {
  created: Plus,
  updated: Edit,
  deleted: Trash2,
  approved: CheckCircle,
  rejected: XCircle,
  published: Send,
  viewed: Eye,
  submitted: Send,
  archived: Shield,
  review_due: AlertTriangle,
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-emerald-100 text-emerald-600",
  updated: "bg-blue-100 text-blue-600",
  deleted: "bg-rose-100 text-rose-600",
  approved: "bg-green-100 text-green-600",
  rejected: "bg-red-100 text-red-600",
  published: "bg-purple-100 text-purple-600",
  viewed: "bg-slate-100 text-slate-600",
  submitted: "bg-amber-100 text-amber-600",
  archived: "bg-slate-100 text-slate-500",
  review_due: "bg-orange-100 text-orange-600",
};

export default function AuditTimeline({
  organizationId,
  entityType,
  entityId,
}: AuditTimelineProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLog();
  }, [organizationId, entityType, entityId]);

  const fetchAuditLog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ organizationId });
      if (entityType) params.append("entityType", entityType);
      if (entityId) params.append("entityId", entityId);

      const response = await fetch(`/api/compliance/audit?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEntries(data.entries || []);
      }
    } catch (error) {
      console.error("Failed to fetch audit log:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionLabel = (action: string) => {
    return action
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold">
            No activity recorded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-4">
            {entries.map((entry, idx) => {
              const IconComponent = ACTION_ICONS[entry.action] || FileText;
              const colorClass =
                ACTION_COLORS[entry.action] || "bg-slate-100 text-slate-600";

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="relative flex items-start gap-4 pl-1"
                >
                  <div
                    className={`relative z-10 p-2 rounded-full ${colorClass}`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {getActionLabel(entry.action)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {entry.entity_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {entry.actor_name && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <User className="w-3 h-3" />
                          {entry.actor_name}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
