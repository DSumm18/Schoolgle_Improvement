"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR, { mutate } from "swr";
import {
  Plus, X, ChevronDown, Calendar, Award, AlertTriangle,
  Trash2, ArrowRightLeft
} from "lucide-react";
import { ConnectorBadge } from "./ConnectorBadge";
import { ConnectorCategory } from "@/lib/connectors/types";
import { fetcher } from "@/lib/fetchers";

interface StaffConnectorPanelProps {
  staffId: string;
  organizationId: string;
  staffName: string;
  canManage: boolean;
}

export function StaffConnectorPanel({
  staffId,
  organizationId,
  staffName,
  canManage,
}: StaffConnectorPanelProps) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [expandedConnector, setExpandedConnector] = useState<string | null>(null);

  // Fetch connectors for this staff member
  const { data: connectors = [], isLoading } = useSWR(
    organizationId
      ? `/api/connectors?staffId=${staffId}&status=active`
      : null,
    fetcher
  );

  // Fetch available connector types for assignment
  const { data: connectorTypes = [] } = useSWR(
    showAssignModal ? "/api/connectors/types" : null,
    fetcher
  );

  const handleAssign = async (connectorTypeId: string) => {
    try {
      const res = await fetch("/api/connectors/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staff_id: staffId,
          connector_type_id: connectorTypeId,
        }),
      });
      if (res.ok) {
        mutate(`/api/connectors?staffId=${staffId}&status=active`);
        setShowAssignModal(false);
      }
    } catch (error) {
      console.error("Error assigning connector:", error);
    }
  };

  const handleRemove = async (connectorId: string) => {
    try {
      const res = await fetch(`/api/connectors/assign?id=${connectorId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        mutate(`/api/connectors?staffId=${staffId}&status=active`);
      }
    } catch (error) {
      console.error("Error removing connector:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="flex gap-2">
          <div className="h-8 bg-muted rounded-full w-24" />
          <div className="h-8 bg-muted rounded-full w-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Roles & Responsibilities
        </h3>
        {canManage && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="text-xs text-primary font-medium hover:text-primary/80 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        )}
      </div>

      {connectors.length === 0 ? (
        <div className="text-sm text-muted-foreground py-2">
          No connectors assigned yet.
          {canManage && " Click + Add to assign roles."}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {connectors.map((c: any, i: number) => (
            <div key={c.id} className="group relative">
              <ConnectorBadge
                name={c.connector_type?.name || "Unknown"}
                category={c.connector_type?.category || "custom"}
                icon={c.connector_type?.icon}
                color={c.connector_type?.color}
                isPrimary={c.is_primary}
                isStatutory={c.connector_type?.is_statutory}
                scope={c.scope}
                trainingExpiry={c.training_expiry_date}
                size="md"
                delay={i * 0.05}
                onClick={() =>
                  setExpandedConnector(
                    expandedConnector === c.id ? null : c.id
                  )
                }
              />

              {/* Expanded detail */}
              <AnimatePresence>
                {expandedConnector === c.id && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -5, height: 0 }}
                    className="absolute left-0 top-full mt-1 z-10 bg-card border border-border rounded-xl shadow-lg p-3 min-w-[280px]"
                  >
                    <div className="space-y-2 text-xs">
                      {c.connector_type?.statutory_basis && (
                        <div className="flex items-center gap-1.5 text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Statutory: {c.connector_type.statutory_basis}</span>
                        </div>
                      )}
                      {c.training_expiry_date && (
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3 h-3 text-muted-foreground" />
                          <span>
                            Training expires:{" "}
                            {new Date(c.training_expiry_date).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span>
                          Assigned: {new Date(c.assigned_date).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                      {c.connector_type?.responsibilities?.length > 0 && (
                        <div className="pt-1 border-t border-border">
                          <div className="font-medium mb-1">Responsibilities:</div>
                          <ul className="space-y-0.5 text-muted-foreground">
                            {c.connector_type.responsibilities.slice(0, 3).map((r: string, ri: number) => (
                              <li key={ri}>· {r}</li>
                            ))}
                            {c.connector_type.responsibilities.length > 3 && (
                              <li className="text-primary">
                                +{c.connector_type.responsibilities.length - 3} more
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      {canManage && (
                        <div className="pt-2 border-t border-border flex gap-2">
                          <button
                            onClick={() => handleRemove(c.id)}
                            className="text-red-600 hover:text-red-700 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowAssignModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-lg">
                  Assign Connector to {staffName}
                </h2>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-1 rounded-lg hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[60vh] divide-y divide-border">
                {/* Filter out already-assigned types */}
                {connectorTypes
                  .filter(
                    (t: any) =>
                      !connectors.some(
                        (c: any) => c.connector_type_id === t.id
                      )
                  )
                  .map((type: any) => (
                    <button
                      key={type.id}
                      onClick={() => handleAssign(type.id)}
                      className="w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-center gap-3"
                    >
                      <ConnectorBadge
                        name={type.name}
                        category={type.category}
                        icon={type.icon}
                        color={type.color}
                        isStatutory={type.is_statutory}
                        size="sm"
                        animated={false}
                      />
                      {type.is_statutory && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
                          Statutory
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {type.category}
                      </span>
                    </button>
                  ))}

                {connectorTypes.filter(
                  (t: any) =>
                    !connectors.some((c: any) => c.connector_type_id === t.id)
                ).length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    All available connectors are already assigned.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
