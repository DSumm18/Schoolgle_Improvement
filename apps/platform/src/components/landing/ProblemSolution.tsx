"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, FolderSearch, CheckCircle2 } from 'lucide-react';

const ProblemSolution = () => {
    const problems = [
        {
            icon: <FolderSearch className="text-lp-accent" size={32} />,
            title: "Evidence Fragmentation",
            description: "Documents scattered across shared drives, emails, and staff laptops make finding the right evidence a nightmare."
        },
        {
            icon: <AlertTriangle className="text-lp-amber" size={32} />,
            title: "Manual Mapping Gaps",
            description: "Tracking compliance manually in spreadsheets leads to missed requirements and last-minute panic when inspection arrives."
        },
        {
            icon: <Clock className="text-rose-500" size={32} />,
            title: "Leadership Burnout",
            description: "Days of SLT time are lost every term just managing the readiness state, instead of focusing on school improvement."
        }
    ];

    return (
        <section className="py-32 px-6 relative overflow-hidden bg-lp-bg">
            <div className="container max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black mb-6 text-lp-text outfit tracking-tight leading-tight"
                    >
                        Inspection readiness shouldn't be a <br />
                        <span className="text-lp-accent">Full-time administrative burden.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-lp-text-sec max-w-2xl mx-auto font-medium"
                    >
                        We talked to dozens of school leaders. The consensus was clear: the systems used to track evidence are broken.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {problems.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-10 rounded-3xl border border-lp-border bg-lp-bg-sec/50 backdrop-blur-sm group hover:border-lp-border-hover transition-colors"
                        >
                            <div className="mb-6 p-3 rounded-2xl bg-lp-bg w-fit border border-lp-border group-hover:scale-110 transition-transform">
                                {p.icon}
                            </div>
                            <h3 className="text-xl font-black mb-4 text-lp-text outfit">{p.title}</h3>
                            <p className="text-lp-text-sec leading-relaxed">{p.description}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative rounded-[3rem] p-12 md:p-20 overflow-hidden border border-lp-border bg-lp-bg-sec shadow-2xl"
                >
                    {/* Subtle glow behind the solution content */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-lp-accent/5 blur-[120px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-16 text-center md:text-left">
                        <div className="flex-1">
                            <h3 className="text-3xl md:text-4xl font-black mb-8 text-lp-text outfit tracking-tight">
                                The Schoolgle Difference: <br />
                                <span className="text-lp-accent">Intelligent Automation.</span>
                            </h3>
                            <div className="space-y-6">
                                {[
                                    "Automatic evidence mapping to Ofsted & SIAMS",
                                    "Real-time gap identification in your framework",
                                    "Staff action plans updated without manual entry"
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-4">
                                        <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                                        <span className="text-lg text-lp-text-sec font-medium">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className="w-full max-w-sm aspect-square bg-lp-bg rounded-3xl border border-lp-border relative overflow-hidden group shadow-2xl">
                                {/* Mock visual of a successful clear scan */}
                                <div className="absolute inset-x-8 top-8 bottom-8 flex flex-col gap-6">
                                    <div className="h-4 w-2/3 bg-lp-accent/30 rounded-full animate-pulse" />
                                    <div className="flex-1 flex items-center justify-center">
                                        <div className="w-32 h-32 rounded-full border-[8px] border-lp-accent border-t-transparent animate-spin-slow" />
                                        <CheckCircle2 className="absolute text-lp-accent" size={64} />
                                    </div>
                                    <div className="h-4 w-full bg-lp-border rounded-full" />
                                    <div className="h-4 w-4/5 bg-lp-border rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default ProblemSolution;
