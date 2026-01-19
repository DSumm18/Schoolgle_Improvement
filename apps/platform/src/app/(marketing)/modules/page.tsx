"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    BarChart3, Shield, Building2, Users, PoundSterling, Heart,
    ArrowRight, Check, Sparkles, ChevronRight
} from 'lucide-react';
import { moduleThemes, getModuleVars } from '@/lib/moduleThemes';

const marketingModules = [
    {
        id: 'improvement',
        name: 'School Improvement',
        outcome: 'Always-on inspection readiness',
        description: 'Ofsted & SIAMS inspection readiness with Ed AI guiding your self-evaluation.',
        icon: BarChart3,
        capabilities: ['Self-assessment (EIF 2025)', 'Action planning', 'Evidence mapping'],
        href: '/modules/improvement'
    },
    {
        id: 'compliance',
        name: 'Compliance',
        outcome: 'Governance on autopilot',
        description: 'Policies, statutory compliance & governance handled without the paperwork burden.',
        icon: Shield,
        capabilities: ['Policy management', 'Staff tracking', 'Auto-feed evidence'],
        href: '/modules/compliance'
    },
    {
        id: 'estates',
        name: 'Estates',
        outcome: 'A safe, efficient estate',
        description: 'Facilities, energy & statutory compliance tracking for safer, greener schools.',
        icon: Building2,
        capabilities: ['DfE GEMS alignment', 'Energy monitoring', 'Statutory H&S'],
        href: '/modules/estates'
    },
    {
        id: 'hr',
        name: 'HR & People',
        outcome: 'Nurture your best asset',
        description: 'Staff management, CPD & wellbeing patterns that prevent burnout.',
        icon: Users,
        capabilities: ['CPD tracking', 'Wellbeing monitoring', 'Onboarding logs'],
        href: '/modules/hr'
    },
    {
        id: 'finance',
        name: 'Finance',
        outcome: 'Money where it matters',
        description: 'Budgets, Pupil Premium & sports premium impact linked directly to progress.',
        icon: PoundSterling,
        capabilities: ['PP impact tracking', 'Budget forecasting', 'Statutory reporting'],
        href: '/modules/finance'
    },
    {
        id: 'send',
        name: 'SEND',
        outcome: 'Support every student',
        description: 'Special needs tracking & provision mapping that creates a continuous thread of care.',
        icon: Heart,
        capabilities: ['EHCP management', 'Provision mapping', 'Funding allocation'],
        href: '/modules/send'
    }
];

export default function ModulesPage() {
    return (
        <main className="pt-24 min-h-screen bg-background transition-colors duration-700">
            {/* Hero Section */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                    >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">The Schoolgle Ecosystem</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.9]">
                        Everything feeds into <br />
                        <span className="text-slate-400 dark:text-slate-600">School Improvement.</span>
                    </h1>

                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        Schoolgle isn't a collection of silos. It's a connected ecosystem where every policy, check, and budget entry builds your evidence base automatically.
                    </p>
                </div>
            </section>

            {/* Modules Grid */}
            <section className="py-24 px-6 bg-slate-50/30 dark:bg-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {marketingModules.map((module, i) => {
                            const vars = getModuleVars(module.id);

                            return (
                                <motion.div
                                    key={module.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    style={vars as any}
                                    className="group"
                                >
                                    <Link href={module.href}>
                                        <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-[var(--module-accent)] transition-all duration-500 h-full flex flex-col">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 group-hover:bg-[var(--module-accent-soft)] group-hover:text-[var(--module-accent)] transition-all duration-500">
                                                <module.icon className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-[var(--module-accent)]" />
                                            </div>

                                            <div className="space-y-4 flex-1">
                                                <div>
                                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-[var(--module-accent)] transition-colors">{module.name}</h3>
                                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">{module.outcome}</p>
                                                </div>

                                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{module.description}</p>

                                                <div className="pt-6 space-y-3">
                                                    {module.capabilities.map((cap, j) => (
                                                        <div key={j} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 group-hover:bg-[var(--module-accent)] transition-colors" />
                                                            {cap}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="pt-10 flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 group-hover:text-[var(--module-accent)] transition-colors">
                                                Learn More
                                                <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Ecosystem Flow - Calm Visual */}
            <section className="py-40 px-6">
                <div className="max-w-4xl mx-auto text-center space-y-12">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">The "Ed" Advantage</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                        {[
                            { title: "No Data Silos", desc: "Data entered in Estates or Finance feeds into your School Improvement judgements automatically." },
                            { title: "One Assistant", desc: "Ed knows your policies in Compliance and applies them to your HR processes." },
                            { title: "Ready for Ofsted", desc: "When inspectors arrive, your SEF is already drafted with evidence from across the school." }
                        ].map((item, i) => (
                            <div key={i} className="space-y-4">
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">{item.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 text-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[4rem] mx-6 mb-24 overflow-hidden relative">
                <div className="max-w-3xl mx-auto relative z-10 space-y-12">
                    <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">
                        Ready to connect <br />
                        <span className="text-slate-500 dark:text-slate-400">your school?</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link href="/early-access" className="px-12 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">
                            Book a demo
                        </Link>
                        <Link href="/ed" className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 transition-colors">
                            Meet Ed the AI →
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
