"use client";

import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
    return (
        <section className="relative min-h-screen flex flex-col pt-12 px-4 md:px-8 pb-20 overflow-hidden">
            <div className="container mx-auto max-w-7xl relative z-10">

                {/* Header Text */}
                <div className="text-center mb-24 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center justify-center gap-2"
                    >
                        <span className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                            Built with UK schools, for UK schools
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-gray-900 text-balance leading-[1.1] max-w-5xl mx-auto"
                    >
                        Take the fear out of Ofsted inspections
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                        className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
                    >
                        Schoolgle helps UK primary schools prepare for Ofsted and SIAMS inspections by organising evidence, tracking actions, and generating reports automatically. No spreadsheets. No last-minute panic.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-col items-center gap-5 pt-4"
                    >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href="#early-access" className="px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all text-base">
                                Request early access
                            </a>
                            <a href="#insights" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-base">
                                Read our thinking →
                            </a>
                        </div>
                        <span className="text-sm text-gray-400 font-medium">Early access pilot 2025</span>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;

