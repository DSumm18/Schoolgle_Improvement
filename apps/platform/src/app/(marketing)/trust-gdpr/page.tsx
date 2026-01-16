"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Database, Eye, MessageCircle, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

const trustPillars = [
    {
        title: "Data Stays Put",
        desc: "Schoolgle doesn't replicate your data. Your systems of record — MIS, Google Workspace, CPOMS — remain the single source of truth.",
        icon: Database
    },
    {
        title: "No Mystery Automation",
        desc: "We don't believe in autonomous AI. Ed guides you, suggests steps, and prepares drafts, but a human always clicks 'Send'.",
        icon: Eye
    },
    {
        title: "Guardian Mode",
        desc: "Proactive safety layers prevent PII (Personally Identifiable Information) from being processed unsafely in AI models.",
        icon: ShieldCheck
    },
    {
        title: "Explainable Output",
        desc: "Every report or document Ed helps you draft is auditable. You'll always know how we got from your data to the final result.",
        icon: MessageCircle
    }
];

const SafeAIList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-20">
        <div className="bg-emerald-50/50 dark:bg-emerald-500/5 p-10 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-500/20">
            <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tight mb-8 flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" />
                The Do's
            </h3>
            <ul className="space-y-4">
                {[
                    "Use Ed to summarize meeting notes",
                    "Draft policy updates with DfE guidance",
                    "Organize evidence for Ofsted judgements",
                    "Generate first drafts of parent comms",
                    "Analyze trends in anonymized attendance"
                ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-emerald-800 dark:text-emerald-300/80 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 dark:bg-emerald-500/40 mt-2" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-500/5 p-10 rounded-[2.5rem] border border-rose-100 dark:border-rose-500/20">
            <h3 className="text-xl font-black text-rose-900 dark:text-rose-400 uppercase tracking-tight mb-8 flex items-center gap-3">
                <XCircle className="text-rose-500" />
                The Don'ts
            </h3>
            <ul className="space-y-4">
                {[
                    "Ask AI to make final SEND decisions",
                    "Input raw, unencrypted pupil data",
                    "Rely on AI for legal advice",
                    "Let AI send emails without human review",
                    "Use public, un-guarded AI tools for school tasks"
                ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-rose-800 dark:text-rose-300/80 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-300 dark:bg-rose-500/40 mt-2" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const TrustPage = () => {
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
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">GDPR & AI Safety First</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.9]">
                        Trust is built on <br />
                        <span className="text-slate-400 dark:text-slate-600">transparency, not hype.</span>
                    </h1>

                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        We built Schoolgle for the highest stakes environment: education. Our approach to AI is conservative, safe, and human-led.
                    </p>
                </div>
            </section>

            {/* Pillars Grid */}
            <section className="py-24 px-6 bg-secondary/5 border-y border-slate-100 dark:border-white/5 transition-colors duration-700">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {trustPillars.map((pillar, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-sm group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-all">
                                    <pillar.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">{pillar.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-lg">{pillar.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <SafeAIList />
                </div>
            </section>

            {/* Quote / Certification Placeholder */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="w-16 h-1 bg-slate-100 dark:bg-white/10 mx-auto" />
                    <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                        "Schoolgle doesn't aim to replace school leadership. It aims to liberate it from the burden of manual process."
                    </p>
                    <div className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-[0.2em] text-[10px]">
                        The Schoolgle Governance Principles
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 text-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[4rem] mx-6 mb-24 overflow-hidden relative">
                <div className="max-w-3xl mx-auto space-y-12">
                    <h2 className="text-5xl font-black uppercase tracking-tighter leading-none">
                        Questions about <br />
                        <span className="text-slate-500 dark:text-slate-400">your school's data?</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link href="/early-access" className="px-12 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                            Book a demo
                        </Link>
                        <a href="mailto:trust@schoolgle.co.uk" className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 hover:text-white dark:hover:text-slate-900 transition-colors">
                            Talk to our DPO →
                        </a>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default TrustPage;
