"use client";

import React from 'react';
import { motion } from 'framer-motion';

const TrustSection = () => {
    return (
        <section className="py-32 bg-white">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center space-y-12"
                >
                    <div className="space-y-6">
                        <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">
                            Built with UK schools,<br />for <span className="text-blue-600">UK schools.</span>
                        </h2>
                        <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto font-medium">
                            Schoolgle is designed by school leaders who understand the pressure of inspection readiness. We're working with a small group of pilot schools to ensure the platform works in real school environments, not just in theory.
                        </p>
                    </div>

                    <div className="pt-8 border-t border-gray-100 flex flex-wrap justify-center gap-12 opacity-60">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 text-center">Data Protection</span>
                            <span className="text-xs font-bold text-gray-400">UK GDPR Compliant</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 text-center">Infrastructure</span>
                            <span className="text-xs font-bold text-gray-400">UK-Based Cloud Hosting</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 text-center">Standards</span>
                            <span className="text-xs font-bold text-gray-400">DfE Security Framework</span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default TrustSection;

