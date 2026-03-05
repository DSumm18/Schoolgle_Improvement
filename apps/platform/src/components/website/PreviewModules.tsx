"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, PoundSterling, Shield, Heart, BookOpen } from 'lucide-react';

const modules = [
    {
        icon: Shield,
        title: "Compliance",
        status: "In development"
    },
    {
        icon: Building2,
        title: "Estates",
        status: "In development"
    },
    {
        icon: Users,
        title: "HR & People",
        status: "In development"
    },
    {
        icon: PoundSterling,
        title: "Finance",
        status: "Early access 2025"
    },
    {
        icon: Heart,
        title: "SEND & Inclusion",
        status: "In development"
    },
    {
        icon: BookOpen,
        title: "Teaching & Learning",
        status: "Early access 2025"
    }
];

const PreviewModules = () => {
    return (
        <section className="py-32 bg-gray-50 dark:bg-slate-900/50 transition-colors duration-500">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-medium text-gray-900 dark:text-white mb-6 tracking-tight">
                        What we're building
                    </h2>
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
                        A complete intelligence platform for every part of school operations
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module, index) => {
                        const IconComponent = module.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
                                    <IconComponent size={24} className="text-gray-700 dark:text-gray-300" />
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                                    {module.title}
                                </h3>
                                <span className="inline-block px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium">
                                    {module.status}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default PreviewModules;








