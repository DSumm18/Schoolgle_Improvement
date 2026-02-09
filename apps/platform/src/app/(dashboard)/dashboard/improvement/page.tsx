"use client";

import { motion } from 'framer-motion';
import { Shield, Church, FileText, TrendingUp, Target, Sparkles } from 'lucide-react';
import Link from 'next/link';

const tools = [
    {
        id: 'ofsted-readiness',
        title: 'Ofsted Readiness',
        description: 'Track compliance against the Education Inspection Framework with evidence mapping and gap analysis.',
        icon: Shield,
        color: 'rose',
        href: '/dashboard/ofsted-readiness',
    },
    {
        id: 'siams-readiness',
        title: 'SIAMS Readiness',
        description: 'Prepare for Church School inspections with framework analysis and evidence linking.',
        icon: Church,
        color: 'purple',
        href: '/dashboard/siams',
    },
    {
        id: 'sef-builder',
        title: 'SEF Builder',
        description: 'Draft comprehensive self-evaluation forms aligned to Ofsted judgements.',
        icon: FileText,
        color: 'blue',
        href: '/dashboard/sef',
    },
    {
        id: 'sdp-builder',
        title: 'SDP Builder',
        description: 'Create and manage school development plans with linked actions and evidence.',
        icon: TrendingUp,
        color: 'emerald',
        href: '/dashboard/sdp',
    },
    {
        id: 'action-plan',
        title: 'Action Plan',
        description: 'Track strategic tasks, assign owners, and monitor completion rates.',
        icon: Target,
        color: 'amber',
        href: '/dashboard/action-plan',
    },
];

export default function ImprovementPage() {
    return (
        <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-6"
            >
                <div className="p-3 bg-rose-100 dark:bg-rose-900/20 rounded-2xl">
                    <Shield className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
                        <Sparkles size={14} className="animate-pulse" />
                        Inspection Readiness
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Improvement Tools
                    </h1>
                </div>
            </motion.div>

            {/* Description */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl"
            >
                Comprehensive tools to prepare for Ofsted and SIAMS inspections, manage self-evaluation,
                and track strategic improvement actions.
            </motion.p>

            {/* Tool Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool, idx) => {
                    const colorClasses: Record<string, string> = {
                        rose: 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
                        purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
                        blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
                        emerald: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
                        amber: 'bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
                    };

                    return (
                        <Link key={tool.id} href={tool.href}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                whileHover={{ y: -4, scale: 1.02 }}
                                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${colorClasses[tool.color]}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                                        <tool.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold mb-2">{tool.title}</h3>
                                        <p className="text-sm opacity-80 leading-relaxed">{tool.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Stats Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8 p-6 bg-gradient-to-r from-rose-500 to-purple-600 rounded-2xl text-white"
            >
                <div className="flex items-center gap-4">
                    <Sparkles size={32} className="animate-pulse" />
                    <div>
                        <h3 className="font-bold text-lg">AI-Powered Insights</h3>
                        <p className="text-rose-100 text-sm">
                            Our AI automatically maps your evidence to framework requirements and identifies gaps
                            for inspection readiness.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
