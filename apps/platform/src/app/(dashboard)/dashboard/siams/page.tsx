"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Church, Sparkles, BookOpen } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { SiamsDashboard } from '@/components/siams';
import { SiamsFrameworkView } from '@/components/siams';
import { SiamsEvidenceMatcher } from '@/components/siams';
import { SiamsReadinessReport } from '@/components/siams';
import { SiamsChurchStatus } from '@/components/siams';

type Tab = 'overview' | 'framework' | 'evidence' | 'readiness' | 'status';

export default function SiamsPage() {
    const { organization } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    const organizationId = organization?.id || '';

    const tabs = [
        { id: 'overview' as Tab, label: 'Overview', icon: Church },
        { id: 'framework' as Tab, label: 'Framework', icon: BookOpen },
        { id: 'evidence' as Tab, label: 'Evidence', icon: null },
        { id: 'readiness' as Tab, label: 'Readiness', icon: null },
        { id: 'status' as Tab, label: 'Church Status', icon: null },
    ];

    return (
        <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-6"
            >
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-2xl">
                    <Church className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
                        <Sparkles size={14} className="animate-pulse" />
                        Church School Inspection
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        SIAMS Readiness
                    </h1>
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
                                ? 'text-purple-600 dark:text-purple-400'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {tab.icon && <tab.icon className="w-4 h-4" />}
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
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
                    <SiamsDashboard organizationId={organizationId} />
                )}
                {activeTab === 'framework' && (
                    <SiamsFrameworkView organizationId={organizationId} />
                )}
                {activeTab === 'evidence' && (
                    <SiamsEvidenceMatcher organizationId={organizationId} />
                )}
                {activeTab === 'readiness' && (
                    <SiamsReadinessReport organizationId={organizationId} />
                )}
                {activeTab === 'status' && (
                    <SiamsChurchStatus organizationId={organizationId} />
                )}
            </motion.div>
        </div>
    );
}
