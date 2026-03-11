"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
  Sparkles,
  FileText,
  Download,
  History,
  RefreshCw,
  CheckCircle,
  Eye,
  BookOpen,
  Users,
  TrendingUp,
  Shield,
  ChevronRight,
  Brain,
  Zap,
  Target,
  BarChart3,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  GraduationCap,
  Heart,
  Scale,
  UserCheck,
  Layers,
  Flag,
  CircleDot,
  Activity,
  Link2,
  CalendarDays,
  Loader2,
} from "lucide-react";
import ErrorBoundary from "@/components/common/ErrorBoundary";

// --- Types aligned with Living SEF engine ---

interface LivingSEFSection {
  id: string;
  categoryName: string;
  grade: string;
  score: number;
  narrative: string;
  strengths: string[];
  areasForDevelopment: string[];
  evidenceSources: string[];
  linkedActions: {
    id: string;
    title: string;
    status: string;
    priority: string;
  }[];
  dataPoints: { label: string; value: string; benchmark?: string }[];
  impactStatement: string;
  nextSteps: string[];
  lastUpdated: string;
  changesSinceLastVersion: string[];
  crossModuleLinks: {
    module: string;
    description: string;
    status: string;
  }[];
}

interface SDPPriority {
  id: string;
  priority_number: number;
  title: string;
  rationale: string;
  ofsted_category_id: string;
  lead_person: string;
  budget: number;
  funding_source: string;
  success_criteria: string[];
  milestones: {
    title: string;
    targetDate: string;
    status: string;
    evidenceRequired: string;
  }[];
  linked_action_ids: string[];
  eef_strategies: string[];
  cross_module_impact: {
    module: string;
    impact: string;
    budgetImplication: number;
  }[];
  review_date: string;
  progress_percentage: number;
}

// --- Area configuration ---

const AREA_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    color: string;
    gradient: string;
    bg: string;
    border: string;
    text: string;
    dot: string;
    label: string;
    legislationRef: string;
  }
> = {
  inclusion: {
    icon: Heart,
    color: "teal",
    gradient: "from-teal-500 to-emerald-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
    text: "text-teal-700",
    dot: "bg-teal-500",
    label: "Inclusion",
    legislationRef: "EIF 2025 \u00a7 Inclusion",
  },
  "curriculum-teaching": {
    icon: BookOpen,
    color: "rose",
    gradient: "from-rose-500 to-pink-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
    label: "Curriculum & Teaching",
    legislationRef: "EIF 2025 \u00a7 Curriculum and Teaching",
  },
  achievement: {
    icon: GraduationCap,
    color: "amber",
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
    label: "Achievement",
    legislationRef: "EIF 2025 \u00a7 Achievement",
  },
  "attendance-behaviour": {
    icon: UserCheck,
    color: "blue",
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
    label: "Attendance & Behaviour",
    legislationRef: "EIF 2025 \u00a7 Attendance and Behaviour",
  },
  "personal-development": {
    icon: TrendingUp,
    color: "orange",
    gradient: "from-orange-500 to-red-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    dot: "bg-orange-500",
    label: "Personal Development",
    legislationRef: "EIF 2025 \u00a7 Personal Development and Well-being",
  },
  "leadership-governance": {
    icon: Scale,
    color: "violet",
    gradient: "from-violet-500 to-purple-600",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    dot: "bg-violet-500",
    label: "Leadership & Governance",
    legislationRef: "EIF 2025 \u00a7 Leadership and Governance",
  },
};

const GRADE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  exceptional: {
    label: "Exceptional",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  strong_standard: {
    label: "Strong Standard",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-600",
  },
  expected_standard: {
    label: "Expected Standard",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  needs_attention: {
    label: "Needs Attention",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  urgent_improvement: {
    label: "Urgent Improvement",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  not_assessed: {
    label: "Not Assessed",
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

const AREA_ORDER = [
  "inclusion",
  "curriculum-teaching",
  "achievement",
  "attendance-behaviour",
  "personal-development",
  "leadership-governance",
];

// --- Main Page Component ---

export default function LivingSEFPage() {
  const { organization } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const validTabs = ["report-card", "sections", "sdp", "history"] as const;
  const [activeTab, setActiveTab] = useState<
    "report-card" | "sections" | "sdp" | "history"
  >(
    validTabs.includes(initialTab as (typeof validTabs)[number])
      ? (initialTab as (typeof validTabs)[number])
      : "report-card",
  );
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sefDoc, setSefDoc] = useState<any>(null);
  const [sections, setSections] = useState<LivingSEFSection[]>([]);
  const [sdpPriorities, setSdpPriorities] = useState<SDPPriority[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState("");
  const [crossModuleStats, setCrossModuleStats] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [editingNarrative, setEditingNarrative] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [narrativeSaveStatus, setNarrativeSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced save: persists updated sections to the database via the API
  const saveNarrativeToDb = useCallback(
    async (updatedSections: LivingSEFSection[]) => {
      if (!sefDoc?.id) return;
      setNarrativeSaveStatus("saving");
      try {
        const res = await fetch(`/api/sef/${sefDoc.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sections: updatedSections }),
        });
        if (!res.ok) throw new Error("Save failed");
        setNarrativeSaveStatus("saved");
        // Reset to idle after 2 seconds
        setTimeout(() => setNarrativeSaveStatus("idle"), 2000);
      } catch {
        setNarrativeSaveStatus("error");
        setTimeout(() => setNarrativeSaveStatus("idle"), 4000);
      }
    },
    [sefDoc?.id],
  );

  const fetchLatest = useCallback(async () => {
    if (!organization?.id) return;
    setIsLoading(true);

    try {
      const { data } = await supabase
        .from("sef_documents")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setSefDoc(data);
        setSections(data.sections || []);

        // Fetch SDP priorities
        const { data: sdp } = await supabase
          .from("sdp_priorities")
          .select("*")
          .eq("sef_document_id", data.id)
          .order("priority_number", { ascending: true });

        setSdpPriorities(sdp || []);
      }
    } finally {
      setIsLoading(false);
    }
  }, [organization?.id]);

  const fetchVersions = useCallback(async () => {
    if (!organization?.id) return;

    const { data } = await supabase
      .from("sef_documents")
      .select(
        "id, title, academic_year, created_at, overall_grade, overall_score, version, status",
      )
      .eq("organization_id", organization.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setVersions(data || []);
  }, [organization?.id]);

  useEffect(() => {
    fetchLatest();
    fetchVersions();
  }, [fetchLatest, fetchVersions]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateProgress("Aggregating cross-module data...");

    try {
      const response = await fetch("/api/sef/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYear: "2025/26",
          generateSDP: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.sef) {
        setSefDoc({ ...result.sef, id: result.sef.id });
        setSections(result.sef.sections || []);
      }
      if (result.sdpPriorities) {
        setSdpPriorities(result.sdpPriorities);
      }
      if (result.crossModuleStats) {
        setCrossModuleStats(result.crossModuleStats);
      }

      setGenerateProgress("");
      fetchVersions();
    } catch (err: any) {
      console.error("Generation error:", err);
      setGenerateProgress(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!sefDoc?.id) return;
    if (
      !confirm(
        "Publish this SEF? It will be archived as a formal version and cannot be edited.",
      )
    )
      return;

    const { error } = await supabase
      .from("sef_documents")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", sefDoc.id);

    if (!error) {
      setSefDoc({ ...sefDoc, status: "published" });
      fetchVersions();
    }
  };

  const handleExport = () => {
    if (!sefDoc || sections.length === 0) return;
    const html = buildExportHTML(sefDoc, sections, sdpPriorities);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  const overallGrade = sefDoc?.overall_grade || "not_assessed";
  const overallScore = sefDoc?.overall_score || 0;
  const gradeConfig = GRADE_CONFIG[overallGrade] || GRADE_CONFIG.not_assessed;

  return (
    <ErrorBoundary name="LivingSEFPage">
      <div className="p-6 lg:p-8 max-w-[1800px] mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 text-sky-500 font-black text-[10px] uppercase tracking-[0.2em] mb-3 bg-sky-50 dark:bg-sky-950/40 w-fit px-4 py-1.5 rounded-full border border-sky-100 dark:border-sky-900/50">
              <Activity size={14} className="animate-pulse" />
              Living Document &middot; EIF November 2025
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              Self-Evaluation & School Development
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-2xl">
              Auto-generated from your evidence scans, assessments, actions,
              estates compliance, governance records, and DfE benchmarks.
              Aligned to the Ofsted Report Card framework (November 2025).
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Tab switcher */}
            <div
              role="tablist"
              aria-label="SEF and SDP sections"
              className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl flex border border-slate-200 dark:border-slate-700 shadow-inner"
              onKeyDown={(e) => {
                const tabIds = [
                  "report-card",
                  "sections",
                  "sdp",
                  "history",
                ] as const;
                const currentIndex = tabIds.indexOf(activeTab);
                let nextIndex = currentIndex;
                if (e.key === "ArrowRight") {
                  nextIndex = (currentIndex + 1) % tabIds.length;
                  e.preventDefault();
                } else if (e.key === "ArrowLeft") {
                  nextIndex =
                    (currentIndex - 1 + tabIds.length) % tabIds.length;
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
                    `tab-sef-${tabIds[nextIndex]}`,
                  );
                  tabEl?.focus();
                }
              }}
            >
              {(
                [
                  {
                    id: "report-card",
                    label: "Report Card",
                    icon: Layers,
                  },
                  { id: "sections", label: "Sections", icon: FileText },
                  { id: "sdp", label: "SDP", icon: Flag },
                  { id: "history", label: "History", icon: History },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-sef-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-sef-${tab.id}`}
                  aria-label={tab.label}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 lg:px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-slate-700 text-sky-600 shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <tab.icon size={13} aria-hidden="true" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-sky-500/25 transition-all active:scale-95 disabled:opacity-60"
            >
              {isGenerating ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Brain size={16} />
              )}
              {isGenerating ? "Generating..." : "Generate SEF"}
            </button>
          </div>
        </header>

        {/* Generation progress */}
        {isGenerating && generateProgress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 flex items-center gap-4"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />
              <Brain
                size={16}
                className="absolute inset-0 m-auto text-sky-600"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-sky-900 dark:text-sky-200">
                {generateProgress}
              </p>
              <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">
                Analysing assessments, evidence, actions, estates, governance,
                compliance, staff data & DfE benchmarks...
              </p>
            </div>
          </motion.div>
        )}

        {/* Cross-module stats bar */}
        {crossModuleStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              {
                label: "Assessments",
                value: crossModuleStats.assessments,
                icon: BarChart3,
              },
              {
                label: "Evidence Docs",
                value: crossModuleStats.evidence,
                icon: FileText,
              },
              {
                label: "Actions",
                value: crossModuleStats.actions,
                icon: Target,
              },
              {
                label: "DfE Data",
                value: crossModuleStats.hasDfEData ? "Linked" : "None",
                icon: GraduationCap,
              },
              {
                label: "Estates",
                value: `${crossModuleStats.estatesComplianceRate}%`,
                icon: Building2,
              },
              {
                label: "Policies",
                value: crossModuleStats.policiesCurrent,
                icon: Shield,
              },
              {
                label: "Staff",
                value: crossModuleStats.staffCount,
                icon: Users,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800 flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400">
                  <stat.icon size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            role="tabpanel"
            id={`tabpanel-sef-${activeTab}`}
            aria-labelledby={`tab-sef-${activeTab}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "report-card" && (
              <ReportCardView
                sections={sections}
                overallGrade={overallGrade}
                overallScore={overallScore}
                safeguardingMet={sefDoc?.safeguarding_met}
                executiveSummary={sefDoc?.executive_summary}
                version={sefDoc?.version}
                generatedAt={sefDoc?.created_at}
                status={sefDoc?.status}
                onPublish={handlePublish}
                onExport={handleExport}
                onSectionClick={(id) => {
                  setActiveSection(id);
                  setActiveTab("sections");
                }}
              />
            )}
            {activeTab === "sections" && (
              <SectionsView
                sections={sections}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                editingNarrative={editingNarrative}
                setEditingNarrative={setEditingNarrative}
                sefDoc={sefDoc}
                narrativeSaveStatus={narrativeSaveStatus}
                onNarrativeChange={(sectionId, narrative) => {
                  const updated = sections.map((s) =>
                    s.id === sectionId ? { ...s, narrative } : s,
                  );
                  setSections(updated);
                  // Debounce save: wait 1.5s after last keystroke
                  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                  saveTimerRef.current = setTimeout(() => {
                    saveNarrativeToDb(updated);
                  }, 1500);
                }}
              />
            )}
            {activeTab === "sdp" && (
              <SDPView
                priorities={sdpPriorities}
                sections={sections}
                sefDoc={sefDoc}
              />
            )}
            {activeTab === "history" && (
              <HistoryView
                versions={versions}
                currentId={sefDoc?.id}
                onLoadVersion={async (id: string) => {
                  const { data } = await supabase
                    .from("sef_documents")
                    .select("*")
                    .eq("id", id)
                    .single();
                  if (data) {
                    setSefDoc(data);
                    setSections(data.sections || []);
                  }
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Loading state */}
        {isLoading && !sefDoc && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-sky-500 mb-4" />
            <p className="text-sm font-bold text-slate-400">
              Loading SEF data...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !sefDoc && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 flex items-center justify-center">
                <Brain size={56} className="text-sky-500" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles size={20} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
              Generate Your Living SEF
            </h2>
            <p className="text-slate-500 max-w-lg mb-8 leading-relaxed">
              Schoolgle will aggregate data from <strong>8 modules</strong>{" "}
              across your platform &mdash; assessments, evidence scans, actions,
              DfE benchmarks, estates, governance, compliance, and staff records
              &mdash; to produce an evaluative Self-Evaluation Form aligned to
              the <strong>EIF November 2025</strong> report card framework.
            </p>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="group flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-sky-600 to-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:shadow-[0_20px_40px_rgba(14,165,233,0.3)] hover:scale-105 transition-all active:scale-95"
            >
              <Brain
                size={22}
                className="group-hover:rotate-12 transition-transform"
              />
              Generate Living SEF & SDP
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

// --- Report Card View (Ofsted-style at-a-glance) ---

function ReportCardView({
  sections,
  overallGrade,
  overallScore,
  safeguardingMet,
  executiveSummary,
  version,
  generatedAt,
  status,
  onPublish,
  onExport,
  onSectionClick,
}: {
  sections: LivingSEFSection[];
  overallGrade: string;
  overallScore: number;
  safeguardingMet: boolean | null;
  executiveSummary: string;
  version: number;
  generatedAt: string;
  status: string;
  onPublish: () => void;
  onExport: () => void;
  onSectionClick: (id: string) => void;
}) {
  if (sections.length === 0) return null;

  const gradeConfig = GRADE_CONFIG[overallGrade] || GRADE_CONFIG.not_assessed;

  return (
    <div className="space-y-8">
      {/* Report Card Header */}
      <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 lg:p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(14,165,233,0.15),transparent_70%)]" />
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-widest">
                  Self-Evaluation Report Card
                </div>
                <div className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-[10px] font-black uppercase tracking-widest">
                  EIF November 2025
                </div>
              </div>
              <h2 className="text-3xl font-black tracking-tight">
                Overall Self-Assessment
              </h2>
              <div className="flex items-center gap-4 mt-3">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${gradeConfig.bg} ${gradeConfig.border} border`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${gradeConfig.dot} shadow-lg`}
                  />
                  <span className={`text-sm font-black ${gradeConfig.color}`}>
                    {gradeConfig.label}
                  </span>
                </div>
                <span className="text-white/50 text-sm font-bold">
                  Score: {overallScore}%
                </span>
                {version && (
                  <span className="text-white/30 text-xs font-bold">
                    v{version} &middot;{" "}
                    {generatedAt
                      ? new Date(generatedAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {status !== "published" && (
                <button
                  onClick={onPublish}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  <CheckCircle size={16} />
                  Publish
                </button>
              )}
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10"
              >
                <Download size={16} />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Safeguarding Banner */}
        <div
          className={`px-8 lg:px-10 py-4 flex items-center justify-between border-b ${
            safeguardingMet === true
              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100"
              : safeguardingMet === false
                ? "bg-red-50 dark:bg-red-900/20 border-red-100"
                : "bg-slate-50 dark:bg-slate-800/50 border-slate-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <Shield
              size={20}
              className={
                safeguardingMet === true
                  ? "text-emerald-600"
                  : safeguardingMet === false
                    ? "text-red-600"
                    : "text-slate-400"
              }
            />
            <span className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Safeguarding
            </span>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
              safeguardingMet === true
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : safeguardingMet === false
                  ? "bg-red-100 text-red-700 border border-red-200"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}
          >
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                safeguardingMet === true
                  ? "bg-emerald-500"
                  : safeguardingMet === false
                    ? "bg-red-500"
                    : "bg-slate-400"
              }`}
            />
            {safeguardingMet === true
              ? "Met"
              : safeguardingMet === false
                ? "Not Met"
                : "Not Assessed"}
          </div>
        </div>

        {/* Report Card Grid */}
        <div className="p-8 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AREA_ORDER.map((areaId) => {
              const section = sections.find((s) => s.id === areaId);
              const config = AREA_CONFIG[areaId];
              const grade = section?.grade || "not_assessed";
              const gc = GRADE_CONFIG[grade] || GRADE_CONFIG.not_assessed;

              return (
                <motion.button
                  key={areaId}
                  onClick={() => onSectionClick(areaId)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative text-left p-5 rounded-2xl border ${gc.border} ${gc.bg} dark:bg-opacity-20 hover:shadow-lg transition-all group overflow-hidden`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border ${gc.border}`}
                      >
                        <config.icon size={18} className={gc.color} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {config.label}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {config.legislationRef}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-300 group-hover:text-slate-500 transition-colors mt-1"
                    />
                  </div>

                  {/* Grade dot + label */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-3 h-3 rounded-full ${gc.dot} shadow-sm`}
                    />
                    <span className={`text-xs font-black ${gc.color}`}>
                      {gc.label}
                    </span>
                    {section && (
                      <span className="text-[10px] text-slate-400 font-bold ml-auto">
                        {section.score}%
                      </span>
                    )}
                  </div>

                  {/* Mini stats */}
                  {section && (
                    <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle size={10} className="text-emerald-500" />
                        {section.strengths.length} strengths
                      </span>
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={10} className="text-amber-500" />
                        {section.areasForDevelopment.length} AFDs
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={10} className="text-blue-500" />
                        {section.evidenceSources.length} docs
                      </span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {executiveSummary && (
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Zap size={18} className="text-sky-500" />
            Executive Summary
          </h3>
          <pre className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
            {executiveSummary}
          </pre>
        </div>
      )}
    </div>
  );
}

// --- Sections Detail View ---

function SectionsView({
  sections,
  activeSection,
  setActiveSection,
  editingNarrative,
  setEditingNarrative,
  sefDoc,
  narrativeSaveStatus,
  onNarrativeChange,
}: {
  sections: LivingSEFSection[];
  activeSection: string | null;
  setActiveSection: (id: string | null) => void;
  editingNarrative: string | null;
  setEditingNarrative: (id: string | null) => void;
  sefDoc: any;
  narrativeSaveStatus: "idle" | "saving" | "saved" | "error";
  onNarrativeChange: (sectionId: string, narrative: string) => void;
}) {
  if (sections.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <FileText size={48} className="mx-auto mb-4 opacity-30" />
        <p className="font-bold">
          No sections generated yet. Click &ldquo;Generate SEF&rdquo; to begin.
        </p>
      </div>
    );
  }

  const selected = activeSection
    ? sections.find((s) => s.id === activeSection)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Section nav */}
      <div className="lg:col-span-3 space-y-3">
        {AREA_ORDER.map((areaId) => {
          const section = sections.find((s) => s.id === areaId);
          const config = AREA_CONFIG[areaId];
          const grade = section?.grade || "not_assessed";
          const gc = GRADE_CONFIG[grade] || GRADE_CONFIG.not_assessed;

          return (
            <button
              key={areaId}
              onClick={() => setActiveSection(areaId)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left ${
                activeSection === areaId
                  ? `${gc.bg} ${gc.border} border shadow-md`
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm`}
              >
                <config.icon
                  size={18}
                  className={
                    activeSection === areaId ? gc.color : "text-slate-400"
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {config.label}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${gc.dot}`} />
                  <span className={`text-[10px] font-bold ${gc.color}`}>
                    {gc.label}
                  </span>
                </div>
              </div>
              {section && (
                <span className="text-xs font-black text-slate-400">
                  {section.score}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Section detail */}
      <div className="lg:col-span-9">
        {selected ? (
          <SectionDetail
            section={selected}
            editing={editingNarrative === selected.id}
            onToggleEdit={() =>
              setEditingNarrative(
                editingNarrative === selected.id ? null : selected.id,
              )
            }
            isPublished={sefDoc?.status === "published"}
            narrativeSaveStatus={narrativeSaveStatus}
            onNarrativeChange={(narrative) =>
              onNarrativeChange(selected.id, narrative)
            }
          />
        ) : (
          <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <Layers size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-sm font-bold text-slate-400">
              Select a section to view the full evaluative narrative, evidence,
              actions, and data points.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Individual Section Detail ---

function SectionDetail({
  section,
  editing,
  onToggleEdit,
  isPublished,
  narrativeSaveStatus,
  onNarrativeChange,
}: {
  section: LivingSEFSection;
  editing: boolean;
  onToggleEdit: () => void;
  isPublished: boolean;
  narrativeSaveStatus: "idle" | "saving" | "saved" | "error";
  onNarrativeChange: (narrative: string) => void;
}) {
  const config = AREA_CONFIG[section.id] || AREA_CONFIG.inclusion;
  const gc = GRADE_CONFIG[section.grade] || GRADE_CONFIG.not_assessed;

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div
          className={`bg-gradient-to-r ${config.gradient} p-6 text-white relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/15 backdrop-blur-md">
                <config.icon size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">
                  {section.categoryName}
                </h2>
                <p className="text-white/70 text-xs font-bold mt-1">
                  {config.legislationRef}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20`}
              >
                <div className={`w-3 h-3 rounded-full ${gc.dot}`} />
                <span className="text-sm font-black">{gc.label}</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black">{section.score}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data points bar */}
        {section.dataPoints.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-6">
            {section.dataPoints.map((dp, i) => (
              <div key={i} className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {dp.label}
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {dp.value}
                </span>
                {dp.benchmark && (
                  <span className="text-[10px] font-bold text-slate-400">
                    ({dp.benchmark})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Narrative */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Brain size={14} className="text-purple-500" />
              AI-Generated Evaluative Narrative
            </h3>
            <div className="flex items-center gap-3">
              {editing && narrativeSaveStatus === "saving" && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-sky-500">
                  <Loader2 size={12} className="animate-spin" />
                  Saving...
                </span>
              )}
              {editing && narrativeSaveStatus === "saved" && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                  <CheckCircle size={12} />
                  Saved
                </span>
              )}
              {editing && narrativeSaveStatus === "error" && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-600">
                  <AlertTriangle size={12} />
                  Save failed
                </span>
              )}
              {!isPublished && (
                <button
                  onClick={onToggleEdit}
                  className="text-[10px] font-black text-sky-600 uppercase tracking-widest hover:text-sky-700 transition-colors"
                >
                  {editing ? "Done" : "Edit"}
                </button>
              )}
            </div>
          </div>
          {editing ? (
            <textarea
              value={section.narrative}
              onChange={(e) => onNarrativeChange(e.target.value)}
              rows={12}
              className="w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 dark:text-slate-200"
            />
          ) : (
            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
              {section.narrative.split("\n\n").map((para, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                >
                  {para}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Strengths + AFDs + Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-6">
          <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <CheckCircle size={14} />
            Key Strengths ({section.strengths.length})
          </h4>
          <div className="space-y-2">
            {section.strengths.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  {s}
                </span>
              </div>
            ))}
            {section.strengths.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                No strengths identified yet.
              </p>
            )}
          </div>
        </div>

        {/* AFDs */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-amber-100 dark:border-amber-900/30 p-6">
          <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertTriangle size={14} />
            Areas for Development ({section.areasForDevelopment.length})
          </h4>
          <div className="space-y-2">
            {section.areasForDevelopment.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100/50 dark:border-amber-800/30"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span className="text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
                  {a}
                </span>
              </div>
            ))}
            {section.areasForDevelopment.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                No areas for development identified.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Impact + Next Steps */}
      {section.impactStatement && (
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/30 p-6">
          <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Zap size={14} />
            Impact Statement
          </h4>
          <p className="text-sm text-purple-800 dark:text-purple-300 leading-relaxed font-medium">
            {section.impactStatement}
          </p>
        </div>
      )}

      {/* Next Steps */}
      {section.nextSteps.length > 0 && (
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-sky-100 dark:border-sky-900/30 p-6">
          <h4 className="text-xs font-black text-sky-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <ArrowUpRight size={14} />
            Next Steps
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {section.nextSteps.map((ns, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-sky-50/50 dark:bg-sky-900/10 rounded-xl border border-sky-100/50 dark:border-sky-800/30"
              >
                <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-800 flex items-center justify-center text-[10px] font-black text-sky-600 shrink-0">
                  {i + 1}
                </span>
                <span className="text-xs font-medium text-sky-800 dark:text-sky-300 leading-relaxed">
                  {ns}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom row: Evidence, Actions, Cross-module */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Evidence sources */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FileText size={14} className="text-blue-500" />
            Evidence Sources ({section.evidenceSources.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {section.evidenceSources.map((ev, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-400"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="truncate">{ev}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Linked actions */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Target size={14} className="text-purple-500" />
            Linked Actions ({section.linkedActions.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {section.linkedActions.map((action, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
              >
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate flex-1">
                  {action.title}
                </span>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    action.status === "complete"
                      ? "bg-emerald-100 text-emerald-700"
                      : action.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {action.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-module links */}
        <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Link2 size={14} className="text-violet-500" />
            Cross-Module Links
          </h4>
          <div className="space-y-2">
            {section.crossModuleLinks.map((link, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
              >
                <div>
                  <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">
                    {link.module}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {link.description}
                  </span>
                </div>
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    link.status === "good"
                      ? "bg-emerald-500"
                      : link.status === "attention"
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                />
              </div>
            ))}
            {section.crossModuleLinks.length === 0 && (
              <p className="text-xs text-slate-400 italic">
                No cross-module data linked.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Changes since last version */}
      {section.changesSinceLastVersion.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 flex items-start gap-3">
          <Clock size={14} className="text-slate-400 mt-0.5 shrink-0" />
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Changes since last version
            </span>
            <ul className="mt-1 space-y-0.5">
              {section.changesSinceLastVersion.map((ch, i) => (
                <li
                  key={i}
                  className="text-xs text-slate-500 dark:text-slate-400 font-medium"
                >
                  {ch}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SDP View ---

function SDPView({
  priorities,
  sections,
  sefDoc,
}: {
  priorities: SDPPriority[];
  sections: LivingSEFSection[];
  sefDoc: any;
}) {
  if (priorities.length === 0) {
    return (
      <div className="text-center py-20">
        <Flag size={48} className="mx-auto mb-4 text-slate-300" />
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
          No Development Priorities Yet
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          SDP priorities are auto-generated from your SEF areas rated
          &ldquo;Needs Attention&rdquo; or &ldquo;Urgent Improvement.&rdquo;
          Generate a Living SEF first.
        </p>
      </div>
    );
  }

  const totalBudget = priorities.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalMilestones = priorities.reduce(
    (sum, p) => sum + (p.milestones?.length || 0),
    0,
  );
  const avgProgress = Math.round(
    priorities.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) /
      priorities.length,
  );

  return (
    <div className="space-y-8">
      {/* SDP Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-sky-600 to-blue-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent)] " />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">
              Total Budget
            </p>
            <p className="text-3xl font-black">
              &pound;{totalBudget.toLocaleString()}
            </p>
          </div>
        </div>
        {[
          {
            label: "Priorities",
            value: priorities.length,
            icon: Flag,
            color: "text-violet-600",
          },
          {
            label: "Milestones",
            value: totalMilestones,
            icon: Target,
            color: "text-amber-600",
          },
          {
            label: "Avg Progress",
            value: `${avgProgress}%`,
            icon: TrendingUp,
            color: "text-emerald-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <stat.icon size={20} className={stat.color} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Priority cards */}
      <div className="space-y-6">
        {priorities.map((priority) => {
          const linkedSection = sections.find(
            (s) => s.id === priority.ofsted_category_id,
          );
          const areaConfig =
            AREA_CONFIG[priority.ofsted_category_id] || AREA_CONFIG.inclusion;

          return (
            <div
              key={priority.id}
              className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm"
            >
              {/* Priority header */}
              <div className="flex items-center gap-4 p-6 border-b border-slate-100 dark:border-slate-800">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${areaConfig.gradient} flex items-center justify-center text-white font-black text-lg`}
                >
                  {priority.priority_number}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {priority.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {priority.rationale}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    &pound;{(priority.budget || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {priority.funding_source || "School Budget"}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Progress
                  </span>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                    {priority.progress_percentage}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${priority.progress_percentage}%`,
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full bg-gradient-to-r ${areaConfig.gradient}`}
                  />
                </div>
              </div>

              {/* Milestones + Details */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Milestones */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <CalendarDays size={12} />
                    Milestones ({priority.milestones?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {(priority.milestones || []).map((ms, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl"
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            ms.status === "completed"
                              ? "bg-emerald-100 text-emerald-600"
                              : ms.status === "in_progress"
                                ? "bg-blue-100 text-blue-600"
                                : ms.status === "delayed"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {ms.status === "completed" ? (
                            <CheckCircle size={12} />
                          ) : (
                            <CircleDot size={12} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {ms.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Target:{" "}
                            {new Date(ms.targetDate).toLocaleDateString(
                              "en-GB",
                              { month: "short", year: "numeric" },
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Success Criteria + EEF */}
                <div className="space-y-4">
                  {priority.success_criteria &&
                    priority.success_criteria.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Target size={12} />
                          Success Criteria
                        </h4>
                        <div className="space-y-1.5">
                          {priority.success_criteria.map((sc, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400"
                            >
                              <CheckCircle
                                size={12}
                                className="text-emerald-400 mt-0.5 shrink-0"
                              />
                              <span>{sc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {priority.eef_strategies &&
                    priority.eef_strategies.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Brain size={12} />
                          EEF Research Strategies
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {priority.eef_strategies.map((strat, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold border border-purple-100 dark:border-purple-800/30"
                            >
                              {strat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  {priority.cross_module_impact &&
                    priority.cross_module_impact.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Link2 size={12} />
                          Cross-Module Impact
                        </h4>
                        <div className="space-y-1.5">
                          {priority.cross_module_impact.map((imp, i) => (
                            <div
                              key={i}
                              className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"
                            >
                              <span className="font-black text-slate-500 shrink-0">
                                {imp.module}:
                              </span>
                              <span>{imp.impact}</span>
                            </div>
                          ))}
                        </div>
                      </div>
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

// --- History View ---

function HistoryView({
  versions,
  currentId,
  onLoadVersion,
}: {
  versions: any[];
  currentId: string;
  onLoadVersion: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
        Version History
      </h2>
      {versions.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <History size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-bold">No versions yet.</p>
        </div>
      ) : (
        versions.map((v) => {
          const gc = GRADE_CONFIG[v.overall_grade] || GRADE_CONFIG.not_assessed;
          const isCurrent = v.id === currentId;

          return (
            <motion.div
              key={v.id}
              whileHover={{ scale: 1.005 }}
              className={`bg-white dark:bg-slate-900/50 rounded-2xl border p-6 flex items-center justify-between transition-all cursor-pointer ${
                isCurrent
                  ? "border-sky-200 dark:border-sky-800 shadow-md bg-sky-50/50 dark:bg-sky-900/10"
                  : "border-slate-200 dark:border-slate-800 hover:shadow-lg"
              }`}
              onClick={() => onLoadVersion(v.id)}
            >
              <div className="flex items-center gap-5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    v.status === "published"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {v.status === "published" ? (
                    <CheckCircle size={24} />
                  ) : (
                    <FileText size={24} />
                  )}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm">
                    {v.title || `SEF v${v.version}`}
                  </h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <CalendarDays size={10} />
                      {new Date(v.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <div
                      className={`flex items-center gap-1.5 text-[10px] font-black ${gc.color}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${gc.dot}`} />
                      {gc.label}
                    </div>
                    {v.overall_score > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {v.overall_score}%
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        v.status === "published"
                          ? "bg-emerald-100 text-emerald-700"
                          : v.status === "archived"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-sky-100 text-sky-700"
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                </div>
              </div>
              {isCurrent && (
                <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">
                  Current
                </span>
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
}

// --- HTML escaping utility ---

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// --- PDF Export ---

function buildExportHTML(
  sefDoc: any,
  sections: LivingSEFSection[],
  priorities: SDPPriority[],
): string {
  const gradeLabel = (g: string) =>
    GRADE_CONFIG[g]?.label || g.replace("_", " ");
  const dotColor = (g: string) => {
    const map: Record<string, string> = {
      exceptional: "#3b82f6",
      strong_standard: "#059669",
      expected_standard: "#22c55e",
      needs_attention: "#f97316",
      urgent_improvement: "#ef4444",
      not_assessed: "#94a3b8",
    };
    return map[g] || "#94a3b8";
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Self-Evaluation Form ${sefDoc?.academic_year || "2025/26"}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 900px; margin: 0 auto; }
  .header { border-bottom: 4px solid #0ea5e9; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 28px; font-weight: 900; }
  .header .subtitle { color: #64748b; font-size: 12px; margin-top: 4px; }
  .report-card { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; }
  .rc-item { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; }
  .rc-item .area { font-weight: 700; font-size: 13px; }
  .rc-item .grade { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 12px; font-weight: 800; }
  .rc-item .dot { width: 10px; height: 10px; border-radius: 50%; }
  .safeguarding { background: ${sefDoc?.safeguarding_met ? "#ecfdf5" : "#fef2f2"}; border: 1px solid ${sefDoc?.safeguarding_met ? "#a7f3d0" : "#fecaca"}; border-radius: 12px; padding: 12px 16px; margin: 16px 0; font-weight: 700; font-size: 13px; }
  .section { margin: 40px 0; page-break-inside: avoid; }
  .section-title { font-size: 18px; font-weight: 900; border-left: 6px solid #0ea5e9; padding-left: 12px; margin-bottom: 16px; }
  .section-grade { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 99px; margin-left: 8px; }
  .narrative { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 16px; font-size: 13px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .box { padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
  .box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 900; color: #64748b; margin-bottom: 10px; }
  .box li { font-size: 12px; margin-bottom: 6px; }
  .sdp-section { margin-top: 50px; border-top: 3px solid #7c3aed; padding-top: 24px; }
  .priority { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
  .priority h3 { font-size: 15px; font-weight: 800; }
  .priority .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
  @media print { body { padding: 20px; } .section { page-break-inside: avoid; } }
</style>
</head>
<body>
  <div class="header">
    <h1>Self-Evaluation Form</h1>
    <p class="subtitle">${escapeHtml(sefDoc?.academic_year || "2025/26")} | Generated ${new Date().toLocaleDateString("en-GB")} | EIF November 2025 | v${sefDoc?.version || 1}</p>
  </div>

  <div class="safeguarding">
    Safeguarding: ${sefDoc?.safeguarding_met === true ? "MET" : sefDoc?.safeguarding_met === false ? "NOT MET" : "Not Assessed"}
  </div>

  <div class="report-card">
    ${sections
      .map(
        (s) => `
    <div class="rc-item">
      <div class="area">${escapeHtml(s.categoryName)}</div>
      <div class="grade"><span class="dot" style="background:${dotColor(s.grade)}"></span> ${escapeHtml(gradeLabel(s.grade))} (${s.score}%)</div>
    </div>`,
      )
      .join("")}
  </div>

  ${sections
    .map(
      (s) => `
  <div class="section">
    <h2 class="section-title">${escapeHtml(s.categoryName)} <span class="section-grade" style="background:${dotColor(s.grade)}20;color:${dotColor(s.grade)}">${escapeHtml(gradeLabel(s.grade))}</span></h2>
    <div class="narrative">${escapeHtml(s.narrative).replace(/\n/g, "<br>")}</div>
    <div class="grid2">
      <div class="box" style="border-color:#a7f3d0">
        <h4 style="color:#059669">Key Strengths</h4>
        <ul>${s.strengths.map((st) => `<li>${escapeHtml(st)}</li>`).join("")}</ul>
      </div>
      <div class="box" style="border-color:#fed7aa">
        <h4 style="color:#ea580c">Areas for Development</h4>
        <ul>${s.areasForDevelopment.map((a) => `<li>${escapeHtml(a)}</li>`).join("")}</ul>
      </div>
    </div>
  </div>`,
    )
    .join("")}

  ${
    priorities.length > 0
      ? `
  <div class="sdp-section">
    <h2 style="font-size:22px;font-weight:900;margin-bottom:20px;">School Development Plan Priorities</h2>
    ${priorities
      .map(
        (p) => `
    <div class="priority">
      <h3>Priority ${p.priority_number}: ${escapeHtml(p.title)}</h3>
      <p class="meta">${escapeHtml(p.rationale)} | Budget: &pound;${(p.budget || 0).toLocaleString()} | Lead: ${escapeHtml(p.lead_person || "TBC")} | Review: ${escapeHtml(p.review_date || "TBC")}</p>
      ${p.success_criteria?.length ? `<div style="margin-top:10px"><h4 style="font-size:10px;text-transform:uppercase;letter-spacing:1px;font-weight:900;color:#64748b;">Success Criteria</h4><ul>${p.success_criteria.map((sc) => `<li style="font-size:12px">${escapeHtml(sc)}</li>`).join("")}</ul></div>` : ""}
    </div>`,
      )
      .join("")}
  </div>`
      : ""
  }

  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center;">
    Generated by Schoolgle &middot; AI-Powered School Improvement Platform &middot; schoolgle.co.uk
  </div>
</body>
</html>`;
}
