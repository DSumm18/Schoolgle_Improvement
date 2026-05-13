"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  BookOpen,
  Shield,
  BarChart3,
  Settings,
  Plus,
  AlertTriangle,
  Clock,
  ShieldAlert,
  UserSearch,
  ClipboardList,
  Mail,
  FileEdit,
  FilePlus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HealthScoreCard from "./HealthScoreCard";
import PolicyList from "./PolicyList";
import PolicyEditor from "./PolicyEditor";
import TrainingDashboard from "./TrainingDashboard";
import GDPRDashboard from "./GDPRDashboard";
import ComplianceTaskList from "./ComplianceTaskList";
import AuditTimeline from "./AuditTimeline";
import TemplatePickerModal from "./TemplatePickerModal";
import type { ComplianceDashboardStats } from "@/lib/compliance/types";

interface ComplianceDashboardProps {
  organizationId: string;
}

type View = "dashboard" | "policy-editor";

export default function ComplianceDashboard({
  organizationId,
}: ComplianceDashboardProps) {
  const [stats, setStats] = useState<ComplianceDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [view, setView] = useState<View>("dashboard");
  const [editPolicyId, setEditPolicyId] = useState<string | undefined>();
  const [editTemplateId, setEditTemplateId] = useState<string | undefined>();
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, [organizationId]);

  const fetchDashboard = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const response = await fetch(
        `/api/compliance/dashboard?organizationId=${organizationId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setFetchError("Failed to load compliance data. Please try again.");
      }
    } catch (error) {
      console.error("Failed to fetch compliance dashboard:", error);
      setFetchError(
        "Network error loading compliance data. Please check your connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = () => {
    setTemplatePickerOpen(true);
  };

  const handleSelectTemplate = (templateId: string) => {
    setTemplatePickerOpen(false);
    setEditPolicyId(undefined);
    setEditTemplateId(templateId);
    setView("policy-editor");
  };

  const handleSelectPolicy = (id: string) => {
    setEditPolicyId(id);
    setEditTemplateId(undefined);
    setView("policy-editor");
  };

  const handleEditorClose = () => {
    setView("dashboard");
    setEditPolicyId(undefined);
    setEditTemplateId(undefined);
    fetchDashboard();
  };

  // Policy editor view
  if (view === "policy-editor") {
    return (
      <PolicyEditor
        organizationId={organizationId}
        itemId={editPolicyId}
        templateId={editTemplateId}
        onClose={handleEditorClose}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Compliance
          </h1>
          <p className="text-slate-500 mt-1">
            Policies, SOPs, training, GDPR, evidence and compliance tasks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={handleCreatePolicy}
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Health Score Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <HealthScoreCard
              label="Policies"
              score={stats.health_scores.policies}
              color="#9333ea"
              icon={FileText}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <HealthScoreCard
              label="Training"
              score={stats.health_scores.training}
              color="#2563eb"
              icon={BookOpen}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <HealthScoreCard
              label="GDPR"
              score={stats.health_scores.gdpr}
              color="#059669"
              icon={Shield}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <HealthScoreCard
              label="Overall"
              score={stats.health_scores.overall}
              color="#E6C3FF"
              icon={BarChart3}
            />
          </motion.div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 flex justify-center">
                <div className="animate-pulse h-24 w-24 rounded-full bg-slate-200" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error Banner */}
      {fetchError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-300">{fetchError}</p>
          <button
            onClick={() => {
              setFetchError("");
              fetchDashboard();
            }}
            className="ml-auto text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl inline-flex h-12">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="policies"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            Policies
          </TabsTrigger>
          <TabsTrigger
            value="training"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            Training
          </TabsTrigger>
          <TabsTrigger
            value="sops"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            SOPs
          </TabsTrigger>
          <TabsTrigger
            value="gdpr"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            GDPR
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg px-6"
          >
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab
            organizationId={organizationId}
            stats={stats}
            onCreatePolicy={handleCreatePolicy}
            onTabChange={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="policies" className="mt-6">
          <PolicyList
            organizationId={organizationId}
            onCreatePolicy={handleCreatePolicy}
            onSelectPolicy={handleSelectPolicy}
          />
        </TabsContent>

        <TabsContent value="training" className="mt-6">
          <TrainingDashboard organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="sops" className="mt-6">
          <SopsTab />
        </TabsContent>

        <TabsContent value="gdpr" className="mt-6">
          <GDPRDashboard organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <ComplianceTaskList organizationId={organizationId} />
        </TabsContent>
      </Tabs>

      {/* Template Picker */}
      <TemplatePickerModal
        organizationId={organizationId}
        isOpen={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={handleSelectTemplate}
      />
    </div>
  );
}

function SopsTab() {
  return (
    <Card className="overflow-hidden border-purple-100 bg-gradient-to-br from-white via-purple-50/50 to-white dark:border-purple-900/40 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
              <ClipboardList className="h-3.5 w-3.5" />
              Policies into practice
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">
                Standard Operating Procedures
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Create the practical “how we do this here” documents that sit
                behind policies, with linked forms, local setup questions,
                guided checklists and evidence trails.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                "Linked to policy requirements",
                "Personalised to the school",
                "Can create tasks and evidence",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-purple-100 bg-white/80 p-3 text-xs font-semibold text-slate-700 shadow-sm dark:border-purple-900/40 dark:bg-slate-900/70 dark:text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/dashboard/compliance/sops"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-purple-700"
            >
              Open SOPs
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/compliance/policies"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-200 bg-white px-5 py-3 text-sm font-bold text-purple-700 transition hover:bg-purple-50 dark:border-purple-900/50 dark:bg-slate-900 dark:text-purple-200"
            >
              View policies
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Overview Tab
function OverviewTab({
  organizationId,
  stats,
  onCreatePolicy,
  onTabChange,
}: {
  organizationId: string;
  stats: ComplianceDashboardStats | null;
  onCreatePolicy: () => void;
  onTabChange: (tab: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={onCreatePolicy}
          >
            <FileText className="w-4 h-4 mr-2" />
            New Policy
          </Button>
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href="/dashboard/compliance/sops">
              <ClipboardList className="w-4 h-4 mr-2" />
              New SOP / Procedure
            </Link>
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <ShieldAlert className="w-4 h-4 mr-2" />
            New Incident Report
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <Shield className="w-4 h-4 mr-2" />
            New DPIA
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <UserSearch className="w-4 h-4 mr-2" />
            New SAR
          </Button>
          <Button variant="outline" className="w-full justify-start">
            <ShieldAlert className="w-4 h-4 mr-2" />
            New Breach
          </Button>
        </CardContent>
      </Card>

      {/* Alerts & summaries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Attention Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(stats?.overdue_reviews || 0) > 0 && (
            <div className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-rose-600" />
                <div>
                  <p className="text-sm font-semibold">
                    Overdue Policy Reviews
                  </p>
                  <p className="text-xs text-slate-500">
                    {stats?.overdue_reviews} policies need reviewing
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTabChange("policies")}
              >
                Review
              </Button>
            </div>
          )}
          {(stats?.pending_approvals || 0) > 0 && (
            <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold">Pending Approvals</p>
                  <p className="text-xs text-slate-500">
                    {stats?.pending_approvals} documents awaiting approval
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTabChange("policies")}
              >
                Review
              </Button>
            </div>
          )}
          {(stats?.training_overdue || 0) > 0 && (
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-orange-600" />
                <div>
                  <p className="text-sm font-semibold">Training Overdue</p>
                  <p className="text-xs text-slate-500">
                    {stats?.training_overdue} staff training expired
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTabChange("training")}
              >
                Review
              </Button>
            </div>
          )}
          {(stats?.open_sars || 0) > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <UserSearch className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold">Open SARs</p>
                  <p className="text-xs text-slate-500">
                    {stats?.open_sars} subject access requests in progress
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTabChange("gdpr")}
              >
                View
              </Button>
            </div>
          )}
          {!stats?.overdue_reviews &&
            !stats?.pending_approvals &&
            !stats?.training_overdue &&
            !stats?.open_sars && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <Shield className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">
                  All caught up! No urgent compliance items.
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Stats summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-2xl font-bold">{stats?.total_policies || 0}</p>
              <p className="text-xs text-slate-500">Total Policies</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-2xl font-bold">
                {stats?.published_policies || 0}
              </p>
              <p className="text-xs text-slate-500">Published</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-2xl font-bold">
                {stats?.training_compliance_rate || 0}%
              </p>
              <p className="text-xs text-slate-500">Training Compliance</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <p className="text-2xl font-bold">
                {stats?.dpias_requiring_review || 0}
              </p>
              <p className="text-xs text-slate-500">DPIAs to Review</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <AuditTimeline organizationId={organizationId} />

      {/* Compliance Tools Grid */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                {
                  icon: FileText,
                  label: "Policies",
                  href: "/dashboard/compliance/policies",
                  color: "text-purple-600 bg-purple-100",
                },
                {
                  icon: ClipboardList,
                  label: "SOPs",
                  href: "/dashboard/compliance/sops",
                  color: "text-indigo-600 bg-indigo-100",
                },
                {
                  icon: ClipboardList,
                  label: "Single Central Record",
                  href: "/dashboard/compliance/scr",
                  color: "text-purple-600 bg-purple-100",
                },
                {
                  icon: Mail,
                  label: "Complaints Tracker",
                  href: "/dashboard/compliance/complaints",
                  color: "text-amber-600 bg-amber-100",
                },
                {
                  icon: ShieldAlert,
                  label: "Low-Level Concerns",
                  href: "/dashboard/compliance/concerns",
                  color: "text-rose-600 bg-rose-100",
                },
                {
                  icon: FileEdit,
                  label: "Consent Manager",
                  href: "/dashboard/compliance/consent",
                  color: "text-blue-600 bg-blue-100",
                },
                {
                  icon: FilePlus,
                  label: "FOI Tracker",
                  href: "/dashboard/compliance/foi",
                  color: "text-emerald-600 bg-emerald-100",
                },
                {
                  icon: Shield,
                  label: "DPO Service",
                  href: "/dashboard/compliance/dpo",
                  color: "text-purple-600 bg-purple-100",
                },
              ].map((tool) => (
                <a
                  key={tool.href}
                  href={tool.href}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:shadow-sm transition-all group"
                >
                  <div className={`p-2 rounded-lg ${tool.color}`}>
                    <tool.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold flex-1">
                    {tool.label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
