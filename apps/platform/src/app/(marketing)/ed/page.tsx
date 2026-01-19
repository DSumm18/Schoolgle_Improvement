"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, GraduationCap, ShieldCheck, CheckCircle2, MessageSquare, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const pillarCards = [
    {
        title: "The Go-To Person",
        desc: "Ed provides immediate continuity. When staff leave or roles change, the knowledge of how your school works stays in-platform.",
        icon: Users,
        color: "blue"
    },
    {
        title: "The Trainer",
        desc: "Ed doesn't just do things for you — he shows you how to do them using the systems you already pay for, building staff confidence.",
        icon: GraduationCap,
        color: "amber"
    },
    {
        title: "The Guardian",
        desc: "Guardian Mode ensures every interaction is safe, preventing unsafe AI prompting and keeping your school data secure.",
        icon: ShieldCheck,
        color: "emerald"
    }
];

const edTasks = [
    // Office
    "Draft a parent newsletter", "Organise meeting minutes", "Prepare governor packs",
    // Estates
    "Submit helpdesk tickets", "Check compliance deadlines", "Log maintenance requests",
    // HR & Finance
    "Track CPD records", "Draft job descriptions", "PP impact reporting",
    // Compliance & SEND
    "Review policy guidance", "Provision mapping prep", "Audit readiness checks"
];

const EdPage = () => {
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
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Meet your always-on guide</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.9]">
                        Meet Ed — <br />
                        <span className="text-slate-400 dark:text-slate-600">the person who knows how your school works.</span>
                    </h1>

                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        Ed is more than a chatbot. He's a digital colleague who understands your processes, your systems, and your school's unique context.
                    </p>
                </div>
            </section>

            {/* Pillars Section */}
            <section className="py-24 px-6 bg-secondary/5 border-y border-slate-100 dark:border-white/5 transition-colors duration-700">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {pillarCards.map((pillar, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                    <pillar.icon className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">{pillar.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{pillar.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Task Grid */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 space-y-4">
                        <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Utility First</span>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ed can fix that.</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {edTasks.map((task, i) => (
                            <div key={i} className="flex items-center gap-3 p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 group hover:border-slate-900 dark:hover:border-white transition-colors cursor-default">
                                <CheckCircle2 className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                                <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{task}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="py-24 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[4rem] mx-6 mb-24 overflow-hidden relative transition-colors duration-700">
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="text-center mb-20 space-y-4">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Transparency</span>
                        <h2 className="text-4xl font-black uppercase tracking-tight">How Ed works.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { step: "01", title: "Ask Ed", desc: "Start a conversation about any task or system in your school." },
                            { step: "02", title: "Ed Guides", desc: "Get step-by-step guidance tailored to your school's data and policies." },
                            { step: "03", title: "You Stay in Control", desc: "Ed never acts autonomously. You review and approve every step." }
                        ].map((item, i) => (
                            <div key={i} className="space-y-6 relative">
                                <span className="text-5xl font-black text-white/10 dark:text-black/10 block leading-none">{item.step}</span>
                                <h3 className="text-lg font-black uppercase tracking-tight">{item.title}</h3>
                                <p className="text-slate-400 dark:text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                                {i < 2 && <ArrowRight className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-white/5 dark:text-black/5 w-12 h-12" />}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-3xl mx-auto space-y-12">
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                        Ready to bring Ed <br />
                        <span className="text-slate-400 dark:text-slate-600">into your school office?</span>
                    </h2>

                    <Link href="/early-access" className="inline-flex h-16 items-center px-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 shadow-2xl transition-all">
                        Book a demo
                    </Link>
                </div>
            </section>
        </main>
    );
};

export default EdPage;
