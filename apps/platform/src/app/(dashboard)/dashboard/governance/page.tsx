"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function GovernancePage() {
    return (
        <div className="p-8 space-y-10 animated-mesh min-h-screen max-w-[1600px] mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[3rem] p-12 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl text-amber-500">
                    <ShieldCheck size={240} />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 text-amber-600 font-black text-xs uppercase tracking-[0.2em] bg-amber-50 dark:bg-amber-900/20 w-fit px-4 py-2 rounded-full border border-amber-100 dark:border-amber-800">
                        <Sparkles size={16} className="animate-pulse" />
                        Strategic Oversight
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">Governance</h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                        Empower your governing body with strategic insights, meeting management, and compliance oversight.
                    </p>
                </div>

                <div className="mt-16 p-12 rounded-[2.5rem] bg-amber-50/50 dark:bg-amber-900/10 border-2 border-dashed border-amber-200 dark:border-amber-800 text-center">
                    <h3 className="text-2xl font-black text-amber-900 dark:text-amber-100 mb-2">Governance Portal Coming Soon</h3>
                    <p className="text-amber-700 dark:text-amber-300 font-medium">
                        We are building a centralized hub for your governors to access reports, minutes, and strategic KPIs.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
