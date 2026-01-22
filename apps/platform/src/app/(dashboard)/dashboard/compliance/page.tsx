"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function CompliancePage() {
    return (
        <div className="p-8 space-y-10 animated-mesh min-h-screen max-w-[1600px] mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[3rem] p-12 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl text-purple-500">
                    <ShieldCheck size={240} />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 text-purple-600 font-black text-xs uppercase tracking-[0.2em] bg-purple-50 dark:bg-purple-900/20 w-fit px-4 py-2 rounded-full border border-purple-100 dark:border-purple-800">
                        <Sparkles size={16} className="animate-pulse" />
                        Statutory Assurance
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">Compliance</h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                        Centralized statutory policy management, risk registers, and automated compliance tracking across your school.
                    </p>
                </div>

                <div className="mt-16 p-12 rounded-[2.5rem] bg-purple-50/50 dark:bg-purple-900/10 border-2 border-dashed border-purple-200 dark:border-purple-800 text-center">
                    <h3 className="text-2xl font-black text-purple-900 dark:text-purple-100 mb-2">Compliance Hub Coming Soon</h3>
                    <p className="text-purple-700 dark:text-purple-300 font-medium">
                        Your one-stop destination for all statutory policies, health & safety audits, and risk management.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
