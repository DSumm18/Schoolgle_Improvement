"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSWR from "swr";
import {
  Shield, Users, AlertTriangle, CheckCircle2, Plus,
  Search, Filter, ChevronRight, Settings, UserMinus
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";
import { ComplianceOverview } from "@/components/connectors/ComplianceOverview";
import { ConnectorBadge } from "@/components/connectors/ConnectorBadge";
import { LeavingImpactReport } from "@/components/connectors/LeavingImpactReport";

type TabId = "compliance" | "all" | "impact";

export default function ConnectorsPage() {
  const { user, organization } = useAuth();
  const organizationId = organization?.id || "";
  const userRole = organization?.role;
  const canManage = userRole === "admin" || userRole === "slt" || userRole === "headteacher";

  const [activeTab, setActiveTab] = useState<TabId>("compliance");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Data fetching
  const { data: complianceData, isLoading: compLoading } = useSWR(
    organizationId ? "/api/connectors/compliance" : null,
    fetcher
  );

  const { data: allConnectors = [], isLoading: connLoading } = useSWR(
    organizationId && activeTab === "all"
      ? `/api/connectors?status=active`
      : null,
    fetcher
  );

  const { data: staff = [] } = useSWR(
    organizationId && activeTab === "impact" ? "/api/staff" : null,
    fetcher
  );

  const tabs = [
    { id: "compliance" as const, label: "Compliance", icon: Shield },
    { id: "all" as const, label: "All Connectors", icon: Users },
    { id: "impact" as const, label: "Impact Analysis", icon: UserMinus },
  ];

  // Filter connectors
  const filteredConnectors = allConnectors.filter((c: any) => {
    const matchesSearch =
      !searchQuery ||
      c.connector_type?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.staff?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || c.connector_type?.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group filtered connectors by staff
  const byStaff = filteredConnectors.reduce((acc: any, c: any) => {
    const sid = c.staff_id;
    if (!acc[sid]) {
      acc[sid] = {
        staff: c.staff,
        connectors: [],
      };
    }
    acc[sid].connectors.push(c);
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Staff Connectors
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Statutory roles, responsibilities, training compliance, and change management
          </p>
        </div>
      </motion.div>

      {/* Tab Bar */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border w-fit"
      >
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
              {tab.id === "compliance" && complianceData?.summary?.non_compliant > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {complianceData.summary.non_compliant}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "compliance" && (
          <motion.div
            key="compliance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {compLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="grid grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted rounded-xl" />
                  ))}
                </div>
                <div className="h-48 bg-muted rounded-2xl" />
              </div>
            ) : complianceData ? (
              <ComplianceOverview
                summary={complianceData.summary}
                compliance={complianceData.compliance}
              />
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No compliance data available yet.</p>
                <p className="text-sm mt-1">
                  Assign connectors to staff members to start tracking compliance.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "all" && (
          <motion.div
            key="all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Search & Filter Bar */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or connector type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Categories</option>
                <option value="safeguarding">Safeguarding</option>
                <option value="send">SEND</option>
                <option value="health_safety">Health & Safety</option>
                <option value="data_governance">Data & Governance</option>
                <option value="curriculum">Curriculum</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {/* Connectors grouped by staff */}
            {connLoading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-2xl" />
                ))}
              </div>
            ) : Object.keys(byStaff).length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No connectors assigned yet.</p>
                <p className="text-sm mt-1">
                  Go to a staff member's profile to assign connectors.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.values(byStaff).map((group: any, idx: number) => (
                  <motion.div
                    key={group.staff?.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-card border border-border rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                        {group.staff?.first_name?.[0]}
                        {group.staff?.last_name?.[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {group.staff?.display_name || "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {group.staff?.job_title}
                        </div>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {group.connectors.length} connector{group.connectors.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.connectors.map((c: any, ci: number) => (
                        <ConnectorBadge
                          key={c.id}
                          name={c.connector_type?.name || "Unknown"}
                          category={c.connector_type?.category || "custom"}
                          icon={c.connector_type?.icon}
                          color={c.connector_type?.color}
                          isPrimary={c.is_primary}
                          isStatutory={c.connector_type?.is_statutory}
                          scope={c.scope}
                          trainingExpiry={c.training_expiry_date}
                          size="sm"
                          delay={ci * 0.03}
                        />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "impact" && (
          <motion.div
            key="impact"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {!selectedStaffId ? (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <UserMinus className="w-5 h-5 text-red-500" />
                  Select a Staff Member
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a staff member to see the impact of them leaving — which connectors
                  need reassigning, how many tasks are affected, and suggested replacements.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {staff
                    .filter((s: any) => s.is_active)
                    .map((s: any) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStaffId(s.id)}
                        className="text-left p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                          {s.first_name?.[0]}{s.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{s.display_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{s.job_title}</div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto flex-shrink-0" />
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedStaffId(null)}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  ← Back to staff list
                </button>
                <LeavingImpactReport
                  staffId={selectedStaffId}
                  organizationId={organizationId}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
