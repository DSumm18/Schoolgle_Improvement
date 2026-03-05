"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
    Plus,
    CheckCircle,
    AlertCircle,
    Clock,
    Target,
    Brain,
    Download,
    Sparkles,
    Search,
    ArrowUp,
    ArrowDown,
    Filter,
    LayoutList,
    BarChart2,
    DollarSign,
    BookOpen,
    Users,
    TrendingUp,
    Calendar as CalendarIcon,
} from "lucide-react";
import ActionsDashboard from "@/components/action-plan/ActionsDashboard";
import EnhancedActionModal from "@/components/action-plan/EnhancedActionModal";
import { Action, getStatusMatrix, FUNDING_SOURCES, getFinancialYears, UserStatus, AIStatus } from "@/lib/actions-hub";
import type { ActionCosts, GanttBar } from "@/lib/actions-hub";

interface Stats {
    overallReadiness: number;
    completedPercentage: number;
    highPriorityGaps: number;
    totalActions: number;
    totalEstimated: number;
    totalActual: number;
}

export default function ActionsHubPage() {
    const { organization, user } = useAuth();
    const [actions, setActions] = useState<Action[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<Action | undefined>(undefined);
    const [stats, setStats] = useState<Stats>({
        overallReadiness: 0,
        completedPercentage: 0,
        highPriorityGaps: 0,
        totalActions: 0,
        totalEstimated: 0,
        totalActual: 0,
    });

    useEffect(() => {
        fetchActions();
    }, [organization?.id]);

    async function fetchActions() {
        if (!organization?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('actions')
                .select('*')
                .eq('organization_id', organization?.id)
                .order('due_date', { ascending: true, nullsFirst: true });

            if (error) throw error;

            // Map DB fields to Action interface from actions-hub.ts
            const mappedActions: Action[] = (data || []).map((a: any) => ({
                id: a.id,
                organization_id: a.organization_id,
                framework_type: a.framework_type || 'ofsted',
                category_id: a.category_id,
                subcategory_id: a.subcategory_id,
                title: a.title || a.description?.substring(0, 100) || 'Untitled',
                description: a.description,
                success_criteria: a.success_criteria,
                eef_strategy: a.eef_strategy,
                eef_impact_months: a.eef_impact_months,
                status: a.status || 'draft',
                user_status: a.user_status || a.status || 'draft',
                ai_status: a.ai_status || 'not_assessed',
                ai_rationale: a.ai_rationale,
                owner_id: a.owner_id,
                owner_name: a.owner_name,
                assigned_date: a.assigned_date ? new Date(a.assigned_date) : undefined,
                due_date: a.due_date ? new Date(a.due_date) : undefined,
                completed_date: a.completed_date ? new Date(a.completed_date) : undefined,
                implementation_date: a.implementation_date ? new Date(a.implementation_date) : undefined,
                priority: a.priority || 'medium',
                estimated_cost: a.estimated_cost,
                actual_cost: a.actual_cost,
                funding_source: a.funding_source,
                financial_year: a.financial_year,
                evidence_count: a.evidence_count || 0,
                notes: a.notes || [],
                last_chased: a.last_chased ? new Date(a.last_chased) : undefined,
                chase_count: a.chase_count || 0,
                approved_by: a.approved_by,
                approved_at: a.approved_at ? new Date(a.approved_at) : undefined,
                source: a.source || 'manual',
                created_by: a.created_by,
                auth_id: a.auth_id,
                created_at: a.created_at,
                updated_at: a.updated_at,
            }));

            setActions(mappedActions);
            calculateStats(mappedActions);
        } catch (err) {
            console.error('Error fetching actions:', err);
        } finally {
            setLoading(false);
        }
    }

    function calculateStats(actions: Action[]) {
        const completed = actions.filter(a => a.user_status === 'complete').length;
        const inProgress = actions.filter(a => a.user_status === 'in_progress').length;
        const gaps = actions.filter(a => a.ai_status === 'not_met' && a.user_status !== 'complete').length;
        const totalEstimated = actions.reduce((sum, a) => sum + (a.estimated_cost || 0), 0);
        const totalActual = actions.reduce((sum, a) => sum + (a.actual_cost || 0), 0);

        setStats({
            overallReadiness: Math.min(50 + (completed * 5), 95),
            completedPercentage: actions.length > 0 ? Math.round((completed / actions.length) * 100) : 0,
            highPriorityGaps: gaps,
            totalActions: actions.length,
            totalEstimated,
            totalActual,
        });
    }

    const handleCreateAction = () => {
        setEditingAction(undefined);
        setIsModalOpen(true);
    };

    const handleEditAction = (action: Action) => {
        setEditingAction(action);
        setIsModalOpen(true);
    };

    const handleSaveAction = async (actionData: Partial<Action>) => {
        try {
            const isUpdate = editingAction?.id;

            const payload = {
                organization_id: organization?.id,
                framework_type: 'ofsted',
                user_id: user?.id,
                ...actionData,
                // Calculate derived fields for status
                status: actionData.user_status || actionData.status || 'draft',
            };

            if (isUpdate) {
                const { error } = await supabase
                    .from('actions')
                    .update(payload)
                    .eq('id', editingAction.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('actions')
                    .insert({
                        ...payload,
                        created_by: user?.id,
                        created_at: new Date().toISOString(),
                    });

                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchActions();
        } catch (err) {
            console.error('Error saving action:', err);
        }
    };

    const handleUpdateAction = async (action: Action) => {
        try {
            const { error } = await supabase
                .from('actions')
                .update({
                    user_status: action.user_status,
                    ai_status: action.ai_status,
                    progress: action.user_status === 'complete' ? 100 :
                        action.user_status === 'in_progress' ? 50 : 0,
                })
                .eq('id', action.id);

            if (error) throw error;
            fetchActions();
        } catch (err) {
            console.error('Error updating action:', err);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Loading Actions Hub...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-[1800px] mx-auto min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 text-blue-500 font-black text-xs uppercase tracking-[0.2em] mb-2 bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-100">
                        <Sparkles size={14} className="animate-pulse" />
                        AI-Augmented Actions Hub
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tight">Actions Hub</h1>
                    <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
                        <Target size={18} className="text-blue-600" />
                        Strategic improvement with EEF research backing
                    </p>
                </motion.div>

                <div className="flex gap-4">
                    <button
                        onClick={handleCreateAction}
                        className="flex items-center gap-2.5 px-8 py-3.5 bg-blue-600 rounded-[1.25rem] text-sm font-black text-white hover:bg-blue-700 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} /> New Action
                    </button>
                </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatsCard
                    label="Completion Rate"
                    value={`${stats.completedPercentage}%`}
                    trend={`${actions.filter(a => a.user_status === 'complete').length} of ${stats.totalActions} complete`}
                    description="User status completion"
                    icon={<CheckCircle size={24} className="text-emerald-500" />}
                    color="emerald"
                    progress={stats.completedPercentage}
                />
                <StatsCard
                    label="Identified Gaps"
                    value={stats.highPriorityGaps}
                    trend={stats.highPriorityGaps === 0 ? "All gaps addressed" : "Requires attention"}
                    description="Actions where AI status is 'not met'"
                    icon={<AlertCircle size={24} className={stats.highPriorityGaps > 0 ? "text-rose-500" : "text-emerald-500"} />}
                    color={stats.highPriorityGaps > 0 ? "rose" : "emerald"}
                    warning={stats.highPriorityGaps > 0}
                />
                <StatsCard
                    label="In Progress"
                    value={actions.filter(a => a.user_status === 'in_progress').length}
                    trend="Active work happening"
                    description="Actions currently being implemented"
                    icon={<TrendingUp size={24} className="text-blue-500" />}
                    color="blue"
                />
                <StatsCard
                    label="Budget Used"
                    value={`£${(stats.totalActual / 1000).toFixed(1)}k`}
                    trend={`of £${(stats.totalEstimated / 1000).toFixed(1)}k estimated`}
                    description="Actual vs estimated spending"
                    icon={<DollarSign size={24} className="text-purple-500" />}
                    color="purple"
                />
                <StatsCard
                    label="Upcoming Deadlines"
                    value={actions.filter(a => a.user_status !== 'complete' && a.due_date && new Date(a.due_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                    trend="Next 7 days"
                    description="Actions due soon"
                    icon={<Clock size={24} className="text-amber-500" />}
                    color="amber"
                />
            </div>

            {/* Main Dashboard */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2rem] p-1 border border-slate-200 shadow-2xl relative"
            >
                <div className="p-8">
                    <ActionsDashboard
                        actions={actions}
                        onUpdateAction={handleUpdateAction}
                        onEditAction={handleEditAction}
                    />
                </div>
            </motion.div>

            {/* Enhanced Modal */}
            {isModalOpen && (
                <EnhancedActionModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveAction}
                    action={editingAction}
                    mode={editingAction ? 'edit' : 'create'}
                    organizationId={organization?.id || ''}
                />
            )}
        </div>
    );
}

function StatsCard({ label, value, trend, description, icon, color, warning, progress }: {
    label: string;
    value: string | number;
    trend: string;
    description: string;
    icon: React.ReactNode;
    color: 'emerald' | 'rose' | 'blue' | 'purple' | 'amber';
    warning?: boolean;
    progress?: number;
}) {
    const colors: any = {
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
        rose: "bg-rose-50 border-rose-100 text-rose-700",
        blue: "bg-blue-50 border-blue-100 text-blue-700",
        purple: "bg-purple-50 border-purple-100 text-purple-700",
        amber: "bg-amber-50 border-amber-100 text-amber-700",
    };

    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            className={`p-6 rounded-2xl border ${colors[color]} shadow-lg relative overflow-hidden group transition-all duration-300`}
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                    {icon}
                </div>
                {warning && (
                    <div className="bg-rose-500 text-white text-[9px] font-bold px-3 py-1 rounded-full animate-pulse tracking-widest uppercase">
                        Review
                    </div>
                )}
            </div>

            <div className="space-y-1 relative z-10 mt-4">
                <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{label}</h3>
                <div className="text-4xl font-black text-slate-900 flex items-baseline gap-2">
                    {value}
                    {progress !== undefined && (
                        <div className="h-1.5 w-20 bg-slate-200 rounded-full overflow-hidden self-center ml-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className={`h-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}`}
                            />
                        </div>
                    )}
                </div>
                <div className="text-xs font-bold text-slate-600">{trend}</div>
                <div className="text-[10px] text-slate-400">{description}</div>
            </div>
        </motion.div>
    );
}
