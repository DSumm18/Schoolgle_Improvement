"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const benefits = [
    "Take the pressure off school offices",
    "Help staff get more from the systems you already pay for",
    "Stay inspection-ready without the panic",
    "Give leaders clear, honest visibility"
];

const WhySchoolgle = () => {
    return (
        <section className="py-24 bg-black text-white overflow-hidden relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-medium mb-8 tracking-tight">
                            Less admin. <br />
                            More time. <br />
                            <span className="text-gray-400">Better schools.</span>
                        </h2>
                        <p className="text-xl text-gray-300 mb-12 font-light leading-relaxed max-w-lg">
                            Schoolgle joins up the tools you already use and does the busywork in the background – so your staff can focus on pupils, not paperwork.
                        </p>

                        <Link href="/signup" className="inline-block px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors">
                            Get started today
                        </Link>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-default"
                            >
                                <p className="text-lg font-medium text-gray-200 leading-snug">{benefit}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WhySchoolgle;

