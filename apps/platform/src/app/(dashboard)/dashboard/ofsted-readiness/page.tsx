"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  BookOpen,
  FileSearch,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Globe,
  ClipboardCheck,
} from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { OfstedOverviewDashboard } from "@/components/ofsted";
import { OfstedFrameworkView } from "@/components/ofsted";
import { OfstedEvidenceMatcher } from "@/components/ofsted";
import { OfstedTrackView } from "@/components/ofsted";
import { OfstedIntelligenceBrief } from "@/components/ofsted";
import SafeguardingPanel from "@/components/ofsted/SafeguardingPanel";
import WebsiteComplianceTab from "@/components/ofsted/WebsiteComplianceTab";
import OfstedFindingsPanel from "@/components/ofsted/OfstedFindingsPanel";
import DocumentPresenceChecker from "@/components/ofsted/DocumentPresenceChecker";
import DriveConnectionPanel from "@/components/ofsted/DriveConnectionPanel";
import EvidenceChecklist from "@/components/ofsted/EvidenceChecklist";
import { FrameworkAssessment } from "@/components/framework/types";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { useGoogleDriveAccess } from "@/hooks/useGoogleDriveAccess";
import AppConnectionStatusCard from "@/components/connectors/AppConnectionStatusCard";

type Tab =
  | "overview"
  | "framework"
  | "track"
  | "actions"
  | "evidence"
  | "website"
  | "safeguarding";

export default function OfstedReadinessPage() {
  const { organization, organizationId: activeOrganizationId } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [assessments, setAssessments] = useState<FrameworkAssessment>({});
  const [loading, setLoading] = useState(false);

  const organizationId = activeOrganizationId || organization?.id || "";

  // Fetch assessments when organization changes
  const fetchAssessments = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ofsted_assessments")
        .select("*")
        .eq("organization_id", organizationId);

      if (error) {
        console.error("Supabase error:", error);
        toast.error("Failed to load Ofsted assessments");
      }

      if (data) {
        const assessmentMap: FrameworkAssessment = {};
        data.forEach((item) => {
          assessmentMap[item.subcategory_id] = {
            schoolRating: item.school_rating,
            schoolRationale: item.school_rationale,
            aiRating: item.ai_rating,
            aiRationale: item.ai_rationale,
            evidence_count: item.evidence_count || 0,
            lastUpdated: item.updated_at,
          };
        });

        setAssessments(assessmentMap);
      }
    } catch (err) {
      console.error("Error fetching assessments:", err);
      toast.error("Failed to load Ofsted assessments");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Fetch on mount and when switching tabs
  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments, activeTab]);

  const handleUpdateAssessments = async (
    newAssessments: FrameworkAssessment,
  ) => {
    setAssessments(newAssessments);

    if (!organizationId) return;

    try {
      const entries = Object.entries(newAssessments);
      for (const [subId, data] of entries) {
        await supabase.from("ofsted_assessments").upsert(
          {
            organization_id: organizationId,
            subcategory_id: subId,
            school_rating: data.schoolRating,
            school_rationale: data.schoolRationale,
            ai_rating: data.aiRating,
            ai_rationale: data.aiRationale,
            evidence_count: data.evidence_count,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "organization_id,subcategory_id",
          },
        );
      }
    } catch (err) {
      console.error("Error saving assessments:", err);
      toast.error("Failed to save assessments");
    }
  };

  const driveAccess = useGoogleDriveAccess();

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: BarChart3 },
    { id: "framework" as Tab, label: "Evaluate", icon: BookOpen },
    { id: "track" as Tab, label: "Track", icon: TrendingUp },
    { id: "actions" as Tab, label: "Actions", icon: ClipboardCheck },
    { id: "evidence" as Tab, label: "Evidence", icon: FileSearch },
    { id: "website" as Tab, label: "Website", icon: Globe },
    { id: "safeguarding" as Tab, label: "Safeguarding", icon: ShieldCheck },
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="improvement"
        icon={Shield}
        label="Education Inspection Framework"
        title="Ofsted Readiness"
        badge="EIF 2025"
      />

      <AppConnectionStatusCard
        appKey="ofsted-readiness"
        title="Ofsted evidence source"
        compact
      />

      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Ofsted readiness sections"
        className="flex items-center gap-1 bg-muted/60 dark:bg-slate-800/60 backdrop-blur-sm p-1 rounded-xl w-fit border border-border/50"
        onKeyDown={(e) => {
          const tabIds = tabs.map((t) => t.id);
          const currentIndex = tabIds.indexOf(activeTab);
          let nextIndex = currentIndex;
          if (e.key === "ArrowRight") {
            nextIndex = (currentIndex + 1) % tabIds.length;
            e.preventDefault();
          } else if (e.key === "ArrowLeft") {
            nextIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
            e.preventDefault();
          } else if (e.key === "Home") {
            nextIndex = 0;
            e.preventDefault();
          } else if (e.key === "End") {
            nextIndex = tabIds.length - 1;
            e.preventDefault();
          }
          if (nextIndex !== currentIndex) {
            setActiveTab(tabIds[nextIndex]);
            const tabEl = document.getElementById(
              `tab-ofsted-${tabIds[nextIndex]}`,
            );
            tabEl?.focus();
          }
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-ofsted-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-ofsted-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors duration-200 ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-card dark:bg-slate-900 rounded-lg shadow-sm border border-border/50"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.icon && (
                  <tab.icon className="w-4 h-4" aria-hidden="true" />
                )}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            role="tabpanel"
            id={`tabpanel-ofsted-${activeTab}`}
            aria-labelledby={`tab-ofsted-${activeTab}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === "overview" && (
              <div className="space-y-6">
                <DriveConnectionPanel
                  organizationId={organizationId}
                  onScanComplete={fetchAssessments}
                />
                <OfstedIntelligenceBrief organizationId={organizationId} />
                <OfstedFindingsPanel
                  compact
                  organizationId={organizationId}
                />
                <EvidenceChecklist organizationId={organizationId} />
                <OfstedOverviewDashboard
                  organizationId={organizationId}
                  assessments={assessments}
                />
              </div>
            )}
            {activeTab === "framework" && (
              <OfstedFrameworkView
                assessments={assessments}
                setAssessments={handleUpdateAssessments}
              />
            )}
            {activeTab === "track" && (
              <OfstedTrackView organizationId={organizationId} />
            )}
            {activeTab === "actions" && (
              <OfstedFindingsPanel organizationId={organizationId} />
            )}
            {activeTab === "evidence" && (
              <div className="space-y-6">
                <DocumentPresenceChecker
                  organizationId={organizationId}
                  accessToken={driveAccess.accessToken}
                  provider={driveAccess.isConnected ? "google" : ""}
                />
                <OfstedEvidenceMatcher organizationId={organizationId} />
              </div>
            )}
            {activeTab === "website" && (
              <WebsiteComplianceTab organizationId={organizationId} />
            )}
            {activeTab === "safeguarding" && (
              <SafeguardingPanel organizationId={organizationId} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
