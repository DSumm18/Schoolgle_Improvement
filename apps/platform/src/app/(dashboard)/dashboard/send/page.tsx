"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

export default function SENDPage() {
    return (
        <div className="p-8 space-y-10 animated-mesh min-h-screen max-w-[1600px] mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[3rem] p-12 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl text-emerald-500">
                    <Heart size={240} />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 text-emerald-600 font-black text-xs uppercase tracking-[0.2em] bg-emerald-50 dark:bg-emerald-900/20 w-fit px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-800">
                        <Sparkles size={16} className="animate-pulse" />
                        Inclusive Education
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">SEND</h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                        Comprehensive provision mapping and EHCP tracking to ensure every student receives the support they need.
                    </p>
                </div>

                <div className="mt-16 p-12 rounded-[2.5rem] bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-dashed border-emerald-200 dark:border-emerald-800 text-center">
                    <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mb-2">SEND Module Coming Soon</h3>
                    <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                        Developing advanced tools for SENCOs to manage interventions, reviews, and external agency collaboration.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
