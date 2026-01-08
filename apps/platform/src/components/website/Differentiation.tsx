"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, School, Zap } from 'lucide-react';

const differentiators = [
    {
        icon: Users,
        title: "Evidence organised automatically",
        description: "Your policies, assessments, and improvement plans are mapped to inspection frameworks from day one. When inspection arrives, everything is already in place."
    },
    {
        icon: School,
        title: "Actions tracked without the admin",
        description: "See what needs doing, who's responsible, and what's overdue. Schoolgle keeps your improvement plan visible and actionable without adding to anyone's workload."
    },
    {
        icon: Zap,
        title: "Reports generated in minutes",
        description: "One-click SEF generation, action plan summaries, and evidence mapping reports. What used to take days now takes minutes."
    }
];

const Differentiation = () => {
    return (
        <section className="py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 tracking-tight">
                        What makes Schoolgle different
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {differentiators.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center p-8"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                                    <IconComponent size={24} className="text-gray-700" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-gray-500 leading-relaxed">
                                    {item.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-20 p-12 bg-slate-900 rounded-[3rem] text-center border border-slate-800 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 50 Q 25 25, 50 50 T 100 50" fill="none" stroke="white" strokeWidth="0.5" />
                        </svg>
                    </div>

                    <h3 className="text-3xl font-black text-white mb-6 tracking-tight">
                        Ready to see <span className="text-blue-400">Schoolgle</span> in action?
                    </h3>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                        Join our Early Access Pilot and start mapping your evidence automatically. No credit card required. No long-term commitment.
                    </p>
                    <a
                        href="#early-access"
                        className="inline-block px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-[0_20px_40px_rgba(37,99,235,0.4)] hover:scale-105"
                    >
                        Request early access
                    </a>
                </motion.div>
            </div>
        </section>
    );
};

export default Differentiation;

