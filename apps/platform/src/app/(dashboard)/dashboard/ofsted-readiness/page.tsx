"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import OfstedFrameworkView from '@/components/OfstedFrameworkView';
import { FrameworkAssessment } from '@/components/framework/types';
import {
    Shield,
    Target,
    Brain,
    TrendingUp,
    FileText,
    AlertTriangle,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function OfstedReadinessPage() {
    const { organization } = useAuth();
    const [assessments, setAssessments] = useState<FrameworkAssessment>({});
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEvidence: 0,
        completedAreas: 0,
        totalGaps: 0
    });

    useEffect(() => {
        if (organization?.id) {
            fetchAssessments();
        }
    }, [organization?.id]);

    async function fetchAssessments() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('ofsted_assessments')
                .select('*')
                .eq('organization_id', organization?.id);

            if (data) {
                const assessmentMap: FrameworkAssessment = {};
                let evidenceCount = 0;
                let completed = 0;

                data.forEach(item => {
                    assessmentMap[item.subcategory_id] = {
                        schoolRating: item.school_rating,
                        schoolRationale: item.school_rationale,
                        aiRating: item.ai_rating,
                        aiRationale: item.ai_rationale,
                        evidence_count: item.evidence_count || 0, // Match the type in FrameworkAssessment
                        lastUpdated: item.updated_at
                    };
                    evidenceCount += item.evidence_count || 0;
                    if (item.school_rating && item.school_rating !== 'not_assessed') completed++;
                });

                setAssessments(assessmentMap);
                setStats({
                    totalEvidence: evidenceCount,
                    completedAreas: completed,
                    totalGaps: 0
                });
            }
        } catch (err) {
            console.error('Error fetching assessments:', err);
        } finally {
            setLoading(false);
        }
    }

    const handleUpdateAssessments = async (newAssessments: FrameworkAssessment) => {
        setAssessments(newAssessments);

        if (!organization?.id) return;

        // In this implementation, the component provides the updated state.
        // To persist, we can either save the entire state or just identify the subId that changed.
        // For simplicity and robustness, we can extract the entries and upsert.

        try {
            const entries = Object.entries(newAssessments);
            for (const [subId, data] of entries) {
                // We could debounce this or only save if it's the one that just changed.
                // For now, let's just use the saveAssessment helper for the specific one if we knew it.
                // Since handleUpdateAssessments receives the whole object, we'll upsert all active ones.
                await saveAssessment(subId, data);
            }
        } catch (err) {
            console.error('Error in bulk save:', err);
        }
    };

    const saveAssessment = async (subId: string, data: any) => {
        if (!organization?.id) return;

        try {
            const { error } = await supabase
                .from('ofsted_assessments')
                .upsert({
                    organization_id: organization.id,
                    subcategory_id: subId,
                    school_rating: data.schoolRating,
                    school_rationale: data.schoolRationale,
                    ai_rating: data.aiRating,
                    ai_rationale: data.aiRationale,
                    evidence_count: data.evidence_count,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'organization_id, subcategory_id'
                });

            if (error) throw error;
        } catch (err) {
            console.error('Error saving assessment:', err);
        }
    };

    if (loading) {
        return (
            <div className="p-8 space-y-8 animated-mesh min-h-screen">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    <div className="h-40 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
                        <div className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
                        <div className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 animated-mesh">
            {/* Header Area */}
            <div className="pt-12 pb-8 px-8 mb-8">
                <div className="max-w-[1600px] mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                                <Sparkles size={16} className="animate-pulse" />
                                Intelligent Inspection Readiness
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                                Ofsted Readiness Tracker
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl text-lg">
                                Real-time gap analysis and evidence alignment against the latest Education Inspection Framework.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">School Name</span>
                                    <p className="text-sm font-black text-slate-900 dark:text-white">{organization?.name}</p>
                                </div>
                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Sync</span>
                                    <p className="text-sm font-black text-emerald-600">Today, 09:42</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
                        <StatCard
                            icon={<FileText className="text-blue-600" size={24} />}
                            label="Evidence Items"
                            value={stats.totalEvidence}
                            suffix="Files Found"
                            color="blue"
                        />
                        <StatCard
                            icon={<Target className="text-emerald-600" size={24} />}
                            label="Assessment Progress"
                            value={`${Math.round((stats.completedAreas / 18) * 100)}%`}
                            suffix="Completed"
                            color="emerald"
                        />
                        <StatCard
                            icon={<Brain className="text-purple-600" size={24} />}
                            label="AI Assurance"
                            value="High"
                            suffix="Confidence"
                            color="purple"
                        />
                        <StatCard
                            icon={<TrendingUp className="text-amber-600" size={24} />}
                            label="Readiness Rating"
                            value="Good"
                            suffix="Predicted"
                            color="amber"
                        />
                    </div>
                </div>
            </div>

            <div className="px-8 mb-12">
                <div className="max-w-[1600px] mx-auto bg-blue-600 text-white rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                    <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                        <Shield size={48} className="text-white" />
                    </div>
                    <div className="flex-1 space-y-2 relative z-10">
                        <h4 className="font-black text-2xl uppercase tracking-tight">Active Framework: EIF November 2025</h4>
                        <p className="text-blue-100 font-medium leading-relaxed max-w-3xl">
                            The system is currently tracking your school's readiness against the latest Ofsted Education Inspection Framework. Use the scanner tool below to automatically link your cloud evidence to framework categories.
                        </p>
                    </div>
                    <button className="px-8 py-4 bg-white text-blue-600 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all relative z-10">
                        View Official Specs
                    </button>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                <OfstedFrameworkView
                    assessments={assessments}
                    setAssessments={handleUpdateAssessments}
                />
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, suffix, color }: { icon: React.ReactNode, label: string, value: string | number, suffix: string, color: 'blue' | 'emerald' | 'purple' | 'amber' | 'orange' | 'rose' }) {
    const colors = {
        blue: 'from-blue-500/10 to-transparent border-blue-100',
        emerald: 'from-emerald-500/10 to-transparent border-emerald-100',
        purple: 'from-purple-500/10 to-transparent border-purple-100',
        amber: 'from-amber-500/10 to-transparent border-amber-100',
        orange: 'from-orange-500/10 to-transparent border-orange-100',
        rose: 'from-rose-500/10 to-transparent border-rose-100'
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className={`bg-white dark:bg-slate-900 p-8 rounded-[2rem] border-2 ${colors[color]} shadow-sm hover:shadow-xl transition-all relative overflow-hidden group`}
        >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {icon}
            </div>
            <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-2xl bg-${color}-50 dark:bg-${color}-900/30`}>
                    {icon}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {value}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">{suffix}</span>
            </div>
        </motion.div>
    );
}
