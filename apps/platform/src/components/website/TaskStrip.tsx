"use client";

import React from 'react';
import { motion } from 'framer-motion';

const tasks = [
    "VDAR form",
    "Printer setup",
    "Risk assessment",
    "Helpdesk ticket",
    "Governor pack",
    "Audit prep"
];

const TaskStrip = () => {
    return (
        <section className="py-12 bg-slate-900 overflow-hidden relative">
            <div className="container mx-auto max-w-7xl px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-shrink-0">
                        <h2 className="text-lg font-black text-white uppercase tracking-tight">
                            Got a task you’re stuck on? <br />
                            <span className="text-slate-500 italic lowercase font-medium">Ed can fix that.</span>
                        </h2>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-end gap-3">
                        {tasks.map((task, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all cursor-default"
                            >
                                {task}
                            </motion.span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Subtle background glow */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-slate-800 rounded-full blur-[100px] opacity-20 pointer-events-none" />
        </section>
    );
};

export default TaskStrip;
