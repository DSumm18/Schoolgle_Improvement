"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { ArrowRight, ChevronRight, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/website/Navbar';
import Footer from '@/components/website/Footer';
import { getPublishedInsights, getComingSoonInsights } from '@/data/insights';

const InsightCard = ({ insight, index, scrollProgress }: any) => {
    // Rolodex effect range
    const start = 0.05 + (index * 0.05);
    const end = start + 0.3;

    const scale = useTransform(scrollProgress, [start - 0.1, start, end, end + 0.1], [0.95, 1, 1, 0.95]);
    const opacity = useTransform(scrollProgress, [start - 0.1, start, end, end + 0.1], [0.4, 1, 1, 0.4]);
    const y = useTransform(scrollProgress, [start - 0.1, start, end], [50, 0, -20]);

    return (
        <motion.article
            style={{ scale, opacity, y }}
            className="group"
        >
            <Link
                href={`/insights/${insight.slug}`}
                className="block h-full glass-card rounded-[2.5rem] overflow-hidden hover:border-lp-accent/50 transition-all duration-500 hover:-translate-y-2 group"
            >
                {insight.heroImage && (
                    <div className="relative w-full h-56 overflow-hidden">
                        <Image
                            src={insight.heroImage}
                            alt={insight.title}
                            fill
                            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-lp-accent/10 mix-blend-overlay" />
                    </div>
                )}
                <div className="p-10">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-lp-accent/10 border border-lp-accent/20 flex items-center justify-center">
                                <Zap className="text-lp-accent" size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-lp-accent">
                                {insight.category || 'Article'}
                            </span>
                        </div>
                        <ArrowRight size={20} className="text-lp-text-muted group-hover:text-lp-accent group-hover:translate-x-1 transition-all" />
                    </div>
                    <h2 className="text-3xl font-black text-lp-text mb-4 leading-tight outfit uppercase tracking-tighter group-hover:text-lp-accent transition-colors">
                        {insight.title}
                    </h2>
                    <p className="text-lp-text-sec font-medium leading-relaxed line-clamp-3">
                        {insight.excerpt}
                    </p>

                    <div className="mt-8 pt-6 border-t border-lp-border flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-lp-text-muted">
                            {new Date(insight.date).toLocaleDateString('en-GB', {
                                month: 'short',
                                year: 'numeric'
                            })}
                        </span>
                        <div className="px-4 py-1.5 rounded-full bg-lp-bg border border-lp-border group-hover:border-lp-accent text-[8px] font-black uppercase tracking-widest text-lp-text transition-all">
                            Read Insight
                        </div>
                    </div>
                </div>
            </Link>
        </motion.article>
    );
};

export default function InsightsPage() {
    const publishedInsights = getPublishedInsights();
    const comingSoonInsights = getComingSoonInsights();
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1.2, 1]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.8]);
    const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);

    return (
        <div ref={containerRef} className="min-h-[250vh] bg-lp-bg relative selection:bg-lp-accent selection:text-white">
            <Navbar />

            <main className="relative z-10 bg-transparent">
                {/* Hero Section */}
                <motion.section
                    style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
                    className="pt-48 pb-32 px-6"
                >
                    <div className="max-w-7xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lp-border bg-lp-bg-sec/50 backdrop-blur-md mb-8"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-lp-accent animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lp-text-sec">Intellectual Strategy</span>
                        </motion.div>

                        <h1 className="text-7xl md:text-[130px] font-black text-lp-text mb-8 tracking-tighter outfit uppercase leading-[0.8] mix-blend-overlay">
                            Deep <br />
                            <span className="text-lp-accent italic">Insights.</span>
                        </h1>
                        <p className="text-2xl md:text-3xl text-lp-text-sec font-medium max-w-3xl mx-auto leading-relaxed">
                            Mapping the intersection of <span className="text-lp-text">school leadership</span> and <span className="text-lp-text">emerging intelligence</span>.
                        </p>
                    </div>
                </motion.section>

                <section className="pb-48 px-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Published Posts Grid */}
                        {publishedInsights.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                                {publishedInsights.map((insight, index) => (
                                    <InsightCard
                                        key={insight.slug}
                                        insight={insight}
                                        index={index}
                                        scrollProgress={scrollYProgress}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Coming Soon Section */}
                        {comingSoonInsights.length > 0 && (
                            <div className="mt-48 text-center">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="mb-16"
                                >
                                    <h2 className="text-4xl md:text-5xl font-black text-lp-text outfit uppercase tracking-tighter">
                                        The roadmap <br /> <span className="text-lp-accent italic">Ahead.</span>
                                    </h2>
                                </motion.div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                                    {comingSoonInsights.map((insight, index) => (
                                        <motion.div
                                            key={insight.slug}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-8 glass-card border-dashed border-lp-border grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-700 rounded-[2rem] text-left"
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-widest text-lp-accent mb-4 block">Coming Soon</span>
                                            <h3 className="text-2xl font-black text-lp-text outfit uppercase tracking-tighter mb-4">{insight.title}</h3>
                                            <p className="text-lp-text-sec font-medium leading-relaxed">{insight.excerpt}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
