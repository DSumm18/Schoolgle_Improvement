"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Sparkles, BookOpen, FileSearch, BarChart3 } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import { OfstedDashboard } from '@/components/ofsted';
import { OfstedFrameworkView } from '@/components/ofsted';
import { OfstedEvidenceMatcher } from '@/components/ofsted';
import { OfstedReadinessReport } from '@/components/ofsted';
import { FrameworkAssessment } from '@/components/framework/types';

type Tab = 'overview' | 'framework' | 'evidence' | 'readiness';

export default function OfstedReadinessPage() {
    const { organization } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [assessments, setAssessments] = useState<FrameworkAssessment>({});

    const organizationId = organization?.id || '';

    // Fetch assessments when organization changes
    const fetchAssessments = useCallback(async () => {
        if (!organizationId) return;

        try {
            const { data, error } = await supabase
                .from('ofsted_assessments')
                .select('*')
                .eq('organization_id', organizationId);

            if (error) {
                console.error('Supabase error:', error);
            }

            if (data) {
                const assessmentMap: FrameworkAssessment = {};
                data.forEach(item => {
                    assessmentMap[item.subcategory_id] = {
                        schoolRating: item.school_rating,
                        schoolRationale: item.school_rationale,
                        aiRating: item.ai_rating,
                        aiRationale: item.ai_rationale,
                        evidence_count: item.evidence_count || 0,
                        lastUpdated: item.updated_at
                    };
                });

                setAssessments(assessmentMap);
            }
        } catch (err) {
            console.error('Error fetching assessments:', err);
        }
    }, [organizationId]);

    // Fetch on mount and when switching to framework tab
    useEffect(() => {
        fetchAssessments();
    }, [fetchAssessments, activeTab]);

    const handleUpdateAssessments = async (newAssessments: FrameworkAssessment) => {
        setAssessments(newAssessments);

        if (!organizationId) return;

        try {
            const entries = Object.entries(newAssessments);
            for (const [subId, data] of entries) {
                await supabase
                    .from('ofsted_assessments')
                    .upsert({
                        organization_id: organizationId,
                        subcategory_id: subId,
                        school_rating: data.schoolRating,
                        school_rationale: data.schoolRationale,
                        ai_rating: data.aiRating,
                        ai_rationale: data.aiRationale,
                        evidence_count: data.evidence_count,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'organization_id,subcategory_id'
                    });
            }
        } catch (err) {
            console.error('Error saving assessments:', err);
        }
    };

    const tabs = [
        { id: 'overview' as Tab, label: 'Overview', icon: Shield },
        { id: 'framework' as Tab, label: 'Framework', icon: BookOpen },
        { id: 'evidence' as Tab, label: 'Evidence', icon: FileSearch },
        { id: 'readiness' as Tab, label: 'Readiness Report', icon: BarChart3 },
    ];

    return (
        <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-6"
            >
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-2xl">
                    <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
                        <Sparkles size={14} className="animate-pulse" />
                        Education Inspection Framework
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Ofsted Readiness
                    </h1>
                </div>
                <div className="ml-auto">
                    <span className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-bold uppercase tracking-wider">
                        6-Area Framework
                    </span>
                </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors relative ${
                            activeTab === tab.id
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {tab.icon && <tab.icon className="w-4 h-4" />}
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeOfstedTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'overview' && (
                    <OfstedDashboard organizationId={organizationId} />
                )}
                {activeTab === 'framework' && (
                    <OfstedFrameworkView
                        assessments={assessments}
                        setAssessments={handleUpdateAssessments}
                    />
                )}
                {activeTab === 'evidence' && (
                    <OfstedEvidenceMatcher organizationId={organizationId} />
                )}
                {activeTab === 'readiness' && (
                    <OfstedReadinessReport organizationId={organizationId} />
                )}
            </motion.div>
        </div>
    );
}
