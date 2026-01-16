"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Sparkles, BookOpen, FilePlus, CheckSquare, Mail, ClipboardList } from 'lucide-react';
import Link from 'next/link';

const subModules = [
    { name: 'Lesson Planning', href: '/dashboard/teaching-learning/lesson-planning', icon: BookOpen, color: 'blue' },
    { name: 'Resource Generator', href: '/dashboard/teaching-learning/resource-generator', icon: FilePlus, color: 'indigo' },
    { name: 'Assessment Support', href: '/dashboard/teaching-learning/assessment-support', icon: CheckSquare, color: 'emerald' },
    { name: 'Parent Comms', href: '/dashboard/teaching-learning/parent-comms', icon: Mail, color: 'amber' },
    { name: 'Intervention Notes', href: '/dashboard/teaching-learning/intervention-notes', icon: ClipboardList, color: 'rose' },
];

export default function TeachingLearningPage() {
    return (
        <div className="p-8 space-y-10 animated-mesh min-h-screen max-w-[1600px] mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[3rem] p-12 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl text-blue-500">
                    <GraduationCap size={240} />
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 text-blue-600 font-black text-xs uppercase tracking-[0.2em] bg-blue-50 dark:bg-blue-900/20 w-fit px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800">
                        <Sparkles size={16} className="animate-pulse" />
                        Next-Gen Pedagogy
                    </div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight">Teaching & Learning</h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
                        Elevate classroom outcomes with AI-powered lesson planning, resource generation, and integrated assessment support.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 relative z-10">
                    {subModules.map((sub, i) => (
                        <Link href={sub.href} key={sub.name}>
                            <motion.div
                                whileHover={{ y: -5, scale: 1.02 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 shadow-xl hover:shadow-2xl transition-all group"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${sub.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                        sub.color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                            sub.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                                sub.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                                                    'bg-rose-50 text-rose-600'
                                    }`}>
                                    <sub.icon size={28} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{sub.name}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-4 italic">Coming soon</p>
                                <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    Explore Module <Sparkles size={12} />
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
