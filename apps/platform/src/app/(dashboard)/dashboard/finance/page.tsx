"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { PoundSterling, Sparkles } from 'lucide-react';

export default function FinancePage() {
    return (
        <div className="p-8 space-y-10 animated-mesh min-h-screen max-w-[1600px] mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[3rem] p-12 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl text-orange-500">
                    <PoundSterling size={240} />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 text-orange-600 font-black text-xs uppercase tracking-[0.2em] bg-orange-50 dark:bg-orange-900/20 w-fit px-4 py-2 rounded-full border border-orange-100 dark:border-orange-800">
                        <Sparkles size={16} className="animate-pulse" />
                        Financial Intelligence
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">Finance</h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                        Streamline your school's financial management with real-time budget monitoring and automated procurement tools.
                    </p>
                </div>

                <div className="mt-16 p-12 rounded-[2.5rem] bg-orange-50/50 dark:bg-orange-900/10 border-2 border-dashed border-orange-200 dark:border-orange-800 text-center">
                    <h3 className="text-2xl font-black text-orange-900 dark:text-orange-100 mb-2">Finance Module Coming Soon</h3>
                    <p className="text-orange-700 dark:text-orange-300 font-medium">
                        Optimizing your financial workflows with AI-driven budget forecasting and vendor management.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
