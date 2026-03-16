"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Play,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  X,
  AlertTriangle,
  Shield,
  Building2,
  Scale,
  Coins,
  Users,
  Heart,
  Camera,
  FileText,
  MessageSquare,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { useAuth } from "@/context/SupabaseAuthContext";
import { fetcher } from "@/lib/fetchers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SopStep {
  step_id: string;
  order: number;
  title: string;
  instruction: string;
  evidence_required: boolean;
  evidence_types: string[];
  evidence_guidance: string;
  linked_module?: string;
  ai_assist?: boolean;
}

interface SopTemplate {
  id: string;
  template_id: string;
  name: string;
  description: string;
  category: string;
  frequency: string;
  steps: SopStep[];
  estimated_time_minutes: number;
  owner_role: string;
  is_active: boolean;
}

interface SopRunStep {
  step_id: string;
  order: number;
  title: string;
  instruction: string;
  evidence_required: boolean;
  evidence_types: string[];
  evidence_guidance: string;
  status: "pending" | "done" | "skipped" | "blocked";
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  evidence: Array<{
    type: string;
    url?: string;
    content?: string;
    caption?: string;
  }>;
}

interface SopRun {
  id: string;
  organization_id: string;
  template_id: string;
  context: string | null;
  status: string;
  steps_data: SopRunStep[];
  completion_notes: string | null;
  started_by: string;
  completed_by: string | null;
  started_at: string;
  completed_at: string | null;
  linked_incident_id: string | null;
  linked_module: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type ViewTab = "active" | "templates" | "completed";

const VIEW_TABS: { label: string; value: ViewTab; icon: typeof Play }[] = [
  { label: "Active Runs", value: "active", icon: Play },
  { label: "Templates", value: "templates", icon: ClipboardList },
  { label: "Completed", value: "completed", icon: CheckCircle2 },
];

const CATEGORY_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof Shield }
> = {
  h_and_s: {
    label: "Health & Safety",
    color: "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400",
    icon: Heart,
  },
  estates: {
    label: "Estates",
    color: "text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400",
    icon: Building2,
  },
  safeguarding: {
    label: "Safeguarding",
    color:
      "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400",
    icon: Shield,
  },
  compliance: {
    label: "Compliance",
    color:
      "text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400",
    icon: Scale,
  },
  governance: {
    label: "Governance",
    color:
      "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
    icon: Users,
  },
  finance: {
    label: "Finance",
    color:
      "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400",
    icon: Coins,
  },
  hr: {
    label: "HR",
    color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    icon: Users,
  },
};

const FREQUENCY_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  termly: "Termly",
  annual: "Annual",
  ad_hoc: "Ad-hoc",
};

const STATUS_BADGE: Record<string, string> = {
  in_progress:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  completed: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  abandoned: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

const EVIDENCE_ICON: Record<string, typeof Camera> = {
  photo: Camera,
  file: FileText,
  note: MessageSquare,
  screenshot: Camera,
};

// ---------------------------------------------------------------------------
// SOP Runner Component (the step-by-step guided flow)
// ---------------------------------------------------------------------------

function SopRunner({
  run,
  onStepUpdate,
  onComplete,
  onClose,
}: {
  run: SopRun & { template?: SopTemplate };
  onStepUpdate: (
    stepId: string,
    status: string,
    notes?: string,
  ) => Promise<void>;
  onComplete: (
    status: "completed" | "abandoned",
    notes?: string,
  ) => Promise<void>;
  onClose: () => void;
}) {
  const [activeStepIdx, setActiveStepIdx] = useState(() => {
    const idx = run.steps_data.findIndex((s) => s.status === "pending");
    return idx >= 0 ? idx : 0;
  });
  const [stepNotes, setStepNotes] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const steps = run.steps_data;
  const completed = steps.filter((s) => s.status === "done").length;
  const total = steps.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const allDone = steps.every((s) => s.status !== "pending");

  const handleStepDone = async (stepId: string) => {
    setSaving(true);
    await onStepUpdate(stepId, "done", stepNotes || undefined);
    setStepNotes("");
    // Auto-advance to next pending step
    const nextIdx = steps.findIndex(
      (s, i) => i > activeStepIdx && s.status === "pending",
    );
    if (nextIdx >= 0) setActiveStepIdx(nextIdx);
    setSaving(false);
  };

  const handleStepSkip = async (stepId: string) => {
    setSaving(true);
    await onStepUpdate(stepId, "skipped", stepNotes || undefined);
    setStepNotes("");
    const nextIdx = steps.findIndex(
      (s, i) => i > activeStepIdx && s.status === "pending",
    );
    if (nextIdx >= 0) setActiveStepIdx(nextIdx);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold">
              {run.template?.name || run.template_id}
            </h2>
            {run.context && (
              <p className="text-sm text-slate-500 mt-0.5">{run.context}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600 dark:text-slate-400">
              {completed}/{total} steps completed
            </span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {steps.map((step, idx) => {
            const isActive = idx === activeStepIdx;
            const isDone = step.status === "done";
            const isSkipped = step.status === "skipped";
            const isBlocked = step.status === "blocked";

            return (
              <div
                key={step.step_id}
                className={`rounded-lg border transition-all ${
                  isActive
                    ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/10"
                    : isDone
                      ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 opacity-75"
                      : isSkipped
                        ? "border-slate-200 bg-slate-50 dark:border-slate-700 opacity-50"
                        : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <button
                  onClick={() =>
                    step.status === "pending" && setActiveStepIdx(idx)
                  }
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  {/* Step number / status indicator */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                      isDone
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : isSkipped
                          ? "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                          : isActive
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isSkipped ? (
                      <RotateCcw className="w-4 h-4" />
                    ) : (
                      step.order
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm font-medium ${isDone ? "line-through text-slate-400" : ""}`}
                    >
                      {step.title}
                    </span>
                    {step.evidence_required && step.status === "pending" && (
                      <span className="ml-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-1.5 py-0.5 rounded">
                        Evidence required
                      </span>
                    )}
                  </div>
                  {!isActive && step.status === "pending" && (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  {isActive && (
                    <ChevronDown className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </button>

                {/* Expanded step content */}
                <AnimatePresence>
                  {isActive && step.status === "pending" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-4 pt-1 ml-11 space-y-3">
                        {/* Instruction */}
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                          {step.instruction}
                        </p>

                        {/* Evidence guidance */}
                        {step.evidence_guidance && (
                          <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                            <Camera className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>{step.evidence_guidance}</span>
                          </div>
                        )}

                        {/* Evidence type badges */}
                        {step.evidence_types.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {step.evidence_types.map((et) => {
                              const Icon = EVIDENCE_ICON[et] || FileText;
                              return (
                                <span
                                  key={et}
                                  className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded"
                                >
                                  <Icon className="w-3 h-3" />
                                  {et}
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Notes input */}
                        <textarea
                          value={stepNotes}
                          onChange={(e) => setStepNotes(e.target.value)}
                          placeholder="Add notes (optional)..."
                          className="w-full text-sm border rounded-lg p-2.5 bg-white dark:bg-slate-800 dark:border-slate-600 resize-none"
                          rows={2}
                        />

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleStepDone(step.step_id)}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {saving ? "Saving..." : "Mark Done"}
                          </button>
                          <button
                            onClick={() => handleStepSkip(step.step_id)}
                            disabled={saving}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-600 dark:text-slate-400"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Show completed step notes */}
                {(isDone || isSkipped) && step.notes && (
                  <div className="px-3 pb-3 ml-11">
                    <p className="text-xs text-slate-500 italic">
                      {step.notes}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer: Complete/Abandon */}
        <div className="border-t dark:border-slate-700 p-5">
          {allDone && !showComplete ? (
            <button
              onClick={() => setShowComplete(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <CheckCircle2 className="w-5 h-5" />
              Complete SOP
            </button>
          ) : showComplete ? (
            <div className="space-y-3">
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Completion notes (optional)..."
                className="w-full text-sm border rounded-lg p-2.5 bg-white dark:bg-slate-800 dark:border-slate-600 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onComplete("completed", completionNotes || undefined)
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Confirm Complete
                </button>
                <button
                  onClick={() => setShowComplete(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {total - completed} steps remaining
              </p>
              <button
                onClick={() => {
                  if (
                    confirm(
                      "Abandon this SOP run? Progress will be saved but marked as abandoned.",
                    )
                  ) {
                    onComplete("abandoned");
                  }
                }}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
              >
                Abandon
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template Card
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  onStart,
}: {
  template: SopTemplate;
  onStart: (templateId: string) => void;
}) {
  const cat = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.estates;
  const CatIcon = cat.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${cat.color}`}
              >
                <CatIcon className="w-3 h-3" />
                {cat.label}
              </span>
              <span className="text-xs text-slate-500">
                {FREQUENCY_LABEL[template.frequency] || template.frequency}
              </span>
            </div>
            <h3 className="font-medium text-sm">{template.name}</h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {template.description}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span>{template.steps.length} steps</span>
              <span>~{template.estimated_time_minutes} min</span>
              <span className="capitalize">{template.owner_role}</span>
            </div>
          </div>
          <button
            onClick={() => onStart(template.template_id)}
            className="shrink-0 p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
            title="Start this SOP"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Run Card (for active/completed lists)
// ---------------------------------------------------------------------------

function RunCard({
  run,
  onResume,
}: {
  run: SopRun & { template_name?: string };
  onResume: (runId: string) => void;
}) {
  const steps = run.steps_data || [];
  const completed = steps.filter((s) => s.status === "done").length;
  const total = steps.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onResume(run.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm truncate">
            {run.template_name || run.template_id}
          </h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[run.status] || STATUS_BADGE.in_progress}`}
          >
            {run.status === "in_progress" ? "In Progress" : run.status}
          </span>
        </div>
        {run.context && (
          <p className="text-xs text-slate-500 mb-2 truncate">{run.context}</p>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-slate-500 shrink-0">
            {completed}/{total}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          <span>
            Started{" "}
            {new Date(run.started_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </span>
          {run.linked_module && (
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {run.linked_module}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function SopsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ViewTab>("active");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Fetch templates
  const { data: templatesData } = useSWR(
    user ? "/api/sops/templates" : null,
    fetcher,
  );

  // Fetch active runs
  const { data: activeRunsData, mutate: mutateRuns } = useSWR(
    user ? "/api/sops/runs?status=in_progress" : null,
    fetcher,
  );

  // Fetch completed runs
  const { data: completedRunsData } = useSWR(
    user && activeTab === "completed"
      ? "/api/sops/runs?status=completed"
      : null,
    fetcher,
  );

  // Fetch active run detail when runner is open
  const { data: activeRunDetail, mutate: mutateRunDetail } = useSWR(
    activeRunId ? `/api/sops/runs/${activeRunId}` : null,
    fetcher,
  );

  const templates: SopTemplate[] = templatesData?.data?.templates || [];
  const activeRuns: SopRun[] = activeRunsData?.data?.runs || [];
  const completedRuns: SopRun[] = completedRunsData?.data?.runs || [];

  const filteredTemplates =
    categoryFilter === "all"
      ? templates
      : templates.filter((t) => t.category === categoryFilter);

  // Group templates by category
  const categories = [...new Set(templates.map((t) => t.category))].sort();

  // Start a new SOP run
  const handleStartRun = useCallback(
    async (templateId: string) => {
      setStarting(true);
      try {
        const res = await fetch("/api/sops/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: templateId }),
        });
        const data = await res.json();
        if (data?.data?.run) {
          setActiveRunId(data.data.run.id);
          mutateRuns();
        }
      } finally {
        setStarting(false);
      }
    },
    [mutateRuns],
  );

  // Resume an existing run
  const handleResumeRun = useCallback((runId: string) => {
    setActiveRunId(runId);
  }, []);

  // Update a step
  const handleStepUpdate = useCallback(
    async (stepId: string, status: string, notes?: string) => {
      if (!activeRunId) return;
      await fetch(`/api/sops/runs/${activeRunId}/steps/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      mutateRunDetail();
      mutateRuns();
    },
    [activeRunId, mutateRunDetail, mutateRuns],
  );

  // Complete/abandon a run
  const handleComplete = useCallback(
    async (status: "completed" | "abandoned", notes?: string) => {
      if (!activeRunId) return;
      await fetch(`/api/sops/runs/${activeRunId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, completion_notes: notes }),
      });
      setActiveRunId(null);
      mutateRuns();
    },
    [activeRunId, mutateRuns],
  );

  const runDetail = activeRunDetail?.data?.run;
  const runTemplate = activeRunDetail?.data?.template;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <ModulePageHeader
        moduleId="estates"
        icon={require("lucide-react").ClipboardList}
        label="Estates"
        title="Standard Operating Procedures"
        description="Step-by-step guided checklists for routine and emergency procedures"
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Play className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeRuns.length}</p>
              <p className="text-xs text-slate-500">Active Runs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{templates.length}</p>
              <p className="text-xs text-slate-500">Templates</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
              <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {templates.filter((t) => t.category === "h_and_s").length}
              </p>
              <p className="text-xs text-slate-500">H&S SOPs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {templates.filter((t) => t.frequency !== "ad_hoc").length}
              </p>
              <p className="text-xs text-slate-500">Recurring</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
        {VIEW_TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.value
                  ? "bg-white dark:bg-slate-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.value === "active" && activeRuns.length > 0 && (
                <span className="ml-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 rounded-full">
                  {activeRuns.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Runs */}
      {activeTab === "active" && (
        <div>
          {activeRuns.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="font-medium text-slate-600 dark:text-slate-400 mb-1">
                  No active SOP runs
                </h3>
                <p className="text-sm text-slate-400 mb-4">
                  Start a procedure from the Templates tab, or Ed will
                  auto-trigger SOPs when incidents are logged.
                </p>
                <button
                  onClick={() => setActiveTab("templates")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Browse Templates
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {activeRuns.map((run) => (
                <RunCard key={run.id} run={run} onResume={handleResumeRun} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Templates */}
      {activeTab === "templates" && (
        <div className="space-y-4">
          {/* Category filter */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                categoryFilter === "all"
                  ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              All ({templates.length})
            </button>
            {categories.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const count = templates.filter((t) => t.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    categoryFilter === cat
                      ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {config?.label || cat} ({count})
                </button>
              );
            })}
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.template_id}
                template={template}
                onStart={handleStartRun}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-slate-500">
                No templates in this category
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Completed Runs */}
      {activeTab === "completed" && (
        <div>
          {completedRuns.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-500">
                No completed SOP runs yet
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {completedRuns.map((run) => (
                <RunCard key={run.id} run={run} onResume={handleResumeRun} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SOP Runner Modal */}
      <AnimatePresence>
        {activeRunId && runDetail && (
          <SopRunner
            run={{ ...runDetail, template: runTemplate }}
            onStepUpdate={handleStepUpdate}
            onComplete={handleComplete}
            onClose={() => setActiveRunId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
