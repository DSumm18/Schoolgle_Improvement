"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, UserCheck, TrendingUp, ShieldCheck, ClipboardList, PieChart, HeartHandshake, BookOpen, FileText, LucideIcon } from 'lucide-react';

interface Feature {
    icon: LucideIcon;
    label: string;
    desc: string;
}

const features: Feature[] = [
    { icon: MessageCircle, label: "Ed – Parent Chatbot", desc: "Fewer calls, clearer messages, happier families." },
    { icon: UserCheck, label: "Ed – Staff Assistant", desc: "Your systems, finally easy to use." },
    { icon: TrendingUp, label: "Schoolgle Improvement", desc: "Evidence, actions and SEF in one place." },
    { icon: ShieldCheck, label: "Estates & Compliance", desc: "Checks, logs and reports without spreadsheets." },
    { icon: ClipboardList, label: "HR & People", desc: "Reviews, objectives and return-to-work made simple." },
    { icon: PieChart, label: "Finance & Business", desc: "From invoices to insights in a few clicks." },
    { icon: HeartHandshake, label: "SEND & Inclusion", desc: "Scaffolds, plans and evidence that are easy to keep updated." },
    { icon: BookOpen, label: "Teaching & Learning", desc: "Lesson planning, resources and curriculum alignment." },
    { icon: FileText, label: "Governance & Trust", desc: "Instant reports and transparent progress for boards and MATs." },
];

const WhatSchoolgleDoes = () => {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 tracking-tight">
                        Built for every team in your school
                    </h2>
                    <p className="text-xl text-gray-500 max-w-3xl mx-auto">
                        Different roles, same problem: too much admin. Schoolgle supports everyone without adding yet another system to learn.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => {
                        const IconComponent = feature.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="flex flex-col items-start gap-4 p-8 rounded-3xl bg-gray-50 hover:bg-gray-100 transition-all hover:shadow-lg hover:-translate-y-1 duration-300"
                            >
                                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                                    <IconComponent size={24} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-xl text-gray-900 mb-2">{feature.label}</h3>
                                    <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default WhatSchoolgleDoes;

