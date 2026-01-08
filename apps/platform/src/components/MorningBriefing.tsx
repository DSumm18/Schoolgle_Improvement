"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCircle, Clock, AlertCircle, TrendingUp, FileCheck, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ErrorBoundary from "@/components/common/ErrorBoundary";

interface PendingAction {
  id: string;
  type: 'pulse_check' | 'evidence_review' | 'intervention_update' | 'assessment';
  title: string;
  description: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  count?: number;
}

export default function MorningBriefing({ organizationId }: { organizationId: string | null }) {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPendingActions() {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        const { data: pulseChecks } = await supabase
          .from('pulse_checks')
          .select('id, date, topic, intervention_id, school_interventions!inner(organization_id)')
          .eq('school_interventions.organization_id', organizationId)
          .order('date', { ascending: false })
          .limit(5);

        const { data: interventions } = await supabase
          .from('school_interventions')
          .select('id, start_date, status, research_strategies(title)')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .limit(5);

        const pendingActions: PendingAction[] = [];

        if (pulseChecks && pulseChecks.length > 0) {
          pendingActions.push({
            id: 'pulse-checks',
            type: 'pulse_check',
            title: `${pulseChecks.length} Pulse Check${pulseChecks.length > 1 ? 's' : ''} to Review`,
            description: 'New intervention data is ready for analysis.',
            priority: 'medium',
            count: pulseChecks.length,
          });
        }

        if (interventions && interventions.length > 0) {
          pendingActions.push({
            id: 'interventions',
            type: 'intervention_update',
            title: `${interventions.length} Active Intervention${interventions.length > 1 ? 's' : ''}`,
            description: 'Weekly status updates due for core programs.',
            priority: 'medium',
            count: interventions.length,
          });
        }

        setActions(pendingActions);
      } catch (error: any) {
        console.error('Error fetching pending actions:', error);
        setError("Failed to load morning briefing. Please try refreshing.");
      } finally {
        setLoading(false);
      }
    }

    fetchPendingActions();
  }, [organizationId]);

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-rose-200/50 bg-rose-50/10">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <AlertCircle className="text-rose-500" size={32} />
          <p className="text-sm font-bold text-rose-600 uppercase tracking-widest">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-slate-200/50 dark:border-slate-800/50">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary name="MorningBriefing">
      <div className="glass-card rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/5">
        <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Morning Briefing</h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Priority Actions</p>
            </div>
          </div>
          <div className="flex -space-x-2">
            {/* Placeholder for collaborator avatars */}
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 space-y-4">
          <AnimatePresence mode="popLayout">
            {actions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="inline-flex p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-emerald-500 mb-4 animate-bounce">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Clear</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                  You've completed all priority tasks for today.
                </p>
              </motion.div>
            ) : (
              actions.map((action, idx) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.01, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-left p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={48} />
                  </div>

                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${action.type === 'pulse_check' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' :
                      action.type === 'intervention_update' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' :
                        'bg-slate-50 dark:bg-slate-900/20 text-slate-600'
                      }`}>
                      {getIcon(action.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate">
                          {action.title}
                        </h3>
                        <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium">
                        {action.description}
                      </p>

                      <div className="flex items-center gap-4 mt-4">
                        {action.count && (
                          <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full border border-slate-200/50 dark:border-slate-700/50">
                            {action.count} PENDING
                          </div>
                        )}
                        {action.dueDate && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Clock size={12} />
                            BY {new Date(action.dueDate).toLocaleDateString('en-GB')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="px-8 py-4 bg-blue-50/50 dark:bg-blue-900/10 border-t border-slate-100 dark:border-slate-800/50 text-center">
          <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 uppercase tracking-widest flex items-center justify-center gap-2 mx-auto">
            View Master Planner
            <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </ErrorBoundary>
  );
}

const getIcon = (type: string) => {
  switch (type) {
    case 'pulse_check': return <CheckCircle size={22} />;
    case 'intervention_update': return <TrendingUp size={22} />;
    case 'evidence_review': return <FileCheck size={22} />;
    default: return <AlertCircle size={22} />;
  }
};
