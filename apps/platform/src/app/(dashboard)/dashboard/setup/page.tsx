"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Upload,
  Users,
  GraduationCap,
  Building2,
  AlertTriangle,
  ArrowRight,
  Download,
  FileText,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  href: string;
  checkEndpoint?: string;
  checkField?: string;
  threshold?: number;
  complete: boolean;
  count?: number;
  action: string;
}

export default function SetupWizardPage() {
  const { user, organizationId } = useAuth();
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [loading, setLoading] = useState(true);

  const checkSetupStatus = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);

    const token = await user?.getIdToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Check staff count
    let staffCount = 0;
    try {
      const res = await fetch(`/api/staff?organizationId=${organizationId}`, {
        headers,
      });
      const data = await res.json();
      staffCount = (data?.staff || data?.data || []).length;
    } catch {
      /* empty */
    }

    // Check pupils count
    let pupilCount = 0;
    try {
      const res = await fetch(`/api/pupils?organizationId=${organizationId}`, {
        headers,
      });
      const data = await res.json();
      pupilCount = data?.count || 0;
    } catch {
      /* empty */
    }

    // Check risks count
    let riskCount = 0;
    try {
      const res = await fetch(`/api/risk?organizationId=${organizationId}`, {
        headers,
      });
      const data = await res.json();
      riskCount = (data?.risks || []).length;
    } catch {
      /* empty */
    }

    // Check governance
    let governorCount = 0;
    try {
      const res = await fetch(
        `/api/governance/governors?organizationId=${organizationId}`,
        { headers },
      );
      const data = await res.json();
      governorCount = (data?.governors || data?.data || []).length;
    } catch {
      /* empty */
    }

    // Check compliance policies
    let policyCount = 0;
    try {
      const res = await fetch(
        `/api/compliance/items?organizationId=${organizationId}&type=policy&limit=1`,
        { headers },
      );
      const data = await res.json();
      policyCount = data?.total || (data?.items || []).length;
    } catch {
      /* empty */
    }

    setSteps([
      {
        id: "staff",
        title: "Connect Staff Data",
        description:
          staffCount > 0
            ? `${staffCount} staff members connected`
            : "Link your staff list from your MIS or HR records",
        icon: Users,
        href: "/dashboard/hr/people",
        complete: staffCount >= 3,
        count: staffCount,
        action: staffCount > 0 ? "View Staff" : "Connect Staff",
      },
      {
        id: "pupils",
        title: "Connect Pupil Data",
        description:
          pupilCount > 0
            ? `${pupilCount} pupils connected`
            : "Link your pupil roll to power attendance, SEND, and behaviour",
        icon: GraduationCap,
        href: "/dashboard/pupils",
        complete: pupilCount >= 10,
        count: pupilCount,
        action: pupilCount > 0 ? "View Pupils" : "Connect Pupils",
      },
      {
        id: "governance",
        title: "Set Up Governance",
        description:
          governorCount > 0
            ? `${governorCount} governors added`
            : "Add your governing body members",
        icon: Building2,
        href: "/dashboard/governance",
        complete: governorCount >= 1,
        count: governorCount,
        action: governorCount > 0 ? "View Governors" : "Add Governors",
      },
      {
        id: "risks",
        title: "Create Risk Register",
        description:
          riskCount > 0
            ? `${riskCount} risks recorded`
            : "Start recording your school's risk register",
        icon: AlertTriangle,
        href: "/dashboard/risk",
        complete: riskCount >= 1,
        count: riskCount,
        action: riskCount > 0 ? "View Risks" : "Add First Risk",
      },
      {
        id: "compliance",
        title: "Review Compliance",
        description:
          policyCount > 0
            ? `${policyCount} policies tracked`
            : "Start with the 36 built-in statutory policy templates",
        icon: FileText,
        href: "/dashboard/compliance",
        complete: policyCount >= 1,
        count: policyCount,
        action: policyCount > 0 ? "View Policies" : "Start Compliance",
      },
    ]);

    setLoading(false);
  }, [organizationId, user]);

  useEffect(() => {
    checkSetupStatus();
  }, [checkSetupStatus]);

  const completedCount = steps.filter((s) => s.complete).length;
  const totalSteps = steps.length;
  const progress =
    totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-xs font-semibold">
          <Sparkles size={12} />
          Getting Started
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Set Up Your School
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
          Connect your school&apos;s data sources to get the most out of
          Schoolgle. Complete these steps in any order — you can add more
          sources later.
        </p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Setup Progress
          </span>
          <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
            {completedCount} of {totalSteps} complete
          </span>
        </div>
        <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        {progress === 100 && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-2">
            All data sources connected! Your school is ready to use Schoolgle.
          </p>
        )}
      </motion.div>

      {/* Steps */}
      <div className="space-y-3">
        <AnimatePresence>
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
            >
              <Link href={step.href}>
                <div
                  className={`group flex items-center gap-4 p-5 rounded-xl border transition-all cursor-pointer ${
                    step.complete
                      ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-sm"
                  }`}
                >
                  {/* Status Icon */}
                  <div className="shrink-0">
                    {step.complete ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-zinc-300 dark:text-zinc-600" />
                    )}
                  </div>

                  {/* Module Icon */}
                  <div
                    className={`shrink-0 p-2.5 rounded-xl ${
                      step.complete
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/30 group-hover:text-sky-600"
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold text-sm ${
                        step.complete
                          ? "text-emerald-800 dark:text-emerald-200"
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {step.description}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span
                      className={`text-xs font-semibold ${
                        step.complete
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-sky-600 dark:text-sky-400"
                      }`}
                    >
                      {step.action}
                    </span>
                    <ChevronRight
                      size={14}
                      className="text-zinc-400 group-hover:text-sky-500 transition-colors"
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5"
      >
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
          Data Format Templates
        </h3>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/staff/import"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
          >
            <Download size={12} />
            Staff CSV Template
          </a>
          <button
            onClick={async () => {
              try {
                const token = await user?.getIdToken();
                const res = await fetch("/api/pupils", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ template: true }),
                });
                const data = await res.json();
                if (data.template) {
                  const blob = new Blob([data.template], {
                    type: "text/csv",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = data.filename || "pupil-import-template.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }
              } catch {
                /* empty */
              }
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-sky-300 dark:hover:border-sky-700 transition-colors"
          >
            <Download size={12} />
            Pupil CSV Template
          </button>
        </div>
      </motion.div>

      {/* Skip */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          Skip setup and go to dashboard
        </Link>
      </div>
    </div>
  );
}
