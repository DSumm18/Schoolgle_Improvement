"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Link, FileCheck, TrendingUp } from 'lucide-react';

const steps = [
    {
        icon: Link,
        title: "Connect your existing systems",
        description: "Link your Google Drive, Microsoft 365, or other document storage. Schoolgle reads what you already have—no manual uploads required."
    },
    {
        icon: FileCheck,
        title: "Evidence is mapped automatically",
        description: "Documents are scanned and matched to Ofsted and SIAMS framework requirements. You see gaps immediately, not when inspection arrives."
    },
    {
        icon: TrendingUp,
        title: "Reports and actions stay current",
        description: "Your self-evaluation form updates as evidence changes. Action plans track progress automatically. Everything stays inspection-ready."
    }
];

const HowItWorks = () => {
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
                        How it works
                    </h2>
                    <p className="text-xl text-gray-500 max-w-3xl mx-auto">
                        Getting started takes less than 10 minutes. Schoolgle scans your connected storage and maps evidence to inspection frameworks automatically.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {steps.map((step, index) => {
                        const IconComponent = step.icon;
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
                                    {step.title}
                                </h3>
                                <p className="text-gray-500 leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto space-y-6 text-gray-600"
                >
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">What schools get in the first 10 minutes</h3>
                        <ul className="space-y-2">
                            <li className="flex gap-3">
                                <span className="text-gray-400">•</span>
                                <span>A complete evidence map showing coverage across all inspection areas</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-gray-400">•</span>
                                <span>Automatic identification of policies, assessments, and action plans</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-gray-400">•</span>
                                <span>A gap analysis highlighting areas that need more evidence</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-gray-400">•</span>
                                <span>Your first draft self-evaluation form, ready to review and refine</span>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">What improves over time</h3>
                        <p className="leading-relaxed">
                            As you continue using Schoolgle, the platform learns your school's structure and priorities. Evidence mapping becomes more accurate. Action plans stay automatically updated as tasks are completed. Reports become more tailored to your school's context. The longer you use it, the less manual work is required.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default HowItWorks;

