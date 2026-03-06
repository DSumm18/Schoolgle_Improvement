"use client";

import { motion } from "framer-motion";
import { CheckSquare, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/SupabaseAuthContext";
import { ComplianceTaskList } from "@/components/compliance";

export default function ComplianceTasksPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <Link
          href="/dashboard/compliance"
          className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-purple-600" />
        </Link>
        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-2xl">
          <CheckSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
            <Sparkles size={14} className="animate-pulse" />
            Action Tracking
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Compliance Tasks
          </h1>
        </div>
      </motion.div>

      <ComplianceTaskList organizationId={organizationId} />
    </div>
  );
}
