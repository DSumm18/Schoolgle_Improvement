"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

const Hero = () => {
    const { track } = useAnalytics();
    return (
        <section className="relative min-h-screen flex flex-col pt-12 px-4 md:px-8 pb-20 overflow-hidden">
            <div className="container mx-auto max-w-7xl relative z-10">

                {/* Header Text */}
                <div className="text-center mb-16 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center justify-center gap-4"
                    >
                        <span className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest border border-blue-100 italic">
                            Built by school leaders, for school leaders
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-gray-900 text-balance leading-none max-w-6xl mx-auto"
                    >
                        Always be ready for <span className="text-blue-600">Inspection.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto leading-relaxed font-medium"
                    >
                        Schoolgle is the AI-powered operations engine for UK primary schools. Automatically map evidence, track improvement actions, and generate inspection-ready reports in seconds.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col items-center gap-8 pt-4"
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <a
                                href="#early-access"
                                onClick={() => track('cta_click', { location: 'hero_primary', label: 'Request early access' })}
                                className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-[0_20px_40px_rgba(37,99,235,0.2)] hover:scale-105"
                            >
                                Request early access
                            </a>
                            <a
                                href="#insights"
                                onClick={() => track('cta_click', { location: 'hero_secondary', label: 'Learn more' })}
                                className="text-gray-400 hover:text-gray-900 font-bold uppercase tracking-widest text-xs transition-colors flex items-center gap-2"
                            >
                                Learn more <ChevronRight size={16} />
                            </a>
                        </div>

                        <div className="flex items-center gap-8 opacity-40 grayscale pointer-events-none">
                            <span className="text-[10px] font-black uppercase tracking-widest">Designed for DfE Compliance</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">GDPR Secure</span>
                            <span className="text-[10px] font-black uppercase tracking-widest">UK Cloud Hosted</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;

