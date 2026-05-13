"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  Sparkles,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { useAuth } from "@/context/SupabaseAuthContext";
import { toast } from "@/components/ui/use-toast";
import { clientAuthFetch } from "@/lib/auth/client-auth-fetch";
import { MAINTAINED_PRIMARY_POLICY_REQUIREMENTS } from "@/lib/compliance/policies/policy-catalogue";
import { fetcher } from "@/lib/fetchers";
import { supabase } from "@/lib/supabase";

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
  source?: "database" | "schoolgle_builtin";
  linked_policy_requirement_ids?: string[];
  recommended_modules?: string[];
  setup_questions?: Array<{
    id: string;
    question: string;
    why: string;
    fieldHint: string;
  }>;
  source_refs?: Array<{
    title: string;
    publisher: string;
    url: string;
    authority: string;
    lastChecked: string;
  }>;
  visual_flow?: Array<{
    label: string;
    detail: string;
  }>;
  document_resources?: Array<{
    title: string;
    type: "form" | "template" | "policy" | "guidance" | "register" | "system";
    description: string;
    action: string;
    locationHint: string;
  }>;
  ed_prompt?: string;
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

type SetupAnswers = Record<string, string>;

type SopDocumentPreviewState = {
  answers: SetupAnswers;
  runId?: string;
  template: SopTemplate;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type ViewTab = "documents" | "active" | "templates" | "completed";

const VIEW_TABS: { label: string; value: ViewTab; icon: typeof Play }[] = [
  { label: "SOP Documents", value: "documents", icon: FileText },
  { label: "Active Checklists", value: "active", icon: Play },
  { label: "Checklist Starters", value: "templates", icon: ClipboardList },
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

const POLICY_LABELS = Object.fromEntries(
  MAINTAINED_PRIMARY_POLICY_REQUIREMENTS.map((requirement) => [
    requirement.id,
    requirement.canonicalName,
  ]),
);

function buildPersonalisedSopContext(
  template: SopTemplate,
  answers: SetupAnswers,
) {
  const answeredQuestions = (template.setup_questions || [])
    .map((questionItem) => {
      const answer = answers[questionItem.id]?.trim();
      if (!answer) return null;
      return `${questionItem.question} ${answer}`;
    })
    .filter(Boolean);

  if (answeredQuestions.length === 0) {
    return `Started from Schoolgle SOP document: ${template.name}`;
  }

  return [
    `Personalised Schoolgle SOP document: ${template.name}`,
    "",
    "Local setup answers:",
    ...answeredQuestions.map((line) => `- ${line}`),
  ].join("\n");
}

function getLinkedPolicyLabels(template: SopTemplate) {
  return (template.linked_policy_requirement_ids || []).map(
    (policyId) => POLICY_LABELS[policyId] || policyId,
  );
}

function getSetupAnswer(
  answers: SetupAnswers,
  questionId: string,
  fallback = "To be confirmed",
) {
  return answers[questionId]?.trim() || fallback;
}

function getSchoolInitials(schoolName?: string | null) {
  const words = (schoolName || "Schoolgle")
    .split(/\s+/)
    .filter((word) => /^[A-Za-z0-9]/.test(word));

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "SG";
}

async function parseSopRunResponse(response: Response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Could not create the SOP run");
  }

  const run = data?.run || data?.data?.run;
  if (!run?.id) {
    throw new Error("The SOP run was created but the response was incomplete");
  }

  return run as SopRun;
}

async function sopAuthFetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 15000,
) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await clientAuthFetch(supabase, url, {
      ...options,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("The SOP request timed out. Please try again.");
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

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
            {run.template?.setup_questions?.length ? (
              <p className="mt-1 text-xs text-purple-600 dark:text-purple-300">
                Ed should confirm {run.template.setup_questions.length} local setup answers before this becomes an approved school SOP.
              </p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {run.template?.visual_flow?.length ? (
          <div className="border-b bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex flex-wrap gap-2">
              {run.template.visual_flow.map((item, index) => (
                <div
                  key={`${run.template_id}:${item.label}`}
                  className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {index + 1}
                  </span>
                  <span>
                    <strong className="block text-slate-800 dark:text-slate-100">
                      {item.label}
                    </strong>
                    <span className="text-slate-500">{item.detail}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

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

function SopWorkflowGuide({
  onBrowseTemplates,
}: {
  onBrowseTemplates: () => void;
}) {
  return (
    <Card className="overflow-hidden border-purple-200 bg-gradient-to-br from-purple-50 via-white to-emerald-50 dark:border-purple-900/50 dark:from-purple-950/20 dark:via-slate-950 dark:to-emerald-950/20">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-purple-700 shadow-sm dark:bg-slate-900 dark:text-purple-300">
              <Sparkles className="h-3.5 w-3.5" />
              Start here
            </div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              SOPs are the internal playbook behind your policies
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Policies say what the school promises. SOPs explain exactly how
              staff do it in practice. Pick a document starter, answer the
              local questions, then Schoolgle turns it into a readable SOP
              document with an optional checklist run underneath it.
            </p>
          </div>
          <button
            onClick={onBrowseTemplates}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-700"
          >
            <FileText className="h-4 w-4" />
            Browse SOP documents
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            ["1", "Policy", "The rulebook: what must happen."],
            ["2", "SOP", "The playbook: how your school does it."],
            ["3", "Questions", "Local roles, places, timings and systems."],
            ["4", "Tasks", "Recurring work and evidence trails."],
          ].map(([number, title, detail]) => (
            <div
              key={title}
              className="rounded-xl border border-white/80 bg-white/85 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="mb-2 grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                {number}
              </div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {title}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {detail}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SopSetupModal({
  onClose,
  onCreate,
  starting,
  template,
  schoolLogoUrl,
  schoolName,
}: {
  onClose: () => void;
  onCreate: (template: SopTemplate, answers: SetupAnswers) => void;
  schoolLogoUrl?: string;
  schoolName?: string;
  starting: boolean;
  template: SopTemplate;
}) {
  const [answers, setAnswers] = useState<SetupAnswers>({});
  const questions = template.setup_questions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-7xl rounded-2xl bg-white shadow-2xl dark:bg-slate-950"
      >
        <div className="flex items-start justify-between gap-4 border-b p-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
              Personalise SOP Document
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
              {template.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Answer what you know now. The document preview updates as you go;
              anything blank stays clearly marked for Ed or the policy owner.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.35fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100">
              This creates a draft SOP document and a working checklist run
              underneath it. Nothing is published or approved until a human
              reviews it.
            </div>

            {questions.length > 0 ? (
              <div className="space-y-3">
                {questions.map((questionItem) => (
                  <label
                    key={questionItem.id}
                    className="block rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {questionItem.question}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {questionItem.why}
                    </span>
                    <input
                      value={answers[questionItem.id] || ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [questionItem.id]: event.target.value,
                        }))
                      }
                      placeholder={questionItem.fieldHint}
                      className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-purple-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
                This SOP has no setup questions yet. You can still create the
                document draft and start the checklist underneath it.
              </div>
            )}
          </div>

          <SopDocumentPreview
            template={template}
            answers={answers}
            compact
            schoolLogoUrl={schoolLogoUrl}
            schoolName={schoolName}
          />
        </div>

        <div className="flex flex-col gap-2 border-t p-5 sm:flex-row sm:justify-between dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Document first, checklist second: the SOP becomes the staff-facing
            guidance; the run/checklist proves it happened.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={() => onCreate(template, answers)}
              disabled={starting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {starting ? "Creating..." : "Create SOP document + checklist"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SopDocumentPreview({
  answers = {},
  compact = false,
  schoolLogoUrl,
  schoolName,
  template,
}: {
  answers?: SetupAnswers;
  compact?: boolean;
  schoolLogoUrl?: string;
  schoolName?: string;
  template: SopTemplate;
}) {
  const cat = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.estates;
  const linkedPolicies = getLinkedPolicyLabels(template);
  const questions = template.setup_questions || [];
  const sourceRefs = template.source_refs || [];
  const flowSteps = template.visual_flow || [];
  const documentResources = template.document_resources || [];
  const [selectedFlowIndex, setSelectedFlowIndex] = useState(0);
  const activeFlow = flowSteps[selectedFlowIndex] || flowSteps[0];
  const activeStep = template.steps[selectedFlowIndex] || template.steps[0];
  const activeResource =
    documentResources.length > 0
      ? documentResources[selectedFlowIndex % documentResources.length]
      : null;

  return (
    <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-xl shadow-slate-900/5 dark:border-indigo-900/50 dark:bg-slate-950">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-900 p-6 text-white">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="relative">
            <div className="mb-5 flex items-center gap-3">
              {schoolLogoUrl ? (
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-white/20 bg-white shadow-lg">
                  <img
                    src={schoolLogoUrl}
                    alt={`${schoolName || "School"} logo`}
                    className="h-full w-full object-contain p-1"
                  />
                </div>
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/20 bg-white/12 text-sm font-black shadow-lg">
                  {getSchoolInitials(schoolName)}
                </div>
              )}
              <div>
                <p className="text-sm font-black leading-tight">
                  {schoolName || "Schoolgle"}
                </p>
                <p className="text-xs text-white/60">
                  Schoolgle managed SOP pack
                </p>
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              Draft Standard Operating Procedure
            </p>
            <h3 className="mt-2 text-3xl font-black tracking-tight">
              {template.name}
            </h3>
            <p className="mt-2 max-w-2xl text-sm text-white/75">
              {template.description}
            </p>
          </div>
          <div className="relative flex flex-col items-end gap-2">
            <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
              Human approval required
            </span>
            <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-200/20">
              Aligned to Policy Manager style
            </span>
          </div>
        </div>
        <div className="relative mt-6 grid gap-2 text-xs sm:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
            <span className="block text-white/55">Owner</span>
            <strong className="mt-1 block capitalize">{template.owner_role}</strong>
          </div>
          <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
            <span className="block text-white/55">Frequency</span>
            <strong className="mt-1 block">
              {FREQUENCY_LABEL[template.frequency] || template.frequency}
            </strong>
          </div>
          <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
            <span className="block text-white/55">Category</span>
            <strong className="mt-1 block">{cat.label}</strong>
          </div>
          <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/15">
            <span className="block text-white/55">Status</span>
            <strong className="mt-1 block">Draft v0.1</strong>
          </div>
        </div>
      </div>

      <div
        className={`space-y-5 ${compact ? "max-h-[62vh] overflow-y-auto p-5" : "p-5"}`}
      >
        <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/70 to-purple-50 p-4 dark:border-indigo-900/50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-purple-950/20">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Contents
          </h4>
          <ol className="mt-2 grid gap-1 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
            <li>1. Purpose and scope</li>
            <li>2. Linked policies, forms and systems</li>
            <li>3. Local operating details</li>
            <li>4. Process flow chart</li>
            <li>5. Detailed procedure</li>
            <li>6. Approval, review and sources</li>
          </ol>
        </section>

        <section>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Purpose and scope
          </h4>
          <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
            This Standard Operating Procedure explains how staff carry out{" "}
            <strong>{template.name.toLowerCase()}</strong> in practice. It
            should be read alongside the linked policy documents and used as the
            step-by-step instruction for staff completing the activity,
            including which forms to complete, where to submit them, who to tell,
            and when to escalate.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Linked policies
            </h4>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {linkedPolicies.length > 0 ? (
                linkedPolicies.map((policy) => (
                  <span
                    key={policy}
                    className="rounded-full bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                  >
                    {policy}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">
                  No linked policy recorded yet.
                </span>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
              What this SOP tells staff
            </h4>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              What to do, which document or form to open, how to complete it,
              where it goes, who owns the next decision, and which records need
              to be kept.
            </p>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Linked documents, forms and systems
          </h4>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {documentResources.length > 0 ? (
              documentResources.map((resource) => (
                <div
                  key={`${template.template_id}:resource:${resource.title}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {resource.title}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-purple-600 dark:text-purple-300">
                        {resource.type}
                      </p>
                    </div>
                    <span className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-bold text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                      Open
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {resource.description}
                  </p>
                  <p className="mt-2 rounded-lg bg-purple-50 px-3 py-2 text-xs text-purple-800 dark:bg-purple-950/30 dark:text-purple-200">
                    Use it: {resource.action}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Location: {resource.locationHint}
                  </p>
                  <button
                    className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-purple-200 hover:text-purple-700 dark:border-slate-700 dark:text-slate-300"
                    type="button"
                  >
                    Open linked {resource.type}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
                No linked forms or templates have been mapped yet. This SOP
                should link the forms, registers or systems staff need to use.
              </div>
            )}
          </div>
        </section>

        {questions.length > 0 && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Local operating details
            </h4>
            <div className="mt-2 grid gap-2">
              {questions.map((questionItem) => (
                <div
                  key={questionItem.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <p className="text-xs font-semibold text-slate-500">
                    {questionItem.question}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {getSetupAnswer(answers, questionItem.id)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {flowSteps.length > 0 && (
          <section>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Interactive process flow
            </h4>
            <div className="mt-3 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-lg dark:border-slate-800">
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-[260px] overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-emerald-950 p-5">
                  <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,#a78bfa_0,transparent_28%),radial-gradient(circle_at_80%_10%,#34d399_0,transparent_26%),radial-gradient(circle_at_50%_90%,#38bdf8_0,transparent_24%)]" />
                  <div className="relative grid gap-3 sm:grid-cols-2">
                    {flowSteps.map((flow, index) => {
                      const selected = index === selectedFlowIndex;
                      return (
                        <motion.button
                          key={`${template.template_id}:document-flow:${flow.label}`}
                          animate={{
                            opacity: selected ? 1 : 0.78,
                            scale: selected ? 1.02 : 1,
                          }}
                          className={`group rounded-2xl border p-4 text-left transition ${
                            selected
                              ? "border-emerald-200 bg-white text-slate-950 shadow-xl"
                              : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                          }`}
                          onClick={() => setSelectedFlowIndex(index)}
                          type="button"
                        >
                          <div
                            className={`mb-3 grid h-8 w-8 place-items-center rounded-full text-sm font-black ${
                              selected
                                ? "bg-emerald-600 text-white"
                                : "bg-white/15 text-white"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <p className="font-bold">{flow.label}</p>
                          <p
                            className={`mt-1 text-xs leading-5 ${
                              selected
                                ? "text-slate-500"
                                : "text-white/65 group-hover:text-white/80"
                            }`}
                          >
                            {flow.detail}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-white p-5 text-slate-950 dark:bg-slate-900 dark:text-white">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-600 dark:text-purple-300">
                    Step {selectedFlowIndex + 1}
                  </p>
                  <h5 className="mt-2 text-2xl font-black">
                    {activeFlow?.label || activeStep?.title}
                  </h5>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {activeStep?.instruction || activeFlow?.detail}
                  </p>
                  {activeResource && (
                    <div className="mt-4 rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/50 dark:bg-purple-950/20">
                      <p className="text-xs font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">
                        Linked form/template
                      </p>
                      <p className="mt-1 font-bold text-slate-950 dark:text-white">
                        {activeResource.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {activeResource.action}
                      </p>
                      <button
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-700"
                        type="button"
                      >
                        Open this {activeResource.type}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                    In the finished product this becomes a Show Me / Remotion
                    explainer: click each stage, open the right form, and see
                    exactly what to complete.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Detailed procedure
          </h4>
          <div className="mt-3 space-y-3">
            {template.steps.map((step) => {
              const linkedResource =
                documentResources.length > 0
                  ? documentResources[(step.order - 1) % documentResources.length]
                  : null;
              return (
                <div
                  key={`${template.template_id}:document-step:${step.step_id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                      {step.order}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {step.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {step.instruction}
                      </p>
                      {linkedResource && (
                        <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs dark:border-indigo-900/50 dark:bg-indigo-950/20">
                          <p className="font-bold text-indigo-800 dark:text-indigo-200">
                            Document to use: {linkedResource.title}
                          </p>
                          <p className="mt-1 text-indigo-700/80 dark:text-indigo-100/70">
                            {linkedResource.action}
                          </p>
                        </div>
                      )}
                      {step.evidence_required && (
                        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                          Record/retain: {step.evidence_guidance}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Approval and review
            </h4>
            <dl className="mt-2 grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Approved by</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  To be confirmed
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Review cycle</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  {FREQUENCY_LABEL[template.frequency] || template.frequency}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Version</dt>
                <dd className="font-semibold text-slate-900 dark:text-white">
                  Draft v0.1
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Sources checked
            </h4>
            <div className="mt-2 space-y-2">
              {sourceRefs.length > 0 ? (
                sourceRefs.map((source) => (
                  <div
                    key={`${template.template_id}:source:${source.title}`}
                    className="text-xs text-slate-600 dark:text-slate-300"
                  >
                    <p className="font-semibold">{source.publisher}</p>
                    <p>{source.title}</p>
                    <p className="text-slate-400">
                      {source.authority.replaceAll("_", " ")} · checked{" "}
                      {new Date(source.lastChecked).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No source references attached yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SopDocumentModal({
  answers,
  onClose,
  onOpenChecklist,
  runId,
  schoolLogoUrl,
  schoolName,
  template,
}: {
  answers: SetupAnswers;
  onClose: () => void;
  onOpenChecklist?: (runId: string) => void;
  runId?: string;
  schoolLogoUrl?: string;
  schoolName?: string;
  template: SopTemplate;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-950"
      >
        <div className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-white/95 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-600 dark:text-purple-300">
              SOP document preview
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
              {template.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Staff-facing procedure first; checklist and evidence trail underneath.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {runId && onOpenChecklist ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                onClick={() => onOpenChecklist(runId)}
                type="button"
              >
                <Play className="h-4 w-4" />
                Open checklist
              </button>
            ) : null}
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </div>
        <div className="p-4">
          <SopDocumentPreview
            answers={answers}
            schoolLogoUrl={schoolLogoUrl}
            schoolName={schoolName}
            template={template}
          />
        </div>
      </motion.div>
    </div>
  );
}

function SopDocumentCard({
  onPreview,
  template,
  onSetup,
  onStart,
}: {
  onPreview: (template: SopTemplate) => void;
  template: SopTemplate;
  onSetup: (template: SopTemplate) => void;
  onStart: (templateId: string) => void;
}) {
  const cat = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.estates;
  const CatIcon = cat.icon;
  const linkedPolicies = getLinkedPolicyLabels(template);
  const flowSteps = template.visual_flow || [];
  const documentResources = template.document_resources || [];

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        <div className="border-b bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${cat.color}`}
                >
                  <CatIcon className="h-3 w-3" />
                  {cat.label}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                  Draft document starter
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-950 dark:text-white">
                {template.name}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {template.description}
              </p>
            </div>
            <FileText className="h-5 w-5 shrink-0 text-purple-500" />
          </div>
        </div>
        <div className="space-y-4 p-4">
          {flowSteps.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-4">
              {flowSteps.slice(0, 4).map((flow, index) => (
                <div
                  key={`${template.template_id}:card-flow:${flow.label}`}
                  className="rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-950"
                >
                  <span className="text-[10px] font-bold text-emerald-600">
                    STEP {index + 1}
                  </span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    {flow.label}
                  </p>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-2 text-xs text-slate-500">
            <span>
              {template.steps.length} procedure sections · ~
              {template.estimated_time_minutes} min checklist
            </span>
            <span className="capitalize">
              Owner role: {template.owner_role}
            </span>
            <span>
              Linked policies:{" "}
              {linkedPolicies.length > 0
                ? linkedPolicies.slice(0, 2).join(", ")
                : "Not mapped yet"}
              {linkedPolicies.length > 2 ? ` +${linkedPolicies.length - 2}` : ""}
            </span>
            <span>
              Linked forms/docs:{" "}
              {documentResources.length > 0
                ? `${documentResources.length} mapped`
                : "To be mapped"}
            </span>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <button
              onClick={() => onPreview(template)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-purple-200 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 dark:border-purple-900/60 dark:text-purple-200 dark:hover:bg-purple-950/20"
            >
              <Eye className="h-3.5 w-3.5" />
              View document
            </button>
            <button
              onClick={() => onSetup(template)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-700"
            >
              <FileText className="h-3.5 w-3.5" />
              Personalise document
            </button>
            <button
              onClick={() => onStart(template.template_id)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Play className="h-3.5 w-3.5" />
              Start checklist
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateCard({
  template,
  onSetup,
  onStart,
}: {
  template: SopTemplate;
  onSetup: (template: SopTemplate) => void;
  onStart: (templateId: string) => void;
}) {
  const cat = CATEGORY_CONFIG[template.category] || CATEGORY_CONFIG.estates;
  const CatIcon = cat.icon;
  const setupQuestions = template.setup_questions || [];
  const linkedPolicies = template.linked_policy_requirement_ids || [];
  const flowSteps = template.visual_flow || [];
  const sourceRefs = template.source_refs || [];

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
              {template.source === "schoolgle_builtin" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                  <Sparkles className="h-3 w-3" />
                  Schoolgle starter
                </span>
              )}
            </div>
            <h3 className="font-medium text-sm">{template.name}</h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {template.description}
            </p>
            {flowSteps.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {flowSteps.slice(0, 4).map((flow, index) => (
                  <span
                    key={`${template.template_id}:${flow.label}`}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {index + 1}. {flow.label}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span>{template.steps.length} steps</span>
              <span>~{template.estimated_time_minutes} min</span>
              <span className="capitalize">{template.owner_role}</span>
            </div>
            {(setupQuestions.length > 0 || linkedPolicies.length > 0 || sourceRefs.length > 0) && (
              <div className="mt-3 grid gap-1.5 text-[11px] text-slate-500">
                {setupQuestions.length > 0 && (
                  <span>{setupQuestions.length} Ed setup questions to localise this SOP</span>
                )}
                {linkedPolicies.length > 0 && (
                  <span>{linkedPolicies.length} linked policy trigger{linkedPolicies.length === 1 ? "" : "s"}</span>
                )}
                {sourceRefs.length > 0 && (
                  <span>{sourceRefs.length} source reference{sourceRefs.length === 1 ? "" : "s"} checked</span>
                )}
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <button
              onClick={() => onSetup(template)}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              title="Answer setup questions and create a personalised SOP"
            >
              Personalise
            </button>
            <button
              onClick={() => onStart(template.template_id)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Start without local setup answers"
            >
              Quick start
            </button>
          </div>
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
  const { organization, organizationId, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ViewTab>("documents");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] =
    useState<SopDocumentPreviewState | null>(null);
  const [setupTemplate, setSetupTemplate] = useState<SopTemplate | null>(null);
  const [policyFilter, setPolicyFilter] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (pathname === "/dashboard/sops") {
      router.replace(`/dashboard/compliance/sops${window.location.search}`);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const linkedPolicy = params.get("policy");
    if (linkedPolicy) {
      setPolicyFilter(linkedPolicy);
      setActiveTab("documents");
    }
  }, [pathname, router]);

  // Fetch templates
  const { data: templatesData } = useSWR(
    user && organizationId
      ? `/api/sops/templates?organizationId=${encodeURIComponent(organizationId)}`
      : null,
    fetcher,
  );

  const { data: brandingData } = useSWR(
    user && organizationId
      ? `/api/settings/branding?organizationId=${encodeURIComponent(organizationId)}`
      : null,
    fetcher,
  );

  // Fetch active runs
  const { data: activeRunsData, mutate: mutateRuns } = useSWR(
    user && organizationId
      ? `/api/sops/runs?status=in_progress&organizationId=${encodeURIComponent(organizationId)}`
      : null,
    fetcher,
  );

  // Fetch completed runs
  const { data: completedRunsData } = useSWR(
    user && organizationId && activeTab === "completed"
      ? `/api/sops/runs?status=completed&organizationId=${encodeURIComponent(organizationId)}`
      : null,
    fetcher,
  );

  // Fetch active run detail when runner is open
  const { data: activeRunDetail, mutate: mutateRunDetail } = useSWR(
    activeRunId && organizationId
      ? `/api/sops/runs/${activeRunId}?organizationId=${encodeURIComponent(organizationId)}`
      : null,
    fetcher,
  );

  const templates: SopTemplate[] =
    templatesData?.templates || templatesData?.data?.templates || [];
  const activeRuns: SopRun[] =
    activeRunsData?.runs || activeRunsData?.data?.runs || [];
  const completedRuns: SopRun[] =
    completedRunsData?.runs || completedRunsData?.data?.runs || [];

  const policyFilteredTemplates = policyFilter
    ? templates.filter((template) =>
        (template.linked_policy_requirement_ids || []).includes(policyFilter),
      )
    : templates;
  const filteredTemplates =
    categoryFilter === "all"
      ? policyFilteredTemplates
      : policyFilteredTemplates.filter((t) => t.category === categoryFilter);
  const linkedPolicyName = policyFilter
    ? POLICY_LABELS[policyFilter] || policyFilter
    : null;
  const schoolName = organization?.name || "Your school";
  const schoolLogoUrl = brandingData?.settings?.logo_url as string | undefined;

  // Group templates by category
  const categories = [
    ...new Set(policyFilteredTemplates.map((t) => t.category)),
  ].sort();

  // Start a new SOP run
  const handleStartRun = useCallback(
    async (templateId: string) => {
      if (!organizationId) return;
      setStarting(true);
      try {
        const res = await sopAuthFetchWithTimeout("/api/sops/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            template_id: templateId,
            context:
              "Quick-started from the Schoolgle SOP library without local setup answers.",
          }),
        });
        const run = await parseSopRunResponse(res);
        setActiveRunId(run.id);
        mutateRuns();
        toast({
          title: "Checklist started",
          description: "The checklist is ready to work through.",
        });
      } catch (err) {
        toast({
          title: "Could not start SOP",
          description:
            err instanceof Error
              ? err.message
              : "Please check your connection and try again.",
          variant: "destructive",
        });
      } finally {
        setStarting(false);
      }
    },
    [mutateRuns, organizationId],
  );

  const handleCreatePersonalisedRun = useCallback(
    async (template: SopTemplate, answers: SetupAnswers) => {
      if (!organizationId) return;
      setStarting(true);
      try {
        const res = await sopAuthFetchWithTimeout("/api/sops/runs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId,
            template_id: template.template_id,
            context: buildPersonalisedSopContext(template, answers),
            linked_module: policyFilter ? "policy_manager" : undefined,
            setup_answers: answers,
          }),
        });
        const run = await parseSopRunResponse(res);
        setSetupTemplate(null);
        setDocumentPreview({ template, answers, runId: run.id });
        mutateRuns();
        toast({
          title: "SOP document and checklist created",
          description:
            "Review the branded SOP document, then open the checklist when you are ready.",
        });
      } catch (err) {
        toast({
          title: "Could not create personalised SOP",
          description:
            err instanceof Error
              ? err.message
              : "Please check your connection and try again.",
          variant: "destructive",
        });
      } finally {
        setStarting(false);
      }
    },
    [mutateRuns, organizationId, policyFilter],
  );

  // Resume an existing run
  const handleResumeRun = useCallback((runId: string) => {
    setActiveRunId(runId);
  }, []);

  // Update a step
  const handleStepUpdate = useCallback(
    async (stepId: string, status: string, notes?: string) => {
      if (!activeRunId || !organizationId) return;
      try {
        const response = await sopAuthFetchWithTimeout(
          `/api/sops/runs/${activeRunId}/steps/${stepId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ organizationId, status, notes }),
          },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Could not update the SOP step");
        }
        mutateRunDetail();
        mutateRuns();
      } catch (err) {
        toast({
          title: "Could not update step",
          description:
            err instanceof Error
              ? err.message
              : "Please check your connection and try again.",
          variant: "destructive",
        });
      }
    },
    [activeRunId, mutateRunDetail, mutateRuns, organizationId],
  );

  // Complete/abandon a run
  const handleComplete = useCallback(
    async (status: "completed" | "abandoned", notes?: string) => {
      if (!activeRunId || !organizationId) return;
      try {
        const response = await sopAuthFetchWithTimeout(
          `/api/sops/runs/${activeRunId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              organizationId,
              status,
              completion_notes: notes,
            }),
          },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Could not update the SOP run");
        }
        setActiveRunId(null);
        mutateRuns();
      } catch (err) {
        toast({
          title: "Could not update SOP",
          description:
            err instanceof Error
              ? err.message
              : "Please check your connection and try again.",
          variant: "destructive",
        });
      }
    },
    [activeRunId, mutateRuns, organizationId],
  );

  const runDetail = activeRunDetail?.run || activeRunDetail?.data?.run;
  const runTemplate = activeRunDetail?.template || activeRunDetail?.data?.template;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <ModulePageHeader
        moduleId="compliance"
        icon={ClipboardList}
        label="Compliance Playbook"
        title="Procedures (SOPs)"
        description="Turn policies into local, step-by-step routines with questions, tasks and evidence trails."
      />

      <SopWorkflowGuide onBrowseTemplates={() => setActiveTab("documents")} />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <Play className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeRuns.length}</p>
              <p className="text-xs text-slate-500">Active Checklists</p>
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
              <p className="text-xs text-slate-500">SOP Documents</p>
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

      {/* SOP Documents */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          {linkedPolicyName && (
            <Card className="border-purple-200 bg-purple-50/70 dark:border-purple-900/60 dark:bg-purple-950/20">
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-purple-950 dark:text-purple-100">
                    Showing SOP documents linked to {linkedPolicyName}
                  </p>
                  <p className="mt-1 text-xs text-purple-900/75 dark:text-purple-100/70">
                    These are the staff-facing procedures that sit underneath
                    the policy. The checklist runs are created from these
                    documents when evidence or tasks are needed.
                  </p>
                </div>
                <a
                  href="/dashboard/sops"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-purple-700 hover:border-purple-300 dark:border-purple-900/60 dark:bg-slate-950 dark:text-purple-200"
                >
                  Show all SOP documents
                </a>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                categoryFilter === "all"
                  ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              All ({policyFilteredTemplates.length})
            </button>
            {categories.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const count = policyFilteredTemplates.filter(
                (t) => t.category === cat,
              ).length;
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

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredTemplates.map((template) => (
              <SopDocumentCard
                key={template.template_id}
                template={template}
                onPreview={(selectedTemplate) =>
                  setDocumentPreview({
                    template: selectedTemplate,
                    answers: {},
                  })
                }
                onSetup={setSetupTemplate}
                onStart={handleStartRun}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-slate-500">
                {linkedPolicyName
                  ? `No SOP documents linked to ${linkedPolicyName} in this category yet`
                  : "No SOP documents in this category"}
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
                  Start a checklist from an SOP document, or Ed will
                  auto-trigger procedure runs when incidents are logged.
                </p>
                <button
                  onClick={() => setActiveTab("documents")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Browse SOP Documents
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
          {linkedPolicyName && (
            <Card className="border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">
                    Showing checklist starters linked to {linkedPolicyName}
                  </p>
                  <p className="mt-1 text-xs text-emerald-900/75 dark:text-emerald-100/70">
                    These are the execution checklists underneath the SOP
                    documents. Use them when you need task completion and an
                    evidence trail.
                  </p>
                </div>
                <a
                  href="/dashboard/sops"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:border-emerald-300 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-emerald-200"
                >
                  Show all SOPs
                </a>
              </CardContent>
            </Card>
          )}

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
              All ({policyFilteredTemplates.length})
            </button>
            {categories.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const count = policyFilteredTemplates.filter(
                (t) => t.category === cat,
              ).length;
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
                onSetup={setSetupTemplate}
                onStart={handleStartRun}
              />
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-slate-500">
                {linkedPolicyName
                  ? `No checklist starters linked to ${linkedPolicyName} in this category yet`
                  : "No checklist starters in this category"}
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
        {setupTemplate && (
          <SopSetupModal
            template={setupTemplate}
            starting={starting}
            onClose={() => setSetupTemplate(null)}
            onCreate={handleCreatePersonalisedRun}
            schoolLogoUrl={schoolLogoUrl}
            schoolName={schoolName}
          />
        )}
        {documentPreview && (
          <SopDocumentModal
            answers={documentPreview.answers}
            runId={documentPreview.runId}
            schoolLogoUrl={schoolLogoUrl}
            schoolName={schoolName}
            template={documentPreview.template}
            onClose={() => setDocumentPreview(null)}
            onOpenChecklist={(runId) => {
              setDocumentPreview(null);
              setActiveRunId(runId);
            }}
          />
        )}
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
