"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { getModuleVars, moduleThemes } from '@/lib/moduleThemes';
import Navbar from '@/components/website/Navbar';
import Footer from '@/components/website/Footer';
import { OrbitBackground } from '@/components/effects';
import Link from 'next/link';

interface ModulePageTemplateProps {
    moduleSlug: string;
    howEdHelps: { title: string; desc: string }[];
    typicalJobs: string[];
    whatItCovers: string[];
}

const ModulePageTemplate = ({
    moduleSlug,
    howEdHelps,
    typicalJobs,
    whatItCovers
}: ModulePageTemplateProps) => {
    const theme = moduleThemes[moduleSlug];
    if (!theme) return <div>Module not found</div>;

    const vars = getModuleVars(moduleSlug);

    return (
        <div style={vars} className="bg-background transition-colors duration-700">
            {/* Header Section */}
            <section className="pt-32 pb-40 px-6 border-b border-slate-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--module-accent-soft)] border border-[var(--module-accent-glow)] mb-8"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--module-accent)]">
                                Schoolgle {theme.name}
                            </span>
                        </motion.div>
                        <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.9] mb-8">
                            {theme.outcome}
                        </h1>
                        <div className="flex flex-col sm:flex-row gap-6 pt-8">
                            <Link href="/early-access" className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-2xl">
                                Book a demo
                            </Link>
                            <Link href="/modules" className="px-10 py-5 bg-background text-slate-900 dark:text-white rounded-full font-black text-xs uppercase tracking-widest border border-slate-100 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all">
                                Back to Ecosystem
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* How Ed Helps */}
            <section className="py-40 px-6 bg-slate-50/30 dark:bg-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
                        <div className="space-y-6 lg:sticky lg:top-40">
                            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">The Narrative</span>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">
                                How Ed helps with <br />
                                <span className="text-[var(--module-accent)]">{theme.name.toLowerCase()}</span>
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">
                                Ed acts as your always-available specialist, guiding your team through {theme.name.toLowerCase()} tasks without the need for constant training.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {howEdHelps.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-10 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group"
                                >
                                    <div className="flex flex-col sm:flex-row gap-8 items-start">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-[var(--module-accent-soft)] transition-colors">
                                            <span className="text-xs font-black text-slate-400 dark:text-slate-500 group-hover:text-[var(--module-accent)]">0{i + 1}</span>
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h3>
                                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Typical Jobs */}
            <section className="py-40 px-6 bg-background border-y border-slate-100 dark:border-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24 space-y-4">
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Practical Support</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Typical jobs Ed completes with you</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {typicalJobs.map((job, i) => (
                            <div key={i} className="p-10 rounded-3xl bg-slate-50/50 dark:bg-white/5 border border-slate-100/50 dark:border-white/10 hover:border-[var(--module-accent)] dark:hover:border-[var(--module-accent)] transition-all group">
                                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 group-hover:text-[var(--module-accent)] transition-colors">{job}</h4>
                                <div className="w-8 h-1 bg-slate-200 dark:bg-white/10 group-hover:bg-[var(--module-accent)] transition-all" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* What it Covers */}
            <section className="py-40 px-6 bg-background">
                <div className="max-w-4xl mx-auto">
                    <div className="space-y-12">
                        <div className="space-y-4">
                            <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Scope</span>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">What this module covers</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                            {whatItCovers.map((item, i) => (
                                <div key={i} className="flex gap-4 items-center py-4 border-b border-slate-100 dark:border-white/5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--module-accent)]" />
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Data Safety */}
            <section className="py-24 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[4rem] mx-6 mb-24 overflow-hidden relative transition-colors duration-700">
                <div className="max-w-4xl mx-auto relative z-10 text-center space-y-8">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Governance & Security</span>
                    <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Safe by design.</h2>
                    <p className="text-slate-400 dark:text-slate-600 font-medium text-lg max-w-2xl mx-auto">
                        Like every Schoolgle module, {theme.name} uses Guardian Mode to prevent risks. No data is moved from your existing systems of record.
                    </p>
                </div>
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <OrbitBackground variant="hero" density="dense" speed="slow" />
                </div>
            </section>
        </div>
    );
};

export default ModulePageTemplate;
