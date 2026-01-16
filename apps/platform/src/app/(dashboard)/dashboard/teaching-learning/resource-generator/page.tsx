"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FilePlus, Sparkles, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResourceGeneratorPage() {
    return (
        <div className="p-8 space-y-10 animated-mesh min-h-screen max-w-[1600px] mx-auto">
            <Link href="/dashboard/teaching-learning" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-black text-xs uppercase tracking-widest mb-4">
                <ArrowLeft size={16} /> Back to Teaching & Learning
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-[3rem] p-24 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[600px]"
            >
                <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10" />

                <div className="p-8 bg-white dark:bg-slate-800 rounded-full shadow-2xl mb-8 relative z-10">
                    <FilePlus size={64} className="text-indigo-600" />
                </div>

                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-4 relative z-10">Resource Generator</h1>
                <div className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-8 relative z-10 shadow-lg">
                    Coming Soon
                </div>

                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed relative z-10">
                    AI-powered resource creation. Generate worksheets, quizzes, and presentations tailored to your specific class needs and ability levels.
                </p>

                <div className="mt-12 flex gap-4 relative z-10">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce delay-100" />
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce delay-200" />
                </div>
            </motion.div>
        </div>
    );
}
