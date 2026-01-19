"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function EdStaffPage() {
    return (
        <main className="pt-32 pb-40 px-6 bg-background transition-colors duration-700">
            <div className="max-w-7xl mx-auto">
                <div className="text-center space-y-8 mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Internal Assistant</span>
                    </motion.div>

                    <h1 className="text-6xl md:text-8xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.9]">
                        Ed for Staff. <br />
                        <span className="text-slate-400 dark:text-slate-600">Your on-the-job companion.</span>
                    </h1>

                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        Guidance when you need it, exactly where you work. Ed helps staff navigate complex school systems with confidence.
                    </p>

                    <div className="pt-8">
                        <Link
                            href="/early-access"
                            className="inline-block px-12 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                            Book a demo
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
