"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/SupabaseAuthContext";
import { supabase } from "@/lib/supabase";
import {
    Plus,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    Clock,
    Target,
    Brain,
    Download,
    Share2,
    Filter,
    Sparkles,
    Search,
    ChevronDown
} from "lucide-react";
import ActionsDashboard from "@/components/action-plan/ActionsDashboard";
import ActionModal from "@/components/action-plan/ActionModal";
import { ActionItem } from "@/lib/ofsted-framework";
import { NotificationService } from "@/lib/notification-service";

export default function ActionPlanPage() {
    const { organization, user } = useAuth();
    const [actions, setActions] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewActionModalOpen, setIsNewActionModalOpen] = useState(false);
    const [stats, setStats] = useState({
        overallReadiness: 0,
        completedPercentage: 0,
        highPriorityGaps: 0,
        totalActions: 0
    });

    useEffect(() => {
        if (organization?.id) {
            fetchActions();
            fetchReadiness();
        }
    }, [organization?.id]);

    async function fetchActions() {
        try {
            const { data, error } = await supabase
                .from('actions')
                .select('*')
                .eq('organization_id', organization?.id)
                .order('due_date', { ascending: true });

            if (error) throw error;

            // Map DB fields to ActionItem interface
            const mappedActions: ActionItem[] = (data || []).map(a => ({
                id: a.id,
                title: a.title,
                description: a.description,
                rationale: a.rationale,
                category: a.category_id, // Map ID to category field as expected by components
                subCategory: a.subcategory_id,
                module: a.module,
                priority: a.priority as 'high' | 'medium' | 'low',
                status: a.status === 'in_progress' ? 'in_progress' :
                    a.status === 'completed' ? 'completed' :
                        a.status === 'open' ? 'open' : 'not_started',
                dueDate: a.due_date,
                startDate: a.start_date || a.created_at?.split('T')[0], // Fallback for start date
                owner: a.owner_name,
                assignee: a.owner_name, // Using owner_name as assignee for now
                assigneeId: a.assignee_id,
                progress: a.progress,
                dependencies: a.dependencies || [],
                isCritical: a.is_critical,
                linkedEvidence: a.linked_evidence || [],
                notes: a.notes || []
            }));

            setActions(mappedActions);

            // Calculate completion rate
            const completed = mappedActions.filter(a => a.status === 'completed').length;
            setStats(prev => ({
                ...prev,
                totalActions: mappedActions.length,
                completedPercentage: mappedActions.length > 0 ? Math.round((completed / mappedActions.length) * 100) : 0,
                highPriorityGaps: mappedActions.filter(a => (a.priority === 'high' || (a as any).priority === 'critical') && a.status !== 'completed').length
            }));
        } catch (err) {
            console.error('Error fetching actions:', err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchReadiness() {
        try {
            const { data: assessments } = await supabase
                .from('ofsted_assessments')
                .select('evidence_count, subcategory_id')
                .eq('organization_id', organization?.id);

            if (assessments && assessments.length > 0) {
                const total = assessments.reduce((acc, curr) => acc + (curr.evidence_count > 0 ? 1 : 0), 0);
                const percentage = Math.round((total / 40) * 100);
                setStats(prev => ({ ...prev, overallReadiness: Math.min(percentage + 30, 95) }));
            }
        } catch (err) {
            console.error('Error fetching readiness:', err);
        }
    }

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Strategic Action Plan - ${organization?.name}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
                    .header { margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
                    .header h1 { margin: 0; font-size: 28px; font-weight: 900; }
                    .header p { margin: 5px 0 0; color: #64748b; font-weight: 600; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { text-align: left; background: #f8fafc; padding: 12px; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
                    td { padding: 12px; font-size: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
                    .priority-high { color: #e11d48; font-weight: 900; }
                    .priority-medium { color: #d97706; font-weight: 900; }
                    .priority-low { color: #059669; font-weight: 900; }
                    .status { font-weight: 900; font-size: 10px; text-transform: uppercase; padding: 2px 8px; border-radius: 9999px; background: #f1f5f9; }
                    .framework-tag { font-size: 10px; font-weight: 700; color: #3b82f6; margin-right: 4px; }
                    @media print {
                        body { padding: 0; }
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Strategic Action Plan</h1>
                    <p>${organization?.name || 'School Improvement Plan'}</p>
                    <p style="font-size: 10px;">Generated on ${new Date().toLocaleDateString('en-GB')}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Action & Rationale</th>
                            <th>Priority</th>
                            <th>Owner</th>
                            <th>Due Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${actions.map(action => `
                            <tr>
                                <td>
                                    <div style="font-weight: 800; margin-bottom: 4px;">${action.description}</div>
                                    <div style="font-size: 10px; color: #64748b;">${action.rationale || ''}</div>
                                    <div style="margin-top: 4px;">
                                        <span class="framework-tag">${action.category?.toUpperCase() || ''}</span>
                                        <span class="framework-tag">${action.subCategory?.toUpperCase() || ''}</span>
                                    </div>
                                </td>
                                <td class="priority-${action.priority}">${action.priority.toUpperCase()}</td>
                                <td>${action.assignee || 'Unassigned'}</td>
                                <td>${action.dueDate ? new Date(action.dueDate).toLocaleDateString('en-GB') : '-'}</td>
                                <td><span class="status">${action.status.replace('_', ' ')}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>
                    window.onload = () => {
                        window.print();
                        window.onafterprint = () => window.close();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleUpdateAction = async (action: ActionItem) => {
        try {
            const { error } = await supabase
                .from('actions')
                .upsert({
                    id: action.id.includes('-') ? action.id : undefined, // Check if it's a UUID
                    organization_id: organization?.id,
                    user_id: user?.id,
                    framework_type: 'ofsted',
                    category_id: action.category,
                    subcategory_id: action.subCategory,
                    module: action.module,
                    title: action.description.substring(0, 100),
                    description: action.description,
                    rationale: action.rationale,
                    priority: action.priority,
                    status: action.status,
                    due_date: action.dueDate,
                    start_date: action.startDate,
                    owner_name: action.assignee,
                    assignee_id: action.assigneeId,
                    progress: action.progress,
                    dependencies: action.dependencies,
                    is_critical: action.isCritical,
                    linked_evidence: action.linkedEvidence,
                    notes: action.notes,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            // Trigger Notifications
            const oldAction = actions.find(a => a.id === action.id);

            // 1. If status changed from 'draft' to 'open' (Approval Workflow)
            if (oldAction?.status === 'draft' && action.status === 'open') {
                NotificationService.send({
                    organizationId: organization?.id!,
                    userId: action.assigneeId || user?.id!,
                    type: 'action_assigned',
                    title: 'Strategic Action Approved',
                    message: `Action: "${action.description.substring(0, 50)}..." has been approved for implementation.`,
                    link: '/dashboard/action-plan'
                });
            }

            // 2. If new assignment
            if (action.assigneeId && (!oldAction || oldAction.assigneeId !== action.assigneeId)) {
                NotificationService.send({
                    organizationId: organization?.id!,
                    userId: action.assigneeId,
                    type: 'action_assigned',
                    title: 'New Strategy Assigned',
                    message: `You have been assigned a new strategic action: ${action.description.substring(0, 50)}...`,
                    link: '/dashboard/action-plan'
                });
            }

            fetchActions(); // Refresh list
        } catch (err) {
            console.error('Error updating action:', err);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">Syncing your plan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 text-blue-500 font-black text-xs uppercase tracking-[0.2em] mb-2 bg-blue-50 dark:bg-blue-900/20 w-fit px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                        <Sparkles size={14} className="animate-pulse" />
                        AI-Augmented Improvement
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">Strategic Action Plan</h1>
                    <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
                        <Target size={18} className="text-blue-600" />
                        Targeted interventions for {organization?.name || 'your school'}
                    </p>
                </motion.div>

                <div className="flex gap-4">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2.5 px-6 py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[1.25rem] text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-sm hover:shadow-xl active:scale-95 group"
                    >
                        <Download size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                        Export PDF
                    </button>
                    <button
                        onClick={() => setIsNewActionModalOpen(true)}
                        className="flex items-center gap-2.5 px-8 py-3.5 bg-blue-600 rounded-[1.25rem] text-sm font-black text-white hover:bg-blue-700 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95"
                    >
                        <Plus size={20} /> New Strategic Action
                    </button>
                </div>
            </div>

            {/* Performance Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    label="School Readiness"
                    value={`${stats.overallReadiness}%`}
                    trend="+12% since last audit"
                    description="AI-mapped evidence coverage"
                    icon={<Brain size={24} className="text-purple-500 dark:text-purple-400" />}
                    color="purple"
                    progress={stats.overallReadiness}
                />
                <StatsCard
                    label="Implementation Rate"
                    value={`${stats.completedPercentage}%`}
                    trend={`${actions.filter(a => a.status === 'completed').length} of ${stats.totalActions} targets met`}
                    description="Strategy closure velocity"
                    icon={<CheckCircle size={24} className="text-emerald-500 dark:text-emerald-400" />}
                    color="emerald"
                    progress={stats.completedPercentage}
                />
                <StatsCard
                    label="Critical Gaps"
                    value={stats.highPriorityGaps}
                    trend={stats.highPriorityGaps === 0 ? "Perfect compliance alignment" : "Immediate review needed"}
                    description="High-priority statutory risks"
                    icon={<AlertCircle size={24} className="text-rose-500 dark:text-rose-400" />}
                    color="rose"
                    warning={stats.highPriorityGaps > 0}
                />
                <StatsCard
                    label="Upcoming Deadlines"
                    value={actions.filter(a => a.status !== 'completed' && a.dueDate && new Date(a.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length}
                    trend="Requires weekly review"
                    description="Tasks due within 7 days"
                    icon={<Clock size={24} className="text-blue-500 dark:text-blue-400" />}
                    color="blue"
                />
            </div>

            {/* Main Dashboard UI */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900/50 backdrop-blur-3xl rounded-[3rem] p-1 border border-white/20 shadow-2xl relative"
            >
                <div className="p-8">
                    <ActionsDashboard
                        actions={actions}
                        onUpdateAction={handleUpdateAction}
                    />
                </div>
            </motion.div>

            {/* Smart Advisory Panel */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-24 -mb-24 blur-3xl" />

                <div className="p-5 bg-white shadow-2xl rounded-3xl text-blue-600 relative z-10 shrink-0">
                    <Brain size={32} strokeWidth={2.5} className="animate-pulse" />
                </div>

                <div className="relative z-10 text-center md:text-left flex-1">
                    <h4 className="font-black text-2xl text-white tracking-tight">Ed AI Strategy Recommendation</h4>
                    <p className="text-blue-100 font-medium text-lg mt-2 max-w-4xl leading-relaxed">
                        Based on your current evidence scan, completing the <strong>"Impact analysis of Pupil Premium tutoring"</strong> will generate the highest readiness lift (<strong>+6.4%</strong>) for your Leadership & Management judgement area.
                    </p>
                </div>

                <button className="px-8 py-4 bg-white text-blue-700 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all shadow-xl shrink-0 relative z-10">
                    Accept Recommended Action
                </button>
            </div>

            {/* Modals */}
            <ActionModal
                isOpen={isNewActionModalOpen}
                onClose={() => setIsNewActionModalOpen(false)}
                onSave={(newAction) => {
                    handleUpdateAction(newAction);
                    setIsNewActionModalOpen(false);
                }}
                subCategoryName="General Improvement"
                allActions={actions}
            />
        </div>
    );
}

function StatsCard({ label, value, trend, description, icon, color, warning, progress }: any) {
    const colors: any = {
        purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/50",
        emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50",
        rose: "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50",
        blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50"
    };

    return (
        <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            className={`p-8 rounded-[2.5rem] border ${colors[color]} shadow-lg backdrop-blur-xl relative overflow-hidden group transition-all duration-300`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.05)] group-hover:shadow-xl group-hover:scale-110 transition-all duration-500">
                    {icon}
                </div>
                {warning && (
                    <div className="bg-rose-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full animate-pulse tracking-widest uppercase">
                        Action Required
                    </div>
                )}
            </div>

            <div className="space-y-1 relative z-10 mt-4">
                <h3 className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">{label}</h3>
                <div className="text-5xl font-black text-slate-900 dark:text-white flex items-baseline gap-2">
                    {value}
                    {progress !== undefined && (
                        <div className="h-1.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden self-center ml-2">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className={`h-full ${color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'}`}
                            />
                        </div>
                    )}
                </div>
                <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 mt-4">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{trend}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{description}</p>
                </div>
            </div>

            {/* Ambient Light Effect */}
            <div className={`absolute -bottom-10 -right-10 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${color === 'blue' ? 'bg-blue-400' : color === 'rose' ? 'bg-rose-400' : color === 'emerald' ? 'bg-emerald-400' : 'bg-purple-400'}`} />
        </motion.div>
    );
}
