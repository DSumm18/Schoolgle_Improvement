"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, BookOpen, FileSearch, BarChart3 } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import { OfstedDashboard } from "@/components/ofsted";
import { OfstedFrameworkView } from "@/components/ofsted";
import { OfstedEvidenceMatcher } from "@/components/ofsted";
import { OfstedReadinessReport } from "@/components/ofsted";
import { FrameworkAssessment } from "@/components/framework/types";
import { ModulePageHeader } from "@/components/ui/module-page-header";

type Tab = "overview" | "framework" | "evidence" | "readiness";

export default function OfstedReadinessPage() {
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [assessments, setAssessments] = useState<FrameworkAssessment>({});

  const organizationId = organization?.id || "";

  // Fetch assessments when organization changes
  const fetchAssessments = useCallback(async () => {
    if (!organizationId) return;

    try {
      const { data, error } = await supabase
        .from("ofsted_assessments")
        .select("*")
        .eq("organization_id", organizationId);

      if (error) {
        console.error("Supabase error:", error);
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
    }
  }, [organizationId]);

  // Fetch on mount and when switching to framework tab
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
    }
  };

  const tabs = [
    { id: "overview" as Tab, label: "Overview", icon: Shield },
    { id: "framework" as Tab, label: "Framework", icon: BookOpen },
    { id: "evidence" as Tab, label: "Evidence", icon: FileSearch },
    { id: "readiness" as Tab, label: "Readiness Report", icon: BarChart3 },
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

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === tab.id
                ? "text-sky-600 dark:text-sky-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeOfstedTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "overview" && (
          <OfstedDashboard organizationId={organizationId} />
        )}
        {activeTab === "framework" && (
          <OfstedFrameworkView
            assessments={assessments}
            setAssessments={handleUpdateAssessments}
          />
        )}
        {activeTab === "evidence" && (
          <OfstedEvidenceMatcher organizationId={organizationId} />
        )}
        {activeTab === "readiness" && (
          <OfstedReadinessReport organizationId={organizationId} />
        )}
      </motion.div>
    </div>
  );
}
