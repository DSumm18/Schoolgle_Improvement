"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, Zap, Target, Shield, BarChart3, Users, BookOpen, Warehouse, Layout } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/website/Navbar';
import Footer from '@/components/website/Footer';

interface ModuleLandingProps {
    id: string;
    tag: string;
    titleLine1: string;
    titleLine2: string;
    subhead: string;
    color: string;
    features: { title: string; description: string; icon: any }[];
}

export default function ModuleLanding({
    id,
    tag,
    titleLine1,
    titleLine2,
    subhead,
    color,
    features
}: ModuleLandingProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1.1, 1]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.9]);

    return (
        <div ref={containerRef} className="min-h-screen bg-lp-bg selection:bg-lp-accent selection:text-white">
            <Navbar />

            <main className="relative z-10">
                {/* Hero Section */}
                <motion.section
                    style={{ scale: heroScale, opacity: heroOpacity }}
                    className="pt-48 pb-32 px-6"
                >
                    <div className="max-w-7xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lp-border bg-lp-bg-sec/50 backdrop-blur-md mb-12"
                        >
                            <span className="flex h-2.5 w-2.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lp-text-sec">{tag}</span>
                        </motion.div>

                        <h1 className="text-6xl md:text-[110px] lg:text-[130px] font-black text-lp-text mb-12 tracking-[-0.04em] outfit uppercase leading-[0.85]">
                            {titleLine1} <br />
                            <span className="italic opacity-90" style={{ color }}>{titleLine2}</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-lp-text-sec font-medium max-w-4xl mx-auto leading-relaxed mb-16">
                            {subhead}
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-6">
                            <Link
                                href="#early-access"
                                style={{ backgroundColor: color }}
                                className="px-12 py-6 text-white rounded-2xl font-black text-xs uppercase tracking-[0.25em] transition-all shadow-2xl flex items-center gap-3 hover:brightness-110 active:scale-95"
                            >
                                Get Priority Access <ChevronRight size={18} />
                            </Link>
                            <Link
                                href="/toolbox"
                                className="px-12 py-6 glass-panel text-lp-text rounded-2xl font-black text-xs uppercase tracking-[0.25em] transition-all flex items-center gap-3 hover:bg-lp-bg-sec"
                            >
                                <Layout size={18} /> View {id} Tools
                            </Link>
                        </div>
                    </div>
                </motion.section>

                {/* Features Grid */}
                <section className="pb-48 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {features.map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-10 glass-card rounded-[2.5rem] border-lp-border hover:border-lp-accent/30 transition-all group"
                                >
                                    <div className="w-14 h-14 rounded-2xl mb-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                                        <feature.icon size={28} style={{ color }} />
                                    </div>
                                    <h3 className="text-2xl font-black text-lp-text mb-4 outfit uppercase tracking-tight">{feature.title}</h3>
                                    <p className="text-lp-text-sec font-medium leading-relaxed">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Integration Section */}
                <section className="py-32 bg-lp-bg-sec/30 border-y border-lp-border px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl md:text-5xl font-black text-lp-text outfit uppercase tracking-tighter mb-8">
                            Powered by <span className="text-lp-accent">Unified Intelligence.</span>
                        </h2>
                        <p className="text-xl text-lp-text-sec font-medium leading-relaxed mb-12">
                            The {id} module isn't just a silo. It's fully integrated with the Schoolgle core, mapping data across your entire organization to identify compliance gaps before they become risks.
                        </p>
                        <div className="flex justify-center gap-12 grayscale opacity-50">
                            {/* Small mock logos or icons */}
                            <div className="w-12 h-12 rounded-lg bg-lp-border" />
                            <div className="w-12 h-12 rounded-lg bg-lp-border" />
                            <div className="w-12 h-12 rounded-lg bg-lp-border" />
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
