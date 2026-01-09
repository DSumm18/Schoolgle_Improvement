"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';

import SchoolgleLogo from '@/components/brand/SchoolgleLogo';
import ThemeToggle from '@/components/effects/ThemeToggle';

const Hero = () => {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32 overflow-hidden px-6">
            {/* Background Grid */}
            <div className="absolute inset-0 grid-background opacity-20 pointer-events-none" />

            {/* Glow Effect */}
            <div className="hero-glow pointer-events-none" />

            {/* Nav Placeholder (Minimal) */}
            <nav className="absolute top-0 left-0 right-0 h-20 z-50 flex items-center justify-between max-w-7xl mx-auto px-6">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2">
                        <SchoolgleLogo size="sm" showText />
                    </Link>
                    <div className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Features</a>
                        <a href="/pricing" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Pricing</a>
                        <a href="/blog" className="text-sm font-medium text-lp-text-sec hover:text-lp-text transition-colors">Blog</a>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link
                        href="#early-access"
                        className="px-5 py-2 bg-lp-accent text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-all btn-scale shadow-lg shadow-blue-500/20"
                    >
                        Request Access
                    </Link>
                </div>
            </nav>

            <div className="container max-w-5xl relative z-10 text-center">
                {/* Logo in Hero */}
                <div className="flex justify-center mb-12">
                    <SchoolgleLogo size="lg" />
                </div>

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lp-border bg-lp-bg-sec/50 backdrop-blur-sm mb-8"
                >
                    <span className="flex h-2 w-2 rounded-full bg-lp-accent animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-lp-text-sec">Early Access 2025</span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] outfit"
                >
                    <span className="text-gradient">Inspection-ready.</span><br />
                    <span className="text-lp-text">Always.</span>
                </motion.h1>

                {/* Subhead */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-xl md:text-2xl text-lp-text-sec max-w-2xl mx-auto mb-10 font-medium"
                >
                    The operations engine for UK schools that maps evidence and identifies gaps automatically.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <Link
                        href="#early-access"
                        className="w-full sm:w-auto px-10 py-5 bg-lp-accent text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all btn-scale shadow-2xl shadow-blue-500/40 flex items-center justify-center gap-2"
                    >
                        Request Access <ChevronRight size={16} />
                    </Link>
                    <button
                        className="w-full sm:w-auto px-10 py-5 border border-lp-border bg-lp-bg-sec/50 backdrop-blur-sm text-lp-text rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-lp-bg-sec transition-all btn-scale flex items-center justify-center gap-2"
                    >
                        <Play size={14} fill="currentColor" /> See how it works
                    </button>
                </motion.div>

                {/* Hero Visual (Placeholder for screenshot) */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="mt-20 relative px-4"
                >
                    <div className="absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-lp-bg via-transparent to-transparent z-10" />
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-lp-accent to-blue-400 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative aspect-[16/10] bg-lp-bg-sec rounded-2xl border border-lp-border overflow-hidden shadow-2xl animate-float">
                            {/* This would be an Image component or a mockup */}
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426')] bg-cover bg-center opacity-40 brightness-50" />
                            <div className="absolute inset-0 bg-gradient-to-t from-lp-bg to-transparent opacity-80" />
                            <div className="absolute bottom-10 left-10 text-left space-y-2">
                                <div className="w-48 h-2 bg-lp-accent/50 rounded-full" />
                                <div className="w-32 h-2 bg-lp-border rounded-full" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
