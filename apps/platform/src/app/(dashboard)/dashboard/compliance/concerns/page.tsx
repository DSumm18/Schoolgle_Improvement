"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Sparkles } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { LowLevelConcernsLog } from "@/components/compliance";

export default function ConcernsPage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="p-3 bg-rose-100 dark:bg-rose-900/20 rounded-2xl">
          <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
            <Sparkles size={14} className="animate-pulse" />
            KCSIE Part 4
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Low-Level Concerns Log
          </h1>
        </div>
      </motion.div>

      <LowLevelConcernsLog organizationId={organizationId} />
    </div>
  );
}
